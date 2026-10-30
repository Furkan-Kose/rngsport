import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Images,
  Loader2,
  Camera,
  Video,
} from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

import api from "../lib/api";
import SEO from "../components/SEO";
import MediaLightbox from "../components/MediaLightbox";
import DownloadAllButtons from "../components/DownloadAllButtons";
import { withQuality, type DownloadSizes, type MediaItem, type MediaQuality } from "../lib/media";
import MediaGrid from "../components/MediaGrid";
import { triggerDownload } from "../lib/download";
import { useZipDownload } from "../hooks/useZipDownload";
import { canShareFiles } from "../lib/device";
import { DownloadHint, SaveToPhotosModal, SelectionBar } from "../components/MediaSelection";
import { useMediaSelection } from "../hooks/useMediaSelection";
import { CheckSquare, Link2Off } from "lucide-react";
import GalleryShopPromo from "../components/shop/GalleryShopPromo";
import FeedbackForm from "../components/FeedbackForm";
import ShareGalleryButton, { ActiveSharesLine } from "../components/ShareGalleryButton";
import { useGalleryShares } from "../hooks/useGalleryShares";
import LocalizedLink from "../components/LocalizedLink";
import { formatDate } from "../lib/format";

interface GalleryPhoto {
  id: string;
  fileName: string;
  album: string | null;
  url: string;
  thumbUrl?: string | null;
  previewUrl?: string | null;
  size?: number | null;
  previewSize?: number | null;
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

/**
 * shareToken verilirse paylaşılan galeri (/paylasim/:token): girişsiz, salt okunur.
 * Uçlar /api/gallery/shared/:token/* — sahibin hesabına dair hiçbir şey dönmez; toplu indirme
 * yalnızca tarayıcıda (sunucu zip'i yok → Railway trafiği yok). Mağaza ve görüş formu gösterilmez.
 *
 * previewUserId verilirse admin "müşteri gözüyle gör" önizlemesi: müşterinin galerisi aynı
 * görünümle, salt okunur (/api/gallery/admin/user/:id/*). Paylaş, görüş formu ve mağaza
 * popup'ı yok; indirmeler müşterinin indirme geçmişine yazılmaz.
 */
const MyGalleryPage = ({
  shareToken,
  previewUserId,
  previewName,
}: {
  shareToken?: string;
  previewUserId?: string;
  previewName?: string;
}) => {
  const isShared = !!shareToken;
  const isPreview = !!previewUserId;
  // Müşteri adına işlem yapılan parçalar (paylaş, görüş) yalnızca müşterinin kendi sayfasında
  const isOwnGallery = !isShared && !isPreview;
  const base = isShared
    ? `/api/gallery/shared/${encodeURIComponent(shareToken)}`
    : isPreview
      ? `/api/gallery/admin/user/${encodeURIComponent(previewUserId)}`
      : "/api/gallery/my";
  const [sharedInfo, setSharedInfo] = useState<{ album: string | null; expiresAt: string } | null>(null);
  const [invalidLink, setInvalidLink] = useState(false);
  const { shares, setShares } = useGalleryShares(isOwnGallery);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [albums, setAlbums] = useState<string[]>([]);
  const [activeAlbum, setActiveAlbum] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSizes, setDownloadSizes] = useState<DownloadSizes | null>(null);
  const [saveItems, setSaveItems] = useState<MediaItem[] | null>(null);
  const selection = useMediaSelection();
  const { t } = useTranslation();

