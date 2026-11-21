import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import LocalizedLink from "../components/LocalizedLink";
import { Award, Calendar, Images, MapPin } from "lucide-react";
import { toast } from "react-toastify";
import api from "../lib/api";
import SEO from "../components/SEO";
import MediaGrid from "../components/MediaGrid";
import MediaLightbox from "../components/MediaLightbox";
import DownloadAllButtons from "../components/DownloadAllButtons";
import { withQuality, type DownloadSizes, type MediaItem, type MediaQuality } from "../lib/media";
import { triggerDownload } from "../lib/download";
import { useZipDownload } from "../hooks/useZipDownload";
import { canShareFiles } from "../lib/device";
import { DownloadHint, SaveToPhotosModal, SelectionBar } from "../components/MediaSelection";
import { useMediaSelection } from "../hooks/useMediaSelection";
import { CheckSquare } from "lucide-react";
import type { AwardCeremony, AwardPhoto, Pagination } from "../lib/awardCeremonies";
import { Button, EmptyState, PageHeader, Skeleton } from "../components/ui/kit";
import { buttonClass, containerClass, cx, pageClass, widthGrid } from "../lib/siteUi";

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
  const [downloadSizes, setDownloadSizes] = useState<DownloadSizes | null>(null);
  const [saveItems, setSaveItems] = useState<MediaItem[] | null>(null);
  const selection = useMediaSelection();
  const { t } = useTranslation();

  const fetchPage = useCallback(
    async (page: number, append: boolean) => {
      try {
        const params = new URLSearchParams({ page: String(page), limit: "60" });
        const { data } = await api.get(`/api/award-ceremonies/${slug}?${params}`);
        setCeremony(data.ceremony);
        setPhotos((prev) => (append ? [...prev, ...data.data] : data.data));
        setPagination(data.pagination);
        setDownloadSizes(data.downloadSizes ?? null);
      } catch (error) {
        const status = (error as { response?: { status?: number } }).response?.status;
        if (status === 404) {
          setNotFound(true);
        } else {
          console.error("Ödül töreni yüklenemedi:", error);
          toast.error(t("pages.media.loadError"));
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [slug, t]
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
  const handleDownloadAll = async (quality: MediaQuality) => {
    await zip.start(
      withQuality(`/api/award-ceremonies/${slug}/download-manifest`, quality),
      withQuality(`/api/award-ceremonies/${slug}/download-all`, quality),
    );
  };

  // Seçilenler: manifest POST ile yalnızca bu id'ler (sunucu zip'i yok — Railway trafiği)
  const handleZipSelected = (ids: string[], quality: MediaQuality) =>
    zip.start(withQuality(`/api/award-ceremonies/${slug}/download-manifest`, quality), undefined, ids);

  // Taze imzalı indirme linki (galeriye kaydet için dosya buradan çekilir)
  const getUrl = useCallback(
    async (item: MediaItem, quality: MediaQuality) =>
      (await api.get(withQuality(`/api/award-ceremonies/${slug}/photos/${item.id}/download`, quality))).data.url as string,
    [slug]
  );

  const handleDownload = async (item: MediaItem, quality: MediaQuality) => {
    setDownloadingId(item.id);
    try {
      const { data } = await api.get(
        withQuality(`/api/award-ceremonies/${slug}/photos/${item.id}/download`, quality),
      );
      triggerDownload(data.url, item.fileName);
    } catch (error) {
      console.error("İndirme hatası:", error);
      toast.error(t("pages.media.downloadError"));
    } finally {
      setDownloadingId(null);
    }
  };

  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  return (
    <div className={cx(pageClass, selection.active && "pb-56")}>
      <SEO
        title={ceremony?.title || t("pages.awards.detailFallbackTitle")}
        description={ceremony?.description || t("pages.awards.detailDescription")}
      />


      <div className={containerClass}>
        <div className={widthGrid}>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-24">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        ) : notFound || !ceremony ? (
          <EmptyState
            icon={Award}
            title={t("pages.awards.notFoundTitle")}
            description={t("pages.awards.notFoundText")}
            className="max-w-lg mx-auto mt-10"
          >
            <LocalizedLink to="/odul-torenleri" className={buttonClass("primary")}>
              {t("pages.awards.back")}
            </LocalizedLink>
          </EmptyState>
        ) : (
          <>
            <PageHeader
              backTo="/odul-torenleri"
              backLabel={t("pages.awards.back")}
              title={ceremony.title}
              subtitle={
                <>
                  <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {ceremony.date && (
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" aria-hidden />
                        {ceremony.date}
                      </span>
                    )}
                    {ceremony.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" aria-hidden />
                        {ceremony.location}
                      </span>
                    )}
                    {pagination && <span>{t("pages.media.files", { count: pagination.total })}</span>}
                  </span>
                  {ceremony.description && (
                    <span className="block mt-3 max-w-2xl whitespace-pre-line">{ceremony.description}</span>
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
                    <DownloadAllButtons
                      sizes={downloadSizes}
                      progress={zip.progress}
                      onStart={handleDownloadAll}
                      primaryClassName={buttonClass("primary")}
                    />
                  </>
                )
              }
            />

            {photos.length > 0 && <DownloadHint />}

            {photos.length === 0 ? (
              <EmptyState
                icon={Images}
                title={t("pages.awards.noPhotosTitle")}
                description={t("pages.awards.noPhotosText")}
              />
            ) : (
              <>
                <MediaGrid
                  items={photos}
                  onOpen={setLightboxIndex}
                  onDownload={handleDownload}
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
          </>
        )}
        </div>
      </div>

      <MediaLightbox
        items={photos}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        onDownload={handleDownload}
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
          onDownloadSingle={handleDownload}
          hasMore={hasMore}
        />
      )}
      {saveItems && (
        <SaveToPhotosModal
          items={saveItems}
          quality="original"
          getUrl={getUrl}
          onDownloadSingle={handleDownload}
          onClose={() => setSaveItems(null)}
        />
      )}
    </div>
  );
};

export default AwardCeremonyDetailPage;
