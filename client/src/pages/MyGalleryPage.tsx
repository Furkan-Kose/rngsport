import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Images,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Camera,
  Video,
  FolderDown,
  Play,
} from "lucide-react";
import { toast } from "react-toastify";
import api, { API_URL } from "../lib/api";
import SEO from "../components/SEO";

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

const isVideo = (photo: GalleryPhoto) => photo.contentType?.startsWith("video/");

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

  // Zip indirme: authenticated GET navigasyonu — cookie tarayıcı tarafından gönderilir
  const handleDownloadAll = () => {
    const params = new URLSearchParams();
    if (activeAlbum) params.set("album", activeAlbum);
    const query = params.toString();
    window.location.href = `${API_URL}/api/gallery/my/download-all${query ? `?${query}` : ""}`;
  };

  const handleDownload = async (photo: GalleryPhoto) => {
    setDownloadingId(photo.id);
    try {
      const { data } = await api.get(`/api/gallery/my/${photo.id}/download`);
      const link = document.createElement("a");
      link.href = data.url;
      link.download = photo.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("İndirme hatası:", error);
      toast.error("Fotoğraf indirilemedi");
    } finally {
      setDownloadingId(null);
    }
  };

  const hasMore = pagination ? pagination.page < pagination.totalPages : false;
  const lightboxPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;
  const isLightboxOpen = lightboxPhoto !== null;

  // Lightbox açıkken sayfa kaydırmasını kilitle + klavye kısayolları.
  // Cleanup'lı effect: component açıkken unmount olsa bile scroll kilitli kalmaz.
  useEffect(() => {
    if (!isLightboxOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxIndex(null);
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) =>
          prev !== null && prev < photos.length - 1 ? prev + 1 : prev
        );
      }
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [isLightboxOpen, photos.length]);

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
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-emerald-500/50 text-zinc-300 hover:text-emerald-400 text-sm font-medium transition-all duration-300"
              >
                <FolderDown className="w-4 h-4" />
                {activeAlbum ? "Bu Albümü İndir" : "Tümünü İndir"} (.zip)
              </button>
            )}
          </div>

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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="relative group aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 cursor-pointer"
                    onClick={() => setLightboxIndex(index)}
                  >
                    {isVideo(photo) ? (
                      <video
                        src={photo.url}
                        preload="metadata"
                        muted
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <img
                        src={photo.url}
                        alt={photo.fileName}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    {isVideo(photo) && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                          <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(photo);
                      }}
                      disabled={downloadingId === photo.id}
                      className="absolute bottom-2 right-2 p-2 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white opacity-0 group-hover:opacity-100 hover:bg-emerald-600/80 transition-all duration-300"
                      title="İndir"
                    >
                      {downloadingId === photo.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

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

      {/* Lightbox — document.body'ye portal'lanır: MainLayout'taki
          `relative z-10` sarmalayıcı stacking context oluşturduğu için,
          portal olmadan z-index ne olursa olsun header (z-50) üstte kalır. */}
      {createPortal(
        <AnimatePresence>
          {lightboxPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setLightboxIndex(null)}
            >
              <button
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                onClick={() => setLightboxIndex(null)}
              >
                <X className="w-6 h-6" />
              </button>

              {lightboxIndex !== null && lightboxIndex > 0 && (
                <button
                  className="absolute left-2 sm:left-6 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(lightboxIndex - 1);
                  }}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              {lightboxIndex !== null && lightboxIndex < photos.length - 1 && (
                <button
                  className="absolute right-2 sm:right-6 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(lightboxIndex + 1);
                  }}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}

              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="max-w-5xl max-h-[85vh] flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                {isVideo(lightboxPhoto) ? (
                  <video
                    key={lightboxPhoto.id}
                    src={lightboxPhoto.url}
                    controls
                    autoPlay
                    className="max-w-full max-h-[75vh] rounded-xl"
                  />
                ) : (
                  <img
                    src={lightboxPhoto.url}
                    alt={lightboxPhoto.fileName}
                    className="max-w-full max-h-[75vh] object-contain rounded-xl"
                  />
                )}
                <div className="flex items-center gap-4 mt-4">
                  <p className="text-sm text-zinc-400 truncate max-w-60">
                    {lightboxPhoto.fileName}
                  </p>
                  <button
                    onClick={() => handleDownload(lightboxPhoto)}
                    disabled={downloadingId === lightboxPhoto.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium transition-all duration-300 disabled:opacity-50"
                  >
                    {downloadingId === lightboxPhoto.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    İndir
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
};

export default MyGalleryPage;
