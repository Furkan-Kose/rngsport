import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'react-toastify';
import { ArrowLeft, Images, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import MediaUploader from '../../components/admin/MediaUploader';
import AdminMediaGrid from '../../components/admin/AdminMediaGrid';
import PreviewBackfill from '../../components/admin/PreviewBackfill';

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
  thumbUrl?: string | null;
  size: number | null;
  contentType: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const UserGalleryPage = () => {
  const { id: userId } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [albums, setAlbums] = useState<string[]>([]);
  const [activeAlbum, setActiveAlbum] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [albumInput, setAlbumInput] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [missingPreviews, setMissingPreviews] = useState(0);

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
        setMissingPreviews(data.missingPreviews ?? 0);
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

      {/* Yükleme paneli — album → R2'de yarışma klasörü olur */}
      <MediaUploader
        presign={async (files) => {
          const { data } = await api.post('/api/gallery/admin/presign', {
            userId,
            album: albumInput.trim() || undefined,
            files,
          });
          return data.files;
        }}
        confirm={async (files) => {
          await api.post('/api/gallery/admin/confirm', {
            userId,
            album: albumInput.trim() || undefined,
            files,
          });
        }}
        onUploaded={() => {
          setAlbumInput('');
          fetchUser();
          fetchPhotos(1, activeAlbum, false);
        }}
        renderFields={(isUploading) => (
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
        )}
      />

      <PreviewBackfill
        missing={missingPreviews}
        fetchBatch={async () => (await api.get(`/api/gallery/admin/user/${userId}/missing-previews`)).data}
        save={async (files) => {
          await api.post(`/api/gallery/admin/user/${userId}/previews`, { files });
        }}
        onDone={() => fetchPhotos(1, activeAlbum, false)}
      />

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
          <AdminMediaGrid
            items={photos}
            deletingId={deletingId}
            onDelete={(item) => handleDelete(item as GalleryPhoto)}
          />

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
