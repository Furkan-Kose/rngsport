import {
  Camera,
  Award,
  Users,
  Target,
  CalendarDays,
  Trophy,
} from "lucide-react";
import SEO from "../components/SEO";
import { Trans, useTranslation } from "react-i18next";
import LocalizedLink from "../components/LocalizedLink";
import SectionHeader from "../components/ui/SectionHeader";
import SectionDivider from "../components/ui/SectionDivider";
import Reveal from "../components/ui/Reveal";
import CountUp from "../components/ui/CountUp";

const BLACK = "#000000";
const ZINC = "#09090b";

const AUDIENCE_ICONS = [Users, Trophy];

// Rakamlar sabit; etiketler about.stats.* altında
const STATS = [
  { icon: Users, end: 1000, suffix: "+", key: "athletes" },
  { icon: Target, end: 3, suffix: "+", key: "competitions" },
  { icon: CalendarDays, end: 4, suffix: null, key: "years" },
  { icon: Award, end: 95, suffix: "%", key: "satisfaction" },
] as const;

interface Audience {
  title: string;
  paragraphs: string[];
}

const AboutPage = () => {
  const { t } = useTranslation();
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
      <section className="relative py-32 pb-44 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/about/hero.jpeg"
            alt={t("pages.about.heroAlt")}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/65 to-black/55" />
        </div>
        <div
          aria-hidden
          className="absolute inset-0 bg-grid-dark opacity-50 pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -bottom-20 left-1/3 w-[28rem] h-[28rem] bg-emerald-600/[0.06] rounded-full blur-3xl pointer-events-none"
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Reveal>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                {t("pages.about.heroBefore")}
                <span className="text-gradient-brand">{t("pages.about.heroHighlight")}</span>
                {t("pages.about.heroAfter")}
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
                {t("pages.about.heroText")}
              </p>
            </Reveal>
          </div>
        </div>

        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-32 md:h-44 z-[5] bg-linear-to-b from-transparent to-[#09090b] pointer-events-none"
        />
      </section>

      {/* 2 — Biz kimiz */}
      <section className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <Reveal>
              <div className="relative">
                <div className="absolute -inset-4 bg-emerald-500/10 rounded-3xl blur-2xl" />
                <img
                  src="/about/organization.webp"
                  alt={t("pages.about.orgAlt")}
                  className="relative rounded-2xl shadow-2xl w-full"
                />
                <div className="absolute -bottom-6 -right-6 bg-linear-to-br from-emerald-500 to-emerald-700 text-white p-6 rounded-2xl shadow-xl hidden md:block">
                  <div className="text-4xl font-bold">2026</div>
                  <div className="text-sm opacity-90">Ritmika Cup</div>
                </div>
              </div>
            </Reveal>

            <div>
              <SectionHeader
                eyebrow={t("pages.about.eyebrow")}
                title={t("pages.about.title")}
                align="left"
                className="mb-6"
              />
              <Reveal delay={0.1}>
                <p className="text-gray-400 mb-4 leading-relaxed">
                  <Trans
                    i18nKey="pages.about.p1"
                    components={{ 1: <strong className="text-emerald-400" /> }}
                  />
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  {t("pages.about.p2")}
                </p>
              </Reveal>
              <Reveal delay={0.4}>
                <div className="inline-flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3">
                  <Camera className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-sm text-gray-300">
                    <Trans
                      i18nKey="pages.about.partner"
                      components={{ 1: <strong className="text-white" /> }}
                    />
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
              <h2 className="text-3xl sm:text-5xl font-bold text-gray-100 leading-tight mb-6">
                {t("pages.about.howTitle")}
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="text-gray-400 text-base sm:text-lg leading-relaxed mb-4">
                {t("pages.about.how1")}
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="text-gray-400 text-base sm:text-lg leading-relaxed mb-12">
                {t("pages.about.how2")}
              </p>
            </Reveal>

            <div className="grid sm:grid-cols-2 gap-4">
              {audiences.map((item, i) => (
                <Reveal key={item.title} delay={i * 0.1}>
                  <div className="h-full bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/40 rounded-2xl p-6 transition-colors">
                    <item.icon className="w-6 h-6 text-emerald-400 mb-3" />
                    <h3 className="text-white font-semibold mb-3">
                      {item.title}
                    </h3>
                    {item.paragraphs.map((text) => (
                      <p
                        key={text}
                        className="text-sm text-gray-400 leading-relaxed mb-2 last:mb-0"
                      >
                        {text}
                      </p>
                    ))}
                  </div>
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-800 border border-zinc-800 rounded-2xl overflow-hidden max-w-4xl mx-auto">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-zinc-950 px-6 py-8 text-center"
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <stat.icon className="w-4 h-4 text-emerald-400/70" />
                    <span className="text-3xl font-bold text-white">
                      <CountUp end={stat.end} suffix={stat.suffix} />
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="relative rounded-3xl p-px bg-linear-to-r from-emerald-500/40 via-emerald-400/20 to-emerald-500/40 overflow-hidden mt-12 max-w-4xl mx-auto">
              <div className="absolute inset-0 border-glow-shimmer opacity-60" />
              <div className="relative bg-linear-to-r from-emerald-900/40 to-teal-900/40 backdrop-blur-xl rounded-3xl p-8 md:p-12 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {t("pages.about.ctaTitle")}
                </h2>
                <p className="text-gray-300 max-w-2xl mx-auto mb-8">
                  {t("pages.about.ctaText")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <LocalizedLink
                    to="/rezervasyon"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5"
                  >
                    {t("pages.about.ctaReserve")}
                  </LocalizedLink>
                  <LocalizedLink
                    to="/paketler"
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-emerald-500/50 text-white px-8 py-3 rounded-xl font-medium transition-all"
                  >
                    {t("pages.about.ctaPackages")}
                  </LocalizedLink>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
