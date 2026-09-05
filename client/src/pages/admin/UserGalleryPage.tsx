import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  Images,
  Loader2,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import api from '../../lib/api';

interface UserInfo {
  id: string;
  name: string | null;
  email: string | null;
  _count: { photos: number };
}

interface GalleryPhoto {
  id: string;
  fileName: string;
  album: string | null;
  url: string;
  size: number | null;
  contentType: string | null;
  createdAt: string;
}

const isVideo = (photo: GalleryPhoto) => photo.contentType?.startsWith('video/');

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PresignedFile {
  key: string;
  fileName: string;
  uploadUrl: string;
}

const UPLOAD_CONCURRENCY = 5;

// Dosyaları en fazla UPLOAD_CONCURRENCY paralellikle R2'ye PUT eder;
// başarılı olanların metadata'sını döner.
const uploadWithPool = async (
  presigned: PresignedFile[],
  fileMap: Map<string, File>,
  onProgress: (done: number) => void
) => {
  const succeeded: { key: string; fileName: string; size: number; contentType: string }[] = [];
  const failed: string[] = [];
  let done = 0;
  let index = 0;

  const worker = async () => {
    while (index < presigned.length) {
      const item = presigned[index++];
      const file = fileMap.get(item.fileName);
      if (!file) continue;
      try {
        // Plain axios: api singleton'ı withCredentials gönderir, R2'ye cookie gitmemeli
        await axios.put(item.uploadUrl, file, {
          headers: { 'Content-Type': file.type },
        });
        succeeded.push({
          key: item.key,
          fileName: item.fileName,
          size: file.size,
          contentType: file.type,
        });
      } catch (error) {
        console.error(`Yükleme hatası (${item.fileName}):`, error);
        failed.push(item.fileName);
      } finally {
        done += 1;
        onProgress(done);
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(UPLOAD_CONCURRENCY, presigned.length) }, worker)
  );

  return { succeeded, failed };
};

