import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'react-toastify';
import { ArrowLeft, Award, ExternalLink, Images, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import MediaUploader from '../../components/admin/MediaUploader';
import AdminMediaGrid, { type AdminMediaItem } from '../../components/admin/AdminMediaGrid';
import PreviewBackfill from '../../components/admin/PreviewBackfill';
import type { AwardCeremony, AwardPhoto, Pagination } from '../../lib/awardCeremonies';

const AwardCeremonyGalleryPage = () => {
  const { id } = useParams<{ id: string }>();
  const [ceremony, setCeremony] = useState<AwardCeremony | null>(null);
  const [photos, setPhotos] = useState<AwardPhoto[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [missingPreviews, setMissingPreviews] = useState(0);

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

  const handleDelete = async (item: AdminMediaItem) => {
    if (!window.confirm(`"${item.fileName}" silinecek. Emin misiniz?`)) return;
    setDeletingId(item.id);
    try {
      await api.delete(`/api/award-ceremonies/photos/${item.id}`);
      setPhotos((prev) => prev.filter((p) => p.id !== item.id));
      setPagination((prev) => (prev ? { ...prev, total: prev.total - 1 } : prev));
      toast.success('Fotoğraf silindi');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Fotoğraf silinemedi');
    } finally {
      setDeletingId(null);
    }
  };

  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/admin/award-ceremonies"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-amber-400 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Ödül Törenlerine Dön
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Award className="w-7 h-7 text-amber-500" />
          {ceremony?.title || 'Ödül Töreni'} — Galeri
        </h1>
        <p className="text-gray-400 mt-1 flex flex-wrap items-center gap-x-3">
          <span>{pagination?.total ?? 0} dosya · herkese açık</span>
          {ceremony && (
            <a
              href={`/odul-torenleri/${ceremony.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-amber-400 hover:underline"
            >
              Sitede gör <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </p>
      </div>

      <MediaUploader
        presign={async (files) => {
          const { data } = await api.post(`/api/award-ceremonies/${id}/presign`, { files });
          return data.files;
        }}
        confirm={async (files) => {
          await api.post(`/api/award-ceremonies/${id}/confirm`, { files });
        }}
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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : photos.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 text-center">
          <Images className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Bu törene henüz fotoğraf yüklenmedi</p>
        </div>
      ) : (
        <>
          <AdminMediaGrid items={photos} deletingId={deletingId} onDelete={handleDelete} />
          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => pagination && fetchPhotos(pagination.page + 1, true)}
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

export default AwardCeremonyGalleryPage;
