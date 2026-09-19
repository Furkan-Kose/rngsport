/**
 * RNG Sport özel ürünleri — şimdilik tamamen statik vitrin.
 * Sipariş akışı yok; satışa açılınca bu dosyanın yerini API alır,
 * bileşenler aynı kalacak şekilde yazıldı.
 */

/** WhatsApp numarası WpButton.tsx ve Footer.tsx'te de geçiyor (ortak sabit yok) */
export const WHATSAPP_NUMBER = "905398444521";

/** "Satışa çıkınca haber ver" için hazır mesajlı WhatsApp bağlantısı */
export const notifyMeUrl = (productName: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Merhaba, "${productName}" satışa çıkınca haber verir misiniz?`,
  )}`;

export type ProductSection = {
  title: string;
  body?: string[];
  bullets?: string[];
};

export type Product = {
  slug: string;
  /** "01" / "02" — kartta ve detay başlığında gösterilir */
  number: string;
  name: string;
  tagline: string;
  /** Kartlarda görünen kısa açıklama; uzun anlatım detay sayfasında */
  cardSummary: string;
  image: string;
  imageAlt: string;
  intro: string[];
  sections: ProductSection[];
  /** Alt bilgi şeridi: "Kişiye özel üretim • 3D tasarım • ..." */
  meta: string;
  comingSoonNote: string;
};

export const products: Product[] = [
  {
    slug: "sporcu-figuru",
    number: "01",
    name: "Kişiye Özel Sporcu Figürü",
    tagline: "Kendi pozun. Kendi ismin. Kendi figürün.",
    cardSummary:
      "Sporcunun kendi pozundan yola çıkılarak hazırlanan, isim plakalı üç boyutlu figür.",
    image: "/products/figur.jpeg",
    imageAlt: "RNG Sport kişiye özel sporcu figürü",
    intro: [
      "Bir yarışma fotoğrafı, unutulmayan bir poz ya da sporcuyu en iyi anlatan o hareket…",
      "RNG SPORT Kişiye Özel Sporcu Figürü, sporcunun kendisinden yola çıkılarak özel olarak hazırlanır. Poz, saç modeli, kostüm detayları ve isim gibi kişisel öğeler tasarıma dahil edilerek yalnızca o sporcuya ait bir figür ortaya çıkarılır.",
      "Alt standı ve kişiselleştirilmiş isim alanıyla birlikte tasarlanan figür; yarışmaların, başarıların ve spor yolculuğunun yıllarca saklanabilecek özel bir hatırasına dönüşür.",
    ],
    sections: [
      {
        title: "Sana özel hazırlanır",
        body: [
          "Her figür, sporcuya ait referans görseller üzerinden kişiselleştirilir.",
        ],
        bullets: [
          "Sporcunun pozu",
          "Saç modeli ve karakteristik detayları",
          "Cimnastik kostümü",
          "Sporcu ismi",
          "Stand üzerindeki yazı",
          "Organizasyona özel detaylar",
        ],
      },
      {
        title: "Bir fotoğraftan fazlası",
        body: [
          "Yarışmalar biter, madalyalar birikir, fotoğraflar arşivde kalır.",
          "Bu figür ise sporcunun o dönemini üç boyutlu bir hatıraya dönüştürür. Odasında, kupa rafında veya çalışma masasının üzerinde ona ait küçük bir anı olarak kalır.",
        ],
      },
    ],
    meta: "Kişiye özel üretim • 3D tasarım • Özel isim plakası",
    comingSoonNote:
      "RNG SPORT kişiye özel sporcu figürleri yakında siparişe açılıyor.",
  },
  {
    slug: "isikli-cimnastik-harfi",
    number: "02",
    name: "Kişiye Özel Işıklı Cimnastik Harfi",
    tagline: "İsminin ilk harfi, senin cimnastik dünyan.",
    cardSummary:
      "İsmin baş harfinden yola çıkan, cimnastik detaylarıyla bezenmiş aydınlatmalı dekoratif tasarım.",
    image: "/products/harf.jpeg",
    imageAlt: "RNG Sport kişiye özel ışıklı cimnastik harfi",
    intro: [
      "Sporcunun isminin baş harfinden yola çıkarak hazırlanan dekoratif tasarım; cimnastik figürleri, kişisel detaylar ve ışıkla bir araya geliyor.",
      "Her harfin içinde sporcunun dünyasını anlatan küçük bir cimnastik sahnesi oluşturuluyor. Ritmik cimnastik ekipmanları, sporcu figürleri ve isme özel detaylarla standart bir dekorasyon ürünü yerine tamamen kişisel bir obje ortaya çıkıyor.",
      "Işığı açıldığında ise harfin içindeki detaylar öne çıkarak özellikle sporcu odalarında farklı bir atmosfer oluşturuyor.",
    ],
    sections: [
      {
        title: "Her harf farklı bir hikâye",
        body: [
          "B harfi Belinay için, D harfi Defne için, E harfi Eylül için…",
          "Ama değişen yalnızca harf değil.",
          "Her tasarım sporcunun adına ve cimnastik dünyasına göre yeniden hazırlanabilir.",
        ],
      },
      {
        title: "Cimnastiğe özel detaylarla",
        body: ["Tasarım içerisinde farklı cimnastik öğeleri kullanılabilir:"],
        bullets: [
          "Top",
          "Çember",
          "Kurdele",
          "Labut",
          "İp",
          "Cimnastikçi figürleri",
          "Yıldız ve yarışma detayları",
          "Sporcu ismi",
        ],
      },
      {
        title: "Gündüz dekor, gece ışık",
        body: [
          "Ürünün içerisinde kullanılan aydınlatma, bu detayları gece de görünür hale getirerek dekoratif harfi aynı zamanda yumuşak bir ortam ışığına dönüştürür.",
          "Gündüz odanın dekorasyonunun bir parçası. Gece ise ışığıyla tasarımın detaylarını ortaya çıkaran kişisel bir obje.",
          "Sporcunun kendi odasında, kupa köşesinde veya çalışma masasının yanında kullanılabilecek şekilde tasarlanır.",
        ],
      },
    ],
    meta:
      "Kişiye özel harf • Cimnastik teması • Aydınlatmalı tasarım • İsim özelleştirmesi",
    comingSoonNote:
      "RNG SPORT Işıklı Cimnastik Harfi yakında siparişe açılıyor.",
  },
];

export const getProduct = (slug?: string) =>
  products.find((product) => product.slug === slug);
