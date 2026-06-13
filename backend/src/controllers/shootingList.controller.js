import * as XLSX from "xlsx";
import prisma from "../lib/prisma.js";
import bus from "../lib/events.js";
import { AppError, rethrowPrismaError } from "../utils/errors.js";
import { parsePaginationQuery } from "../utils/pagination.js";
import { normalizeApparatus } from "../utils/apparatuses.js";
import { matchKey } from "../utils/names.js";

const NOT_FOUND = { notFound: "Kayıt bulunamadı" };
const VALID_ACTIONS = new Set(["start", "end", "reset"]);
const VALID_SORTS = new Set(["position", "expected", "started", "name"]);

// Türkçe karakter normalizasyonu + lowercase + boşluk temizleme
const normalizeKey = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/i̇/g, "i")
    .replace(/[\s_-]+/g, "")
    .trim();

// Excel başlık → kanonik alan eşleşmesi
const HEADER_ALIASES = {
  athleteName: ["sporcuadi", "adsoyad", "isim", "sporcuadsoyad", "ad", "athlete", "name"],
  clubName: ["kulup", "club", "kulubu", "kulupadi"],
  birthYear: ["dogumyili", "dogum", "yas", "year", "birthyear"],
  category: ["kategori", "category", "alet", "alan", "brans"],
  expectedTime: ["saat", "time", "beklenensaat", "tahminisaat", "cikissaati"],
  position: ["sira", "siralama", "no", "order", "position"],
};

const canonicalForHeader = (header) => {
  const norm = normalizeKey(header);
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(norm)) return field;
  }
  return null;
};

const formatEntry = (entry) => ({
  id: entry.id,
  position: entry.position,
  athleteName: entry.athleteName,
  clubName: entry.clubName,
  birthYear: entry.birthYear,
  category: entry.category,
  expectedTime: entry.expectedTime,
  willBeShot: entry.willBeShot,
  orderId: entry.orderId,
  reservationId: entry.reservationId,
  shootStartedAt: entry.shootStartedAt,
  shootEndedAt: entry.shootEndedAt,
  createdAt: entry.createdAt,
  customerPhone:
    entry.order?.customerPhone || entry.reservation?.customerPhone || null,
  notes: entry.order?.notes || entry.reservation?.notes || null,
  status: entry.order?.status || entry.reservation?.status || null,
  items:
    entry.order?.items?.map((it) => ({
      packageName: it.packageName,
      category: it.category,
      seriesCount: it.seriesCount,
      quantity: it.quantity,
      apparatuses: it.apparatuses,
    })) ||
    entry.reservation?.items?.map((it) => ({
      packageName: it.packageName,
      category: it.category,
      seriesCount: it.seriesCount,
      quantity: it.quantity,
      apparatuses: it.apparatuses,
    })) ||
    [],
});

// Composite key: "nameKey::apparatusKey" (sporcu adı + alet slug)
const compositeKey = (nameKey, apparatusKey) => `${nameKey}::${apparatusKey}`;

// Bir order/reservation listesinden composite key -> id haritası kur.
// Her record'un items dizisindeki her item'ın apparatuses'ı üzerinden döngü;
// her alet için ayrı bir map entry'si üretir.
const buildApparatusMap = (records) => {
  const map = new Map();
  for (const r of records) {
    const nameKey = matchKey(r.athleteName);
    for (const item of r.items ?? []) {
      for (const raw of item.apparatuses ?? []) {
        const appKey = normalizeApparatus(raw);
        if (appKey) map.set(compositeKey(nameKey, appKey), r.id);
      }
    }
  }
  return map;
};

// Mevcut ödenmiş sipariş ve onaylı/ödenmiş rezervasyonlardan (ad+alet) → id haritası kur
const fetchMatchMaps = async () => {
  const [orders, reservations] = await Promise.all([
    prisma.order.findMany({
      where: { status: "PAID" },
      select: {
        id: true,
        athleteName: true,
        items: { select: { apparatuses: true } },
      },
    }),
    prisma.reservation.findMany({
      where: { status: { in: ["PAID", "CONFIRMED"] } },
      select: {
        id: true,
        athleteName: true,
        items: { select: { apparatuses: true } },
      },
    }),
  ]);
  return {
    orderMap: buildApparatusMap(orders),
    resMap: buildApparatusMap(reservations),
  };
};

