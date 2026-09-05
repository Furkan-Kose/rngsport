import * as XLSX from "xlsx";
import prisma from "../lib/prisma.js";
import bus from "../lib/events.js";
import { AppError, rethrowPrismaError } from "../utils/errors.js";
import { parsePaginationQuery } from "../utils/pagination.js";
import { normalizeApparatus } from "../utils/apparatuses.js";
import { matchKey } from "../utils/names.js";
import {
  ROLES,
  TRACK_CATEGORIES,
  resolveTrack,
  trackFields,
} from "../utils/roles.js";

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

// Paket satırlarını ize göre süz: fotoğrafçı video paketini, videocu foto paketini görmez.
// track === "all" (admin) → filtre yok.
const mapItems = (items, track) => {
  const allowed = TRACK_CATEGORIES[track];
  return (items ?? [])
    .filter((it) => !allowed || allowed.includes(it.category))
    .map((it) => ({
      packageName: it.packageName,
      category: it.category,
      seriesCount: it.seriesCount,
      quantity: it.quantity,
      apparatuses: it.apparatuses,
    }));
};

const formatEntry = (entry, track = "all") => ({
  id: entry.id,
  position: entry.position,
  athleteName: entry.athleteName,
  clubName: entry.clubName,
  birthYear: entry.birthYear,
  category: entry.category,
  expectedTime: entry.expectedTime,
  // Seçili ize göre çözülmüş bayrak — client'ta ekstra hesap gerekmez
  willBeShot: entry[trackFields(track).willBeShot],
  willBeShotPhoto: entry.willBeShotPhoto,
  willBeShotVideo: entry.willBeShotVideo,
  orderId: entry.orderId,
  reservationId: entry.reservationId,
  photoStartedAt: entry.photoStartedAt,
  photoEndedAt: entry.photoEndedAt,
  videoStartedAt: entry.videoStartedAt,
  videoEndedAt: entry.videoEndedAt,
  createdAt: entry.createdAt,
  customerPhone:
    entry.order?.customerPhone || entry.reservation?.customerPhone || null,
  notes: entry.order?.notes || entry.reservation?.notes || null,
  status: entry.order?.status || entry.reservation?.status || null,
  items: mapItems(entry.order?.items ?? entry.reservation?.items, track),
});

// Composite key: "nameKey::apparatusKey" (sporcu adı + alet slug)
const compositeKey = (nameKey, apparatusKey) => `${nameKey}::${apparatusKey}`;

// Bir order/reservation listesinden composite key -> id haritası kur.
// Her record'un items dizisindeki her item'ın apparatuses'ı üzerinden döngü;
// her alet için ayrı bir map entry'si üretir.
// categories verilirse sadece o kategorideki paket satırları sayılır (iz bazlı eşleşme).
const buildApparatusMap = (records, categories = null) => {
  const map = new Map();
  for (const r of records) {
    const nameKey = matchKey(r.athleteName);
    for (const item of r.items ?? []) {
      if (categories && !categories.includes(item.category)) continue;
      for (const raw of item.apparatuses ?? []) {
        const appKey = normalizeApparatus(raw);
        if (appKey) map.set(compositeKey(nameKey, appKey), r.id);
      }
    }
  }
  return map;
};

// Mevcut ödenmiş sipariş ve onaylı/ödenmiş rezervasyonlardan (ad+alet) → id haritası kur.
// Tek sorgudan üç harita seti üretilir: hepsi / foto (photo+full) / video (video+full).
const fetchMatchMaps = async () => {
  const [orders, reservations] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: ["PAID", "DELIVERED"] } },
      select: {
        id: true,
        athleteName: true,
        items: { select: { apparatuses: true, category: true } },
      },
    }),
    prisma.reservation.findMany({
      where: { status: { in: ["PAID", "CONFIRMED", "DELIVERED"] } },
      select: {
        id: true,
        athleteName: true,
        items: { select: { apparatuses: true, category: true } },
      },
    }),
  ]);
  const pair = (categories) => ({
    orderMap: buildApparatusMap(orders, categories),
    resMap: buildApparatusMap(reservations, categories),
  });
  return {
    all: pair(null),
    photo: pair(TRACK_CATEGORIES.photo),
    video: pair(TRACK_CATEGORIES.video),
  };
};

