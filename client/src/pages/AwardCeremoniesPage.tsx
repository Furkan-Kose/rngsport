import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import LocalizedLink from "../components/LocalizedLink";
import { Award, Calendar, Images, MapPin, ArrowRight } from "lucide-react";
import SEO from "../components/SEO";
import Reveal from "../components/ui/Reveal";
import PageHero from "../components/ui/PageHero";
import { Alert, Button, EmptyState, Pill, Skeleton } from "../components/ui/kit";
import api from "../lib/api";
import { AWARD_FALLBACK_IMAGE, type AwardCeremonySummary } from "../lib/awardCeremonies";
import { cardClass, cx } from "../lib/siteUi";

const gridClass = "grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto";

const AwardCeremoniesPage = () => {
  const [ceremonies, setCeremonies] = useState<AwardCeremonySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  // "Tekrar dene" bu sayacı artırır, effect isteği yeniden atar
  const [attempt, setAttempt] = useState(0);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    let alive = true;
    api
      .get("/api/award-ceremonies")
      .then(({ data }) => {
        if (!alive) return;
        setCeremonies(data);
        setFailed(false);
      })
      .catch((error) => {
        console.error("Ödül törenleri yüklenemedi:", error);
        if (alive) setFailed(true);
      })
      .finally(() => alive && setIsLoading(false));
    return () => {
      alive = false;
    };
  }, [attempt, i18n.language]);

  const load = () => {
    setIsLoading(true);
    setAttempt((n) => n + 1);
  };

  return (
    <div className="min-h-screen">
      <SEO
        title={t("pages.awards.seoTitle")}
        description={t("pages.awards.seoDescription")}
        keywords={t("pages.awards.seoKeywords")}
      />

      <PageHero
        image="/odul-torenleri.jpg"
        imageAlt={t("pages.awards.imageAlt")}
        title={
          <>
            {t("pages.awards.titleBefore")}
            <span className="text-gradient-brand">{t("pages.awards.titleHighlight")}</span>
            {t("pages.awards.titleAfter")}
          </>
        }
        intro={t("pages.awards.intro")}
      />

      {/* Tören kartları */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className={gridClass}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="aspect-4/5 rounded-2xl" />
              ))}
            </div>
          ) : failed ? (
            <div className="max-w-md mx-auto text-center">
              <Alert tone="danger" className="text-left mb-4">
                {t("common.error")}
              </Alert>
              <Button variant="secondary" onClick={load}>
                {t("common.retry")}
              </Button>
            </div>
          ) : ceremonies.length === 0 ? (
            <EmptyState icon={Award} title={t("pages.awards.empty")} className="max-w-xl mx-auto" />
          ) : (
            <ul className={gridClass}>
              {ceremonies.map((ceremony, index) => (
                <Reveal key={ceremony.id} delay={index * 0.05} className="h-full">
                  <li className="h-full">
                    <LocalizedLink
                      to={`/odul-torenleri/${ceremony.slug}`}
                      className={cx(
                        cardClass,
                        "group flex flex-col h-full overflow-hidden hover:border-zinc-600 transition-colors",
                      )}
                    >
                      <div className="relative aspect-4/3 overflow-hidden bg-zinc-900">
                        <img
                          src={ceremony.coverUrl || AWARD_FALLBACK_IMAGE}
                          alt=""
                          loading="lazy"
                          className={cx(
                            "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
                            !ceremony.coverUrl && "opacity-50",
                          )}
                        />
                        <Pill icon={Images} className="absolute bottom-3 left-3 bg-zinc-950/80">
                          {ceremony.photoCount > 0
                            ? t("pages.media.files", { count: ceremony.photoCount })
                            : t("pages.awards.soon")}
                        </Pill>
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <h2 className="text-lg font-semibold text-white mb-2">{ceremony.title}</h2>
                        {(ceremony.date || ceremony.location) && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400 mb-4">
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
                          </div>
                        )}
                        <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                          {t("pages.awards.open")}
                          <ArrowRight className="w-4 h-4" aria-hidden />
                        </span>
                      </div>
                    </LocalizedLink>
                  </li>
                </Reveal>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};

export default AwardCeremoniesPage;
