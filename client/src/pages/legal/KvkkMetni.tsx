import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import SEO from "../../components/SEO";

const KvkkMetni = () => {
  return (
    <div className="min-h-screen bg-linear-to-b from-gray-950 via-gray-900 to-gray-950">
      <SEO
        title="KVKK Aydınlatma Metni"
        description="RNG Sport KVKK kapsamında kişisel verilerin korunması aydınlatma ve açık rıza metni."
        url="https://rngsport.com/kvkk"
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
              Kişisel Verilerin Korunması Kanunu (KVKK) Kapsamında
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-emerald-500">
              Aydınlatma ve Açık Rıza Metni
            </h2>
          </div>

          {/* Content Card */}
          <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl">
            {/* Section 1 */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-emerald-500 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm">
                  1
                </span>
                Veri Sorumlusu ve İşleyen
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu
                ("Kanun") uyarınca,{" "}
                <strong className="text-emerald-400">
                  International Ritmika Cup
                </strong>{" "}
                organizasyonu kapsamında; organizasyon sahibi{" "}
                <strong className="text-gray-100">Ritmika Cimnastik</strong> ve
                yetkili görüntüleme partneri{" "}
                <strong className="text-gray-100">
                  Range Media (Hakan Köse)
                </strong>{" "}
                tarafından işlenecek kişisel verileriniz ve görüntü kayıtlarınız
                hakkında sizi bilgilendirmek ve açık rızanızı almak amacıyla
                hazırlanmıştır.
              </p>
            </section>

            {/* Section 2 */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-emerald-500 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm">
                  2
                </span>
                İşlenen Kişisel Veriler ve İşleme Amaçları
              </h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Organizasyon süresince katılımcı sporcuların;
              </p>

              <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/5">
                <h4 className="text-gray-100 font-semibold mb-3">
                  İşlenen Veriler:
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                    <span>
                      <strong className="text-gray-100">
                        Kimlik Bilgileri:
                      </strong>{" "}
                      Ad, Soyad, Doğum Tarihi, Kulüp Bilgisi
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                    <span>
                      <strong className="text-gray-100">
                        Görsel ve İşitsel Kayıtlar:
                      </strong>{" "}
                      Fotoğraf, Video, Yarışma Performans Görüntüleri
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                    <span>
                      <strong className="text-gray-100">
                        İletişim Bilgileri:
                      </strong>{" "}
                      Veli E-posta, Telefon
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/5">
                <h4 className="text-gray-100 font-semibold mb-3">
                  İşleme Amaçları:
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                    <span>
                      Yarışma organizasyonunun yürütülmesi ve arşivlenmesi
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                    <span>
                      Sporcu performanslarının profesyonel olarak kayıt altına
                      alınması ve talep eden velilere/sporculara satışa
                      sunulması
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                    <span>
                      Ritmika Cimnastik ve Range Media'ya ait sosyal medya
                      hesaplarında (Instagram, YouTube, vb.), web sitelerinde ve
                      tanıtım filmlerinde etkinlik haberi ve pazarlama materyali
                      olarak kullanılması
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-emerald-500 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm">
                  3
                </span>
                Kişisel Verilerin Aktarılması
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Elde edilen görsel ve işitsel kayıtlar; etkinliğin tanıtımı,
                sporun teşviki ve hizmetin ifası amacıyla; Ritmika Cimnastik ve
                Range Media'nın sosyal medya hesaplarında halka açık olarak
                paylaşılabilir, iş ortakları ve yetkili mercilerle Kanun'un{" "}
                <strong className="text-gray-100">8. ve 9. maddelerine</strong>{" "}
                uygun olarak paylaşılabilir.
              </p>
            </section>

            {/* Section 4 */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-emerald-500 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm">
                  4
                </span>
                Haklarınız
              </h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                KVKK'nın <strong className="text-gray-100">11. maddesi</strong>{" "}
                uyarınca aşağıdaki haklara sahipsiniz:
              </p>
              <div className="bg-white/5 rounded-xl p-6 border border-white/5">
                <ul className="space-y-2">
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                    <span>Verilerinizin işlenip işlenmediğini öğrenme</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                    <span>İşlenmişse buna ilişkin bilgi talep etme</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                    <span>
                      İşlenme amacına uygun kullanılıp kullanılmadığını öğrenme
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                    <span>
                      Görüntülerin silinmesini veya yok edilmesini isteme{" "}
                      <em className="text-gray-400">
                        (yasal saklama yükümlülükleri ve yayınlanmış içeriklerin
                        teknik geri alınamazlığı saklı kalmak kaydıyla)
                      </em>
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h3 className="text-xl font-bold text-emerald-500 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm">
                  5
                </span>
                Açık Rıza Beyanı
              </h3>
              <div className="bg-linear-to-r from-emerald-500/10 to-teal-500/10 rounded-xl p-6 border border-emerald-500/20">
                <p className="text-gray-200 leading-relaxed">
                  Yukarıdaki aydınlatma metnini okudum ve anladım. Velisi/Vasisi
                  bulunduğum sporcunun{" "}
                  <strong className="text-emerald-400">
                    International Ritmika Cup
                  </strong>{" "}
                  kapsamındaki fotoğraf ve video çekimlerinin Range Media
                  tarafından yapılmasına; bu görsellerin Ritmika Cimnastik ve
                  Range Media tarafından sosyal medya, internet siteleri ve
                  tanıtım materyallerinde ticari veya ticari olmayan amaçlarla
                  kullanılmasına, çoğaltılmasına ve yayınlanmasına hiçbir baskı
                  altında kalmadan{" "}
                  <strong className="text-emerald-400 uppercase">
                    açık rıza gösteriyorum
                  </strong>
                  .
                </p>
              </div>
            </section>

            {/* Footer Note */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <p className="text-gray-400 text-sm text-center">
                Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu
                kapsamında hazırlanmıştır.
                <br />
                Sorularınız için{" "}
                <a
                  href="tel:+905398444521"
                  className="text-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  +90 (539) 844 45 21
                </a>{" "}
                numaralı telefondan bize ulaşabilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KvkkMetni;
