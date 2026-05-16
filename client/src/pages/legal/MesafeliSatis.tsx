import {
  ArrowLeft,
  Users,
  FileText,
  Package,
  Scale,
  Shield,
  Gavel,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router";
import SEO from "../../components/SEO";

const MesafeliSatis = () => {
  return (
    <div className="min-h-screen bg-linear-to-b from-gray-950 via-gray-900 to-gray-950">
      <SEO
        title="Mesafeli Satış Sözleşmesi"
        description="RNG Sport mesafeli satış sözleşmesi. Online sipariş ve satış koşulları hakkında bilgi."
        url="https://rngsport.com/mesafeli-satis-sozlesmesi"
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
              Mesafeli Satış Sözleşmesi
            </h1>
            <p className="text-gray-400">
              6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli
              Sözleşmeler Yönetmeliği kapsamında
            </p>
          </div>

          {/* Content Card */}
          <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl">
            {/* MADDE 1 */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-emerald-500 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </span>
                MADDE 1 – TARAFLAR
              </h3>

              {/* Satıcı Bilgileri */}
              <div className="bg-white/5 rounded-xl p-6 mb-4 border border-white/5">
                <h4 className="text-gray-100 font-semibold mb-3">
                  1.1. SATICI (Hizmet Sağlayıcı)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-300">
                  <div>
                    <span className="text-gray-400 text-sm">Ünvanı:</span>
                    <p className="text-gray-100">Hakan Köse - Range Media</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Telefon:</span>
                    <p>
                      <a
                        href="tel:+905398444521"
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        0 539 844 45 21
                      </a>
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">E-Posta:</span>
                    <p>
                      <a
                        href="mailto:hakankose5534@gmail.com"
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        hakankose5534@gmail.com
                      </a>
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Adres:</span>
                    <p>Başıbüyük Mah. Aydınlılar Sk. No: 39 Maltepe/İstanbul</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-3 italic">
                  (Bundan böyle "SATICI" olarak anılacaktır)
                </p>
              </div>

              {/* Alıcı Bilgileri */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/5">
                <h4 className="text-gray-100 font-semibold mb-3">
                  1.2. ALICI (Müşteri)
                </h4>
                <p className="text-gray-300 leading-relaxed">
                  İşbu sözleşme kapsamında,{" "}
                  <span className="text-emerald-400">www.ritmikacup.com</span>{" "}
                  üzerinden sipariş veren, hizmeti satın alan ve ödemeyi
                  gerçekleştiren gerçek veya tüzel kişidir. İlgili kişinin ödeme
                  esnasında beyan ettiği Ad, Soyad ve İletişim bilgileri esas
                  alınır.
                </p>
                <p className="text-gray-400 text-sm mt-3 italic">
                  (Bundan böyle "ALICI" olarak anılacaktır)
                </p>
              </div>
            </section>

            {/* MADDE 2 */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-emerald-500 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </span>
                MADDE 2 – KONU
              </h3>
              <p className="text-gray-300 leading-relaxed">
                İşbu sözleşmenin konusu, ALICI'nın SATICI'ya ait internet sitesi
                üzerinden elektronik ortamda siparişini verdiği, aşağıda
                nitelikleri belirtilen hizmetin satışı ve ifası ile ilgili
                olarak{" "}
                <strong className="text-gray-100">
                  6502 sayılı Tüketicinin Korunması Hakkında Kanun
                </strong>{" "}
                ve{" "}
                <strong className="text-gray-100">
                  Mesafeli Sözleşmeler Yönetmeliği
                </strong>{" "}
                hükümleri gereğince tarafların hak ve yükümlülüklerinin
                belirlenmesidir.
              </p>
            </section>

            {/* MADDE 3 */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-emerald-500 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </span>
                MADDE 3 – SÖZLEŞME KONUSU HİZMET
              </h3>

              <div className="bg-linear-to-r from-emerald-500/10 to-teal-500/10 rounded-xl p-6 border border-emerald-500/20">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                    <div className="text-gray-300">
                      <strong className="text-gray-100">Hizmetin Adı:</strong>{" "}
                      International Ritmika Cup - Fotoğraf ve Video Dijital
                      İçerik Paketi
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                    <div className="text-gray-300">
                      <strong className="text-gray-100">
                        Hizmetin Niteliği:
                      </strong>{" "}
                      Spor organizasyonu kapsamında gerçekleştirilen kişiye özel
                      fotoğraf ve video çekimi, kurgulanması ve dijital ortamda
                      teslimi.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                    <div className="text-gray-300">
                      <strong className="text-gray-100">Teslimat Şekli:</strong>{" "}
                      Dijital Teslimat (E-posta veya İndirme Bağlantısı yoluyla)
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                    <div className="text-gray-300">
                      <strong className="text-gray-100">Toplam Tutar:</strong>{" "}
                      Ödeme sayfasında belirtilen ve ALICI tarafından onaylanan
                      tutardır.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                    <div className="text-gray-300">
                      <strong className="text-gray-100">Ödeme Şekli:</strong>{" "}
                      Nakit / Kredi Kartı / Banka Kartı (Sanal POS)
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* MADDE 4 */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-emerald-500 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </span>
                MADDE 4 – GENEL HÜKÜMLER
              </h3>

              <div className="bg-white/5 rounded-xl p-6 border border-white/5 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold">4.1.</span>
                  <p className="text-gray-300 leading-relaxed">
                    ALICI, internet sitesinde sözleşme konusu hizmetin temel
                    nitelikleri, satış fiyatı, ödeme şekli ve ifasına ilişkin ön
                    bilgileri okuyup bilgi sahibi olduğunu ve elektronik ortamda
                    gerekli teyidi verdiğini beyan eder.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold">4.2.</span>
                  <p className="text-gray-300 leading-relaxed">
                    Sözleşme konusu hizmet, ALICI tarafından belirtilen e-posta
                    adresine veya GSM numarasına dijital bağlantı (link) olarak
                    iletilecektir. ALICI'nın yanlış iletişim bilgisi vermesinden
                    kaynaklanan aksaklıklardan SATICI sorumlu tutulamaz.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold">4.3.</span>
                  <p className="text-gray-300 leading-relaxed">
                    Hizmetin ifası, etkinlik bitimini takip eden ve SATICI
                    tarafından taahhüt edilen makul süre (kurgu/edit süreci)
                    sonunda dijital içeriklerin ALICI'ya iletilmesi ile
                    tamamlanmış sayılır.
                  </p>
                </div>
              </div>
            </section>

            {/* MADDE 5 */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-emerald-500 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </span>
                MADDE 5 – CAYMA HAKKI VE İSTİSNALARI
              </h3>

              <div className="bg-linear-to-r from-emerald-500/10 to-teal-500/10 rounded-xl p-6 border border-emerald-500/20 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold">5.1.</span>
                  <p className="text-gray-300 leading-relaxed">
                    İşbu sözleşme konusu hizmet; 27.11.2014 tarihli Mesafeli
                    Sözleşmeler Yönetmeliği'nin "Cayma Hakkının İstisnaları"
                    başlıklı{" "}
                    <strong className="text-emerald-400">
                      15. maddesinin (ğ) bendi
                    </strong>{" "}
                    uyarınca; "Elektronik ortamda anında ifa edilen hizmetler
                    veya tüketiciye anında teslim edilen gayrimaddi mallara
                    ilişkin sözleşmeler" kapsamındadır.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold">5.2.</span>
                  <p className="text-gray-300 leading-relaxed">
                    Satın alınan fotoğraf ve video paketleri, kişiye özel
                    (sporcunun performansına ait) üretilen ve dijital ortamda
                    erişime açılan içerikler olduğundan,{" "}
                    <strong className="text-emerald-400">
                      hizmet ifa edildikten (içerik linki gönderildikten) sonra
                      ALICI'nın cayma ve iade hakkı bulunmamaktadır.
                    </strong>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold">5.3.</span>
                  <p className="text-gray-300 leading-relaxed">
                    Etkinlik gerçekleşmeden önce yapılan iptal taleplerinde,
                    SATICI'nın belirlediği iptal koşulları geçerlidir. Etkinlik
                    gerçekleştikten veya çekim yapıldıktan sonra ücret iadesi
                    yapılmaz.
                  </p>
                </div>
              </div>
            </section>

            {/* MADDE 6 */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-emerald-500 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm">
                  6
                </span>
                KİŞİSEL VERİLERİN KORUNMASI
              </h3>
              <p className="text-gray-300 leading-relaxed">
                ALICI, işbu sözleşme kapsamında verdiği kişisel bilgilerin ve
                görüntü kayıtlarının, hizmetin ifası, fatura kesilmesi ve
                siparişin teslimi amacıyla SATICI tarafından kaydedilmesine,
                saklanmasına ve{" "}
                <Link
                  to="/kvkk-aydinlatma-metni"
                  className="text-emerald-400 hover:text-emerald-300 underline"
                >
                  KVKK Aydınlatma Metni
                </Link>
                'nde belirtilen şartlarda işlenmesine onay verir.
              </p>
            </section>

            {/* MADDE 7 */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-emerald-500 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Gavel className="w-4 h-4" />
                </span>
                MADDE 7 – YETKİLİ MAHKEME
              </h3>
              <p className="text-gray-300 leading-relaxed">
                İşbu sözleşmenin uygulanmasında doğabilecek uyuşmazlıklarda,
                Ticaret Bakanlığı'nca ilan edilen değere kadar Tüketici Hakem
                Heyetleri ile SATICI'nın yerleşim yerindeki{" "}
                <strong className="text-gray-100">(İstanbul/Maltepe)</strong>{" "}
                Tüketici Mahkemeleri ve İcra Daireleri yetkilidir.
              </p>
            </section>

            {/* MADDE 8 */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-emerald-500 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </span>
                MADDE 8 – YÜRÜRLÜK
              </h3>
              <p className="text-gray-300 leading-relaxed">
                ALICI, site üzerinden verdiği siparişe ait ödemeyi
                gerçekleştirdiğinde işbu sözleşmenin tüm şartlarını kabul etmiş
                sayılır.
              </p>
            </section>

            {/* Taraflar */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-xl p-6 border border-white/5 text-center">
                  <p className="text-gray-400 text-sm mb-2">SATICI</p>
                  <p className="text-gray-100 font-semibold">
                    HAKAN KÖSE - RANGE MEDIA
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-6 border border-white/5 text-center">
                  <p className="text-gray-400 text-sm mb-2">ALICI</p>
                  <p className="text-gray-100 font-semibold">
                    Siparişi Veren Tüketici
                  </p>
                </div>
              </div>
              <p className="text-gray-400 text-sm text-center mt-6">
                TARİH: İşlem Tarihi
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MesafeliSatis;
