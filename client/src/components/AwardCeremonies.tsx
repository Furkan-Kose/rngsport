import { useTranslation } from "react-i18next";
import LocalizedLink from "./LocalizedLink";
import { ArrowRight, Download, Images } from "lucide-react";
import SectionHeader from "./ui/SectionHeader";
import Reveal from "./ui/Reveal";
import { buttonClass } from "../lib/siteUi";

// Ana sayfadaki kısa tanıtım — galeriler /odul-torenleri sayfasında
const AwardCeremonies = () => {
  const { t } = useTranslation();
  return (
    <section id="odul-torenleri" className="py-24 bg-black scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-center max-w-6xl mx-auto">
          <Reveal>
            <LocalizedLink
              to="/odul-torenleri"
              className="group block rounded-2xl overflow-hidden border border-zinc-800"
              aria-label={t("home.awards.cta")}
            >
              <img
                src="/odul-torenleri.jpg"
                alt={t("home.awards.imageAlt")}
                loading="lazy"
                className="w-full aspect-4/3 object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </LocalizedLink>
          </Reveal>

          <div>
            <SectionHeader title={t("home.awards.title")} align="left" className="mb-5" />
            <Reveal delay={0.05}>
              <p className="text-zinc-400 mb-6">{t("home.awards.description")}</p>
              <ul className="space-y-2.5 mb-8 text-zinc-300">
                <li className="flex items-center gap-2.5">
                  <Images className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden />
                  {t("home.awards.point1")}
                </li>
                <li className="flex items-center gap-2.5">
                  <Download className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden />
                  {t("home.awards.point2")}
                </li>
              </ul>
              <LocalizedLink to="/odul-torenleri" className={buttonClass("primary", "lg")}>
                {t("home.awards.cta")}
                <ArrowRight className="w-4 h-4" aria-hidden />
              </LocalizedLink>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AwardCeremonies;
