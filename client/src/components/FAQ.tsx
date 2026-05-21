import { useState } from "react";
import { ChevronDown, HelpCircle, MessageCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import SectionHeader from "./ui/SectionHeader";
import Reveal from "./ui/Reveal";

const faqs = [
  {
    question: "Rezervasyonumu ne zaman yapmalıyım?",
    answer:
      "Çekim planlamamızın eksiksiz yapılabilmesi için web sitemiz üzerinden ön rezervasyon yapmanızı öneriyoruz. Yarışma günü alandaki standımızdan da kayıt kabul edilmektedir; ancak öncelik rezervasyonlu sporcularımızdadır.",
  },
  {
    question: "Ödeme işlemini nasıl gerçekleştireceğim?",
    answer:
      "Web sitemiz üzerinden paketinizi seçip ön kaydınızı oluşturduktan sonra, ödemenizi yarışma günü alandaki standımızda (Nakit veya Kredi Kartı ile) tamamlayabilirsiniz. Ödemesi tamamlanan kayıtlar çekim listesine alınır.",
  },
  {
    question: "Sadece fotoğraf mı, yoksa video çekimi de yapıyor musunuz?",
    answer:
      "Evet, hem fotoğraf hem de video hizmetimiz mevcuttur. Dilerseniz sadece fotoğraf, sadece video veya her ikisini kapsayan avantajlı paketlerimizi tercih edebilirsiniz.",
  },
  {
    question: "Çocuğumun çekildiğinden nasıl emin olabilirim?",
    answer:
      "Rezervasyon yaptıran sporcularımız, yarışma esame (başlangıç) listesi üzerinden takip edilir. Profesyonel ekibimiz, rezervasyonlu sporcunun sırası geldiğinde hazır bulunur ve performansı baştan sona kayıt altına alır.",
  },
  {
    question:
      "Teknik bir sorun olursa veya fotoğrafları beğenmezsem iade yapıyor musunuz?",
    answer:
      "Müşteri memnuniyeti esastır. Eğer bizden kaynaklı teknik bir hata (odak kaybı, veri bozulması vb.) nedeniyle performansınız görüntülenemezse, %100 ücret iadesi garantisi veriyoruz.",
  },
  {
    question:
      "Sadece dijital teslim mi yapıyorsunuz, albüm veya çerçeve seçeneği var mı?",
    answer:
      "Standart teslimatımız en hızlı ulaşım için dijitaldir. Ancak talep edilmesi durumunda; özel tasarım poster, kanvas tablo veya anı albümü gibi baskılı ürünler için yarışma sonrası ekibimizle iletişime geçebilirsiniz.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="sss" className="relative py-24 bg-black">
      <div className="container mx-auto px-4 relative z-10">
        <SectionHeader
          eyebrow="Yardım"
          icon={HelpCircle}
          title="Sık Sorulan Sorular"
          description="Merak ettiğiniz soruların cevapları"
          className="mb-16"
        />

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <Reveal key={index} delay={index * 0.04}>
                <div
                  className={`relative rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? "bg-zinc-900/80 border-emerald-500/40 shadow-[0_0_30px_-12px_rgba(16,185,129,0.4)]"
                      : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  {/* Left accent bar when open */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 transition-opacity duration-300 ${
                      isOpen ? "opacity-100" : "opacity-0"
                    }`}
                  />

                  <button
                    className="w-full flex items-center justify-between p-5 text-left"
                    onClick={() => toggleFAQ(index)}
                  >
                    <span
                      className={`font-semibold pr-4 transition-colors ${
                        isOpen ? "text-emerald-300" : "text-gray-200"
                      }`}
                    >
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="shrink-0"
                    >
                      <ChevronDown
                        className={`w-5 h-5 transition-colors ${
                          isOpen ? "text-emerald-400" : "text-zinc-500"
                        }`}
                      />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: 0.35,
                          ease: [0.22, 1, 0.36, 1] as const,
                        }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-gray-400 leading-relaxed">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Contact CTA */}
        <Reveal delay={0.2}>
          <div className="text-center mt-12 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300 font-medium">
                Hâlâ sorunuz var mı?
              </span>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto">
              "Aradığınız cevabı bulamadınız mı?" "WhatsApp destek hattımızdan
              veya yarışma günü danışma masamızdan bize anında ulaşabilirsiniz.
              Size yardımcı olmaktan mutluluk duyarız."
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default FAQ;
