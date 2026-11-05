import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router';
import { toast } from 'react-toastify';
import { CheckSquare, Eye, EyeOff, FolderInput, Images, Pencil, Trash2, X } from 'lucide-react';
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
import { Button, EmptyState, FilterTabs, PageHeader, SkeletonGrid } from '../../components/admin/ui';

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
  // Müşteriden gizleme: tüm galeri (all) ve/veya tek tek albümler
  const [visibility, setVisibility] = useState<{ all: boolean; albums: string[] }>({ all: false, albums: [] });
  const [visibilityTarget, setVisibilityTarget] = useState<{ album: string | null; hidden: boolean } | null>(null);
  const [savingVisibility, setSavingVisibility] = useState(false);

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
        if (data.visibility) setVisibility(data.visibility);
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

  // Tek dosya silme: önce onay modalı (photoToDelete), sonra sil
  const [photoToDelete, setPhotoToDelete] = useState<GalleryPhoto | null>(null);
  const handleDelete = async () => {
    const photo = photoToDelete;
    if (!photo) return;
    setDeletingId(photo.id);
    try {
      await api.delete(`/api/gallery/admin/photo/${photo.id}`);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      toast.success('Fotoğraf silindi');
      setPhotoToDelete(null);
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

  const isAlbumHidden = (album: string | null) => !!album && visibility.albums.includes(album);
  const applyVisibility = async () => {
    if (!visibilityTarget) return;
    setSavingVisibility(true);
    try {
      const { data } = await api.put(`/api/gallery/admin/user/${userId}/visibility`, visibilityTarget);
      setVisibility(data.visibility);
      toast.success(data.message);
      setVisibilityTarget(null);
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Görünürlük değiştirilemedi');
    } finally {
      setSavingVisibility(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ to: '/admin/users', label: 'Kullanıcılara Dön' }}
        title={`${user?.name || 'Kullanıcı'} — Galeri`}
        icon={Images}
        description={`${user?.email ?? ''} · ${pagination?.total ?? user?._count.photos ?? 0} dosya`}
        actions={
          <>
            <Button icon={Eye} href={`/galerim/onizleme/${userId}`} target="_blank">
              Müşteri gözüyle gör{visibility.all && <span className="text-amber-400 font-normal">(gizli)</span>}
            </Button>
            {(pagination?.total ?? 0) > 0 && (
              <Button variant="danger" icon={Trash2} onClick={() => setConfirmDeleteAll(true)}>
                {activeAlbum ? 'Bu albümü sil' : 'Tüm dosyaları sil'}
              </Button>
            )}
          </>
        }
      />

      {/* Müşteriye görünürlük: tüm galeri açık / gizli (albüm bazlı gizleme albüm sekmelerinde) */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
          visibility.all ? 'bg-amber-500/10 border-amber-500/40' : 'bg-emerald-500/5 border-emerald-500/25'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`inline-flex items-center justify-center w-9 h-9 rounded-full shrink-0 ${
              visibility.all ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'
            }`}
          >
            {visibility.all ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              {visibility.all ? 'Galeri müşteriden gizli' : 'Galeri müşteriye açık'}
            </p>
            <p className="text-xs text-gray-400">
              {visibility.all
                ? "Müşteri Galerim'de hiçbir dosya görmez, paylaşım linkleri de boş görünür. Yükleme yapmaya devam edebilirsiniz."
                : visibility.albums.length > 0
                  ? `Gizli albüm: ${visibility.albums.join(', ')} — müşteri bu albümleri görmez.`
                  : "Müşteri Galerim'de tüm dosyaları görür."}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant={visibility.all ? 'primary' : 'secondary'}
          icon={visibility.all ? Eye : EyeOff}
          onClick={() => setVisibilityTarget({ album: null, hidden: !visibility.all })}
        >
          {visibility.all ? 'Galeriyi müşteriye aç' : 'Galeriyi gizle'}
        </Button>
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
            {(visibility.all || isAlbumHidden(uploadAlbum || null)) && (
              <p className="text-xs text-amber-300 mt-1.5 flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5 shrink-0" />
                {visibility.all ? 'Galeri gizli' : 'Bu albüm gizli'} — yüklenen dosyaları müşteri açılana kadar görmez.
              </p>
            )}
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
        <div className="flex flex-wrap items-center gap-2">
          <FilterTabs
            tabs={[
              { key: '', label: 'Tümü', count: user?._count.photos ?? 0 },
              ...albums.map((album) => ({
                key: album,
                label: isAlbumHidden(album) ? (
                  <span className="inline-flex items-center gap-1 opacity-70" title="Müşteriden gizli">
                    <EyeOff className="w-3.5 h-3.5" />
                    {album}
                  </span>
                ) : (
                  album
                ),
                count: albumCounts[album] ?? 0,
              })),
            ]}
            value={activeAlbum ?? ''}
            onChange={(key) => setActiveAlbum(key || null)}
          />
          {activeAlbum && (
            <>
              <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setRenameFrom(activeAlbum)}>
                Albüm adını düzelt
              </Button>
              <Button
                size="sm"
                variant="ghost"
                icon={isAlbumHidden(activeAlbum) ? Eye : EyeOff}
                disabled={visibility.all}
                title={visibility.all ? 'Galerinin tamamı gizli — önce galeriyi açın' : undefined}
                onClick={() => setVisibilityTarget({ album: activeAlbum, hidden: !isAlbumHidden(activeAlbum) })}
              >
                {isAlbumHidden(activeAlbum) ? 'Bu albümü müşteriye aç' : 'Bu albümü gizle'}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Foto grid */}
      {isLoading ? (
        <SkeletonGrid />
      ) : photos.length === 0 ? (
        <EmptyState icon={Images} title="Bu kullanıcıya henüz dosya yüklenmedi" />
      ) : (
        <div className="space-y-4">
          {/* Seç → Albüme taşı / Sil */}
          <div className="flex flex-wrap items-center gap-2">
            {!selectMode ? (
              <Button size="sm" icon={CheckSquare} onClick={() => setSelectMode(true)}>
                Seç (taşı / sil)
              </Button>
            ) : (
              <>
                <span className="text-sm text-white font-medium mr-1">{selectedIds.size} seçili</span>
                <Button size="sm" onClick={() => setSelectedIds(new Set(photos.map((p) => p.id)))}>
                  Görünenlerin tümü ({photos.length})
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  icon={FolderInput}
                  disabled={selectedIds.size === 0}
                  onClick={() => setMoveOpen(true)}
                >
                  Albüme taşı
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  icon={Trash2}
                  disabled={selectedIds.size === 0}
                  onClick={() => setConfirmDeleteSelected(true)}
                >
                  Sil
                </Button>
                <Button size="sm" variant="ghost" icon={X} onClick={exitSelectMode}>
                  İptal
                </Button>
              </>
            )}
          </div>

          <AdminMediaGrid
            items={photos}
            deletingId={deletingId}
            onDelete={(item) => setPhotoToDelete(item as GalleryPhoto)}
            selectedIds={selectMode ? selectedIds : undefined}
            onToggleSelect={selectMode ? (item) => toggleSelect(item.id) : undefined}
          />

          {hasMore && (
            <div className="flex justify-center">
              <Button onClick={loadMore}>Daha Fazla Yükle</Button>
            </div>
          )}
        </div>
      )}

      <ConfirmDeleteModal
        open={confirmDeleteAll}
        title={activeAlbum ? 'Albüm silinsin mi?' : 'Tüm dosyalar silinsin mi?'}
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
        open={!!photoToDelete}
        title="Dosya silinsin mi?"
        message={
          <>
            <strong className="text-white break-all">{photoToDelete?.fileName}</strong> (önizlemeleriyle birlikte)
            kalıcı olarak silinecek. Müşteri artık bu dosyayı göremez. Bu işlem geri alınamaz.
          </>
        }
        isDeleting={!!deletingId}
        onConfirm={handleDelete}
        onCancel={() => setPhotoToDelete(null)}
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

      <ConfirmDeleteModal
        open={!!visibilityTarget}
        tone="confirm"
        title={
          visibilityTarget?.album
            ? visibilityTarget.hidden
              ? `"${visibilityTarget.album}" albümü gizlensin mi?`
              : `"${visibilityTarget.album}" albümü müşteriye açılsın mı?`
            : visibilityTarget?.hidden
              ? 'Galeri müşteriden gizlensin mi?'
              : 'Galeri müşteriye açılsın mı?'
        }
        message={
          visibilityTarget?.hidden
            ? `${user?.name || 'Müşteri'} ${
                visibilityTarget.album ? 'bu albümdeki dosyaları' : 'galerisindeki hiçbir dosyayı'
              } Galerim'de ve paylaşım linklerinde görmez, indiremez. Dosyalar silinmez; istediğiniz zaman açabilirsiniz.`
            : `${user?.name || 'Müşteri'} ${
                visibilityTarget?.album ? 'bu albümü' : 'galerisini'
              } Galerim'de yeniden görür ve indirebilir.`
        }
        confirmLabel={visibilityTarget?.hidden ? 'Evet, Gizle' : 'Evet, Aç'}
        busyLabel="Kaydediliyor..."
        isDeleting={savingVisibility}
        onConfirm={applyVisibility}
        onCancel={() => setVisibilityTarget(null)}
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
