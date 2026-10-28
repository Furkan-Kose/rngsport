import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'react-toastify';
import { ArrowLeft, CheckSquare, FolderInput, Images, Loader2, Pencil, Trash2, X } from 'lucide-react';
import api from '../../lib/api';
import MediaUploader from '../../components/admin/MediaUploader';
import AdminMediaGrid from '../../components/admin/AdminMediaGrid';
import PreviewBackfill from '../../components/admin/PreviewBackfill';
import DownloadHistory from '../../components/admin/DownloadHistory';
import AlbumInput from '../../components/admin/AlbumInput';
import AlbumNameModal from '../../components/admin/AlbumNameModal';
import { canonicalAlbum } from '../../lib/albums';

// Taşıma sunucuda 25'erli parçalarla yapılır (R2'de kopyala → kaydı güncelle → eskisini sil)
const MOVE_CHUNK = 25;
const DELETE_CHUNK = 2000;
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';

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
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [albumCounts, setAlbumCounts] = useState<Record<string, number>>({});
  const [recentAlbums, setRecentAlbums] = useState<string[]>([]);
  // Seç → Albüme taşı / Sil
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moveOpen, setMoveOpen] = useState(false);
  const [renameFrom, setRenameFrom] = useState<string | null>(null);
  const [moveProgress, setMoveProgress] = useState<{ done: number; total: number } | null>(null);
  const [confirmDeleteSelected, setConfirmDeleteSelected] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);

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
        setAlbumCounts(data.albumCounts || {});
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

  // Albüm seçici önerileri: tüm müşterilerdeki son yarışma adları
  useEffect(() => {
    api
      .get('/api/gallery/admin/albums')
      .then(({ data }) => setRecentAlbums(data.data || []))
      .catch(() => setRecentAlbums([]));
  }, []);

  // Önce bu müşterinin albümleri, sonra diğer son yarışmalar
  const albumOptions = useMemo(
    () => [...albums, ...recentAlbums.filter((a) => !albums.includes(a))],
    [albums, recentAlbums]
  );

  // Bir albüm sekmesi açıkken yükleme o albüme gider
  useEffect(() => {
    setAlbumInput(activeAlbum ?? '');
  }, [activeAlbum]);

  // Taşıma/ad değişikliğiyle boşalan albümün sekmesi kapanır
  useEffect(() => {
    if (activeAlbum && !isLoading && !albums.includes(activeAlbum)) setActiveAlbum(null);
  }, [albums, activeAlbum, isLoading]);

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const refresh = () => {
    fetchUser();
    fetchPhotos(1, activeAlbum, false);
  };

  // Seçilenleri albüme taşı (R2'de de yeni klasöre)
  const handleMoveSelected = async (rawAlbum: string) => {
    const album = canonicalAlbum(rawAlbum, albumOptions);
    const ids = [...selectedIds];
    let moved = 0;
    let failed = 0;
    setMoveProgress({ done: 0, total: ids.length });
    try {
      for (let i = 0; i < ids.length; i += MOVE_CHUNK) {
        const { data } = await api.post(`/api/gallery/admin/user/${userId}/photos/move`, {
          ids: ids.slice(i, i + MOVE_CHUNK),
          album: album || null,
        });
        moved += data.moved;
        failed += data.failed;
        setMoveProgress({ done: Math.min(i + MOVE_CHUNK, ids.length), total: ids.length });
      }
      toast.success(`${moved} dosya ${album ? `"${album}" albümüne` : 'genel klasöre'} taşındı`);
      if (failed) toast.error(`${failed} dosya taşınamadı, tekrar deneyin`);
      setMoveOpen(false);
      exitSelectMode();
    } catch (error) {
      console.error('Taşıma hatası:', error);
      toast.error(moved ? `Taşıma yarıda kaldı (${moved} dosya taşındı)` : 'Dosyalar taşınamadı');
    } finally {
      setMoveProgress(null);
      refresh();
    }
  };

  // Albüm adını düzelt: o albümün tüm dosyaları yeni ada (ve R2'de yeni klasöre) geçer
  const handleRenameAlbum = async (rawAlbum: string) => {
    if (renameFrom === null) return;
    const album = canonicalAlbum(rawAlbum, albumOptions.filter((a) => a !== renameFrom));
    if (album === renameFrom) {
      setRenameFrom(null);
      return;
    }
    const total = albumCounts[renameFrom] ?? 0;
    let moved = 0;
    setMoveProgress({ done: 0, total });
    try {
      for (;;) {
        const { data } = await api.post(`/api/gallery/admin/user/${userId}/photos/move`, {
          fromAlbum: renameFrom,
          album: album || null,
        });
        moved += data.moved;
        setMoveProgress({ done: moved, total });
        // İlerleme yoksa (ör. R2 hatası) sonsuz döngüye girme
        if (data.remaining === 0 || data.moved === 0) {
          if (data.remaining > 0) toast.error(`${data.remaining} dosya taşınamadı, tekrar deneyin`);
          break;
        }
      }
      toast.success(album ? `Albüm "${album}" olarak güncellendi` : 'Albüm kaldırıldı, dosyalar genel klasörde');
      setRenameFrom(null);
      // Sekme değişince liste kendiliğinden yeni albümle yüklenir (eski albümü ayrıca çekme)
      fetchUser();
      setActiveAlbum(album || null);
    } catch (error) {
      console.error('Albüm adı hatası:', error);
      toast.error(moved ? `Yarıda kaldı (${moved} dosya taşındı)` : 'Albüm adı değiştirilemedi');
      refresh();
    } finally {
      setMoveProgress(null);
    }
  };

  const handleDeleteSelected = async () => {
    const ids = [...selectedIds];
    setIsDeletingSelected(true);
    try {
      let count = 0;
      for (let i = 0; i < ids.length; i += DELETE_CHUNK) {
        const { data } = await api.post(`/api/gallery/admin/user/${userId}/photos/delete`, {
          ids: ids.slice(i, i + DELETE_CHUNK),
        });
        count += data.count;
      }
      toast.success(`${count} dosya silindi`);
      setConfirmDeleteSelected(false);
      exitSelectMode();
    } catch (error) {
      console.error('Seçilenleri silme hatası:', error);
      toast.error('Dosyalar silinemedi');
    } finally {
      setIsDeletingSelected(false);
      refresh();
    }
  };

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

  // Seçili albüm varsa yalnızca o albüm, yoksa kullanıcının bütün galerisi
  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      const query = activeAlbum ? `?${new URLSearchParams({ album: activeAlbum })}` : '';
      const { data } = await api.delete(`/api/gallery/admin/user/${userId}/photos${query}`);
      toast.success(`${data.count} dosya silindi`);
      setConfirmDeleteAll(false);
      if (activeAlbum) setActiveAlbum(null);
      else fetchPhotos(1, null, false);
      fetchUser();
    } catch (error) {
      console.error('Toplu silme hatası:', error);
      toast.error('Fotoğraflar silinemedi');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const loadMore = () => {
    if (!pagination || pagination.page >= pagination.totalPages) return;
    fetchPhotos(pagination.page + 1, activeAlbum, true);
  };

  const hasMore = pagination ? pagination.page < pagination.totalPages : false;
  // Yazım farkı yeni albüm açmasın: mevcut adın yazımı kullanılır
  const uploadAlbum = canonicalAlbum(albumInput, albumOptions);

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
        <p className="text-gray-400 mt-1 flex flex-wrap items-center gap-x-3">
          <span>
            {user?.email} · {pagination?.total ?? user?._count.photos ?? 0} fotoğraf
          </span>
          {(pagination?.total ?? 0) > 0 && (
            <button
              onClick={() => setConfirmDeleteAll(true)}
              className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 hover:underline"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {activeAlbum ? 'Bu albümü sil' : 'Tüm fotoğrafları sil'}
            </button>
          )}
        </p>
      </div>

      {/* Yükleme paneli — album → R2'de yarışma klasörü olur */}
      <MediaUploader
        presign={async (files) => {
          const { data } = await api.post('/api/gallery/admin/presign', {
            userId,
            album: uploadAlbum || undefined,
            files,
          });
          return data.files;
        }}
        confirm={async (files) => {
          await api.post('/api/gallery/admin/confirm', {
            userId,
            album: uploadAlbum || undefined,
            files,
          });
        }}
        label={`${user?.name || 'Müşteri'} — ${uploadAlbum || 'genel'}`}
        target={`user:${userId}`}
        onUploaded={refresh}
        renderFields={() => (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Yarışma / Albüm (R2'de klasör olur)
            </label>
            <AlbumInput value={albumInput} onChange={setAlbumInput} options={albumOptions} />
            <p className="text-xs text-gray-500 mt-1.5">
              Kutuya tıklayınca mevcut albümler ve son yarışmalar listelenir. Boş bırakılırsa "genel".
            </p>
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

      {userId && <DownloadHistory userId={userId} />}

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
            Tümü <span className="opacity-70">({user?._count.photos ?? 0})</span>
          </button>
          {albums.map((album) => (
            <span key={album} className="inline-flex items-center">
              <button
                onClick={() => setActiveAlbum(album)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  activeAlbum === album
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:text-gray-300'
                }`}
              >
                {album} <span className="opacity-70">({albumCounts[album] ?? 0})</span>
              </button>
              {activeAlbum === album && (
                <button
                  type="button"
                  onClick={() => setRenameFrom(album)}
                  className="ml-1 p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-gray-800"
                  title="Albüm adını düzelt"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </span>
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
          {/* Seç → Albüme taşı / Sil */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {!selectMode ? (
              <button
                type="button"
                onClick={() => setSelectMode(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-gray-700 bg-gray-800/50 text-gray-300 hover:text-white"
              >
                <CheckSquare className="w-4 h-4" /> Seç (taşı / sil)
              </button>
            ) : (
              <>
                <span className="text-sm text-white font-medium mr-1">{selectedIds.size} seçili</span>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set(photos.map((p) => p.id)))}
                  className="px-3 py-1.5 rounded-lg text-sm border border-gray-700 bg-gray-800/50 text-gray-300 hover:text-white"
                >
                  Görünenlerin tümü ({photos.length})
                </button>
                <button
                  type="button"
                  disabled={selectedIds.size === 0}
                  onClick={() => setMoveOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-amber-500 hover:bg-amber-600 text-white font-medium disabled:opacity-40"
                >
                  <FolderInput className="w-4 h-4" /> Albüme taşı
                </button>
                <button
                  type="button"
                  disabled={selectedIds.size === 0}
                  onClick={() => setConfirmDeleteSelected(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" /> Sil
                </button>
                <button
                  type="button"
                  onClick={exitSelectMode}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" /> İptal
                </button>
              </>
            )}
          </div>

          <AdminMediaGrid
            items={photos}
            deletingId={deletingId}
            onDelete={(item) => handleDelete(item as GalleryPhoto)}
            selectedIds={selectMode ? selectedIds : undefined}
            onToggleSelect={selectMode ? (item) => toggleSelect(item.id) : undefined}
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

      <ConfirmDeleteModal
        open={confirmDeleteAll}
        title={activeAlbum ? 'Albüm silinsin mi?' : 'Tüm fotoğraflar silinsin mi?'}
        message={
          <>
            {activeAlbum ? (
              <>
                <strong>{user?.name}</strong> galerisindeki <strong>{activeAlbum}</strong> albümünün{' '}
                <strong>{pagination?.total ?? 0}</strong> dosyası
              </>
            ) : (
              <>
                <strong>{user?.name}</strong> galerisindeki <strong>{pagination?.total ?? 0}</strong> dosyanın
                tamamı
              </>
            )}{' '}
            (önizlemeleriyle birlikte) kalıcı olarak silinecek. Müşteri artık bu dosyaları göremez. Bu işlem
            geri alınamaz.
          </>
        }
        confirmLabel="Evet, Hepsini Sil"
        isDeleting={isDeletingAll}
        onConfirm={handleDeleteAll}
        onCancel={() => setConfirmDeleteAll(false)}
      />

      <ConfirmDeleteModal
        open={confirmDeleteSelected}
        title="Seçilen dosyalar silinsin mi?"
        message={
          <>
            <strong>{selectedIds.size}</strong> dosya (önizlemeleriyle birlikte) kalıcı olarak silinecek. Bu işlem
            geri alınamaz.
          </>
        }
        confirmLabel="Evet, Sil"
        isDeleting={isDeletingSelected}
        onConfirm={handleDeleteSelected}
        onCancel={() => setConfirmDeleteSelected(false)}
      />

      {moveOpen && (
        <AlbumNameModal
          title={`${selectedIds.size} dosyayı albüme taşı`}
          description="Dosyalar Cloudflare'de de yeni yarışma klasörüne taşınır."
          initialValue={activeAlbum ?? ''}
          options={albumOptions}
          confirmLabel="Taşı"
          progress={moveProgress}
          onSubmit={handleMoveSelected}
          onCancel={() => setMoveOpen(false)}
        />
      )}

      {renameFrom !== null && (
        <AlbumNameModal
          title="Albüm adını düzelt"
          description={`"${renameFrom}" albümündeki ${albumCounts[renameFrom] ?? 0} dosya yeni ada ve Cloudflare'de yeni klasöre taşınır. Mevcut bir albümün adını yazarsanız iki albüm birleşir.`}
          initialValue={renameFrom}
          options={albumOptions.filter((a) => a !== renameFrom)}
          confirmLabel="Kaydet"
          progress={moveProgress}
          onSubmit={handleRenameAlbum}
          onCancel={() => setRenameFrom(null)}
        />
      )}
    </div>
  );
};

export default UserGalleryPage;
