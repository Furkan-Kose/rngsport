import {
  ArrowLeft,
  CreditCard,
  Shield,
  Mail,
  Cookie,
  Phone,
} from "lucide-react";
import { Link } from "react-router";
import SEO from "../../components/SEO";

const GizlilikPolitikasi = () => {
  return (
    <div className="min-h-screen bg-linear-to-b from-gray-950 via-gray-900 to-gray-950">
      <SEO 
        title="Gizlilik Politikası"
        description="International Ritmika Cup gizlilik politikası. Kişisel verilerinizin nasıl toplandığı, kullanıldığı ve korunduğu hakkında bilgi."
        url="https://ritmikacup.com/gizlilik-politikasi"
      />
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-fuchsia-500 transition-colors"
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
              Gizlilik ve Güvenlik Politikası
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              <strong className="text-gray-100">
                Range Media - Hakan Köse
              </strong>{" "}
              olarak,{" "}
              <span className="text-fuchsia-400">www.ritmikacup.com</span>{" "}
              sitemizi kullanan ve alışveriş yapan müşterilerimizin kişisel
              verilerinin ve özellikle ödeme bilgilerinin güvenliğine büyük önem
              vermekteyiz.
            </p>
          </div>

          {/* Content Card */}
          <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl">
            {/* Section 1 */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-fuchsia-500 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </span>
                1. Kredi Kartı Güvenliği ve iyzico Altyapısı
              </h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Sitemizden yapacağınız alışverişlerde kredi kartı bilgilerinizin
                güvenliği en üst düzeyde tutulmaktadır.
              </p>

              <div className="bg-white/5 rounded-xl p-6 border border-white/5 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-fuchsia-500 mt-2 shrink-0"></span>
                  <div className="text-gray-300">
                    <strong className="text-gray-100">
                      Kart Bilgileri Saklanmaz:
                    </strong>{" "}
                    Kredi kartı numaranız, son kullanma tarihi ve CVC kodunuz
                    gibi hassas ödeme bilgileriniz hiçbir şekilde firmamızın
                    sunucularında, veritabanında veya tarayıcı çerezlerinde
                    saklanmamaktadır.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-fuchsia-500 mt-2 shrink-0"></span>
                  <div className="text-gray-300">
                    <strong className="text-gray-100">iyzico Güvencesi:</strong>{" "}
                    Ödeme işlemleri, Türkiye'nin önde gelen ödeme kuruluşu{" "}
                    <span className="text-fuchsia-400">
                      iyzico (iyzico Ödeme Hizmetleri A.Ş.)
                    </span>{" "}
                    altyapısı üzerinden gerçekleştirilir. Kart bilgileriniz,
                    sitemizden bağımsız olarak doğrudan ve şifreli bir şekilde
                    banka sistemine iletilir. Firmamız, sadece ödemenin başarılı
                    olup olmadığı bilgisini görür, kart detaylarınıza erişemez.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-fuchsia-500 mt-2 shrink-0"></span>
                  <div className="text-gray-300">
                    <strong className="text-gray-100">
                      3D Secure (Güvenli Ödeme):
                    </strong>{" "}
                    İşlemlerinizde 3D Secure sistemi kullanılır. Bu sayede ödeme
                    onayı için cep telefonunuza gelen SMS şifresini girmeden
                    işlem tamamlanmaz. Bu, kartınızın yetkisiz kişilerce
                    kullanımını engeller.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-fuchsia-500 mt-2 shrink-0"></span>
                  <div className="text-gray-300">
                    <strong className="text-gray-100">SSL Sertifikası:</strong>{" "}
                    Sitemizdeki tüm veri akışı,{" "}
                    <span className="text-fuchsia-400">
                      256 bit SSL (Secure Sockets Layer)
                    </span>{" "}
                    şifreleme teknolojisi ile korunmaktadır. Ödeme sayfasına
                    girdiğinizde tarayıcınızın adres çubuğunda göreceğiniz
                    "kilit" işareti, bağlantınızın şifreli ve güvenli olduğunu
                    gösterir.
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-fuchsia-500 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </span>
                2. Kişisel Verilerin Gizliliği
              </h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Firmamız, siparişlerinizi teslim edebilmek ve hizmet verebilmek
                amacıyla bazı kişisel bilgilerinizi (Ad, Soyad, E-posta, Telefon
                vb.) talep etmektedir.
              </p>

              <div className="bg-white/5 rounded-xl p-6 border border-white/5 space-y-3">
                <div className="flex items-start gap-3 text-gray-300">
                  <span className="w-2 h-2 rounded-full bg-fuchsia-500 mt-2 shrink-0"></span>
                  <span>
                    Bu bilgiler, yalnızca siparişinizin işlenmesi,
                    fotoğraf/video linklerinin tarafınıza iletilmesi ve
                    gerektiğinde sizinle irtibat kurulması amacıyla kullanılır.
                  </span>
                </div>
                <div className="flex items-start gap-3 text-gray-300">
                  <span className="w-2 h-2 rounded-full bg-fuchsia-500 mt-2 shrink-0"></span>
                  <span>
                    Kişisel bilgileriniz, yasal zorunluluklar (resmi makamların
                    talebi) ve ödeme güvenliği (iyzico ile sınırlı veri
                    paylaşımı) haricinde,{" "}
                    <strong className="text-gray-100">
                      kesinlikle üçüncü şahıslarla veya başka şirketlerle
                      paylaşılmaz, satılmaz ve ticari amaçla kullanılmaz.
                    </strong>
                  </span>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-fuchsia-500 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </span>
                3. E-Posta Güvenliği
              </h3>
              <div className="bg-linear-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-6 border border-yellow-500/20">
                <p className="text-gray-300 leading-relaxed">
                  Müşteri hizmetlerimizle veya siparişinizle ilgili yapacağınız
                  e-posta yazışmalarında,{" "}
                  <strong className="text-yellow-400">
                    asla kredi kartı numaranızı veya şifrelerinizi yazmayınız.
                  </strong>{" "}
                  E-postalarda yer alan bilgiler üçüncü şahıslar tarafından
                  görülebilir. Firmamız, e-posta yoluyla aktarılan bilgilerin
                  güvenliğini garanti edemez; bu nedenle hassas finansal
                  bilgilerinizi sadece sitemizdeki güvenli ödeme sayfasında
                  giriniz.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-fuchsia-500 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
                  <Cookie className="w-4 h-4" />
                </span>
                4. Çerez (Cookie) Kullanımı
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Sitemiz, kullanıcı deneyimini iyileştirmek ve sitenin verimli
                çalışmasını sağlamak amacıyla çerezler (cookies) kullanmaktadır.
                Bu çerezler, kişisel verilerinizi toplamak için değil, oturum
                sürekliliğini sağlamak (örneğin sepetinizdeki ürünlerin
                hatırlanması) için kullanılır. Tarayıcı ayarlarınızdan çerez
                kullanımını dilediğiniz zaman engelleyebilirsiniz.
              </p>
            </section>

            {/* Section 5 - Contact */}
            <section>
              <h3 className="text-xl font-bold text-fuchsia-500 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </span>
                5. İletişim
              </h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Gizlilik ve güvenlik politikamızla ilgili her türlü sorunuz için
                bizimle iletişime geçebilirsiniz.
              </p>

              <div className="bg-linear-to-r from-fuchsia-500/10 to-purple-500/10 rounded-xl p-6 border border-fuchsia-500/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Firma Ünvanı</p>
                    <p className="text-gray-100 font-medium">
                      Hakan Köse - Range Media
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Telefon</p>
                    <a
                      href="tel:+905398444521"
                      className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
                    >
                      0 539 844 45 21
                    </a>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">E-posta</p>
                    <a
                      href="mailto:hakankose5534@gmail.com"
                      className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
                    >
                      hakankose5534@gmail.com
                    </a>
                  </div>
                  <div>
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
                Bu politika, müşterilerimizin güvenliği için hazırlanmıştır.
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

export default GizlilikPolitikasi;
