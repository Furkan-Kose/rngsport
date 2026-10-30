import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Ürün detay galerisi (e-ticaret gibi): kaydırma (parmakla), oklar, altta küçük resimler.
// Tek fotoğrafta düz resim olarak görünür.
const ProductImageCarousel = ({ images, alt }: { images: string[]; alt: string }) => {
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);
  const list = images.filter(Boolean);
  const count = list.length;
  const go = (i: number) => setIndex((i + count) % count);

  if (count <= 1) {
    return <img src={list[0]} alt={alt} className="relative w-full rounded-2xl shadow-2xl" />;
  }

  return (
    <div className="relative">
      <div
        className="relative overflow-hidden rounded-2xl shadow-2xl bg-zinc-900 select-none"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {list.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={i === 0 ? alt : `${alt} ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              draggable={false}
              className="w-full shrink-0 aspect-4/5 object-cover"
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Önceki"
          onClick={() => go(index - 1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          aria-label="Sonraki"
          onClick={() => go(index + 1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <span className="absolute bottom-3 right-3 text-xs px-2 py-0.5 rounded-full bg-black/60 text-white">
          {index + 1} / {count}
        </span>
      </div>

      {/* Küçük resimler: kaydırılabilir ama kaydırma çubuğu gizli */}
      <div className="flex gap-2 mt-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {list.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`${i + 1}`}
            aria-current={i === index}
            className={`shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
              i === index ? "border-emerald-400" : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductImageCarousel;
