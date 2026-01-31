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
        description="International Ritmika Cup - Ritmik cimnastik branşında uluslararası standartları yakalamak ve sporculara profesyonel bir yarışma deneyimi sunmak amacıyla hayata geçirilmiştir."
        keywords="ritmika cup hakkında, ritmik cimnastik organizasyonu, range media, spor etkinliği, uluslararası yarışma"
        url="https://ritmikacup.com/hakkimizda"
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
            <span className="inline-flex items-center gap-2 bg-fuchsia-500/20 border border-fuchsia-500/30 rounded-full px-4 py-1.5 mb-6">
              <Globe className="w-4 h-4 text-fuchsia-400" />
              <span className="text-fuchsia-300 text-sm font-medium">
                International
              </span>
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Sezonun En Büyük Buluşması:
              <span className="block text-fuchsia-500 mt-2">
                International Ritmika Cup
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
              Ritmik cimnastik branşında uluslararası standartları yakalamak ve
              sporculara profesyonel bir yarışma deneyimi sunmak amacıyla hayata
              geçirilmiştir.
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
              <div className="absolute -bottom-6 -right-6 bg-fuchsia-500 text-white p-6 rounded-2xl shadow-xl hidden md:block">
                <div className="text-4xl font-bold">2026</div>
                <div className="text-sm opacity-90">Ritmika Cup</div>
              </div>
            </div>

            <div>
              <span className="text-fuchsia-500 font-semibold uppercase tracking-wider text-sm">
                Hakkımızda
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-200 mt-4 mb-6">
                Ritmika Cimnastik Organizasyonu
              </h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                <strong className="text-fuchsia-400">Ritmika Cimnastik</strong>{" "}
                tarafından organize edilen bu etkinlik; katılımcı sayısı, teknik
                altyapısı ve organizasyon kalitesiyle
                <strong className="text-white">
                  {" "}
                  "sezonun en büyük buluşması"
                </strong>{" "}
                olma vizyonunu taşımaktadır.
              </p>
              <p className="text-gray-400 leading-relaxed">
                Temel önceliğimiz; sporcularımızın sezon boyunca verdikleri
                emeği, hak ettikleri profesyonel sahnede sergilemelerine olanak
                tanımaktır.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-fuchsia-500 font-semibold uppercase tracking-wider text-sm">
              Vizyonumuz
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-200 mt-4 mb-6">
              Organizasyon Vizyonumuz
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Amacımız, sadece bir madalya mücadelesi değil, sporcuların
              gelişimine katkı sağlayan nitelikli bir spor etkinliği
              yaratmaktır.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                title: "Uluslararası Standartlar",
                description:
                  "Uluslararası yarışma kurallarına tam uyum sağlayarak en yüksek kaliteyi sunuyoruz.",
              },
              {
                icon: Shield,
                title: "Adil Hakem Yönetimi",
                description:
                  "Adil ve şeffaf hakem yönetimi ile tüm sporculara eşit fırsatlar tanıyoruz.",
              },
              {
                icon: Heart,
                title: "Sporcu Odaklı Yaklaşım",
                description:
                  "Sporcu ve antrenör odaklı süreç yönetimi ilkesiyle hareket ediyoruz.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="group bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 hover:border-fuchsia-500/50 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-fuchsia-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-fuchsia-500/30 transition-colors">
                  <item.icon className="w-7 h-7 text-fuchsia-400" />
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
              <span className="text-fuchsia-500 font-semibold uppercase tracking-wider text-sm">
                İlkelerimiz
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-200 mt-4 mb-8">
                Organizasyonumuzun Temel İlkeleri
              </h2>

              <div className="space-y-4">
                {[
                  "Uluslararası yarışma kurallarına tam uyum",
                  "Adil ve şeffaf hakem yönetimi",
                  "Sporcu ve antrenör odaklı süreç yönetimi",
                  "Profesyonel sahne ve teknik altyapı",
                  "Yüksek kaliteli medya hizmetleri",
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 bg-zinc-900/40 border border-zinc-800 rounded-xl p-4"
                  >
                    <div className="w-10 h-10 bg-fuchsia-500/20 rounded-lg flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5 text-fuchsia-400" />
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
                    <Camera className="w-8 h-8 text-fuchsia-400" />
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
              <span className="text-fuchsia-500 font-semibold uppercase tracking-wider text-sm">
                Medya
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-200 mt-4 mb-6">
                Medya ve Görüntüleme Hizmetleri
              </h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Organizasyonun profesyonel medya yönetimi, canlı yayın ve içerik
                üretimi süreçleri resmi çözüm ortağımız{" "}
                <strong className="text-fuchsia-400">Range Media</strong>{" "}
                tarafından yürütülmektedir.
              </p>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Bu platform; yarışma esnasında kaydedilen yüksek çözünürlüklü
                performans videolarına ve fotoğraflarına, sporcu ailelerinin
                kolayca ve güvenle ulaşabilmesi için tasarlanmıştır.
              </p>
              <div className="flex items-start gap-4 bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
                <Award className="w-10 h-10 text-fuchsia-400 shrink-0" />
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
                <div className="w-16 h-16 bg-fuchsia-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-fuchsia-500/30 transition-colors">
                  <stat.icon className="w-8 h-8 text-fuchsia-400" />
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
          <div className="bg-linear-to-r from-fuchsia-900/40 to-purple-900/40 border border-fuchsia-500/30 rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ritmika Cup 2026'da Yerinizi Ayırtın
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto mb-8">
              Profesyonel fotoğraf ve video hizmetlerimizle performansınızı
              ölümsüzleştirin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/rezervasyon"
                className="bg-fuchsia-500 hover:bg-fuchsia-600 text-white px-8 py-3 rounded-xl font-medium transition-colors"
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