const UserGalleryPage = () => {
  const { id: userId } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [albums, setAlbums] = useState<string[]>([]);
  const [activeAlbum, setActiveAlbum] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Yükleme durumu
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [albumInput, setAlbumInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/users/${userId}`);
      setUser(data.user);
    } catch (error) {
      console.error('User fetch error:', error);
    }
  }, [userId]);

  const fetchPhotos = useCallback(
    async (page: number, album: string | null, append: boolean) => {
      try {
        const params = new URLSearchParams({ page: String(page), limit: '60' });
        if (album) params.set('album', album);
        const { data } = await api.get(`/api/gallery/admin/user/${userId}?${params}`);
        setPhotos((prev) => (append ? [...prev, ...data.data] : data.data));
        setAlbums(data.albums || []);
        setPagination(data.pagination);
      } catch (error) {
        console.error('Gallery fetch error:', error);
        toast.error('Galeri yüklenemedi');
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    setIsLoading(true);
    fetchPhotos(1, activeAlbum, false);
  }, [activeAlbum, fetchPhotos]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter((f) =>
      /\.(jpe?g|png|webp|mp4|mov|webm)$/i.test(f.name)
    );
    const skipped = files.length - valid.length;
    if (skipped > 0) {
      toast.warning(`${skipped} dosya atlandı (jpg/png/webp/mp4/mov/webm)`);
    }
    setSelectedFiles(valid);
  };

  const handleUpload = async () => {
    if (!userId || selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress({ done: 0, total: selectedFiles.length });

    try {
      // 1) Presigned PUT URL'leri al (album → R2'de yarışma klasörü olur)
      const { data: presignData } = await api.post('/api/gallery/admin/presign', {
        userId,
        album: albumInput.trim() || undefined,
        files: selectedFiles.map((f) => ({
          fileName: f.name,
          contentType: f.type,
          size: f.size,
        })),
      });

      // 2) Tarayıcıdan direkt R2'ye yükle (5'li havuz)
      const fileMap = new Map(selectedFiles.map((f) => [f.name, f]));
      const { succeeded, failed } = await uploadWithPool(
        presignData.files,
        fileMap,
        (done) => setUploadProgress({ done, total: selectedFiles.length })
      );

      // 3) Başarılı olanları DB'ye kaydet
      if (succeeded.length > 0) {
        await api.post('/api/gallery/admin/confirm', {
          userId,
          album: albumInput.trim() || undefined,
          files: succeeded,
        });
        toast.success(`${succeeded.length} fotoğraf yüklendi`);
      }
      if (failed.length > 0) {
        toast.error(`${failed.length} dosya yüklenemedi: ${failed.slice(0, 3).join(', ')}${failed.length > 3 ? '...' : ''}`);
      }

      setSelectedFiles([]);
      setAlbumInput('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchUser();
      fetchPhotos(1, activeAlbum, false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Yükleme sırasında hata oluştu');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (photo: GalleryPhoto) => {
    if (!window.confirm(`"${photo.fileName}" silinecek. Emin misiniz?`)) return;
    setDeletingId(photo.id);
    try {
      await api.delete(`/api/gallery/admin/photo/${photo.id}`);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      toast.success('Fotoğraf silindi');
      fetchUser();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Fotoğraf silinemedi');
    } finally {
      setDeletingId(null);
    }
  };

  const loadMore = () => {
    if (!pagination || pagination.page >= pagination.totalPages) return;
    fetchPhotos(pagination.page + 1, activeAlbum, true);
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
  };

  const totalSelectedSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-amber-400 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Kullanıcılara Dön
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Images className="w-7 h-7 text-amber-500" />
          {user?.name || 'Kullanıcı'} — Galeri
        </h1>
        <p className="text-gray-400 mt-1">
          {user?.email} · {pagination?.total ?? user?._count.photos ?? 0} fotoğraf
        </p>
      </div>

      {/* Yükleme paneli */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-amber-500" />
          Fotoğraf Yükle
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Yarışma / Albüm Adı (opsiyonel — R2'de klasör olur)
            </label>
            <input
              type="text"
              value={albumInput}
              onChange={(e) => setAlbumInput(e.target.value)}
              placeholder="Örn: İstanbul Kupası 2026"
              maxLength={100}
              disabled={isUploading}
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Dosyalar (foto: jpg/png/webp ≤30MB · video: mp4/mov/webm ≤500MB, 100 dosya)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
              onChange={(e) => handleFileSelect(e.target.files)}
              disabled={isUploading}
              className="hidden"
            />
            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                if (!isUploading) setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (!isUploading) handleFileSelect(e.dataTransfer.files);
              }}
              className={`flex flex-col items-center justify-center gap-1.5 px-4 py-5 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                isDragging
                  ? 'border-amber-500 bg-amber-500/5'
                  : 'border-gray-600 hover:border-amber-500/50 bg-gray-900/30'
              } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Upload className={`w-5 h-5 ${isDragging ? 'text-amber-400' : 'text-gray-500'}`} />
              <p className="text-sm text-gray-400 text-center">
                {isDragging ? (
                  <span className="text-amber-400 font-medium">Dosyaları bırakın</span>
                ) : (
                  <>
                    Dosyaları buraya <span className="text-amber-400">sürükleyin</span> veya{' '}
                    <span className="text-amber-400">tıklayın</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mb-4 text-sm text-gray-300">
            <span className="font-medium text-white">{selectedFiles.length}</span> dosya seçildi
            ({formatSize(totalSelectedSize)})
            {!isUploading && (
              <button
                onClick={() => {
                  setSelectedFiles([]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="ml-3 text-gray-500 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4 inline" /> Temizle
              </button>
            )}
          </div>
        )}

        {isUploading && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Yükleniyor...</span>
              <span>
                {uploadProgress.done} / {uploadProgress.total}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{
                  width: `${uploadProgress.total ? (uploadProgress.done / uploadProgress.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={isUploading || selectedFiles.length === 0}
          className="px-6 py-2.5 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Yükleniyor...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Yüklemeyi Başlat
            </>
          )}
        </button>
      </div>

      {/* Albüm filtreleri */}
      {albums.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveAlbum(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              activeAlbum === null
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:text-gray-300'
            }`}
          >
            Tümü
          </button>
          {albums.map((album) => (
            <button
              key={album}
              onClick={() => setActiveAlbum(album)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                activeAlbum === album
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:text-gray-300'
              }`}
            >
              {album}
            </button>
          ))}
        </div>
      )}

      {/* Foto grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : photos.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 text-center">
          <Images className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Bu kullanıcıya henüz fotoğraf yüklenmedi</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative group aspect-square rounded-xl overflow-hidden bg-gray-800 border border-gray-700"
              >
                {isVideo(photo) ? (
                  <video
                    src={photo.url}
                    preload="metadata"
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={photo.url}
                    alt={photo.fileName}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                )}
                {isVideo(photo) && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white truncate">{photo.fileName}</p>
                  {photo.album && (
                    <p className="text-xs text-amber-400 truncate">{photo.album}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(photo)}
                  disabled={deletingId === photo.id}
                  className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 hover:bg-red-600/80 transition-all duration-300"
                  title="Sil"
                >
                  {deletingId === photo.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={loadMore}
                className="px-5 py-2.5 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 text-gray-300 font-medium transition-colors"
              >
                Daha Fazla Yükle
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserGalleryPage;
