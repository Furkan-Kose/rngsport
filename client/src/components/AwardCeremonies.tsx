import { useTranslation } from "react-i18next";
import LocalizedLink from "./LocalizedLink";
import { ArrowRight, Award, Download, Images } from "lucide-react";
import SectionHeader from "./ui/SectionHeader";
import Reveal from "./ui/Reveal";

// Ana sayfadaki kısa tanıtım — galeriler /odul-torenleri sayfasında
const AwardCeremonies = () => {
  const { t } = useTranslation();
  return (
  <section id="odul-torenleri" className="relative py-24 bg-black">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
        <Reveal>
          <LocalizedLink to="/odul-torenleri" className="group relative block">
            <div className="absolute -inset-4 bg-emerald-500/10 rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <img
                src="/odul-torenleri.jpg"
                alt={t("home.awards.imageAlt")}
                loading="lazy"
                className="w-full aspect-4/3 object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
            </div>
          </LocalizedLink>
        </Reveal>

        <div>
          <SectionHeader
            eyebrow={t("home.awards.eyebrow")}
            icon={Award}
            title={t("home.awards.title")}
            align="left"
            className="mb-6"
          />
          <Reveal delay={0.1}>
            <p className="text-gray-400 mb-6 leading-relaxed">
              {t("home.awards.description")}
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <ul className="space-y-2 mb-8 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <Images className="w-4 h-4 text-emerald-400" />
                {t("home.awards.point1")}
              </li>
              <li className="flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                {t("home.awards.point2")}
              </li>
            </ul>
          </Reveal>
          <Reveal delay={0.2}>
            <LocalizedLink
              to="/odul-torenleri"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold transition-all duration-300 hover:gap-3"
            >
              {t("home.awards.cta")}
              <ArrowRight className="w-4 h-4" />
            </LocalizedLink>
          </Reveal>
        </div>
      </div>
    </div>
  </section>
  );
};

export default AwardCeremonies;