const matchIds = (nameKey, appKey, { orderMap, resMap }) => {
  const key = compositeKey(nameKey, appKey);
  const orderId = orderMap.get(key) || null;
  const reservationId = orderId ? null : resMap.get(key) || null;
  return { orderId, reservationId };
};

const NO_MATCH = {
  orderId: null,
  reservationId: null,
  willBeShot: false,
  willBeShotPhoto: false,
  willBeShotVideo: false,
};

// Excel satırının (athleteName, category=alet) çiftine göre order/reservation eşleşmesi
// ve iz bayrakları. Alet boşsa veya tanınmıyorsa eşleşme olmaz.
const computeMatch = (athleteName, category, maps) => {
  const appKey = normalizeApparatus(category);
  if (!appKey) return { ...NO_MATCH };
  const nameKey = matchKey(athleteName);
  const all = matchIds(nameKey, appKey, maps.all);
  const photo = matchIds(nameKey, appKey, maps.photo);
  const video = matchIds(nameKey, appKey, maps.video);
  return {
    ...all,
    willBeShot: Boolean(all.orderId || all.reservationId),
    willBeShotPhoto: Boolean(photo.orderId || photo.reservationId),
    willBeShotVideo: Boolean(video.orderId || video.reservationId),
  };
};

const MATCH_FIELDS = Object.keys(NO_MATCH);

// Eşleşmeler yalnızca bir sipariş/rezervasyon değiştiğinde bayatlar. Veritabanı uzakta
// (her sorgu ~100-400 ms) olduğu için her okumada yeniden hesaplamak pahalı — bayrakla gidiyoruz.
// "shooting-list-refresh" (saat işlemleri) eşleşmeleri etkilemez, bu yüzden bayrağı kirletmez.
let matchesDirty = true;
bus.on("shooting-list-changed", () => {
  matchesDirty = true;
});

const syncMatchesIfNeeded = async () => {
  if (!matchesDirty) return;
  matchesDirty = false;
  try {
    await syncShootingListMatches();
  } catch (err) {
    matchesDirty = true; // başarısızsa bir sonraki okumada tekrar denensin
    throw err;
  }
};

// Çekim listesini güncel sipariş/rezervasyonlara göre yeniden eşleştir
const syncShootingListMatches = async () => {
  const entries = await prisma.shootingListEntry.findMany({
    select: {
      id: true,
      athleteName: true,
      category: true,
      willBeShot: true,
      willBeShotPhoto: true,
      willBeShotVideo: true,
      orderId: true,
      reservationId: true,
    },
  });
  if (entries.length === 0) return;

  const maps = await fetchMatchMaps();

  const updates = [];
  for (const entry of entries) {
    const match = computeMatch(entry.athleteName, entry.category, maps);
    if (MATCH_FIELDS.some((field) => entry[field] !== match[field])) {
      updates.push(
        prisma.shootingListEntry.update({ where: { id: entry.id }, data: match }),
      );
    }
  }

  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }
};

const buildOrderBy = (sortKey, track = "all") => {
  if (sortKey === "name") return [{ athleteName: "asc" }];
  if (sortKey === "started")
    return [
      { [trackFields(track).startedAt]: { sort: "asc", nulls: "last" } },
      { position: "asc" },
    ];
  if (sortKey === "expected")
    return [{ expectedTime: { sort: "asc", nulls: "last" } }, { position: "asc" }];
  return [{ position: "asc" }];
};

// İstatistik için gereken en dar kolon seti — tek sorguda çekilip JS'te sayılır.
// (Ayrı ayrı count atmak uzak veritabanında 5 gidiş-dönüş demekti, ~2,3 sn.)
const STAT_SELECT = {
  willBeShot: true,
  willBeShotPhoto: true,
  willBeShotVideo: true,
  photoStartedAt: true,
  photoEndedAt: true,
  videoStartedAt: true,
  videoEndedAt: true,
};