// Excel satırının (athleteName, category=alet) çiftine göre order/reservation eşleşmesi.
// Alet boşsa veya tanınmıyorsa eşleşme olmaz.
const computeMatch = (athleteName, category, orderMap, resMap) => {
  const appKey = normalizeApparatus(category);
  if (!appKey) {
    return { orderId: null, reservationId: null, willBeShot: false };
  }
  const key = compositeKey(matchKey(athleteName), appKey);
  const orderId = orderMap.get(key) || null;
  const reservationId = orderId ? null : resMap.get(key) || null;
  return { orderId, reservationId, willBeShot: Boolean(orderId || reservationId) };
};

// Çekim listesini güncel sipariş/rezervasyonlara göre yeniden eşleştir
const syncShootingListMatches = async () => {
  const entries = await prisma.shootingListEntry.findMany({
    select: {
      id: true,
      athleteName: true,
      category: true,
      willBeShot: true,
      orderId: true,
      reservationId: true,
    },
  });
  if (entries.length === 0) return;

  const { orderMap, resMap } = await fetchMatchMaps();

  const updates = [];
  for (const entry of entries) {
    const match = computeMatch(entry.athleteName, entry.category, orderMap, resMap);
    if (
      entry.orderId !== match.orderId ||
      entry.reservationId !== match.reservationId ||
      entry.willBeShot !== match.willBeShot
    ) {
      updates.push(
        prisma.shootingListEntry.update({ where: { id: entry.id }, data: match }),
      );
    }
  }

  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }
};

const buildOrderBy = (sortKey) => {
  if (sortKey === "name") return [{ athleteName: "asc" }];
  if (sortKey === "started")
    return [{ shootStartedAt: { sort: "asc", nulls: "last" } }, { position: "asc" }];
  if (sortKey === "expected")
    return [{ expectedTime: { sort: "asc", nulls: "last" } }, { position: "asc" }];
  return [{ position: "asc" }];
};

// Sekmeler için günleri ve her günün toplam kayıt sayısını döndür
const listDays = async () => {
  const days = await prisma.shootingDay.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { entries: true } } },
  });
  return days.map((d) => ({
    id: d.id,
    label: d.label,
    sortOrder: d.sortOrder,
    total: d._count.entries,
  }));
};

export const getShootingList = async (req, res) => {
  const { page, limit, skip, search } = parsePaginationQuery(req);
  const sortKey = VALID_SORTS.has(req.query.sort) ? req.query.sort : "position";

  // Her okumada güncel sipariş/rezervasyonlara göre eşleşmeleri tazele
  await syncShootingListMatches();

  const days = await listDays();

  // Aktif gün: query'deki dayId geçerliyse onu, değilse ilk günü kullan
  const requestedDayId = req.query.dayId ? String(req.query.dayId) : null;
  const activeDay =
    days.find((d) => d.id === requestedDayId) || days[0] || null;

  // Hiç gün yoksa boş yanıt
  if (!activeDay) {
    return res.json({
      days,
      activeDayId: null,
      data: [],
      pagination: { page: 1, limit, total: 0, totalPages: 1 },
      stats: { total: 0, willBeShot: 0, willNotBeShot: 0, pending: 0, inProgress: 0, done: 0 },
    });
  }

  const where = { dayId: activeDay.id };
  if (search) {
    where.AND = [
      {
        OR: [
          { athleteName: { contains: search, mode: "insensitive" } },
          { clubName: { contains: search, mode: "insensitive" } },
        ],
      },
    ];
  }

  const include = {
    order: { select: { customerPhone: true, notes: true, status: true, items: true } },
    reservation: { select: { customerPhone: true, notes: true, status: true, items: true } },
  };

  const [entries, total, willBeShotCount, inProgress, done] = await Promise.all([
    prisma.shootingListEntry.findMany({
      where,
      include,
      orderBy: buildOrderBy(sortKey),
      skip,
      take: limit,
    }),
    prisma.shootingListEntry.count({ where }),
    prisma.shootingListEntry.count({ where: { ...where, willBeShot: true } }),
    prisma.shootingListEntry.count({
      where: { ...where, shootStartedAt: { not: null }, shootEndedAt: null },
    }),
    prisma.shootingListEntry.count({
      where: { ...where, shootEndedAt: { not: null } },
    }),
  ]);

  const stats = {
    total,
    willBeShot: willBeShotCount,
    willNotBeShot: total - willBeShotCount,
    pending: total - inProgress - done,
    inProgress,
    done,
  };

  res.json({
    days,
    activeDayId: activeDay.id,
    data: entries.map(formatEntry),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    stats,
  });
};

