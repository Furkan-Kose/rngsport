import { useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Camera, Play } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import SEO from "../components/SEO";
import Reveal from "../components/ui/Reveal";
import { galleryItems, type GalleryItem } from "../data/gallery";

const getVimeoThumbnail = (videoId: string) =>
  `https://vumbnail.com/${videoId}.jpg`;

const getItemThumbnail = (item: GalleryItem) => {
  if (item.type === "video" && item.vimeoId) {
    return item.thumbnail || getVimeoThumbnail(item.vimeoId);
  }
  return item.thumbnail;
};

const GalleryPage = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const categories = ["all", "Fotoğraf", "Video"];

  const filteredItems =
    filter === "all"
      ? galleryItems
      : galleryItems.filter((item) => item.category === filter);

  const openLightbox = (index: number) => {
    setSelectedImage(index);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = "auto";
  };

  const goToPrevious = () => {
    if (selectedImage !== null) {
      setSelectedImage(
        selectedImage === 0 ? filteredItems.length - 1 : selectedImage - 1,
      );
    }
  };

  const goToNext = () => {
    if (selectedImage !== null) {
      setSelectedImage(
        selectedImage === filteredItems.length - 1 ? 0 : selectedImage + 1,
      );
    }
  };

  return (
    <div className="min-h-screen">
      <SEO
        title="Galeri"
        description="RNG Sport'un yarışma ve turnuvalardaki profesyonel fotoğraf ve video çekimlerinden örnekler. Ritmik cimnastik ve spor performanslarının en güzel anları."
        keywords="rng sport galeri, ritmik cimnastik fotoğrafları, ritmik cimnastik videoları, spor fotoğrafçılığı, yarışma çekim örnekleri"
        url="https://rngsport.com/galeri"
      />

      {/* Hero Section */}
      <section className="relative py-32 pb-44 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/gallery/7.webp"
            alt="International Ritmika Cup Galeri"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/65 to-black/55" />
        </div>
        <div
          aria-hidden
          className="absolute inset-0 bg-grid-dark opacity-40 pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -bottom-20 left-1/3 w-[28rem] h-[28rem] bg-emerald-600/[0.06] rounded-full blur-3xl pointer-events-none"
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Reveal>
              <span className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/40 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 shadow-[0_0_24px_-8px_rgba(16,185,129,0.6)]">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 text-sm font-medium tracking-wider uppercase">
                  Portföy
                </span>
              </span>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                <span className="text-gradient-brand">Galeri</span>
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                Geçtiğimiz yılın organizasyonunda yakaladığımız performanslardan
                seçilmiş kareler ve videolar.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Bottom fade — image dissolves into the next section (#09090b) */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-32 md:h-44 z-[5] bg-linear-to-b from-transparent to-[#09090b] pointer-events-none"
        />
      </section>

      {/* Gallery Section */}
      <section className="py-20 bg-zinc-950 relative">
        <div className="container mx-auto px-4">
          {/* Filter Buttons */}
          <Reveal>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    filter === category
                      ? "bg-emerald-500 text-white scale-105 shadow-lg shadow-emerald-500/40"
                      : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800"
                  }`}
                >
                  {category === "all" ? "Tümü" : category}
                </button>
              ))}
            </div>
          </Reveal>

          {/* Stats */}
          <Reveal delay={0.1}>
            <div className="flex justify-center gap-8 mb-12">
              <div className="text-center px-6 py-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                <div className="text-2xl font-bold text-emerald-400">
                  {galleryItems.filter((i) => i.type === "photo").length}
                </div>
                <div className="text-sm text-gray-400">Fotoğraf</div>
              </div>
              <div className="text-center px-6 py-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                <div className="text-2xl font-bold text-emerald-400">
                  {galleryItems.filter((i) => i.type === "video").length}
                </div>
                <div className="text-sm text-gray-400">Video</div>
              </div>
            </div>
          </Reveal>

          {/* Gallery Grid — uniform aspect-square */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredItems.map((item, index) => (
              <Reveal key={item.id} delay={(index % 8) * 0.04}>
                <div
                  className="group relative aspect-square overflow-hidden rounded-2xl cursor-pointer bg-zinc-900 border border-zinc-800/50 hover:border-emerald-500/40 transition-colors"
                  onClick={() => openLightbox(index)}
                >
                  <img
                    src={getItemThumbnail(item)}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />

                  {item.type === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/40 rounded-full blur-xl group-hover:bg-emerald-400/60 transition-colors" />
                        <div className="relative w-14 h-14 rounded-full bg-emerald-500/95 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                          <Play className="w-6 h-6 text-white fill-white ml-1" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-1">
                      {item.category}
                    </p>
                    <h3 className="text-white font-semibold">{item.title}</h3>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-20">
              <Camera className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-gray-400">
                Bu kategoride henüz içerik bulunmuyor.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {createPortal(
        <AnimatePresence>
          {selectedImage !== null && (
            <motion.div
              key="gallery-page-lightbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center"
              onClick={closeLightbox}
            >
              <button
                className="absolute top-6 right-6 z-50 p-3 text-white hover:text-emerald-400 bg-zinc-900/80 hover:bg-zinc-800 rounded-full transition-all"
                onClick={closeLightbox}
              >
                <X className="w-8 h-8" />
              </button>

              <button
                className="absolute left-4 z-50 p-3 text-white/80 hover:text-white bg-zinc-900/50 hover:bg-zinc-800 rounded-full transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                className="absolute right-4 z-50 p-3 text-white/80 hover:text-white bg-zinc-900/50 hover:bg-zinc-800 rounded-full transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
              >
                <ChevronRight className="w-8 h-8" />
              </button>

              <motion.div
                key={selectedImage}
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-[95vw] lg:max-w-[85vw] px-2 sm:px-4"
                onClick={(e) => e.stopPropagation()}
              >
                {filteredItems[selectedImage].type === "video" &&
                filteredItems[selectedImage].vimeoId ? (
                  <div className="relative w-full h-[70vh] lg:h-[85vh]">
                    <iframe
                      className="absolute inset-0 w-full h-full rounded-lg"
                      src={`https://player.vimeo.com/video/${filteredItems[selectedImage].vimeoId}?autoplay=1&title=0&byline=0&portrait=0`}
                      title={filteredItems[selectedImage].title}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <img
                    src={filteredItems[selectedImage].src}
                    alt={filteredItems[selectedImage].title}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg mx-auto"
                  />
                )}
                <div className="text-center mt-4">
                  <p className="text-emerald-400 text-sm">
                    {filteredItems[selectedImage].category}
                  </p>
                  <h3 className="text-white text-xl font-semibold mt-1">
                    {filteredItems[selectedImage].title}
                  </h3>
                  <p className="text-gray-500 text-sm mt-2">
                    {selectedImage + 1} / {filteredItems.length}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
};

export default GalleryPage;
