import { Camera, Users, Trophy } from "lucide-react";
import SEO from "../components/SEO";
import { Trans, useTranslation } from "react-i18next";
import LocalizedLink from "../components/LocalizedLink";
import SectionHeader from "../components/ui/SectionHeader";
import SectionDivider from "../components/ui/SectionDivider";
import PageHero from "../components/ui/PageHero";
import Reveal from "../components/ui/Reveal";
import CountUp from "../components/ui/CountUp";
import { Card } from "../components/ui/kit";
import { useTournaments } from "../lib/tournaments";
import { buttonClass, cardClass, cx, sectionTitleClass } from "../lib/siteUi";

const BLACK = "#000000";
const ZINC = "#09090b";

const AUDIENCE_ICONS = [Users, Trophy];

// Rakamlar sabit; etiketler about.stats.* altında. Yalnızca sayılabilen şeyler
// (ölçülmemiş "memnuniyet %" gibi rakamlar bilerek yok).
const STATS = [
  { end: 1000, suffix: "+", key: "athletes" },
  { end: 3, suffix: "+", key: "competitions" },
  { end: 4, suffix: null, key: "years" },
] as const;

interface Audience {
  title: string;
  paragraphs: string[];
}

const AboutPage = () => {
  const { t } = useTranslation();
  // CTA başlığı rezervasyona açık yarışmanın adını taşır; açık yarışma yoksa genel metin
  const { open } = useTournaments();
  const audiences = (t("pages.about.audiences", { returnObjects: true }) as Audience[]).map(
    (a, i) => ({ ...a, icon: AUDIENCE_ICONS[i] ?? Users })
  );
  const stats = STATS.map((s) => ({
    ...s,
    suffix: s.suffix ?? t("pages.about.stats.yearsSuffix"),
    label: t(`pages.about.stats.${s.key}`),
  }));

  return (
    <div className="min-h-screen">
      <SEO
        title={t("pages.about.seoTitle")}
        description={t("pages.about.seoDescription")}
        keywords={t("pages.about.seoKeywords")}
      />

      {/* 1 — Hero */}
      <PageHero
        image="/about/hero.jpeg"
        imageAlt={t("pages.about.heroAlt")}
        title={
          <>
            {t("pages.about.heroBefore")}
            <span className="text-gradient-brand">{t("pages.about.heroHighlight")}</span>
            {t("pages.about.heroAfter")}
          </>
        }
        intro={t("pages.about.heroText")}
      />

      {/* 2 — Biz kimiz */}
      <section className="pb-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-center max-w-6xl mx-auto">
            <Reveal>
              <img
                src="/about/organization.webp"
                alt={t("pages.about.orgAlt")}
                className="rounded-2xl border border-zinc-800 w-full"
              />
            </Reveal>

            <div>
              <SectionHeader title={t("pages.about.title")} align="left" className="mb-5" />
              <Reveal delay={0.05}>
                <p className="text-zinc-300 mb-4">
                  <Trans i18nKey="pages.about.p1" components={{ 1: <strong className="text-emerald-400" /> }} />
                </p>
                <p className="text-zinc-300 mb-6">{t("pages.about.p2")}</p>
                <div className={cx(cardClass, "inline-flex items-center gap-3 px-4 py-3")}>
                  <Camera className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden />
                  <span className="text-sm text-zinc-300">
                    <Trans i18nKey="pages.about.partner" components={{ 1: <strong className="text-white" /> }} />
                  </span>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider fromBg={ZINC} toBg={BLACK} />

      {/* 3 — Nasıl çalışıyoruz + kimler için. Bilinçli olarak görselsiz:
          sayfa aynı "görsel + metin" ritmini üst üste tekrarlamasın. */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Reveal>
              <h2 className={cx(sectionTitleClass, "leading-tight mb-6")}>{t("pages.about.howTitle")}</h2>
              <p className="text-zinc-300 text-base sm:text-lg mb-4">{t("pages.about.how1")}</p>
              <p className="text-zinc-300 text-base sm:text-lg mb-10">{t("pages.about.how2")}</p>
            </Reveal>

            <div className="grid sm:grid-cols-2 gap-4">
              {audiences.map((item, i) => (
                <Reveal key={item.title} delay={i * 0.05} className="h-full">
                  <Card className="h-full">
                    <item.icon className="w-6 h-6 text-emerald-400 mb-3" aria-hidden />
                    <h3 className="text-white font-semibold mb-3">{item.title}</h3>
                    {item.paragraphs.map((text) => (
                      <p key={text} className="text-sm text-zinc-400 mb-2 last:mb-0">
                        {text}
                      </p>
                    ))}
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SectionDivider fromBg={BLACK} toBg={ZINC} />

      {/* 4 — Rakamlar + CTA */}
      <section className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <Reveal>
            <dl className="grid grid-cols-3 gap-px bg-zinc-800 border border-zinc-800 rounded-2xl overflow-hidden max-w-3xl mx-auto">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-zinc-950 px-4 py-8 text-center flex flex-col-reverse">
                  <dt className="text-sm text-zinc-400 mt-1">{stat.label}</dt>
                  <dd className="text-3xl font-bold text-white">
                    <CountUp end={stat.end} suffix={stat.suffix} />
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={0.1}>
            <Card padding="lg" tone="soft" className="mt-12 max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                {open[0] ? t("pages.about.ctaTitleNamed", { name: open[0].name }) : t("pages.about.ctaTitle")}
              </h2>
              <p className="text-zinc-300 max-w-2xl mx-auto mb-8">{t("pages.about.ctaText")}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <LocalizedLink to="/rezervasyon" className={buttonClass("primary", "lg")}>
                  {t("pages.about.ctaReserve")}
                </LocalizedLink>
                <LocalizedLink to="/paketler" className={buttonClass("secondary", "lg")}>
                  {t("pages.about.ctaPackages")}
                </LocalizedLink>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
