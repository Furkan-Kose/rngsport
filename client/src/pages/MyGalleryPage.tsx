import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Images,
  Loader2,
  Camera,
  Video,
  FolderDown,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../lib/api";
import SEO from "../components/SEO";
import MediaLightbox from "../components/MediaLightbox";
import type { MediaItem } from "../lib/media";
import MediaGrid from "../components/MediaGrid";
import { triggerDownload } from "../lib/download";
import { useZipDownload } from "../hooks/useZipDownload";
import { isMobileDevice } from "../lib/zipDownload";

interface GalleryPhoto {
  id: string;
  fileName: string;
  album: string | null;
  url: string;
  contentType: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type TypeFilter = "all" | "image" | "video";

const MyGalleryPage = () => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [albums, setAlbums] = useState<string[]>([]);
  const [activeAlbum, setActiveAlbum] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchPhotos = useCallback(
    async (page: number, album: string | null, type: TypeFilter, append: boolean) => {
      try {
        const params = new URLSearchParams({ page: String(page), limit: "60" });
        if (album) params.set("album", album);
        if (type !== "all") params.set("type", type);
        const { data } = await api.get(`/api/gallery/my?${params}`);
        setPhotos((prev) => (append ? [...prev, ...data.data] : data.data));
        setAlbums(data.albums || []);
        setPagination(data.pagination);
      } catch (error) {
        console.error("Galeri yüklenemedi:", error);
        toast.error("Fotoğraflar yüklenirken bir hata oluştu");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    setIsLoading(true);
    fetchPhotos(1, activeAlbum, typeFilter, false);
  }, [activeAlbum, typeFilter, fetchPhotos]);

  const loadMore = () => {
    if (!pagination || pagination.page >= pagination.totalPages) return;
    setIsLoadingMore(true);
    fetchPhotos(pagination.page + 1, activeAlbum, typeFilter, true);
  };

  // Toplu indirme: zip tarayıcıda, dosyalar doğrudan R2'den (bkz. lib/zipDownload)
  const zip = useZipDownload();
  const handleDownloadAll = () => {
    const query = activeAlbum ? `?${new URLSearchParams({ album: activeAlbum })}` : "";
    zip.start(`/api/gallery/my/download-manifest${query}`, `/api/gallery/my/download-all${query}`);
  };

  const handleDownload = async (photo: GalleryPhoto) => {
    setDownloadingId(photo.id);
    try {
      const { data } = await api.get(`/api/gallery/my/${photo.id}/download`);
      triggerDownload(data.url, photo.fileName);
    } catch (error) {
      console.error("İndirme hatası:", error);
      toast.error("Fotoğraf indirilemedi");
    } finally {
      setDownloadingId(null);
    }
  };

  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  return (
    <div className="min-h-screen bg-zinc-950 pt-28 pb-16">
      <SEO title="Fotoğraflarım" description="Çekim fotoğraflarınızı görüntüleyin ve indirin." />

      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Başlık */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Images className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient-brand">Galerim</h1>
                <p className="text-zinc-500 text-sm">
                  {pagination ? `${pagination.total} dosya` : "Çekim fotoğraf ve videolarınız"}
                </p>
              </div>
            </div>
            {photos.length > 0 && (
              <button
                onClick={handleDownloadAll}
                disabled={zip.isRunning}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl disabled:opacity-70 bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-emerald-500/50 text-zinc-300 hover:text-emerald-400 text-sm font-medium transition-all duration-300"
              >
                {zip.isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderDown className="w-4 h-4" />}
                {zip.progress
                  ? zip.progress.total
                    ? `Hazırlanıyor ${zip.progress.done}/${zip.progress.total}`
                    : "Hazırlanıyor..."
                  : `${activeAlbum ? "Bu Albümü İndir" : "Tümünü İndir"} (.zip)`}
              </button>
            )}
          </div>

          {photos.length > 0 && isMobileDevice() && (
              <p className="text-xs text-zinc-500 mb-4 -mt-4">
                📱 Telefonda fotoğraf ve videoları tek tek indirirseniz doğrudan galerinize kaydedilir. Zip dosyası telefonda &quot;Dosyalar&quot; uygulamasına iner.
              </p>
            )}

          {/* Filtreler: yarışma/albüm + tür */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {albums.length > 0 && (
              <>
                <button
                  onClick={() => setActiveAlbum(null)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-300 ${
                    activeAlbum === null
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                      : "bg-zinc-800/60 border-zinc-700/50 text-zinc-400 hover:border-emerald-500/30 hover:text-zinc-300"
                  }`}
                >
                  Tüm Yarışmalar
                </button>
                {albums.map((album) => (
                  <button
                    key={album}
                    onClick={() => setActiveAlbum(album)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-300 ${
                      activeAlbum === album
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : "bg-zinc-800/60 border-zinc-700/50 text-zinc-400 hover:border-emerald-500/30 hover:text-zinc-300"
                    }`}
                  >
                    {album}
                  </button>
                ))}
                <div className="w-px h-6 bg-zinc-800 mx-1 hidden sm:block" />
              </>
            )}
            {(
              [
                { value: "all", label: "Hepsi", icon: null },
                { value: "image", label: "Fotoğraflar", icon: Camera },
                { value: "video", label: "Videolar", icon: Video },
              ] as const
            ).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTypeFilter(value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-300 ${
                  typeFilter === value
                    ? "bg-teal-500/20 border-teal-500/50 text-teal-300"
                    : "bg-zinc-800/60 border-zinc-700/50 text-zinc-400 hover:border-teal-500/30 hover:text-zinc-300"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {label}
              </button>
            ))}
          </div>

          {/* İçerik */}
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
          ) : photos.length === 0 ? (
            <div className="relative bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-2xl p-12 text-center">
              <Images className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-white mb-2">
                Henüz fotoğrafınız yüklenmedi
              </h2>
              <p className="text-sm text-zinc-500 max-w-md mx-auto">
                Çekiminiz tamamlandıktan sonra fotoğraflarınız burada görünecek.
                Teslim süresi paketinize göre değişiklik gösterir.
              </p>
            </div>
          ) : (
            <>
              <MediaGrid
                items={photos}
                onOpen={setLightboxIndex}
                onDownload={(item) => handleDownload(item as GalleryPhoto)}
                downloadingId={downloadingId}
              />

              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="px-6 py-3 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-emerald-500/50 text-zinc-300 font-medium transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isLoadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                    Daha Fazla Yükle
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      <MediaLightbox
        items={photos}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        onDownload={(item: MediaItem) => handleDownload(item as GalleryPhoto)}
        downloadingId={downloadingId}
      />
    </div>
  );
};

export default MyGalleryPage;
