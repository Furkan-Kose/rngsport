import { useState } from "react";
import { ChevronDown, HelpCircle, MessageCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import SectionHeader from "./ui/SectionHeader";
import Reveal from "./ui/Reveal";

interface FaqItem {
  q: string;
  a: string;
}

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { t } = useTranslation();
  const faqs = (t("home.faq.items", { returnObjects: true }) as FaqItem[]).map((item) => ({
    question: item.q,
    answer: item.a,
  }));

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="sss" className="relative py-24 bg-black">
      <div className="container mx-auto px-4 relative z-10">
        <SectionHeader
          eyebrow={t("home.faq.eyebrow")}
          icon={HelpCircle}
          title={t("home.faq.title")}
          description={t("home.faq.description")}
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
                {t("home.faq.stillQuestions")}
              </span>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t("home.faq.contactText")}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default FAQ;
