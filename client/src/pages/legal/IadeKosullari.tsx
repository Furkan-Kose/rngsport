import {
  ArrowLeft,
  BookOpen,
  XCircle,
  CheckCircle,
  RotateCcw,
  AlertTriangle,
  Phone,
} from "lucide-react";
import { Link } from "react-router";
import SEO from "../../components/SEO";

const IadeKosullari = () => {
  return (
    <div className="min-h-screen bg-linear-to-b from-gray-950 via-gray-900 to-gray-950">
      <SEO
        title="İade Koşulları"
        description="RNG Sport iade koşulları ve cayma hakkı bilgilendirmesi."
        url="https://rngsport.com/iade-kosullari"
      />
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-emerald-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Ana Sayfaya Dön</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-4">
              İptal ve İade Koşulları
            </h1>
            <p className="text-gray-400">
              6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli
              Sözleşmeler Yönetmeliği kapsamında
            </p>
          </div>

          {/* Content Card */}
          <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl">
            {/* Section 1 */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-emerald-500 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </span>
                1. Genel İlkeler
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Müşteri (ALICI),{" "}
                <span className="text-emerald-400">www.ritmikacup.com</span>{" "}
                üzerinden satın aldığı hizmetlerde,{" "}
                <strong className="text-gray-100">
                  6502 sayılı Tüketicinin Korunması Hakkında Kanun
                </strong>{" "}
                ve{" "}
                <strong className="text-gray-100">
                  Mesafeli Sözleşmeler Yönetmeliği
                </strong>{" "}
                hükümleri ile aşağıda belirtilen iptal/iade şartlarını kabul
                etmiş sayılır.
              </p>
            </section>

            {/* Section 2 */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-emerald-500 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </span>
                2. Cayma Hakkının İstisnaları (İade Edilemeyen Durumlar)
              </h3>

              <p className="text-gray-300 leading-relaxed mb-4">
                Satın alınan hizmet;{" "}
                <strong className="text-gray-100">
                  "Spor organizasyonu kapsamında kişiye özel fotoğraf/video
                  çekimi ve dijital teslimatı"
                </strong>
                nı kapsamaktadır. Mesafeli Sözleşmeler Yönetmeliği'nin{" "}
                <strong className="text-gray-100">
                  15. maddesinin (ğ) bendi
                </strong>{" "}
                uyarınca; "Elektronik ortamda anında ifa edilen hizmetler veya
                tüketiciye anında teslim edilen gayrimaddi mallar" cayma
                hakkının istisnası kapsamındadır.
              </p>

              <div className="bg-linear-to-r from-red-500/10 to-orange-500/10 rounded-xl p-6 border border-red-500/20">
                <p className="text-gray-200 font-semibold mb-3">
                  Bu nedenle aşağıdaki durumlarda iade yapılmaz:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></span>
                    <span>
                      Yarışma gerçekleştikten ve çekim yapıldıktan sonra
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></span>
                    <span>
                      Fotoğraf/Video indirme bağlantısı (link) ALICI'ya
                      iletildikten sonra
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></span>
                    <span>
                      "Beğenmeme" veya "Beklentiyi karşılamama" gibi öznel
                      gerekçelerle
                    </span>
                  </li>
                </ul>
                <p className="text-red-400 font-semibold mt-4">
                  Hizmet bedeli iadesi (cayma hakkı) kullanılamaz.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-emerald-500 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </span>
                3. İptal ve İade Kabul Edilen Durumlar
              </h3>

              <p className="text-gray-300 leading-relaxed mb-4">
                Aşağıdaki hallerde ALICI'ya ücret iadesi yapılır:
              </p>

              <div className="bg-linear-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-6 border border-green-500/20 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </span>
                  <div className="text-gray-300">
                    <strong className="text-green-400">
                      Yarışma Öncesi İptal:
                    </strong>{" "}
                    ALICI, yarışma tarihinden en geç{" "}
                    <strong className="text-gray-100">24 saat öncesine</strong>{" "}
                    kadar tarafımıza yazılı olarak başvurarak siparişini iptal
                    etmek isterse, ücretin tamamı kesintisiz olarak iade edilir.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </span>
                  <div className="text-gray-300">
                    <strong className="text-green-400">
                      Organizasyon İptali:
                    </strong>{" "}
                    Etkinliğin organizatör veya resmi makamlarca iptal edilmesi
                    durumunda, çekim yapılamayacağı için alınan ücretler iade
                    edilir.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </span>
                  <div className="text-gray-300">
                    <strong className="text-green-400">
                      Teknik Aksaklıklar:
                    </strong>{" "}
                    SATICI'dan kaynaklanan teknik bir sorun nedeniyle (kamera
                    arızası, veri kaybı vb.) sporcunun görüntülerinin
                    kaydedilememesi veya teslim edilememesi durumunda ücretin
                    tamamı iade edilir.
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-emerald-500 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </span>
                4. İade Prosedürü
              </h3>

              <p className="text-gray-300 leading-relaxed mb-4">
                İadeye hak kazanılan durumlarda;
              </p>

              <div className="bg-white/5 rounded-xl p-6 border border-white/5 space-y-3">
                <div className="flex items-start gap-3 text-gray-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                  <span>
                    İade işlemleri, ALICI'nın satın alma sırasında kullandığı
                    kredi kartına/banka hesabına yapılır.
                  </span>
                </div>
                <div className="flex items-start gap-3 text-gray-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                  <span>
                    SATICI tarafından iade talimatı verildikten sonra, tutarın
                    ALICI'nın hesabına yansıması banka süreçlerine bağlı olarak{" "}
                    <strong className="text-gray-100">3 ile 7 iş günü</strong>{" "}
                    sürebilir. Bu süreçte bankadan kaynaklı gecikmelerden SATICI
                    sorumlu değildir.
                  </span>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-emerald-500 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                5. Hatalı veya Eksik İçerik
              </h3>

              <div className="bg-linear-to-r from-yellow-500/10 to-amber-500/10 rounded-xl p-6 border border-yellow-500/20">
                <p className="text-gray-300 leading-relaxed">
                  Teslim edilen dijital dosyalarda teknik bir hata (açılmama,
                  bozuk dosya vb.) olması durumunda, ALICI'nın durumu bildirmesi
                  üzerine, SATICI{" "}
                  <strong className="text-yellow-400">
                    en kısa sürede hatayı düzelterek dosyaları yeniden
                    iletecektir.
                  </strong>
                </p>
              </div>
            </section>

            {/* Contact Section */}
            <section>
              <h3 className="text-xl font-bold text-emerald-500 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </span>
                İletişim
              </h3>

              <div className="bg-linear-to-r from-emerald-500/10 to-teal-500/10 rounded-xl p-6 border border-emerald-500/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Şirket Ünvanı</p>
                    <p className="text-gray-100 font-medium">
                      Hakan Köse - Range Media
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">E-Posta</p>
                    <a
                      href="mailto:hakankose5534@gmail.com"
                      className="text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      hakankose5534@gmail.com
                    </a>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-400 text-sm mb-1">Adres</p>
                    <p className="text-gray-100">
                      Başıbüyük Mah. Aydınlılar Sk. No: 39 Maltepe/İstanbul
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer Note */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <p className="text-gray-400 text-sm text-center">
                İptal ve iade talepleriniz için{" "}
                <a
                  href="mailto:hakankose5534@gmail.com"
                  className="text-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  hakankose5534@gmail.com
                </a>{" "}
                adresine e-posta gönderebilirsiniz.
                <br />
                Son güncelleme: Ocak 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IadeKosullari;
