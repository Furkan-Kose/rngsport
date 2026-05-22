import {
  Target,
  Users,
  Camera,
  Award,
  CheckCircle,
  Globe,
  Shield,
  Heart,
  CalendarDays,
} from "lucide-react";
import SEO from "../components/SEO";
import { Link } from "react-router";
import SectionHeader from "../components/ui/SectionHeader";
import SectionDivider from "../components/ui/SectionDivider";
import Reveal from "../components/ui/Reveal";
import CountUp from "../components/ui/CountUp";

const BLACK = "#000000";
const ZINC = "#09090b";

const visionItems = [
  {
    icon: Globe,
    title: "Ritmik Cimnastik Uzmanlığı",
    description:
      "Sahne düzenini, seri akışını ve sporcuların kritik anlarını bilen bir çekim yaklaşımıyla çalışıyoruz.",
  },
  {
    icon: Shield,
    title: "Hızlı ve Düzenli Teslimat",
    description:
      "Fotoğraf ve videoları sporcu bazlı, düzenli ve kolay erişilebilir şekilde teslim ediyoruz.",
  },
  {
    icon: Heart,
    title: "Sporcu Odaklı Görsel Dil",
    description:
      "Her sporcunun emeğini, performansını ve sahnedeki hikâyesini özenli bir görsel arşive dönüştürüyoruz.",
  },
];

const principles = [
  "Ritmik cimnastik dinamiğine hâkim çekim ekibi",
  "Seri akışına uygun fotoğraf ve video takibi",
  "Sporcu bazlı düzenli arşivleme",
  "Aileler için kolay erişilebilir teslimat",
  "Organizasyon için güçlü görsel içerik üretimi",
];

