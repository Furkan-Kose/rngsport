import axios from 'axios';
import { useSyncExternalStore } from 'react';
import { uploadImageVariants, uploadVideoPoster, type UploadedVariants, type VariantTargets } from './imageVariants';

// Admin yükleme kuyruğu. Modül düzeyinde tutulur: sayfa değişse (hatta AdminLayout yeniden
// kurulsa) de yükleme sürer, ilerleme her sayfada sağ alttaki kutuda görünür. İşler sırayla
// çalışır (iki iş aynı anda birbirini yavaşlatmasın). Sekme kapanınca durur — dosyalar
// tarayıcıdan gidiyor; o yüzden iş sürerken kapatma/yenilemede tarayıcı uyarır.

export interface PresignedFile extends VariantTargets {
  key: string;
  fileName: string;
  uploadUrl: string;
}

export interface UploadedFile extends Partial<UploadedVariants> {
  key: string;
  fileName: string;
  size: number;
  contentType: string;
}

export interface FileMeta {
  fileName: string;
  contentType: string;
  size: number;
}

export interface UploadJobInput {
  label: string; // ör. "Ayşe Yılmaz — Ankara Kupası"
  target: string; // ör. "user:abc" — sayfalar biten işi bununla dinler
  files: File[];
  presign: (files: FileMeta[]) => Promise<PresignedFile[]>;
  confirm: (files: UploadedFile[]) => Promise<void>;
}

export type UploadJobStatus = 'queued' | 'running' | 'done' | 'error';

export interface UploadJob {
  id: number;
  label: string;
  target: string;
  total: number;
  done: number;
  uploaded: number;
  failed: string[];
  status: UploadJobStatus;
  error?: string;
}

const UPLOAD_CONCURRENCY = 5;
// Sunucu tek istekte en fazla 100 dosya kabul ediyor (utils/uploads.js MAX_FILES_PER_BATCH).
// Dosyalar 100'erli gruplar halinde yüklenir, her grup ayrı kaydedilir.
const SERVER_BATCH = 100;
// Sunucu yeniden başlarken (Railway deploy ~30-60 sn) presign/confirm düşmesin: ~1 dk tekrar dene
const RETRY_DELAYS = [2000, 5000, 10000, 15000, 30000];

let jobs: UploadJob[] = [];
const inputs = new Map<number, UploadJobInput>();
const listeners = new Set<() => void>();
const finishListeners = new Set<(target: string) => void>();
let nextId = 1;
let running = false;

const emit = () => listeners.forEach((l) => l());
const patch = (id: number, data: Partial<UploadJob>) => {
  jobs = jobs.map((j) => (j.id === id ? { ...j, ...data } : j));
  emit();
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Ağ hatası / 5xx / 429 tekrar denenir; 4xx (geçersiz dosya vb.) hemen hata
const isRetryable = (error: unknown) => {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === undefined || status >= 500 || status === 429;
};

const withRetry = async <T>(fn: () => Promise<T>, delays = RETRY_DELAYS): Promise<T> => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= delays.length || !isRetryable(error)) throw error;
      await sleep(delays[attempt]);
    }
  }
};

// presigned[i] ↔ files[i] (sunucu sırayı korur) — ada göre eşleştirme, farklı klasörlerden
// aynı adlı iki dosyayı karıştırıyordu.
const uploadWithPool = async (presigned: PresignedFile[], files: File[], onProgress: () => void) => {
  const succeeded: UploadedFile[] = [];
  const failed: string[] = [];
  let index = 0;

  const worker = async () => {
    while (index < presigned.length) {
      const i = index++;
      const item = presigned[i];
      const file = files[i];
      if (!file) continue;
      try {
        // Plain axios: api singleton'ı withCredentials gönderir, R2'ye cookie gitmemeli.
        // Kısa ağ kopmalarına karşı 2 tekrar.
        await withRetry(() => axios.put(item.uploadUrl, file, { headers: { 'Content-Type': file.type } }), [2000, 4000]);
        // Önizlemeler yerel dosyadan üretilir (görsel: 2 sürüm, video: kapak resmi);
        // üretilemezse dosya önizlemesiz kaydedilir
        const variants = file.type.startsWith('image/')
          ? await uploadImageVariants(file, item)
          : file.type.startsWith('video/')
            ? await uploadVideoPoster(file, item)
            : null;
        succeeded.push({ key: item.key, fileName: item.fileName, size: file.size, contentType: file.type, ...variants });
      } catch (error) {
        console.error(`Yükleme hatası (${item.fileName}):`, error);
        failed.push(item.fileName);
      } finally {
        onProgress();
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, presigned.length) }, worker));
  return { succeeded, failed };
};

const runJob = async (job: UploadJob, input: UploadJobInput) => {
  patch(job.id, { status: 'running' });
  let done = 0;
  let uploaded = 0;
  const failed: string[] = [];
  try {
    for (let start = 0; start < input.files.length; start += SERVER_BATCH) {
      const batch = input.files.slice(start, start + SERVER_BATCH);
      const presigned = await withRetry(() =>
        input.presign(batch.map((f) => ({ fileName: f.name, contentType: f.type, size: f.size })))
      );
      const result = await uploadWithPool(presigned, batch, () => {
        done += 1;
        patch(job.id, { done });
      });
      // Her grup hemen kaydedilir: sonraki grupta hata olsa da yüklenenler kaybolmaz
      if (result.succeeded.length > 0) {
        await withRetry(() => input.confirm(result.succeeded));
        uploaded += result.succeeded.length;
      }
      failed.push(...result.failed);
      patch(job.id, { uploaded, failed: [...failed] });
    }
    patch(job.id, { status: failed.length ? 'error' : 'done', uploaded, failed });
  } catch (error) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      'Yükleme sırasında hata oluştu';
    patch(job.id, { status: 'error', error: message, uploaded, failed });
  } finally {
    inputs.delete(job.id);
    finishListeners.forEach((l) => l(input.target));
  }
};

const pump = async () => {
  if (running) return;
  running = true;
  try {
    for (;;) {
      const job = jobs.find((j) => j.status === 'queued');
      if (!job) break;
      const input = inputs.get(job.id);
      if (!input) {
        patch(job.id, { status: 'error', error: 'İş bulunamadı' });
        continue;
      }
      await runJob(job, input);
    }
  } finally {
    running = false;
  }
};

export const enqueueUpload = (input: UploadJobInput) => {
  if (input.files.length === 0) return;
  const id = nextId++;
  inputs.set(id, input);
  jobs = [
    ...jobs,
    { id, label: input.label, target: input.target, total: input.files.length, done: 0, uploaded: 0, failed: [], status: 'queued' },
  ];
  emit();
  void pump();
};

export const dismissUpload = (id: number) => {
  jobs = jobs.filter((j) => j.id !== id || j.status === 'queued' || j.status === 'running');
  emit();
};

export const isUploadActive = () => jobs.some((j) => j.status === 'queued' || j.status === 'running');

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const snapshot = () => jobs;

export const useUploadJobs = () => useSyncExternalStore(subscribe, snapshot);

// Sayfa, kendi hedefine ait iş bitince listesini yenilesin
export const onUploadFinished = (listener: (target: string) => void) => {
  finishListeners.add(listener);
  return () => {
    finishListeners.delete(listener);
  };
};

// İş sürerken sekme kapatma / yenileme uyarısı
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', (event) => {
    if (!isUploadActive()) return;
    event.preventDefault();
    event.returnValue = '';
  });
}
