import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const packages = [
  {
    slug: "photo-basic",
    category: "photo",
    name: "Foto Basic",
    price: 2400,
    image: "/packages/10.webp",
    features: [
      "1 Seri Çekimi (1 Alet / 1 Performans)",
      "Tüm çekilen fotoğraflar teslim edilir",
      "Edit / renk düzenleme yok",
      "2 kamera (2 açı) ile eş zamanlı çekim",
      "Teslim: 3–7 gün",
    ],
    discount2: 4320,
    discount3: 6480,
    // Rezervasyon fiyatları (elden nakit için)
    reservationPrice: 2000,
    reservationDiscount2: 3600,
    reservationDiscount3: 5400,
    sortOrder: 10,
  },
  {
    slug: "photo-standard",
    category: "photo",
    name: "Foto Standart",
    price: 3360,
    image: "/packages/11.webp",
    features: [
      "1 Seri Çekimi",
      "40+ seçilmiş fotoğraf",
      "Profesyonel renk & kontrast düzenleme",
      "Temel kadraj temizliği",
      "2 kamera (2 açı) yedekli çekim",
      "Teslim: 10–25 gün",
    ],
    discount2: 6240,
    discount3: 9360,
    // Rezervasyon fiyatları (elden nakit için)
    reservationPrice: 2800,
    reservationDiscount2: 5200,
    reservationDiscount3: 7800,
    sortOrder: 11,
  },
  {
    slug: "video-full",
    category: "video",
    name: "Video Full",
    price: 2400,
    image: "/packages/20.webp",
    features: [
      "1 seri tam rutin video",
      "2 kamera (2 açı)",
      "Temel renk düzenleme",
      "Teslim: 10–25 gün",
    ],
    discount2: 4320,
    discount3: 6480,
    // Rezervasyon fiyatları (elden nakit için)
    reservationPrice: 2000,
    reservationDiscount2: 3600,
    reservationDiscount3: 5400,
    sortOrder: 20,
  },
  {
    slug: "video-reels",
    category: "video",
    name: "Video Reels (30 sn)",
    price: 3000,
    image: "/packages/21.webp",
    features: [
      "30 sn Reels (9:16)",
      "Dinamik kurgu",
      "Renk düzenleme + cut edit",
      "Instagram / TikTok uyumlu",
    ],
    discount2: 5520,
    discount3: 8280,
    // Rezervasyon fiyatları (elden nakit için)
    reservationPrice: 2500,
    reservationDiscount2: 4600,
    reservationDiscount3: 6900,
    sortOrder: 21,
  },
  {
    slug: "full-event",
    category: "full",
    name: "Full Event Pack",
    price: 8160,
    image: "/packages/1.webp",
    features: [
      "Foto Standart (40+ editli foto)",
      "Video Full (Tam rutin)",
      "Video Reels (30 sn / 9:16)",
      "2 kamera / 2 açı yedekli çekim",
    ],
    discount2: 14640,
    discount3: 22080,
    // Rezervasyon fiyatları (elden nakit için)
    reservationPrice: 6800,
    reservationDiscount2: 12200,
    reservationDiscount3: 18400,
    sortOrder: 1, // En üstte göster
  },
];

async function main() {
  console.log("Seeding packages...");

  for (const pkg of packages) {
    await prisma.package.upsert({
      where: { slug: pkg.slug },
      update: pkg,
      create: pkg,
    });
    console.log(`  ✓ ${pkg.name}`);
  }

  // Admin kullanıcı oluştur
  console.log("\nSeeding admin user...");
  const hashedPassword = await bcrypt.hash("admin", 10);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
      role: "admin",
    },
  });
  console.log("  ✓ Admin user created");

  console.log("\nSeeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
