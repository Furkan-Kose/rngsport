import { useCallback, useEffect, useState } from "react";
import { Images, Camera, Video, Eye } from "lucide-react";
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
import { Button, Chip, EmptyState, PageHeader, Skeleton } from "../components/ui/kit";
import { buttonClass, containerClass, cx, pageClass, widthGrid } from "../lib/siteUi";

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
  // Önizlemede müşterinin gördüğü kapsam: gizlenen galeri / albümler admin önizlemesinde de düşer
  const asCustomer = useCallback(
    (url: string) => (isPreview ? `${url}${url.includes("?") ? "&" : "?"}asCustomer=1` : url),
    [isPreview],
  );
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
        const { data } = await api.get(asCustomer(`${base}?${params}`));
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
    [base, asCustomer]
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
      asCustomer(withQuality(`${base}/download-manifest${query}`, quality)),
      // Paylaşılan galeride sunucu zip'i yok: tarayıcının kaldıramayacağı boyutta uyarı çıkar
      isOwnGallery ? withQuality(`/api/gallery/my/download-all${query}`, quality) : undefined,
    );
  };

  // Seçilenler: manifest POST ile yalnızca bu id'ler (sunucu zip'i yok — Railway trafiği)
  const handleZipSelected = (ids: string[], quality: MediaQuality) =>
    zip.start(asCustomer(withQuality(`${base}/download-manifest`, quality)), undefined, ids);

  // Taze imzalı indirme linki (galeriye kaydet için dosya buradan çekilir).
  // purpose=save: admin indirme geçmişinde "Galeriye kaydedildi" olarak görünsün
  const getUrl = useCallback(
    async (item: MediaItem, quality: MediaQuality) =>
      (await api.get(asCustomer(withQuality(`${base}/${item.id}/download?purpose=save`, quality)))).data.url as string,
    [base, asCustomer]
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
      const { data } = await api.get(asCustomer(withQuality(`${base}/${photo.id}/download`, quality)));
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
      <div className={pageClass}>
        <SEO title={t("pages.share.seoTitle")} noindex noReferrer />
        <div className={containerClass}>
          <EmptyState
            icon={Link2Off}
            title={t("pages.share.invalidTitle")}
            description={t("pages.share.invalidText")}
            className="max-w-lg mx-auto mt-10"
          >
            <LocalizedLink to="/" className={buttonClass("primary")}>
              {t("pages.share.goHome")}
            </LocalizedLink>
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className={cx(pageClass, selection.active && "pb-56")}>
      {isShared || isPreview ? (
        <SEO title={isPreview ? "Müşteri görünümü" : t("pages.share.seoTitle")} noindex noReferrer />
      ) : (
        <SEO noindex title={t("pages.myGallery.seoTitle")} description={t("pages.myGallery.seoDescription")} />
      )}


      <div className={containerClass}>
        <div className={widthGrid}>
          {isPreview && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              <span className="flex items-start gap-2">
                <Eye className="w-5 h-5 shrink-0" aria-hidden />
                <span>
                  Önizleme — <strong>{previewName || "Müşteri"}</strong> galerisini müşterinin gördüğü gibi
                  görüyorsunuz. Paylaş ve görüş formu burada gizli.
                </span>
              </span>
              <a
                href={`/admin/users/${previewUserId}/galeri`}
                className="shrink-0 inline-flex items-center min-h-10 rounded-xl bg-amber-500 px-4 font-semibold text-zinc-950 hover:bg-amber-400"
              >
                Panele dön
              </a>
            </div>
          )}

          <PageHeader
            backTo={isOwnGallery ? "/profil" : undefined}
            backLabel={t("common.nav.account")}
            title={isShared ? t("pages.share.sharedTitle") : t("pages.myGallery.title")}
            subtitle={
              <>
                {pagination ? t("pages.media.files", { count: pagination.total }) : t("pages.myGallery.subtitle")}
                {isShared && sharedInfo && (
                  <>
                    {" · "}
                    {t("pages.share.validUntil", {
                      date: formatDate(sharedInfo.expiresAt, { day: "numeric", month: "long" }),
                    })}
                  </>
                )}
              </>
            }
            actions={
              photos.length > 0 && (
                <>
                  {!selection.active && (
                    <Button variant="secondary" icon={CheckSquare} onClick={selection.start}>
                      {t("pages.media.select.start")}
                    </Button>
                  )}
                  {isOwnGallery && (
                    <ShareGalleryButton
                      album={activeAlbum}
                      shares={shares}
                      setShares={setShares}
                      className={buttonClass("secondary")}
                    />
                  )}
                  <DownloadAllButtons
                    serverFallback={isOwnGallery}
                    sizes={downloadSizes}
                    album={activeAlbum !== null}
                    progress={zip.progress}
                    onStart={handleDownloadAll}
                    primaryClassName={buttonClass("primary")}
                  />
                </>
              )
            }
          />

          {isOwnGallery && <ActiveSharesLine shares={shares} />}

          {photos.length > 0 && <DownloadHint />}

          {!isShared && <GalleryShopPromo withPopup={!isPreview} />}

          {/* Filtreler: yarışma/albüm + tür */}
          {albums.length > 0 && !(isShared && sharedInfo?.album) && (
            <div role="group" aria-label={t("pages.myGallery.allCompetitions")} className="flex flex-wrap gap-2 mb-3">
              <Chip active={activeAlbum === null} onClick={() => changeAlbum(null)}>
                {t("pages.myGallery.allCompetitions")}
              </Chip>
              {albums.map((album) => (
                <Chip key={album} active={activeAlbum === album} onClick={() => changeAlbum(album)}>
                  {album}
                </Chip>
              ))}
            </div>
          )}
          <div role="group" aria-label={t("pages.myGallery.typeFilter")} className="flex flex-wrap gap-2 mb-6">
            {(
              [
                { value: "all", label: t("pages.myGallery.all"), icon: null },
                { value: "image", label: t("pages.myGallery.photos"), icon: Camera },
                { value: "video", label: t("pages.myGallery.videos"), icon: Video },
              ] as const
            ).map(({ value, label, icon: Icon }) => (
              <Chip key={value} active={typeFilter === value} onClick={() => changeType(value)}>
                {Icon && <Icon className="w-4 h-4" aria-hidden />}
                {label}
              </Chip>
            ))}
          </div>

          {/* İçerik */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <EmptyState
              icon={Images}
              title={t("pages.myGallery.emptyTitle")}
              description={t("pages.myGallery.emptyText")}
            />
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
                  <Button variant="secondary" size="lg" loading={isLoadingMore} onClick={loadMore}>
                    {t("pages.media.loadMore")}
                  </Button>
                </div>
              )}
            </>
          )}

          {isOwnGallery && <FeedbackForm page="galerim" />}
        </div>
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