// Dosya adı için güvenli slug: TR karakter sadeleştir, boşlukları tireye çevir
const slugify = (s) =>
  normalizeKey(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "liste";

// Excel sheet adı: 31 karakter sınırı + geçersiz karakterleri temizle
const safeSheetName = (label) =>
  String(label || "Liste")
    .replace(/[\\/?*[\]:]/g, " ")
    .trim()
    .slice(0, 31) || "Liste";

// Bir entry'yi (formatEntry çıktısı) Excel satırına (Türkçe başlıklı) dönüştür
const toExcelRow = (e) => ({
  "Sıra": e.position,
  "Sporcu Adı": e.athleteName || "",
  "Kulüp": e.clubName || "",
  "Doğum Yılı": e.birthYear || "",
  "Alet / Kategori": e.category || "",
  "Beklenen Saat": e.expectedTime || "",
  "Çekilecek mi": e.willBeShot ? "Evet" : "Hayır",
  "Telefon": e.customerPhone || "",
  "Paket / Seri": (e.items || [])
    .map((it) => `${it.packageName} (${it.seriesCount}×${it.quantity})`)
    .join(", "),
  "Not": e.notes || "",
});

// Aktif günün çekim listesini Excel olarak indir
export const exportShootingList = async (req, res) => {
  const dayId = req.query.dayId ? String(req.query.dayId) : null;
  if (!dayId) throw new AppError("Gün belirtilmedi", 400);

  const day = await prisma.shootingDay.findUnique({ where: { id: dayId } });
  if (!day) throw new AppError("Gün bulunamadı", 404);

  // İndirmeden önce eşleşmeleri güncelle (getShootingList ile aynı davranış)
  await syncShootingListMatches();

  const include = {
    order: { select: { customerPhone: true, notes: true, status: true, items: true } },
    reservation: { select: { customerPhone: true, notes: true, status: true, items: true } },
  };

  const entries = await prisma.shootingListEntry.findMany({
    where: { dayId },
    include,
    orderBy: buildOrderBy("position"),
  });

  const rows = entries.map((entry) => toExcelRow(formatEntry(entry)));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Sütun genişliklerini içeriğe (başlık + en uzun hücre) göre ayarla
  const headers = rows.length
    ? Object.keys(rows[0])
    : [
        "Sıra",
        "Sporcu Adı",
        "Kulüp",
        "Doğum Yılı",
        "Alet / Kategori",
        "Beklenen Saat",
        "Çekilecek mi",
        "Telefon",
        "Paket / Seri",
        "Not",
      ];
  worksheet["!cols"] = headers.map((header) => {
    const maxCell = rows.reduce(
      (max, row) => Math.max(max, String(row[header] ?? "").length),
      header.length,
    );
    // +2 nefes payı, 10–60 arası sınırla
    return { wch: Math.min(60, Math.max(10, maxCell + 2)) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName(day.label));
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="cekim-listesi-${slugify(day.label)}.xlsx"`,
  );
  res.send(buffer);
};

const buildUpdateData = (body) => {
  const { action, expectedTime, startedAt, endedAt } = body;

  if (action !== undefined && !VALID_ACTIONS.has(action)) {
    throw new AppError("Geçersiz işlem", 400);
  }

  const data = {};

  if (action === "start") {
    data.shootStartedAt = new Date();
  } else if (action === "end") {
    data.shootEndedAt = new Date();
  } else if (action === "reset") {
    data.shootStartedAt = null;
    data.shootEndedAt = null;
  }

  if (expectedTime !== undefined) {
    data.expectedTime = expectedTime
      ? String(expectedTime).trim().slice(0, 50)
      : null;
  }

  if (startedAt !== undefined) {
    if (startedAt === null || startedAt === "") {
      data.shootStartedAt = null;
    } else {
      const date = new Date(startedAt);
      if (Number.isNaN(date.getTime())) {
        throw new AppError("Geçersiz başlangıç saati", 400);
      }
      data.shootStartedAt = date;
    }
  }

  if (endedAt !== undefined) {
    if (endedAt === null || endedAt === "") {
      data.shootEndedAt = null;
    } else {
      const date = new Date(endedAt);
      if (Number.isNaN(date.getTime())) {
        throw new AppError("Geçersiz bitiş saati", 400);
      }
      data.shootEndedAt = date;
    }
  }

  if (Object.keys(data).length === 0) {
    throw new AppError("Güncellenecek alan yok", 400);
  }

  return data;
};

export const updateShootingEntry = async (req, res) => {
  const { id } = req.params;
  const data = buildUpdateData(req.body);

  const include = {
    order: { select: { customerPhone: true, notes: true, status: true, items: true } },
    reservation: { select: { customerPhone: true, notes: true, status: true, items: true } },
  };

  const record = await prisma.shootingListEntry
    .update({ where: { id }, data, include })
    .catch(rethrowPrismaError(NOT_FOUND));

  res.json({ message: "Güncellendi", entry: formatEntry(record) });
};

const parseExcelBuffer = (buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new AppError("Excel dosyasında sayfa bulunamadı", 400);
  }
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });

  const parsed = [];
  rows.forEach((row, idx) => {
    const entry = {};
    for (const [header, value] of Object.entries(row)) {
      const field = canonicalForHeader(header);
      if (!field) continue;
      const str = String(value ?? "").trim();
      if (!str) continue;
      entry[field] = str;
    }
    if (!entry.athleteName) return; // başlık satırı veya boş satır

    parsed.push({
      position: entry.position ? Number(entry.position) || idx + 1 : idx + 1,
      athleteName: entry.athleteName,
      clubName: entry.clubName || null,
      birthYear: entry.birthYear || null,
      category: entry.category || null,
      expectedTime: entry.expectedTime || null,
    });
  });

  return parsed;
};

export const uploadShootingList = async (req, res) => {
  if (!req.file) {
    throw new AppError("Excel dosyası gerekli", 400);
  }

  const dayId = req.body.dayId ? String(req.body.dayId) : null;
  const label = req.body.label ? String(req.body.label).trim().slice(0, 100) : "";

  // Mevcut bir güne yüklüyorsak o günü doğrula; yeni günse isim zorunlu
  let targetDay = null;
  if (dayId) {
    targetDay = await prisma.shootingDay.findUnique({ where: { id: dayId } });
    if (!targetDay) throw new AppError("Gün bulunamadı", 404);
  } else if (!label) {
    throw new AppError("Gün adı gerekli", 400);
  }

  const parsed = parseExcelBuffer(req.file.buffer);
  if (parsed.length === 0) {
    throw new AppError("Excel'de geçerli sporcu satırı bulunamadı", 400);
  }

  const { orderMap, resMap } = await fetchMatchMaps();

  const unmatched = [];
  const entries = parsed.map((row) => {
    const match = computeMatch(row.athleteName, row.category, orderMap, resMap);
    if (!match.willBeShot) unmatched.push({ name: row.athleteName, club: row.clubName });
    return { ...row, ...match };
  });

  // Mevcut güne yükleme → sadece o günün satırlarını değiştir (isteğe bağlı yeniden adlandır)
  // Yeni gün → yeni ShootingDay oluştur (sortOrder = mevcut max + 1)
  const resolvedDayId = await prisma.$transaction(async (tx) => {
    let id = targetDay?.id;
    if (id) {
      await tx.shootingListEntry.deleteMany({ where: { dayId: id } });
      if (label && label !== targetDay.label) {
        await tx.shootingDay.update({ where: { id }, data: { label } });
      }
    } else {
      const last = await tx.shootingDay.findFirst({ orderBy: { sortOrder: "desc" } });
      const created = await tx.shootingDay.create({
        data: { label, sortOrder: (last?.sortOrder ?? 0) + 1 },
      });
      id = created.id;
    }
    await tx.shootingListEntry.createMany({
      data: entries.map((e) => ({ ...e, dayId: id })),
    });
    return id;
  });

  const willBeShotCount = entries.filter((e) => e.willBeShot).length;
  res.json({
    message: "Liste yüklendi",
    dayId: resolvedDayId,
    summary: {
      total: entries.length,
      willBeShot: willBeShotCount,
      willNotBeShot: entries.length - willBeShotCount,
      unmatched,
    },
  });
};

// Bir günü (ve cascade ile tüm satırlarını) sil
export const clearShootingList = async (req, res) => {
  const dayId = req.query.dayId ? String(req.query.dayId) : null;
  if (!dayId) throw new AppError("Silinecek gün belirtilmedi", 400);

  await prisma.shootingDay
    .delete({ where: { id: dayId } })
    .catch(rethrowPrismaError({ notFound: "Gün bulunamadı" }));

  res.json({ message: "Gün silindi" });
};

// SSE stream: yeni sipariş/rezervasyon değişikliklerinde istemciyi tetikler
export const streamShootingList = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  // nginx vb. reverse proxy'lerin buffer'lamasını kapat
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  // İlk handshake mesajı — istemci bağlantının kurulduğunu bilir
  res.write(`event: ready\ndata: ${Date.now()}\n\n`);

  const onChange = () => {
    res.write(`event: refresh\ndata: ${Date.now()}\n\n`);
  };

  bus.on("shooting-list-changed", onChange);

  // Proxy idle timeout'larına karşı periyodik keepalive
  const ping = setInterval(() => {
    res.write(`event: ping\ndata: ${Date.now()}\n\n`);
  }, 25000);

  req.on("close", () => {
    clearInterval(ping);
    bus.off("shooting-list-changed", onChange);
  });
};
