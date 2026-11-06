import prisma from "../lib/prisma.js";

/**
 * GET /sitemap.xml — site haritası veritabanından üretilir.
 * Ödül törenleri ve satıştaki ürünler eklendikçe kendiliğinden güncellenir; elle tutulan
 * public/sitemap.xml eskiyordu. Netlify `/sitemap.xml` isteğini buraya proxy'ler (client/public/_redirects).
 *
 * Her sayfa üç dilde ayrı <url> olarak yazılır ve hreflang alternatifleriyle birbirine bağlanır
 * (Türkçe öneksiz, /en/..., /ru/...; slug'lar Türkçe kalır). Giriş gerektiren, kişisel ya da
 * işlem sayfaları (sepet, profil, galerim, ödeme sonucu, paylaşım linki) bilerek yoktur.
 */

const SITE = "https://rngsport.com";
const LANGS = ["tr", "en", "ru"];
const CACHE_SECONDS = 60 * 60; // 1 saat: arama motoru sık çekse de veritabanı yorulmasın

// Sabit herkese açık sayfalar: [yol, güncelleme sıklığı, öncelik]
const STATIC_PAGES = [
  ["", "weekly", "1.0"],
  ["paketler", "weekly", "0.9"],
  ["rezervasyon", "weekly", "0.9"],
  ["odul-torenleri", "weekly", "0.8"],
  ["urunler", "weekly", "0.8"],
  ["galeri", "monthly", "0.7"],
  ["hakkimizda", "monthly", "0.6"],
  ["kvkk-aydinlatma-metni", "yearly", "0.3"],
  ["gizlilik-ve-guvenlik-politikasi", "yearly", "0.3"],
  ["mesafeli-satis-sozlesmesi", "yearly", "0.3"],
  ["iptal-ve-iade-kosullari", "yearly", "0.3"],
];

// Emekliye ayrılan ürünler (client/src/data/products.ts RETIRED_SLUGS ile aynı)
const RETIRED_PRODUCT_SLUGS = new Set(["isikli-cimnastik-harfi"]);

const urlFor = (lang, path) => {
  const prefix = lang === "tr" ? "" : `/${lang}`;
  if (!path) return `${SITE}${prefix || "/"}`;
  return `${SITE}${prefix}/${path}`;
};

const escapeXml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const day = (date) => (date ? new Date(date).toISOString().slice(0, 10) : null);

const entry = ({ path, lastmod, changefreq, priority }) =>
  LANGS.map((lang) => {
    const alternates = [
      ...LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${escapeXml(urlFor(l, path))}"/>`),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(urlFor("tr", path))}"/>`,
    ].join("\n");
    return [
      "  <url>",
      `    <loc>${escapeXml(urlFor(lang, path))}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      alternates,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n");
  }).join("\n");

export const getSitemap = async (req, res) => {
  const [ceremonies, products, latestPackage, latestTournament] = await Promise.all([
    prisma.awardCeremony.findMany({ select: { slug: true, updatedAt: true }, orderBy: { sortOrder: "asc" } }),
    prisma.shopProduct.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.package.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    prisma.tournament.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
  ]);

  const visibleProducts = products.filter((p) => !RETIRED_PRODUCT_SLUGS.has(p.slug));
  const newest = (...dates) => day(dates.filter(Boolean).sort((a, b) => b - a)[0]);

  // Liste sayfalarının tarihi, içindeki en yeni kaydın tarihi
  const dynamicLastmod = {
    "": newest(latestPackage?.updatedAt, latestTournament?.updatedAt, ...ceremonies.map((c) => c.updatedAt)),
    paketler: day(latestPackage?.updatedAt),
    rezervasyon: day(latestPackage?.updatedAt),
    "odul-torenleri": newest(...ceremonies.map((c) => c.updatedAt)),
    urunler: newest(...visibleProducts.map((p) => p.updatedAt)),
  };

  const urls = [
    ...STATIC_PAGES.map(([path, changefreq, priority]) =>
      entry({ path, changefreq, priority, lastmod: dynamicLastmod[path] ?? null }),
    ),
    ...visibleProducts.map((p) =>
      entry({ path: `urunler/${p.slug}`, changefreq: "monthly", priority: "0.7", lastmod: day(p.updatedAt) }),
    ),
    ...ceremonies.map((c) =>
      entry({ path: `odul-torenleri/${c.slug}`, changefreq: "monthly", priority: "0.6", lastmod: day(c.updatedAt) }),
    ),
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");

  res.set("Content-Type", "application/xml; charset=utf-8");
  res.set("Cache-Control", `public, max-age=${CACHE_SECONDS}`);
  res.send(xml);
};
