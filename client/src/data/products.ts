/**
 * RNG Sport özel ürünleri — şimdilik tamamen statik vitrin.
 * Sipariş akışı yok; satışa açılınca bu dosyanın yerini API alır,
 * bileşenler aynı kalacak şekilde yazıldı.
 */

/** WhatsApp numarası WpButton.tsx ve Footer.tsx'te de geçiyor (ortak sabit yok) */
export const WHATSAPP_NUMBER = "905423406557";

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
  /** Fiyat rozetinde fiyatın önünde: "Kısa bir süreliğine" */
  priceNote?: string;
};

const ALL_PRODUCTS: Product[] = [
  {
    slug: "sporcu-figuru",
    number: "01",
    name: "Kişiye Özel Sporcu Figürü",
    tagline: "Senin Pozun, Senin İsmin, Senin Figürün",
    cardSummary:
      "Sporcunun kendine özgü pozunu ve ismini taşıyan, tamamen ona özel tasarlanmış 3D hatıra figürü.",
    priceNote: "Kısa bir süreliğine",
    image: "/products/product.jpeg",
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
          "Seçilebilir özel pozlar",
          "Saç modeli ve karakteristik detayları",
          "Sporcunun mayosu",
          "Sporcu ismi",
          "Organizasyona özel detaylar",
        ],
      },
      {
        title: "Bir fotoğraftan fazlası",
        body: [
          "Yarışmalar biter, fotoğraflar arşivde kalır.",
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

/**
 * Satıştan/vitrinden kaldırılan ürünler (2026-10: sadece Sporcu Figürü satılıyor).
 * Metinleri yukarıda duruyor; geri açmak için slug'ı buradan çıkarmak yeterli.
 */
const RETIRED_SLUGS = new Set(["isikli-cimnastik-harfi"]);

export const products: Product[] = ALL_PRODUCTS.filter((p) => !RETIRED_SLUGS.has(p.slug));

export const getProduct = (slug?: string) =>
  products.find((product) => product.slug === slug);

// ---------------------------------------------------------------------------
// Çeviriler. Türkçe asıl metin yukarıda; burada olmayan ürün Türkçe kalır.
// ---------------------------------------------------------------------------
type ProductText = Pick<
  Product,
  "name" | "tagline" | "cardSummary" | "imageAlt" | "intro" | "sections" | "meta" | "comingSoonNote" | "priceNote"
>;

const TRANSLATIONS: Record<"en" | "ru", Record<string, ProductText>> = {
  en: {
    "sporcu-figuru": {
      name: "Personalised Athlete Figure",
      tagline: "Your Pose, Your Name, Your Figure",
      cardSummary: "A 3D keepsake figure designed entirely for the athlete, carrying her own unique pose and name.",
      priceNote: "For a limited time",
      imageAlt: "RNG Sport personalised athlete figure",
      intro: [
        "A competition photo, an unforgettable pose, or the move that captures the athlete best…",
        "The RNG SPORT Personalised Athlete Figure is created specifically from the athlete herself. Personal elements such as pose, hairstyle, costume details and name are built into the design, resulting in a figure that belongs to her alone.",
        "Designed together with a base and a personalised name area, the figure becomes a keepsake of competitions, achievements and the sporting journey that can be treasured for years.",
      ],
      sections: [
        {
          title: "Made just for you",
          body: ["Every figure is personalised using reference images of the athlete."],
          bullets: [
            "Selectable special poses",
            "Hairstyle and characteristic details",
            "The athlete's leotard",
            "The athlete's name",
            "Event-specific details",
          ],
        },
        {
          title: "More than a photo",
          body: [
            "Competitions end, photos stay in the archive.",
            "This figure turns that period of the athlete's life into a three-dimensional keepsake — a small memory of her in her room, on the trophy shelf or on her desk.",
          ],
        },
      ],
      meta: "Personalised production • 3D design • Custom name plate",
      comingSoonNote: "RNG SPORT personalised athlete figures will be available to order soon.",
    },
    "isikli-cimnastik-harfi": {
      name: "Personalised Illuminated Gymnastics Letter",
      tagline: "The first letter of your name, your gymnastics world.",
      cardSummary:
        "An illuminated decorative design based on the initial of your name, adorned with gymnastics details.",
      imageAlt: "RNG Sport personalised illuminated gymnastics letter",
      intro: [
        "A decorative design based on the initial of the athlete's name, bringing together gymnastics figures, personal details and light.",
        "Inside each letter, a small gymnastics scene tells the story of the athlete's world. With rhythmic gymnastics apparatus, athlete figures and name-specific details, it becomes a completely personal object rather than a standard decoration.",
        "When the light is switched on, the details inside the letter stand out, creating a special atmosphere — especially in an athlete's room.",
      ],
      sections: [
        {
          title: "Every letter tells a different story",
          body: [
            "B for Belinay, D for Defne, E for Eylül…",
            "But it is not only the letter that changes.",
            "Each design can be recreated around the athlete's name and gymnastics world.",
          ],
        },
        {
          title: "With gymnastics details",
          body: ["Different gymnastics elements can be used in the design:"],
          bullets: [
            "Ball",
            "Hoop",
            "Ribbon",
            "Clubs",
            "Rope",
            "Gymnast figures",
            "Stars and competition details",
            "The athlete's name",
          ],
        },
        {
          title: "Decor by day, light by night",
          body: [
            "The built-in lighting makes these details visible at night too, turning the decorative letter into a soft ambient light.",
            "By day, part of the room's decoration. By night, a personal object whose light brings out the details of the design.",
            "Designed to be used in the athlete's own room, in the trophy corner or next to her desk.",
          ],
        },
      ],
      meta: "Personalised letter • Gymnastics theme • Illuminated design • Name personalisation",
      comingSoonNote: "The RNG SPORT Illuminated Gymnastics Letter will be available to order soon.",
    },
  },
  ru: {
    "sporcu-figuru": {
      name: "Именная фигурка спортсменки",
      tagline: "Твоя поза, твоё имя, твоя фигурка",
      cardSummary: "Объёмная фигурка-память с неповторимой позой и именем спортсменки, созданная полностью для неё.",
      priceNote: "Только сейчас",
      imageAlt: "Именная фигурка спортсменки RNG Sport",
      intro: [
        "Фото с соревнований, незабываемая поза или движение, которое лучше всего передаёт характер спортсменки…",
        "Именная фигурка RNG SPORT создаётся специально по образу самой спортсменки. Поза, причёска, детали костюма и имя включаются в дизайн — получается фигурка, принадлежащая только ей.",
        "Фигурка с подставкой и именной табличкой становится памятью о соревнованиях, победах и спортивном пути, которую можно хранить годами.",
      ],
      sections: [
        {
          title: "Создаётся специально для тебя",
          body: ["Каждая фигурка персонализируется по фотографиям спортсменки."],
          bullets: [
            "Особые позы на выбор",
            "Причёска и характерные детали",
            "Купальник спортсменки",
            "Имя спортсменки",
            "Детали конкретного турнира",
          ],
        },
        {
          title: "Больше, чем фотография",
          body: [
            "Соревнования заканчиваются, фото остаются в архиве.",
            "А эта фигурка превращает тот период жизни спортсменки в объёмное воспоминание — в её комнате, на полке с кубками или на рабочем столе.",
          ],
        },
      ],
      meta: "Индивидуальное изготовление • 3D-дизайн • Именная табличка",
      comingSoonNote: "Именные фигурки RNG SPORT скоро станут доступны для заказа.",
    },
    "isikli-cimnastik-harfi": {
      name: "Именная светящаяся гимнастическая буква",
      tagline: "Первая буква твоего имени — твой мир гимнастики.",
      cardSummary: "Декоративная буква с подсветкой по инициалу имени, украшенная гимнастическими деталями.",
      imageAlt: "Именная светящаяся гимнастическая буква RNG Sport",
      intro: [
        "Декоративный дизайн по первой букве имени спортсменки, объединяющий фигуры гимнасток, личные детали и свет.",
        "Внутри каждой буквы создаётся маленькая гимнастическая сцена, рассказывающая о мире спортсменки. Предметы художественной гимнастики, фигурки гимнасток и именные детали превращают её не в стандартный декор, а в полностью личную вещь.",
        "Когда включается подсветка, детали внутри буквы оживают и создают особую атмосферу — особенно в комнате спортсменки.",
      ],
      sections: [
        {
          title: "У каждой буквы своя история",
          body: [
            "B — для Белинай, D — для Дефне, E — для Эйлюль…",
            "Но меняется не только буква.",
            "Каждый дизайн можно создать заново под имя спортсменки и её мир гимнастики.",
          ],
        },
        {
          title: "С гимнастическими деталями",
          body: ["В дизайне можно использовать разные гимнастические элементы:"],
          bullets: [
            "Мяч",
            "Обруч",
            "Лента",
            "Булавы",
            "Скакалка",
            "Фигурки гимнасток",
            "Звёзды и детали соревнований",
            "Имя спортсменки",
          ],
        },
        {
          title: "Днём — декор, ночью — свет",
          body: [
            "Встроенная подсветка делает детали видимыми и ночью, превращая декоративную букву в мягкий ночник.",
            "Днём — часть интерьера комнаты. Ночью — личная вещь, свет которой раскрывает детали дизайна.",
            "Создаётся для комнаты спортсменки, уголка с наградами или рабочего стола.",
          ],
        },
      ],
      meta: "Именная буква • Гимнастическая тема • Подсветка • Персонализация имени",
      comingSoonNote: "Светящаяся гимнастическая буква RNG SPORT скоро станет доступна для заказа.",
    },
  },
};

/** Ürünün o dildeki metinleri (Türkçe veya çevirisi olmayan dilde asıl metin) */
export const localizeProduct = (product: Product, lang: string): Product => {
  const text = lang === "en" || lang === "ru" ? TRANSLATIONS[lang][product.slug] : undefined;
  return text ? { ...product, ...text } : product;
};

/** "Satışa çıkınca haber ver" WhatsApp mesajı, sayfanın dilinde */
const NOTIFY_MESSAGES: Record<string, (name: string) => string> = {
  en: (name) => `Hello, could you let me know when "${name}" goes on sale?`,
  ru: (name) => `Здравствуйте, сообщите, пожалуйста, когда «${name}» поступит в продажу?`,
};

export const notifyMeUrlFor = (productName: string, lang: string) =>
  NOTIFY_MESSAGES[lang]
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(NOTIFY_MESSAGES[lang](productName))}`
    : notifyMeUrl(productName);
