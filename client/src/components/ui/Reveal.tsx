import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { EASE, MAX_DELAY, REVEAL } from "../../lib/motion";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}

const buildVariants = (y: number): Variants => ({
  hidden: { opacity: 0, y },
  visible: { opacity: 1, y: 0 },
});

/**
 * Kaydırınca hafifçe beliren sarmalayıcı (süre ve eğri: lib/motion.ts).
 * Tetik payı bilerek yok (amount: 0): hızlı kaydıran ziyaretçi boş siyah ekran
 * görmemeli. Gecikmenin üst sınırı var, uzun listelerde son öğeler geç kalmasın.
 */
const Reveal = ({ children, delay = 0, y = REVEAL.y, className = "", once = true }: RevealProps) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0 }}
      variants={buildVariants(y)}
      transition={{ duration: REVEAL.duration, ease: EASE, delay: Math.min(delay, MAX_DELAY) }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;
