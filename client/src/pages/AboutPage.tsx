import {
  Camera,
  Award,
  Users,
  Target,
  CalendarDays,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import SEO from "../components/SEO";
import { Link } from "react-router";
import SectionHeader from "../components/ui/SectionHeader";
import SectionDivider from "../components/ui/SectionDivider";
import Reveal from "../components/ui/Reveal";
import CountUp from "../components/ui/CountUp";

const BLACK = "#000000";
const ZINC = "#09090b";

/**
 * Yarışma günü akışı — metinler uydurma değil, SSS'te (components/FAQ.tsx)
 * zaten verilen taahhütlerin aynısı.
 */
const steps = [
  {
    title: "Ön rezervasyon",
    body: "Siteden paketini seçip kaydını oluşturuyorsun. Yarışma günü alandaki standımızdan da kayıt alıyoruz; ancak çekim listesinde öncelik rezervasyonlu sporcuların.",
  },
  {
    title: "Ödeme",
    body: "Ödemeyi yarışma günü standımızda nakit veya kredi kartıyla tamamlıyorsun. Ödemesi tamamlanan kayıtlar çekim listesine giriyor.",
  },
  {
    title: "Esame listesinden takip",
    body: "Her rezervasyonlu sporcuyu yarışmanın esame (başlangıç) listesinden takip ediyoruz. Sıra geldiğinde ekip yerinde hazır oluyor, performans baştan sona kaydediliyor.",
  },
  {
    title: "Teslimat",
    body: "Çekimler sporcu bazlı klasörlenip hesabına yükleniyor. Galerine girip tek tek ya da toplu indirebiliyorsun.",
  },
];

const guarantees = [
  {
    icon: Award,
    title: "Teknik hatada %100 iade",
    body: "Bizden kaynaklı bir teknik sorun (odak kaybı, veri bozulması) yüzünden performans görüntülenemezse ücretin tamamını iade ediyoruz.",
  },
  {
    icon: Sparkles,
    title: "Kişiye özel ürünler",
    body: "Çekimin ötesinde: sporcunun kendi pozundan hazırlanan üç boyutlu figür ve isminin baş harfinden yola çıkan ışıklı cimnastik harfi. Yakında siparişe açılıyor.",
    to: "/urunler",
  },
];

const stats = [
  { icon: Users, end: 1000, suffix: "+", label: "Sporcu" },
  { icon: Target, end: 3, suffix: "+", label: "Uluslararası yarışma" },
  { icon: CalendarDays, end: 4, suffix: " Yıl", label: "Saha deneyimi" },
  { icon: Award, end: 95, suffix: "%", label: "Memnuniyet" },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen">
      <SEO
        title="Hakkımızda"
        description="RNG Sport, ritmik cimnastik başta olmak üzere spor organizasyonlarında fotoğraf ve video çekimi yapan bir spor medya ajansıdır. Yarışma günü nasıl çalıştığımızı buradan okuyabilirsiniz."
        keywords="rng sport hakkında, spor medya ajansı, ritmik cimnastik çekim ekibi, yarışma fotoğrafçısı, turnuva video çekim"
        url="https://rngsport.com/hakkimizda"
      />

      {/* 1 — Hero */}
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
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Ritmik cimnastik çeken{" "}
                <span className="text-gradient-brand">bir ekibiz</span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
                Dört yıldır yarışma salonlarındayız. Bir serinin hangi
                saniyesinde ne olacağını bildiğimiz için doğru anı kaçırmıyoruz.
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
                  alt="Ritmika Cup organizasyonu"
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
                eyebrow="Hakkımızda"
                title="Salonu tanıyan bir çekim ekibi"
                align="left"
                className="mb-6"
              />
              <Reveal delay={0.1}>
                <p className="text-gray-400 mb-4 leading-relaxed">
                  <strong className="text-emerald-400">RNG Sport,</strong> spor
                  organizasyonları için fotoğraf, video ve dijital içerik üreten
                  bir spor medya ajansıdır. Ana alanımız ritmik cimnastik.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <p className="text-gray-400 mb-4 leading-relaxed">
                  Sahne düzenini, seri akışını ve aletlerin ritmini bildiğimiz
                  için kadrajı olayın peşinden sürüklemiyoruz — atlayışın,
                  fırlatmanın ve bitiriş pozunun nerede olacağını önceden
                  kurguluyoruz.
                </p>
              </Reveal>
              <Reveal delay={0.3}>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Yarışma boyunca yalnızca performansları değil; hazırlık
                  anlarını, sahne atmosferini ve ödül törenini de kayıt altına
                  alıyoruz.
                </p>
              </Reveal>
              <Reveal delay={0.4}>
                <div className="inline-flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3">
                  <Camera className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-sm text-gray-300">
                    <strong className="text-white">Range Media</strong> resmi
                    çözüm ortağı
                  </span>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider fromBg={ZINC} toBg={BLACK} />

      {/* 3 — Yarışma günü akışı. Bilinçli olarak görselsiz: sayfa aynı
          "görsel + metin" ritmini üst üste tekrarlamasın. */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Reveal>
              <h2 className="text-3xl sm:text-5xl font-bold text-gray-100 leading-tight mb-5">
                Yarışma günü nasıl çalışıyoruz
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="text-gray-400 text-base sm:text-lg mb-12">
                Kayıttan teslimata kadar süreç bu şekilde işliyor.
              </p>
            </Reveal>

            <ol className="relative border-l border-zinc-800 pl-8 space-y-10">
              {steps.map((step, i) => (
                <Reveal key={step.title} delay={i * 0.08}>
                  <li className="relative">
                    <span className="absolute -left-[3.15rem] flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-sm font-semibold">
                      {i + 1}
                    </span>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">{step.body}</p>
                  </li>
                </Reveal>
              ))}
            </ol>

            <div className="grid sm:grid-cols-2 gap-4 mt-12">
              {guarantees.map((item, i) => {
                const cardClass =
                  "group h-full block bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/40 rounded-2xl p-6 transition-colors";
                const inner = (
                  <>
                    <item.icon className="w-6 h-6 text-emerald-400 mb-3" />
                    <h3 className="text-white font-semibold mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {item.body}
                    </p>
                    {item.to && (
                      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                        Ürünleri gör
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    )}
                  </>
                );

                return (
                  <Reveal key={item.title} delay={i * 0.1}>
                    {item.to ? (
                      <Link to={item.to} className={cardClass}>
                        {inner}
                      </Link>
                    ) : (
                      <div className={cardClass}>{inner}</div>
                    )}
                  </Reveal>
                );
              })}
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
                  IV. International Golden Ribbon Cup 2026'da Yerinizi Ayırtın
                </h2>
                <p className="text-gray-300 max-w-2xl mx-auto mb-8">
                  Çekim listesinde öncelik rezervasyonlu sporcuların. Yerinizi
                  şimdiden ayırtın.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/rezervasyon"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5"
                  >
                    Rezervasyon Yap
                  </Link>
                  <Link
                    to="/paketler"
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
