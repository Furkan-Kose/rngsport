import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Rezervasyonumu ne zaman yapmalıyım?",
    answer: "Çekim planlamamızın eksiksiz yapılabilmesi için web sitemiz üzerinden ön rezervasyon yapmanızı öneriyoruz. Yarışma günü alandaki standımızdan da kayıt kabul edilmektedir; ancak öncelik rezervasyonlu sporcularımızdadır."
  },
  {
    question: "Ödeme işlemini nasıl gerçekleştireceğim?",
    answer: "Web sitemiz üzerinden paketinizi seçip ön kaydınızı oluşturduktan sonra, ödemenizi yarışma günü alandaki standımızda (Nakit veya Kredi Kartı ile) tamamlayabilirsiniz. Ödemesi tamamlanan kayıtlar çekim listesine alınır."
  },
  {
    question: "Sadece fotoğraf mı, yoksa video çekimi de yapıyor musunuz?",
    answer: "Evet, hem fotoğraf hem de video hizmetimiz mevcuttur. Dilerseniz sadece fotoğraf, sadece video veya her ikisini kapsayan avantajlı paketlerimizi tercih edebilirsiniz."
  },
  {
    question: "Çocuğumun çekildiğinden nasıl emin olabilirim?",
    answer: "Rezervasyon yaptıran sporcularımız, yarışma esame (başlangıç) listesi üzerinden takip edilir. Profesyonel ekibimiz, rezervasyonlu sporcunun sırası geldiğinde hazır bulunur ve performansı baştan sona kayıt altına alır."
  },
  {
    question: "Teknik bir sorun olursa veya fotoğrafları beğenmezsem iade yapıyor musunuz?",
    answer: "Müşteri memnuniyeti esastır. Eğer bizden kaynaklı teknik bir hata (odak kaybı, veri bozulması vb.) nedeniyle performansınız görüntülenemezse, %100 ücret iadesi garantisi veriyoruz."
  },
  {
    question: "Sadece dijital teslim mi yapıyorsunuz, albüm veya çerçeve seçeneği var mı?",
    answer: "Standart teslimatımız en hızlı ulaşım için dijitaldir. Ancak talep edilmesi durumunda; özel tasarım poster, kanvas tablo veya anı albümü gibi baskılı ürünler için yarışma sonrası ekibimizle iletişime geçebilirsiniz."
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="sss" className="py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-emerald-500 font-semibold uppercase tracking-wider text-sm">
            <HelpCircle className="w-4 h-4" />
            Yardım
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-gray-200 mt-4 mb-6">
            Sık Sorulan Sorular
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Merak ettiğiniz soruların cevapları
          </p>
        </div>

        {/* FAQ List */}
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`rounded-2xl border transition-all duration-300 ${
                openIndex === index 
                  ? "bg-zinc-900/60 border-emerald-500/30" 
                  : "bg-zinc-900/30 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <button
                className="w-full flex items-center justify-between p-5 text-left"
                onClick={() => toggleFAQ(index)}
              >
                <span className={`font-semibold pr-4 transition-colors ${
                  openIndex === index ? "text-emerald-400" : "text-gray-200"
                }`}>
                  {faq.question}
                </span>
                <ChevronDown 
                  className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                    openIndex === index 
                      ? "rotate-180 text-emerald-400" 
                      : "text-zinc-500"
                  }`} 
                />
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ${
                openIndex === index ? "max-h-96" : "max-h-0"
              }`}>
                <p className="px-5 pb-5 text-gray-400 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="text-center mt-12 max-w-3xl mx-auto">
          <p className="text-gray-400 mb-4">"Aradığınız cevabı bulamadınız mı?" "WhatsApp destek hattımızdan veya yarışma günü danışma masamızdan bize anında ulaşabilirsiniz. Size yardımcı olmaktan mutluluk duyarız."</p>
          {/* <a 
            href="#contact" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
          >
            Bize Ulaşın
          </a> */}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
