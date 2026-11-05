import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router';
import { toast } from 'react-toastify';
import { Award, ExternalLink, Images, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import MediaUploader from '../../components/admin/MediaUploader';
import AdminMediaGrid, { type AdminMediaItem } from '../../components/admin/AdminMediaGrid';
import PreviewBackfill from '../../components/admin/PreviewBackfill';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { Button, EmptyState, PageHeader, SkeletonGrid } from '../../components/admin/ui';
import type { AwardCeremony, AwardPhoto, Pagination } from '../../lib/awardCeremonies';

const AwardCeremonyGalleryPage = () => {
  const { id } = useParams<{ id: string }>();
  const [ceremony, setCeremony] = useState<AwardCeremony | null>(null);
  const [photos, setPhotos] = useState<AwardPhoto[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [missingPreviews, setMissingPreviews] = useState(0);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<AdminMediaItem | null>(null);

  const fetchPhotos = useCallback(
    async (page: number, append: boolean) => {
      try {
        const params = new URLSearchParams({ page: String(page), limit: '60' });
        const { data } = await api.get(`/api/award-ceremonies/admin/${id}?${params}`);
        setCeremony(data.ceremony);
        setPhotos((prev) => (append ? [...prev, ...data.data] : data.data));
        setPagination(data.pagination);
        setMissingPreviews(data.missingPreviews ?? 0);
      } catch (error) {
        console.error('Tören galerisi yüklenemedi:', error);
        toast.error('Galeri yüklenemedi');
      } finally {
        setIsLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    setIsLoading(true);
    fetchPhotos(1, false);
  }, [fetchPhotos]);

  const handleDelete = async () => {
    const item = photoToDelete;
    if (!item) return;
    setDeletingId(item.id);
    try {
      await api.delete(`/api/award-ceremonies/photos/${item.id}`);
      setPhotos((prev) => prev.filter((p) => p.id !== item.id));
      setPagination((prev) => (prev ? { ...prev, total: prev.total - 1 } : prev));
      toast.success('Fotoğraf silindi');
      setPhotoToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Fotoğraf silinemedi');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      const { data } = await api.delete(`/api/award-ceremonies/${id}/photos`);
      toast.success(`${data.count} dosya silindi`);
      setConfirmDeleteAll(false);
      fetchPhotos(1, false);
    } catch (error) {
      console.error('Toplu silme hatası:', error);
      toast.error('Fotoğraflar silinemedi');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ to: '/admin/award-ceremonies', label: 'Ödül Törenlerine Dön' }}
        title={`${ceremony?.title || 'Ödül Töreni'} — Galeri`}
        icon={Award}
        description={`${pagination?.total ?? 0} dosya · herkese açık`}
        actions={
          <>
            {ceremony && (
              <Button icon={ExternalLink} href={`/odul-torenleri/${ceremony.slug}`} target="_blank">
                Sitede gör
              </Button>
            )}
            {(pagination?.total ?? 0) > 0 && (
              <Button variant="danger" icon={Trash2} onClick={() => setConfirmDeleteAll(true)}>
                Tüm dosyaları sil
              </Button>
            )}
          </>
        }
      />

      <MediaUploader
        presign={async (files) => {
          const { data } = await api.post(`/api/award-ceremonies/${id}/presign`, { files });
          return data.files;
        }}
        confirm={async (files) => {
          await api.post(`/api/award-ceremonies/${id}/confirm`, { files });
        }}
        label={`Ödül töreni — ${ceremony?.title || ''}`}
        target={`ceremony:${id}`}
        onUploaded={() => fetchPhotos(1, false)}
      />

      <PreviewBackfill
        missing={missingPreviews}
        fetchBatch={async () => (await api.get(`/api/award-ceremonies/admin/${id}/missing-previews`)).data}
        save={async (files) => {
          await api.post(`/api/award-ceremonies/${id}/previews`, { files });
        }}
        onDone={() => fetchPhotos(1, false)}
      />

      {isLoading ? (
        <SkeletonGrid />
      ) : photos.length === 0 ? (
        <EmptyState icon={Images} title="Bu törene henüz fotoğraf yüklenmedi" />
      ) : (
        <div className="space-y-4">
          <AdminMediaGrid items={photos} deletingId={deletingId} onDelete={setPhotoToDelete} />
          {hasMore && (
            <div className="flex justify-center">
              <Button onClick={() => pagination && fetchPhotos(pagination.page + 1, true)}>Daha Fazla Yükle</Button>
            </div>
          )}
        </div>
      )}

      <ConfirmDeleteModal
        open={!!photoToDelete}
        title="Dosya silinsin mi?"
        message={
          <>
            <strong className="text-white break-all">{photoToDelete?.fileName}</strong> (önizlemeleriyle birlikte)
            kalıcı olarak silinecek ve sitedeki tören galerisinden kalkar. Bu işlem geri alınamaz.
          </>
        }
        isDeleting={!!deletingId}
        onConfirm={handleDelete}
        onCancel={() => setPhotoToDelete(null)}
      />

      <ConfirmDeleteModal
        open={confirmDeleteAll}
        title="Tüm dosyalar silinsin mi?"
        message={
          <>
            <strong>{ceremony?.title}</strong> törenindeki <strong>{pagination?.total ?? 0}</strong> dosya
            (önizlemeleriyle birlikte) kalıcı olarak silinecek. Tören ve sitedeki adresi kalır; yeni
            fotoğrafları aynı yere yükleyebilirsiniz. Bu işlem geri alınamaz.
          </>
        }
        confirmLabel="Evet, Hepsini Sil"
        isDeleting={isDeletingAll}
        onConfirm={handleDeleteAll}
        onCancel={() => setConfirmDeleteAll(false)}
      />
    </div>
  );
};

export default AwardCeremonyGalleryPage;
