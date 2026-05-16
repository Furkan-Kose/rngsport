import { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
  Play,
  ArrowRight,
} from "lucide-react";

// Vimeo video ID'sinden thumbnail URL'i oluştur
const getVimeoThumbnail = (videoId: string) =>
  `https://vumbnail.com/${videoId}.jpg`;

const galleryItems = [
  {
    id: 1,
    type: "video",
    vimeoId: "1160466956", // Vimeo video ID'sini buraya yazın
    thumbnail: "/video/1.jpeg", // Boş bırakırsanız Vimeo thumbnail'ı kullanılır
    title: "Ritmika Cup 2025",
    category: "Video",
  },
  {
    id: 2,
    type: "video",
    vimeoId: "1160467514",
    thumbnail: "/video/2.jpeg",
    title: "Ritmika Cup 2025",
    category: "Video",
  },
  {
    id: 3,
    type: "video",
    vimeoId: "1160467257",
    thumbnail: "",
    title: "Ritmika Cup 2025",
    category: "Video",
  },
  {
    id: 4,
    type: "video",
    vimeoId: "1160469238",
    thumbnail: "",
    title: "Ritmika Cup 2025",
    category: "Video",
  },
  {
    id: 5,
    type: "photo",
    src: "/gallery/1.webp",
    thumbnail: "/gallery/1.webp",
    title: "Ritmika Cup 2025",
    category: "Fotoğraf",
  },
  {
    id: 6,
    type: "photo",
    src: "/gallery/2.webp",
    thumbnail: "/gallery/2.webp",
    title: "Ritmika Cup 2025",
    category: "Fotoğraf",
  },
  {
    id: 7,
    type: "photo",
    src: "/gallery/3.webp",
    thumbnail: "/gallery/3.webp",
    title: "Ritmika Cup 2025",
    category: "Fotoğraf",
  },
  {
    id: 8,
    type: "photo",
    src: "/gallery/4.webp",
    thumbnail: "/gallery/4.webp",
    title: "Ritmika Cup 2025",
    category: "Fotoğraf",
  },
  {
    id: 9,
    type: "photo",
    src: "/gallery/5.webp",
    thumbnail: "/gallery/5.webp",
    title: "Ritmika Cup 2025",
    category: "Fotoğraf",
  },
];

// Item'ın thumbnail'ını al (video ise Vimeo thumbnail, değilse normal thumbnail)
const getItemThumbnail = (item: (typeof galleryItems)[0]) => {
  if (item.type === "video" && item.vimeoId) {
    return item.thumbnail || getVimeoThumbnail(item.vimeoId);
  }
  return item.thumbnail;
};

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const categories = ["all", "Fotoğraf", "Video"];

  const allFilteredItems =
    filter === "all"
      ? galleryItems
      : galleryItems.filter((item) => item.category === filter);

  // Ana sayfada sadece 6 item göster
  const filteredItems = allFilteredItems.slice(0, 6);

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

  const gallerySection = (
    <section id="galeri" className="py-24 bg-zinc-950/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 text-emerald-500 font-semibold uppercase tracking-wider text-sm">
            <Camera className="w-4 h-4" />
            Portföy
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-gray-200 mt-4 mb-6">
            Galeri
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Geçtiğimiz yılın organizasyonunda yakaladığımız performanslardan
            seçilmiş örnek kareler.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                filter === category
                  ? "bg-emerald-500 text-white"
                  : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white"
              }`}
            >
              {category === "all" ? "Tümü" : category}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                  <div className="w-16 h-16 rounded-full bg-emerald-500/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-7 h-7 text-white fill-white ml-1" />
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

        {/* Tüm Galeriyi Gör Butonu */}
        {allFilteredItems.length > 6 && (
          <div className="text-center mt-10">
            <Link
              to="/galeri"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-medium transition-colors"
            >
              Tüm Galeriyi Gör
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );

  const lightbox =
    selectedImage !== null &&
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
          </div>
        </div>
      </div>,
      document.body,
    );

  return (
    <>
      {gallerySection}
      {lightbox}
    </>
  );
};

export default Gallery;