  const fetchPhotos = useCallback(
    async (page: number, album: string | null, type: TypeFilter, append: boolean) => {
      try {
        const params = new URLSearchParams({ page: String(page), limit: "60" });
        if (album) params.set("album", album);
        if (type !== "all") params.set("type", type);
        const { data } = await api.get(`${base}?${params}`);
        setPhotos((prev) => (append ? [...prev, ...data.data] : data.data));
        setAlbums(data.albums || []);
        setPagination(data.pagination);
        setDownloadSizes(data.downloadSizes ?? null);
        if (data.share) setSharedInfo(data.share);
      } catch (error) {
        if (isShared && (error as { response?: { status?: number } }).response?.status === 404) {
          setInvalidLink(true);
          return;
        }
        console.error("Galeri yüklenemedi:", error);
        toast.error(t("pages.media.loadError"));
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    // t yalnızca hata bildiriminde
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [base]
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
  const handleDownloadAll = async (quality: MediaQuality) => {
    const query = activeAlbum ? `?${new URLSearchParams({ album: activeAlbum })}` : "";
    await zip.start(
      withQuality(`${base}/download-manifest${query}`, quality),
      // Paylaşılan galeride sunucu zip'i yok: tarayıcının kaldıramayacağı boyutta uyarı çıkar
      isOwnGallery ? withQuality(`/api/gallery/my/download-all${query}`, quality) : undefined,
    );
  };

  // Seçilenler: manifest POST ile yalnızca bu id'ler (sunucu zip'i yok — Railway trafiği)
  const handleZipSelected = (ids: string[], quality: MediaQuality) =>
    zip.start(withQuality(`${base}/download-manifest`, quality), undefined, ids);

  // Taze imzalı indirme linki (galeriye kaydet için dosya buradan çekilir).
  // purpose=save: admin indirme geçmişinde "Galeriye kaydedildi" olarak görünsün
  const getUrl = useCallback(
    async (item: MediaItem, quality: MediaQuality) =>
      (await api.get(withQuality(`${base}/${item.id}/download?purpose=save`, quality))).data.url as string,
    [base]
  );

  // Filtre değişince seçim sıfırlanır (seçilenler görünmeyen dosyalarda kalmasın)
  const changeAlbum = (album: string | null) => {
    selection.clear();
    setActiveAlbum(album);
  };
  const changeType = (type: TypeFilter) => {
    selection.clear();
    setTypeFilter(type);
  };

  const handleDownload = async (photo: GalleryPhoto, quality: MediaQuality) => {
    setDownloadingId(photo.id);
    try {
      const { data } = await api.get(withQuality(`${base}/${photo.id}/download`, quality));
      triggerDownload(data.url, photo.fileName);
    } catch (error) {
      console.error("İndirme hatası:", error);
      toast.error(t("pages.media.downloadError"));
    } finally {
      setDownloadingId(null);
    }
  };

  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  if (invalidLink) {
    return (
      <div className="min-h-screen bg-zinc-950 pt-28 pb-16">
        <SEO title={t("pages.share.seoTitle")} noindex />
        <div className="container mx-auto px-4 max-w-lg text-center">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-10">
            <Link2Off className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-white mb-2">{t("pages.share.invalidTitle")}</h1>
            <p className="text-sm text-zinc-400 mb-6">{t("pages.share.invalidText")}</p>
            <LocalizedLink to="/" className="inline-flex px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold">
              {t("pages.share.goHome")}
            </LocalizedLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-zinc-950 pt-28 ${selection.active ? "pb-56" : "pb-16"}`}>
      {isShared || isPreview ? (
        <SEO title={isPreview ? "Müşteri görünümü" : t("pages.share.seoTitle")} noindex />
      ) : (
        <SEO title={t("pages.myGallery.seoTitle")} description={t("pages.myGallery.seoDescription")} />
      )}

      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {isPreview && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <span>
              👁 Önizleme — <strong className="text-amber-100">{previewName || "Müşteri"}</strong> galerisini
              müşterinin gördüğü gibi görüyorsunuz. Paylaş ve görüş formu burada gizli.
            </span>
            <a
              href={`/admin/users/${previewUserId}/galeri`}
              className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 font-semibold text-zinc-950 hover:bg-amber-400"
            >
              Panele dön
            </a>
          </div>
        )}
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
                <h1 className="text-3xl font-bold text-gradient-brand">
                  {isShared ? t("pages.share.sharedTitle") : t("pages.myGallery.title")}
                </h1>
                <p className="text-zinc-500 text-sm">
                  {pagination ? t("pages.media.files", { count: pagination.total }) : t("pages.myGallery.subtitle")}
                  {isShared && sharedInfo && (
                    <> · {t("pages.share.validUntil", { date: formatDate(sharedInfo.expiresAt, { day: "numeric", month: "long" }) })}</>
                  )}
                </p>
              </div>
            </div>
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
              {!selection.active && (
              <button
                onClick={selection.start}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-emerald-500/50 text-zinc-300 hover:text-emerald-400 text-sm font-medium transition-all duration-300"
              >
                <CheckSquare className="w-4 h-4" />
                {t("pages.media.select.start")}
              </button>
              )}
              {isOwnGallery && (
                <ShareGalleryButton
                  album={activeAlbum}
                  shares={shares}
                  setShares={setShares}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-emerald-500/50 text-zinc-300 hover:text-emerald-400 text-sm font-medium transition-all duration-300"
                />
              )}
              <DownloadAllButtons
                serverFallback={isOwnGallery}
                sizes={downloadSizes}
                album={activeAlbum !== null}
                progress={zip.progress}
                
                onStart={handleDownloadAll}
                primaryClassName="flex items-center gap-2 px-4 py-2.5 rounded-xl disabled:opacity-70 bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-emerald-500/50 text-zinc-300 hover:text-emerald-400 text-sm font-medium transition-all duration-300"
              />
              </div>
            )}
          </div>

          {isOwnGallery && <ActiveSharesLine shares={shares} />}

          {photos.length > 0 && <DownloadHint />}

          {!isShared && <GalleryShopPromo withPopup={!isPreview} />}

          {/* Filtreler: yarışma/albüm + tür */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {albums.length > 0 && !(isShared && sharedInfo?.album) && (
              <>
                <button
                  onClick={() => changeAlbum(null)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-300 ${
                    activeAlbum === null
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                      : "bg-zinc-800/60 border-zinc-700/50 text-zinc-400 hover:border-emerald-500/30 hover:text-zinc-300"
                  }`}
                >
                  {t("pages.myGallery.allCompetitions")}
                </button>
                {albums.map((album) => (
                  <button
                    key={album}
                    onClick={() => changeAlbum(album)}
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
                { value: "all", label: t("pages.myGallery.all"), icon: null },
                { value: "image", label: t("pages.myGallery.photos"), icon: Camera },
                { value: "video", label: t("pages.myGallery.videos"), icon: Video },
              ] as const
            ).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => changeType(value)}
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
                {t("pages.myGallery.emptyTitle")}
              </h2>
              <p className="text-sm text-zinc-500 max-w-md mx-auto">
                {t("pages.myGallery.emptyText")}
              </p>
            </div>
          ) : (
            <>
              <MediaGrid
                items={photos}
                onOpen={setLightboxIndex}
                onDownload={(item, quality) => handleDownload(item as GalleryPhoto, quality)}
                downloadingId={downloadingId}
                selecting={selection.active}
                selectedIds={selection.selected}
                onToggleSelect={selection.toggle}
              />

              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="px-6 py-3 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-emerald-500/50 text-zinc-300 font-medium transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isLoadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t("pages.media.loadMore")}
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>

        {isOwnGallery && <FeedbackForm page="galerim" />}
      </div>

      <MediaLightbox
        items={photos}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        onDownload={(item: MediaItem, quality: MediaQuality) => handleDownload(item as GalleryPhoto, quality)}
        downloadingId={downloadingId}
        onSaveToGallery={canShareFiles() ? (item) => setSaveItems([item]) : undefined}
      />

      {selection.active && (
        <SelectionBar
          items={photos}
          selectedIds={selection.selected}
          onSelectAll={() => selection.selectMany(photos.map((p) => p.id))}
          onClear={selection.clear}
          onExit={selection.stop}
          onZip={handleZipSelected}
          zipRunning={zip.isRunning}
          zipProgress={zip.progress}
          getUrl={getUrl}
          onDownloadSingle={(item, quality) => handleDownload(item as GalleryPhoto, quality)}
          hasMore={hasMore}
        />
      )}
      {saveItems && (
        <SaveToPhotosModal
          items={saveItems}
          quality="original"
          getUrl={getUrl}
          onDownloadSingle={(item, quality) => handleDownload(item as GalleryPhoto, quality)}
          onClose={() => setSaveItems(null)}
        />
      )}
    </div>
  );
};

export default MyGalleryPage;