// Bir satırın seçili izdeki durumu. "all" iki izi birden kapsar: herhangi biri
// açıksa satır "çekiliyor", değilse herhangi biri bitmişse "tamamlandı" sayılır.
const trackProgress = (row, track) => {
  const forTrack = (t) => {
    const f = trackFields(t);
    const started = row[f.startedAt] !== null;
    const ended = row[f.endedAt] !== null;
    return { recording: started && !ended, ended };
  };
  if (track !== "all") return forTrack(track);
  const photo = forTrack("photo");
  const video = forTrack("video");
  return {
    recording: photo.recording || video.recording,
    ended: photo.ended || video.ended,
  };
};

const buildStats = (rows, track) => {
  const willBeShotField = trackFields(track).willBeShot;
  let willBeShot = 0;
  let inProgress = 0;
  let done = 0;

  for (const row of rows) {
    if (row[willBeShotField]) willBeShot += 1;
    const { recording, ended } = trackProgress(row, track);
    if (recording) inProgress += 1;
    else if (ended) done += 1;
  }

  const total = rows.length;
  return {
    total,
    willBeShot,
    willNotBeShot: total - willBeShot,
    pending: total - inProgress - done,
    inProgress,
    done,
  };
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
  // Personelde iz rolden gelir (query yok sayılır); admin ?track= ile seçer, varsayılan "all"
  const track = resolveTrack(req.user?.role, req.query.track);

  // Sipariş/rezervasyon değiştiyse eşleşmeleri tazele (bkz. matchesDirty)
  await syncMatchesIfNeeded();

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
      track,
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

  // Sayfa satırları + istatistik satırları: 6 ayrı count yerine tek ek sorgu
  const [entries, statRows] = await Promise.all([
    prisma.shootingListEntry.findMany({
      where,
      include,
      orderBy: buildOrderBy(sortKey, track),
      skip,
      take: limit,
    }),
    prisma.shootingListEntry.findMany({ where, select: STAT_SELECT }),
  ]);

  const stats = buildStats(statRows, track);
  const total = stats.total;

  res.json({
    days,
    activeDayId: activeDay.id,
    track,
    data: entries.map((entry) => formatEntry(entry, track)),
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

const excelTime = (value) =>
  value ? new Date(value).toLocaleString("tr-TR") : "";

// Bir entry'yi (formatEntry çıktısı) Excel satırına (Türkçe başlıklı) dönüştür.
// Her iki iz de ayrı sütunlarda raporlanır.
const toExcelRow = (e) => ({
  "Sıra": e.position,
  "Sporcu Adı": e.athleteName || "",
  "Kulüp": e.clubName || "",
  "Doğum Yılı": e.birthYear || "",
  "Alet / Kategori": e.category || "",
  "Beklenen Saat": e.expectedTime || "",
  "Çekilecek mi": e.willBeShot ? "Evet" : "Hayır",
  "Foto Çekilecek": e.willBeShotPhoto ? "Evet" : "Hayır",
  "Video Çekilecek": e.willBeShotVideo ? "Evet" : "Hayır",
  "Foto Başlangıç": excelTime(e.photoStartedAt),
  "Foto Bitiş": excelTime(e.photoEndedAt),
  "Video Başlangıç": excelTime(e.videoStartedAt),
  "Video Bitiş": excelTime(e.videoEndedAt),
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
  await syncMatchesIfNeeded();

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
  const headers = rows.length ? Object.keys(rows[0]) : Object.keys(toExcelRow({}));
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

// Zincir: yeni çekim başlarken aynı gün + aynı izdeki açık kayıt aynı anda kapanır.
// Sahada ayrı bir "durdur" hamlesi yok — sıradaki sporcuya basmak öncekini bitirir.
const closeOpenEntries = (tx, dayId, exceptId, track, now) => {
  const fields = trackFields(track);
  return tx.shootingListEntry.updateMany({
    where: {
      dayId,
      id: { not: exceptId },
      [fields.startedAt]: { not: null },
      [fields.endedAt]: null,
    },
    data: { [fields.endedAt]: now },
  });
};

// Saat alanları seçili izin kolonlarına yazılır; expectedTime sadece admin'e açık.
// now dışarıdan gelir: önceki kaydın bitişi ile yeni kaydın başlangıcı aynı timestamp olsun.
const buildUpdateData = (body, { isAdmin, track, now }) => {
  const { action, expectedTime, startedAt, endedAt } = body;

  if (action !== undefined && !VALID_ACTIONS.has(action)) {
    throw new AppError("Geçersiz işlem", 400);
  }

  const fields = trackFields(track);
  const data = {};

  if (action === "start") {
    data[fields.startedAt] = now;
    data[fields.endedAt] = null;
  } else if (action === "end") {
    data[fields.endedAt] = now;
  } else if (action === "reset") {
    data[fields.startedAt] = null;
    data[fields.endedAt] = null;
  }

  if (expectedTime !== undefined) {
    if (!isAdmin) {
      throw new AppError("Beklenen saati sadece yönetici değiştirebilir", 403);
    }
    data.expectedTime = expectedTime
      ? String(expectedTime).trim().slice(0, 50)
      : null;
  }

  const parseTime = (value, label) => {
    if (value === null || value === "") return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new AppError(`Geçersiz ${label} saati`, 400);
    }
    return date;
  };

  if (startedAt !== undefined) {
    data[fields.startedAt] = parseTime(startedAt, "başlangıç");
  }

  if (endedAt !== undefined) {
    data[fields.endedAt] = parseTime(endedAt, "bitiş");
  }

  if (Object.keys(data).length === 0) {
    throw new AppError("Güncellenecek alan yok", 400);
  }

  return data;
};

export const updateShootingEntry = async (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user?.role === ROLES.ADMIN;
  // Personelde iz rolden zorlanır; admin gövdede foto/video belirtmek zorunda
  const track = resolveTrack(req.user?.role, req.body?.track);
  if (track === "all") {
    throw new AppError("Güncelleme için iz (foto/video) belirtilmeli", 400);
  }
  const now = new Date();
  const data = buildUpdateData(req.body, { isAdmin, track, now });

  const include = {
    order: { select: { customerPhone: true, notes: true, status: true, items: true } },
    reservation: { select: { customerPhone: true, notes: true, status: true, items: true } },
  };

  // "start" iki satırı birden değiştirir (öncekini kapatır) → tek transaction.
  // dayId'yi ayrıca okumuyoruz: güncellenen kayıttan geliyor, böylece bir tur daha az.
  const record = await prisma
    .$transaction(async (tx) => {
      const updated = await tx.shootingListEntry.update({ where: { id }, data, include });
      if (req.body?.action === "start") {
        await closeOpenEntries(tx, updated.dayId, id, track, now);
      }
      return updated;
    })
    .catch(rethrowPrismaError(NOT_FOUND));

  // Zincir başka satırı da değiştirmiş olabilir → açık ekranlar SSE ile tazelensin.
  // Eşleşmeleri etkilemediği için "changed" değil "refresh" yayınlıyoruz (matchesDirty kirlenmesin).
  // clientId: işlemi yapan istemci kendi yankısını yok sayabilsin diye.
  bus.emit("shooting-list-refresh", req.body?.clientId ?? "");

  res.json({ message: "Güncellendi", entry: formatEntry(record, track) });
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

  const maps = await fetchMatchMaps();

  const unmatched = [];
  const entries = parsed.map((row) => {
    const match = computeMatch(row.athleteName, row.category, maps);
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

  // data = değişikliği tetikleyen istemcinin id'si (varsa); istemci kendi yankısını atlar
  const onChange = (originId = "") => {
    res.write(`event: refresh\ndata: ${originId}\n\n`);
  };

  bus.on("shooting-list-changed", onChange);
  bus.on("shooting-list-refresh", onChange);

  // Proxy idle timeout'larına karşı periyodik keepalive
  const ping = setInterval(() => {
    res.write(`event: ping\ndata: ${Date.now()}\n\n`);
  }, 25000);

  req.on("close", () => {
    clearInterval(ping);
    bus.off("shooting-list-changed", onChange);
    bus.off("shooting-list-refresh", onChange);
  });
};
