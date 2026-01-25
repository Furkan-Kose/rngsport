import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Camera, Play } from "lucide-react";

// YouTube video ID'sinden thumbnail URL'i oluştur
const getYoutubeThumbnail = (videoId: string) => 
  `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

const galleryItems = [
  {
    id: 1,
    type: "video",
    youtubeId: "4YqjW0LaNxc", // YouTube video ID'sini buraya yazın
    thumbnail: "", // Boş bırakırsanız YouTube thumbnail'ı kullanılır
    title: "Ritmika Cup 2025",
    category: "Video",
  },
  {
    id: 2,
    type: "video",
    youtubeId: "LxsuspJmM6A",
    thumbnail: "",
    title: "Ritmika Cup 2025",
    category: "Video",
  },
  {
    id: 3,
    type: "video",
    youtubeId: "1enESTwX7UQ",
    thumbnail: "",
    title: "Ritmika Cup 2025",
    category: "Video",
  },
  {
    id: 4,
    type: "video",
    youtubeId: "skdPXjQmPZk",
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
  // {
  //   id: 10,
  //   type: "photo",
  //   src: "/gallery/6.webp",
  //   thumbnail: "/gallery/6.webp",
  //   title: "Ritmika Cup 2025",
  //   category: "Fotoğraf",
  // },
];

// Item'ın thumbnail'ını al (video ise YouTube thumbnail, değilse normal thumbnail)
const getItemThumbnail = (item: typeof galleryItems[0]) => {
  if (item.type === "video" && item.youtubeId) {
    return item.thumbnail || getYoutubeThumbnail(item.youtubeId);
  }
  return item.thumbnail;
};

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const categories = ["all", "Fotoğraf", "Video"];

  const filteredItems = filter === "all" 
    ? galleryItems 
    : galleryItems.filter(item => item.category === filter);

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
      setSelectedImage(selectedImage === 0 ? filteredItems.length - 1 : selectedImage - 1);
    }
  };

  const goToNext = () => {
    if (selectedImage !== null) {
      setSelectedImage(selectedImage === filteredItems.length - 1 ? 0 : selectedImage + 1);
    }
  };

  return (
    <section id="gallery" className="py-24 bg-zinc-950/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 text-fuchsia-500 font-semibold uppercase tracking-wider text-sm">
            <Camera className="w-4 h-4" />
            Portföy
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-gray-200 mt-4 mb-6">
            Galeri
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Geçtiğimiz yılın organizasyonunda yakaladığımız performanslardan seçilmiş örnek kareler.
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
                  ? "bg-fuchsia-500 text-white"
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
                  <div className="w-16 h-16 rounded-full bg-fuchsia-500/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-7 h-7 text-white fill-white ml-1" />
                  </div>
                </div>
              )}

              {/* Hover Info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-xs text-fuchsia-400 font-medium mb-1">{item.category}</p>
                <h3 className="text-white font-semibold">{item.title}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox */}
        {selectedImage !== null && (
          <div 
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button 
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-10"
              onClick={closeLightbox}
            >
              <X className="w-8 h-8" />
            </button>

            {/* Navigation */}
            <button 
              className="absolute left-4 p-2 text-white/70 hover:text-white transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
            >
              <ChevronLeft className="w-10 h-10" />
            </button>
            <button 
              className="absolute right-4 p-2 text-white/70 hover:text-white transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
            >
              <ChevronRight className="w-10 h-10" />
            </button>

            {/* Content */}
            <div className="w-full max-w-5xl max-h-[85vh] px-4 sm:px-16" onClick={(e) => e.stopPropagation()}>
              {filteredItems[selectedImage].type === "video" && filteredItems[selectedImage].youtubeId ? (
                // YouTube Video Player
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full rounded-lg"
                    src={`https://www.youtube.com/embed/${filteredItems[selectedImage].youtubeId}?autoplay=1&rel=0`}
                    title={filteredItems[selectedImage].title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                // Image
                <img
                  src={filteredItems[selectedImage].src}
                  alt={filteredItems[selectedImage].title}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg mx-auto"
                />
              )}
              <div className="text-center mt-4">
                <p className="text-fuchsia-400 text-sm">{filteredItems[selectedImage].category}</p>
                <h3 className="text-white text-xl font-semibold mt-1">{filteredItems[selectedImage].title}</h3>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Gallery;
