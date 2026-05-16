import { useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Camera, Play } from "lucide-react";
import SEO from "../components/SEO";
import { galleryItems, type GalleryItem } from "../data/gallery";

// Vimeo video ID'sinden thumbnail URL'i oluştur
const getVimeoThumbnail = (videoId: string) =>
  `https://vumbnail.com/${videoId}.jpg`;

// Item'ın thumbnail'ını al (video ise Vimeo thumbnail, değilse normal thumbnail)
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
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/gallery/7.webp"
            alt="International Ritmika Cup Galeri"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/70 to-black" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-6">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 text-sm font-medium">
                Portföy
              </span>
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Galeri
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
              Geçtiğimiz yılın organizasyonunda yakaladığımız performanslardan
              seçilmiş kareler ve videolar.
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          {/* Filter Buttons */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  filter === category
                    ? "bg-emerald-500 text-white"
                    : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white"
                }`}
              >
                {category === "all" ? "Tümü" : category}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-10">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {galleryItems.filter((i) => i.type === "photo").length}
              </div>
              <div className="text-sm text-gray-400">Fotoğraf</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {galleryItems.filter((i) => i.type === "video").length}
              </div>
              <div className="text-sm text-gray-400">Video</div>
            </div>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="group relative aspect-square overflow-hidden rounded-2xl cursor-pointer bg-zinc-800"
                onClick={() => openLightbox(index)}
              >
                <img
                  src={getItemThumbnail(item)}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Video Badge */}
                {item.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-6 h-6 text-white fill-white ml-1" />
                    </div>
                  </div>
                )}

                {/* Hover Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-xs text-emerald-400 font-medium mb-1">
                    {item.category}
                  </p>
                  <h3 className="text-white font-semibold">{item.title}</h3>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
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

      {/* Lightbox - Portal ile body'ye render */}
      {selectedImage !== null &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              className="absolute top-6 right-6 z-50 p-3 text-white hover:text-emerald-400 bg-zinc-900/80 hover:bg-zinc-800 rounded-full transition-all"
              onClick={closeLightbox}
            >
              <X className="w-8 h-8" />
            </button>

            {/* Navigation */}
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

            {/* Content */}
            <div
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
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default GalleryPage;
