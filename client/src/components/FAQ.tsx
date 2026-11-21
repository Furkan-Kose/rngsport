import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import SectionHeader from "./ui/SectionHeader";
import Reveal from "./ui/Reveal";
import WhatsAppIcon from "./ui/WhatsAppIcon";
import { whatsappUrl } from "../lib/contact";
import { COLLAPSE, EASE, STAGGER } from "../lib/motion";
import { buttonClass, cardTone, cx } from "../lib/siteUi";

interface FaqItem {
  q: string;
  a: string;
}

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { t } = useTranslation();
  const faqs = t("home.faq.items", { returnObjects: true }) as FaqItem[];

  return (
    <section id="sss" className="py-24 bg-black scroll-mt-20">
      <div className="container mx-auto px-4">
        <SectionHeader title={t("home.faq.title")} description={t("home.faq.description")} />

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const panelId = `faq-panel-${index}`;
            const buttonId = `faq-button-${index}`;
            return (
              <Reveal key={index} delay={index * STAGGER}>
                <div className={cx(cardTone(isOpen ? "strong" : "default"), "transition-colors")}>
                  <h3>
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className="w-full flex items-center justify-between gap-4 p-5 text-left rounded-2xl"
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                    >
                      <span
                        className={cx(
                          "font-semibold transition-colors",
                          isOpen ? "text-emerald-400" : "text-zinc-100",
                        )}
                      >
                        {faq.q}
                      </span>
                      <ChevronDown
                        aria-hidden
                        className={cx(
                          "w-5 h-5 shrink-0 text-zinc-400 transition-transform duration-300",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: COLLAPSE.duration, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-zinc-300 leading-relaxed">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="text-center mt-12 max-w-2xl mx-auto">
          <p className="text-lg font-semibold text-zinc-100">{t("home.faq.stillQuestions")}</p>
          <p className="mt-2 text-zinc-400">{t("home.faq.contactText")}</p>
          <a
            href={whatsappUrl(t("common.whatsapp.message"))}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("secondary", "md", "mt-5")}
          >
            <WhatsAppIcon className="w-4 h-4" />
            {t("home.faq.contactCta")}
          </a>
        </Reveal>
      </div>
    </section>
  );
};

export default FAQ;
