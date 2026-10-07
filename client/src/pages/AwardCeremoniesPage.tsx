import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Award, Calendar, Images, Loader2, MapPin, ArrowRight } from "lucide-react";
import SEO from "../components/SEO";
import Reveal from "../components/ui/Reveal";
import SectionHeader from "../components/ui/SectionHeader";
import api from "../lib/api";
import { AWARD_FALLBACK_IMAGE, type AwardCeremonySummary } from "../lib/awardCeremonies";

const AwardCeremoniesPage = () => {
  const [ceremonies, setCeremonies] = useState<AwardCeremonySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/award-ceremonies")
      .then(({ data }) => setCeremonies(data))
      .catch((error) => console.error("Ödül törenleri yüklenemedi:", error))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <SEO
        title="Ödül Törenleri"
        description="Baby Games ödül töreni fotoğrafları. Minik yıldızların kürsü heyecanına ait fotoğraflara buradan ulaşabilir, tek tek veya toplu indirebilirsiniz."
        keywords="ödül töreni fotoğrafları, baby games, ritmik cimnastik ödül töreni, kürsü fotoğrafı"
        url="https://rngsport.com/odul-torenleri"
      />

      {/* Hero */}
      <section className="relative py-32 pb-44 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/odul-torenleri.jpeg"
            alt="Baby Games ödül töreni"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/65 to-black/55" />
        </div>
        <div aria-hidden className="absolute inset-0 bg-grid-dark opacity-50 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-medium">
                <Award className="w-4 h-4" />
                Ödül Törenleri
              </div>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Baby Games <span className="text-gradient-brand">Ödül Töreni</span> Fotoğrafları
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
                Minik yıldızların kürsü heyecanına ortak olun! Baby Games ödül töreni
                fotoğrafları yarışma günü içerisinde bu sayfaya yüklenecektir. Çocuğunuzun
                bu özel anlarına ait fotoğraflara buradan ulaşabilirsiniz.
              </p>
            </Reveal>
          </div>
        </div>

        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-32 md:h-44 z-[5] bg-linear-to-b from-transparent to-[#09090b] pointer-events-none"
        />
      </section>

      {/* Tören kartları */}
      <section className="py-16 bg-zinc-950">
        <div className="container mx-auto px-4">
          <SectionHeader
            eyebrow="Galeriler"
            icon={Images}
            title="Ödül Törenleri"
            description="Töreni seçin; fotoğrafları tek tek ya da hepsini birden indirebilirsiniz."
            className="mb-12"
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
          ) : ceremonies.length === 0 ? (
            <div className="max-w-xl mx-auto bg-zinc-900/60 border border-zinc-800 rounded-2xl p-10 text-center">
              <Award className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400">
                Fotoğraflar yarışma günü içerisinde burada yayınlanacak.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {ceremonies.map((ceremony, index) => (
                <Reveal key={ceremony.id} delay={index * 0.05}>
                  <Link
                    to={`/odul-torenleri/${ceremony.slug}`}
                    className="group block h-full rounded-2xl overflow-hidden bg-zinc-900/70 border border-zinc-800 hover:border-emerald-500/50 transition-all duration-300"
                  >
                    <div className="relative aspect-4/3 overflow-hidden bg-zinc-900">
                      <img
                        src={ceremony.coverUrl || AWARD_FALLBACK_IMAGE}
                        alt={ceremony.title}
                        loading="lazy"
                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                          ceremony.coverUrl ? "" : "opacity-50"
                        }`}
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
                      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-xs text-white">
                        <Images className="w-3.5 h-3.5 text-emerald-400" />
                        {ceremony.photoCount > 0 ? `${ceremony.photoCount} dosya` : "Yakında yüklenecek"}
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors mb-2">
                        {ceremony.title}
                      </h3>
                      {(ceremony.date || ceremony.location) && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400 mb-3">
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
                        </div>
                      )}
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 group-hover:gap-3 transition-all">
                        Galeriyi Aç
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AwardCeremoniesPage;
