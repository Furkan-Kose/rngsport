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
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/about/hero.jpeg"
            alt="International Ritmika Cup"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/70 to-black" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-6">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 text-sm font-medium">
                YAKLAŞIMIMIZ
              </span>
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Spor Çekimlerinde Önceliğimiz
              {/* <span className="block text-emerald-500 mt-2"></span> */}
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
              Ritmik cimnastik başta olmak üzere spor organizasyonlarında; doğru
              anı, doğru açıdan ve yüksek kaliteyle kayıt altına alıyoruz.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img
                src="/about/organization.webp"
                alt="Ritmika Cup Organizasyon"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -right-6 bg-emerald-500 text-white p-6 rounded-2xl shadow-xl hidden md:block">
                <div className="text-4xl font-bold">2026</div>
                <div className="text-sm opacity-90">Ritmika Cup</div>
              </div>
            </div>

            <div>
              <span className="text-emerald-500 font-semibold uppercase tracking-wider text-sm">
                Hakkımızda
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-200 mt-4 mb-6">
                Sporun En Değerli Anlarını Görünür Kılıyoruz
              </h2>
              <p className="text-gray-400 mb-4 leading-relaxed">
                <strong className="text-emerald-400">RNG Sport,</strong> spor
                organizasyonları için profesyonel fotoğraf, video ve dijital
                içerik üretimi yapan bir spor medya ajansıdır.
              </p>
              <p className="text-gray-400 mb-4 leading-relaxed">
                Yarışma, turnuva ve özel spor etkinliklerinde; sporcuların
                performanslarını, ailelerin unutmak istemeyeceği anları ve
                organizasyonun atmosferini kaliteli bir görsel arşive
                dönüştürüyoruz.
              </p>
              <p className="text-gray-400 leading-relaxed">
                Amacımız sadece çekim yapmak değil; her sporcunun emeğini,
                heyecanını ve sahnedeki hikâyesini doğru açıdan anlatmak.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-emerald-500 font-semibold uppercase tracking-wider text-sm">
              Vizyonumuz
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-200 mt-4 mb-6">
              Organizasyon Vizyonumuz
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Yarışma ve spor etkinliklerinde; sporcuların performansını,
              aileler için değerli anları ve organizasyonun atmosferini
              profesyonel bir görsel arşive dönüştürüyoruz.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
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
            ].map((item, index) => (
              <div
                key={index}
                className="group bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500/30 transition-colors">
                  <item.icon className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-200 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Principles Section */}
      <section className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <span className="text-emerald-500 font-semibold uppercase tracking-wider text-sm">
                ÇEKİM STANDARTLARIMIZ
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-200 mt-4 mb-8">
                Her Sporcuyu Aynı Özenle Çekiyoruz
              </h2>

              <div className="space-y-4">
                {[
                  "Ritmik cimnastik dinamiğine hâkim çekim ekibi",
                  "Seri akışına uygun fotoğraf ve video takibi",
                  "Sporcu bazlı düzenli arşivleme",
                  "Aileler için kolay erişilebilir teslimat",
                  "Organizasyon için güçlü görsel içerik üretimi",
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 bg-zinc-900/40 border border-zinc-800 rounded-xl p-4"
                  >
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 md:order-2">
              <img
                src="/about/principles.jpeg"
                alt="Ritmika Cup İlkeleri"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Media Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img
                src="/about/media.jpeg"
                alt="Range Media"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent rounded-2xl" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-black/80 backdrop-blur-sm border border-zinc-700 rounded-xl p-4">
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

            <div>
              <span className="text-emerald-500 font-semibold uppercase tracking-wider text-sm">
                Medya
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-200 mt-4 mb-6">
                Yarışma Günü Tüm Süreci Kayıt Altına Alıyoruz
              </h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                <strong className="text-emerald-400">RNG Sport,</strong>{" "}
                organizasyon boyunca yalnızca performans anlarını değil;
                hazırlık sürecini, sahne atmosferini, ödül anlarını ve
                etkinliğin genel enerjisini de kapsayan bütünlüklü bir medya
                akışı oluşturur.
              </p>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Çekimler, yarışma temposuna uyum sağlayacak şekilde planlanır.
                Sporcu geçişleri, seri sıraları ve teslimat süreci düzenli takip
                edilerek ailelerin içeriklere kolayca ulaşması hedeflenir.
              </p>
              <div className="flex items-start gap-4 bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
                <Award className="w-10 h-10 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-white font-semibold mb-1">
                    En Güncel Teknoloji
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Sahadaki her performans, en güncel yayıncılık teknolojileri
                    kullanılarak kayıt altına alınmakta ve arşivlenmektedir.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-linear-to-b from-zinc-950 to-black">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "900+", label: "Sporcu", icon: Users },
              { number: "75+", label: "Kulüp", icon: Target },
              {
                number: "4 Gün",
                label: "Sürecek Sahne Performansları",
                icon: CalendarDays,
              },
              { number: "100%", label: "Memnuniyet", icon: Award },
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500/30 transition-colors">
                  <stat.icon className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="bg-linear-to-r from-emerald-900/40 to-teal-900/40 border border-emerald-500/30 rounded-3xl p-8 md:p-12 text-center">
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
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-medium transition-colors"
              >
                Rezervasyon Yap
              </Link>
              <Link
                to="/#paketler"
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-3 rounded-xl font-medium transition-colors"
              >
                Paketleri İncele
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