const AboutPage = () => {
  return (
    <div className="min-h-screen">
      <SEO
        title="Hakkımızda"
        description="RNG Sport, spor organizasyonları için profesyonel fotoğraf, video ve dijital içerik üretimi yapan bir spor medya ajansıdır. Yarışma ve turnuvalarda sporcuların performansını profesyonel bir görsel arşive dönüştürüyoruz."
        keywords="rng sport hakkında, spor medya ajansı, ritmik cimnastik çekim ekibi, yarışma fotoğrafçısı, turnuva video çekim"
        url="https://rngsport.com/hakkimizda"
      />

      {/* Hero Section */}
      <section className="relative py-32 pb-44 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/about/hero.jpeg"
            alt="International Ritmika Cup"
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
              <span className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/40 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 shadow-[0_0_24px_-8px_rgba(16,185,129,0.6)]">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 text-sm font-medium tracking-wider uppercase">
                  Yaklaşımımız
                </span>
              </span>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Spor Çekimlerinde{" "}
                <span className="text-gradient-brand">Önceliğimiz</span>
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                Ritmik cimnastik başta olmak üzere spor organizasyonlarında;
                doğru anı, doğru açıdan ve yüksek kaliteyle kayıt altına
                alıyoruz.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Bottom fade — image dissolves into the next section (#09090b) */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-32 md:h-44 z-[5] bg-linear-to-b from-transparent to-[#09090b] pointer-events-none"
        />
      </section>

      {/* About Section */}
      <section className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <Reveal>
              <div className="relative">
                <div className="absolute -inset-4 bg-emerald-500/10 rounded-3xl blur-2xl" />
                <img
                  src="/about/organization.webp"
                  alt="Ritmika Cup Organizasyon"
                  className="relative rounded-2xl shadow-2xl"
                />
                <div className="absolute -bottom-6 -right-6 bg-linear-to-br from-emerald-500 to-emerald-700 text-white p-6 rounded-2xl shadow-xl hidden md:block">
                  <div className="text-4xl font-bold">2026</div>
                  <div className="text-sm opacity-90">Ritmika Cup</div>
                </div>
              </div>
            </Reveal>

            <div>
              <SectionHeader
                eyebrow="Hakkımızda"
                title="Sporun En Değerli Anlarını Görünür Kılıyoruz"
                align="left"
                className="mb-6"
              />
              <Reveal delay={0.1}>
                <p className="text-gray-400 mb-4 leading-relaxed">
                  <strong className="text-emerald-400">RNG Sport,</strong> spor
                  organizasyonları için profesyonel fotoğraf, video ve dijital
                  içerik üretimi yapan bir spor medya ajansıdır.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <p className="text-gray-400 mb-4 leading-relaxed">
                  Yarışma, turnuva ve özel spor etkinliklerinde; sporcuların
                  performanslarını, ailelerin unutmak istemeyeceği anları ve
                  organizasyonun atmosferini kaliteli bir görsel arşive
                  dönüştürüyoruz.
                </p>
              </Reveal>
              <Reveal delay={0.3}>
                <p className="text-gray-400 leading-relaxed">
                  Amacımız sadece çekim yapmak değil; her sporcunun emeğini,
                  heyecanını ve sahnedeki hikâyesini doğru açıdan anlatmak.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider fromBg={ZINC} toBg={BLACK} />

      {/* Vision Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <SectionHeader
            eyebrow="Vizyonumuz"
            title="Organizasyon Vizyonumuz"
            description="Yarışma ve spor etkinliklerinde; sporcuların performansını, aileler için değerli anları ve organizasyonun atmosferini profesyonel bir görsel arşive dönüştürüyoruz."
            className="mb-16"
          />

          <div className="grid md:grid-cols-3 gap-8">
            {visionItems.map((item, index) => (
              <Reveal key={index} delay={index * 0.1}>
                <div className="group relative h-full rounded-2xl p-px bg-linear-to-br from-emerald-500/20 via-zinc-700/10 to-emerald-500/20 hover:from-emerald-500/50 hover:to-emerald-400/50 transition-all duration-500">
                  <div className="relative h-full bg-zinc-950 rounded-2xl p-8 hover:-translate-y-1 transition-transform duration-300">
                    <div className="w-14 h-14 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500/30 group-hover:shadow-[0_0_24px_-4px_rgba(16,185,129,0.6)] transition-all">
                      <item.icon className="w-7 h-7 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-100 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider fromBg={BLACK} toBg={ZINC} />

      {/* Principles Section */}
      <section className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <SectionHeader
                eyebrow="Çekim Standartlarımız"
                title="Her Sporcuyu Aynı Özenle Çekiyoruz"
                align="left"
                className="mb-8"
              />

              <div className="space-y-3">
                {principles.map((item, index) => (
                  <Reveal key={index} delay={index * 0.06}>
                    <div className="group flex items-center gap-4 bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/40 rounded-xl p-4 transition-colors">
                      <div className="w-10 h-10 bg-emerald-500/15 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-emerald-500/30 group-hover:shadow-[0_0_18px_-4px_rgba(16,185,129,0.7)] transition-all">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="text-gray-300">{item}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            <Reveal className="order-1 md:order-2">
              <div className="relative">
                <div className="absolute -inset-4 bg-emerald-500/10 rounded-3xl blur-2xl" />
                <img
                  src="/about/principles.jpeg"
                  alt="Ritmika Cup İlkeleri"
                  className="relative rounded-2xl shadow-2xl"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <SectionDivider fromBg={ZINC} toBg={BLACK} />

      {/* Media Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <Reveal>
              <div className="relative">
                <img
                  src="/about/media.jpeg"
                  alt="Range Media"
                  className="rounded-2xl shadow-2xl"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent rounded-2xl" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-black/85 backdrop-blur-md border border-emerald-500/30 rounded-xl p-4 shadow-[0_0_24px_-8px_rgba(16,185,129,0.5)]">
                    <div className="flex items-center gap-3">
                      <Camera className="w-8 h-8 text-emerald-400" />
                      <div>
                        <div className="text-white font-semibold">
                          Range Media
                        </div>
                        <div className="text-gray-400 text-sm">
                          Resmi Çözüm Ortağı
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            <div>
              <SectionHeader
                eyebrow="Medya"
                title="Yarışma Günü Tüm Süreci Kayıt Altına Alıyoruz"
                align="left"
                className="mb-6"
              />
              <Reveal delay={0.1}>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  <strong className="text-emerald-400">RNG Sport,</strong>{" "}
                  organizasyon boyunca yalnızca performans anlarını değil;
                  hazırlık sürecini, sahne atmosferini, ödül anlarını ve
                  etkinliğin genel enerjisini de kapsayan bütünlüklü bir medya
                  akışı oluşturur.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Çekimler, yarışma temposuna uyum sağlayacak şekilde planlanır.
                  Sporcu geçişleri, seri sıraları ve teslimat süreci düzenli
                  takip edilerek ailelerin içeriklere kolayca ulaşması
                  hedeflenir.
                </p>
              </Reveal>
              <Reveal delay={0.3}>
                <div className="flex items-start gap-4 bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/30 rounded-xl p-5 transition-colors">
                  <Award className="w-10 h-10 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold mb-1">
                      En Güncel Teknoloji
                    </h4>
                    <p className="text-gray-400 text-sm">
                      Sahadaki her performans, en güncel yayıncılık
                      teknolojileri kullanılarak kayıt altına alınmakta ve
                      arşivlenmektedir.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider fromBg={BLACK} toBg={ZINC} />

      {/* Stats Section */}
      <section className="py-20 bg-zinc-950 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-b from-transparent via-emerald-950/10 to-transparent"
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Reveal>
              <div className="text-center group">
                <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500/30 group-hover:shadow-[0_0_24px_-4px_rgba(16,185,129,0.7)] transition-all">
                  <Users className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  <CountUp end={1000} suffix="+" />
                </div>
                <div className="text-gray-400">Sporcu</div>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="text-center group">
                <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500/30 group-hover:shadow-[0_0_24px_-4px_rgba(16,185,129,0.7)] transition-all">
                  <Target className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  <CountUp end={3} suffix="+" />
                </div>
                <div className="text-gray-400">Uluslararası Yarışma Deneyimi</div>
              </div>
            </Reveal>
            <Reveal delay={0.16}>
              <div className="text-center group">
                <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500/30 group-hover:shadow-[0_0_24px_-4px_rgba(16,185,129,0.7)] transition-all">
                  <CalendarDays className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  <CountUp end={4} suffix=" Yıl" />
                </div>
                <div className="text-gray-400">
                  Spor Deneyimi
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="text-center group">
                <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500/30 group-hover:shadow-[0_0_24px_-4px_rgba(16,185,129,0.7)] transition-all">
                  <Award className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  <CountUp end={95} suffix="%" />
                </div>
                <div className="text-gray-400">Memnuniyet</div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <SectionDivider fromBg={ZINC} toBg={BLACK} />

      {/* CTA Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="relative rounded-3xl p-px bg-linear-to-r from-emerald-500/40 via-emerald-400/20 to-emerald-500/40 overflow-hidden">
              <div className="absolute inset-0 border-glow-shimmer opacity-60" />
              <div className="relative bg-linear-to-r from-emerald-900/40 to-teal-900/40 backdrop-blur-xl rounded-3xl p-8 md:p-12 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  IV. International Golden Ribbon Cup 2026'da Yerinizi Ayırtın
                </h2>
                <p className="text-gray-300 max-w-2xl mx-auto mb-8">
                  Profesyonel fotoğraf ve video hizmetlerimizle performansınızı
                  ölümsüzleştirin.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/rezervasyon"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5"
                  >
                    Rezervasyon Yap
                  </Link>
                  <Link
                    to="/#paketler"
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-emerald-500/50 text-white px-8 py-3 rounded-xl font-medium transition-all"
                  >
                    Paketleri İncele
                  </Link>
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
