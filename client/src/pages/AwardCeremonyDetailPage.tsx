import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Award, Calendar, FolderDown, Images, Loader2, MapPin } from "lucide-react";
import { toast } from "react-toastify";
import api from "../lib/api";
import SEO from "../components/SEO";
import MediaGrid from "../components/MediaGrid";
import MediaLightbox from "../components/MediaLightbox";
import type { MediaItem } from "../lib/media";
import { triggerDownload } from "../lib/download";
import { useZipDownload } from "../hooks/useZipDownload";
import { isMobileDevice } from "../lib/zipDownload";
import type { AwardCeremony, AwardPhoto, Pagination } from "../lib/awardCeremonies";

const AwardCeremonyDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [ceremony, setCeremony] = useState<AwardCeremony | null>(null);
  const [photos, setPhotos] = useState<AwardPhoto[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (page: number, append: boolean) => {
      try {
        const params = new URLSearchParams({ page: String(page), limit: "60" });
        const { data } = await api.get(`/api/award-ceremonies/${slug}?${params}`);
        setCeremony(data.ceremony);
        setPhotos((prev) => (append ? [...prev, ...data.data] : data.data));
        setPagination(data.pagination);
      } catch (error) {
        const status = (error as { response?: { status?: number } }).response?.status;
        if (status === 404) {
          setNotFound(true);
        } else {
          console.error("Ödül töreni yüklenemedi:", error);
          toast.error("Fotoğraflar yüklenirken bir hata oluştu");
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [slug]
  );

  useEffect(() => {
    setIsLoading(true);
    fetchPage(1, false);
  }, [fetchPage]);

  const loadMore = () => {
    if (!pagination || pagination.page >= pagination.totalPages) return;
    setIsLoadingMore(true);
    fetchPage(pagination.page + 1, true);
  };

  // Toplu indirme: zip tarayıcıda, dosyalar doğrudan R2'den (bkz. lib/zipDownload)
  const zip = useZipDownload();
  const handleDownloadAll = () =>
    zip.start(
      `/api/award-ceremonies/${slug}/download-manifest`,
      `/api/award-ceremonies/${slug}/download-all`,
    );

  const handleDownload = async (item: MediaItem) => {
    setDownloadingId(item.id);
    try {
      const { data } = await api.get(`/api/award-ceremonies/${slug}/photos/${item.id}/download`);
      triggerDownload(data.url, item.fileName);
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
      <SEO
        title={ceremony?.title || "Ödül Töreni"}
        description={
          ceremony?.description ||
          "Ödül töreni fotoğraflarını görüntüleyin, tek tek veya toplu olarak indirin."
        }
        url={`https://rngsport.com/odul-torenleri/${slug}`}
      />

      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <Link
          to="/odul-torenleri"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-emerald-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Tüm Ödül Törenleri
        </Link>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : notFound || !ceremony ? (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-12 text-center">
            <Award className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h1 className="text-lg font-semibold text-white mb-2">Ödül töreni bulunamadı</h1>
            <p className="text-sm text-zinc-500">Bağlantı hatalı olabilir veya tören kaldırılmış olabilir.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Başlık */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-14 h-14 shrink-0 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <Award className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl md:text-3xl font-bold text-gradient-brand">{ceremony.title}</h1>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400 mt-1">
                    {ceremony.date && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-emerald-500/70" />
                        {ceremony.date}
                      </span>
                    )}
                    {ceremony.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-500/70" />
                        {ceremony.location}
                      </span>
                    )}
                    {pagination && <span>{pagination.total} dosya</span>}
                  </div>
                  {ceremony.description && (
                    <p className="text-zinc-400 mt-3 max-w-2xl whitespace-pre-line">{ceremony.description}</p>
                  )}
                </div>
              </div>
              {photos.length > 0 && (
                <button
                  onClick={handleDownloadAll}
                  disabled={zip.isRunning}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl disabled:opacity-70 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold transition-all duration-300"
                >
                  {zip.isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderDown className="w-4 h-4" />}
                  {zip.progress
                  ? zip.progress.total
                    ? `Hazırlanıyor ${zip.progress.done}/${zip.progress.total}`
                    : "Hazırlanıyor..."
                  : "Tümünü İndir (.zip)"}
                </button>
              )}
            </div>

            {photos.length > 0 && isMobileDevice() && (
              <p className="text-xs text-zinc-500 mb-4">
                📱 Telefonda fotoğraf ve videoları tek tek indirirseniz doğrudan galerinize kaydedilir. Zip dosyası telefonda &quot;Dosyalar&quot; uygulamasına iner.
              </p>
            )}

            {photos.length === 0 ? (
              <div className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-2xl p-12 text-center">
                <Images className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-white mb-2">Fotoğraflar henüz yüklenmedi</h2>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">
                  Ödül töreni fotoğrafları yarışma günü içerisinde bu sayfaya yüklenecektir.
                </p>
              </div>
            ) : (
              <>
                <MediaGrid
                  items={photos}
                  onOpen={setLightboxIndex}
                  onDownload={handleDownload}
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
        )}
      </div>

      <MediaLightbox
        items={photos}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        onDownload={handleDownload}
        downloadingId={downloadingId}
      />
    </div>
  );
};

export default AwardCeremonyDetailPage;
