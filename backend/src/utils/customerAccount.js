import prisma from "../lib/prisma.js";
import { ROLES } from "./roles.js";
import { createEmailToken } from "./emailTokens.js";

// Şifre belirleme linkinin ömrü. Normal "şifremi unuttum" 1 saat, ama bu token
// bir işlem mailiyle gidiyor — müşteri mailini ertesi gün açabilir.
const SET_PASSWORD_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 gün

// Başarı ekranından şifre belirleme hakkı. Yetkiyi sipariş/rezervasyon cuid'i
// kanıtlıyor (bilinçli public capability URL), bu yüzden süresiz olamaz:
// cuid'i sonradan ele geçiren biri sahipsiz hesabı kapatmasın. Süre dolarsa
// "şifremi unuttum" akışı zaten çalışıyor.
export const CLAIM_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 saat

/**
 * Bir sipariş/rezervasyon kaydı için şifre belirleme durumunu hesaplar.
 * record: { userId, createdAt, user: { role, password } | null }
 *   claimable — kart gösterilir
 *   linked    — hesap şifreli; "giriş yap" gösterilir
 *   expired   — 24 saat geçmiş; "şifremi unuttum" gösterilir
 *   none      — bağlı müşteri hesabı yok
 */
export const claimStatusFor = (record) => {
  if (!record?.userId || !record.user || record.user.role !== ROLES.CUSTOMER) {
    return "none";
  }
  if (record.user.password !== null) return "linked";
  const age = Date.now() - new Date(record.createdAt).getTime();
  return age > CLAIM_WINDOW_MS ? "expired" : "claimable";
};

/**
 * Sipariş/rezervasyon veren misafir için teslimat hesabını hazırlar.
 *
 * Galeri tamamen User'a bağlı (GalleryPhoto.userId NOT NULL), bu yüzden hesabı
 * olmayan müşteriye fotoğraf teslim etmenin yolu yok. Çözüm: create anında
 * customerEmail'den ŞİFRESİZ bir müşteri hesabı açıp kaydı ona bağlamak.
 * Müşteri şifresini başarı ekranından (claim-account) veya mailindeki linkten belirler.
 *
 * status:
 *   claimable — hesap yeni açıldı ya da hâlâ şifresiz; şifre belirletilebilir
 *   linked    — şifreli bir hesap zaten var; kayıt bağlanır ama şifre SORULMAZ
 *               (yoksa başkasının e-postasını yazan kişi o hesabı ele geçirirdi)
 *   none      — e-posta admin/personel hesabına ait; hiçbir şey bağlanmaz
 */
export const findOrCreateCustomerByEmail = async ({ email, name, clubName, birthYear, phone }) => {
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, password: true },
  });

  if (existing) {
    if (existing.role !== ROLES.CUSTOMER) {
      return { userId: null, status: "none" };
    }
    // Mevcut hesabın name/phone'u bilinçli olarak EZİLMEZ.
    return {
      userId: existing.id,
      status: existing.password === null ? "claimable" : "linked",
    };
  }

  try {
    const created = await prisma.user.create({
      // Sporcu bilgileri siparişten kopyalanır: bir sonraki rezervasyonda form
      // ön-dolu gelsin. name = athleteName; R2 klasörü users/{isim-slug}_{id}/
      // olduğu için admin panelinde de aranabilir bir isim olur.
      data: { email, name, clubName, birthYear, phone, password: null, role: ROLES.CUSTOMER },
      select: { id: true },
    });
    return { userId: created.id, status: "claimable" };
  } catch (error) {
    // Eşzamanlı iki istek aynı e-postayla geldiyse unique ihlali olur; kazananı bul.
    if (error.code === "P2002") {
      const winner = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true, password: true },
      });
      if (winner && winner.role === ROLES.CUSTOMER) {
        return {
          userId: winner.id,
          status: winner.password === null ? "claimable" : "linked",
        };
      }
      return { userId: null, status: "none" };
    }
    throw error;
  }
};

/**
 * createOrder/createReservation için sarmalayıcı.
 * Hesap açma adımı HİÇBİR koşulda siparişi düşürmemeli — yarışma alanında canlı
 * kullanılan bir akış. Hata olursa loglanır ve bugünkü davranışa (userId: null)
 * geri düşülür; lib/mail.js'teki sendSafe felsefesinin aynısı.
 */
export const resolveGuestAccount = async (customer) => {
  try {
    return await findOrCreateCustomerByEmail({
      email: customer.customerEmail,
      name: customer.athleteName,
      clubName: customer.clubName,
      birthYear: customer.birthYear,
      phone: customer.customerPhone,
    });
  } catch (error) {
    console.error("[customerAccount] Otomatik hesap açılamadı:", error);
    return { userId: null, status: "none" };
  }
};

/**
 * Şifresiz hesap için "şifreni belirle" token'ı üretir. Mevcut şifre sıfırlama
 * altyapısını (resetTokenHash + /sifre-sifirla?token=) yeniden kullanır; tek fark
 * daha uzun TTL. Başarılı sıfırlama e-postayı da doğrulanmış sayıyor.
 * Hata durumunda null döner — mail yine gider, sadece butonsuz.
 */
export const issueSetPasswordToken = async (userId) => {
  if (!userId) return null;
  try {
    const { raw, hash } = createEmailToken();
    await prisma.user.update({
      where: { id: userId },
      data: {
        resetTokenHash: hash,
        resetTokenExpiresAt: new Date(Date.now() + SET_PASSWORD_TTL_MS),
      },
    });
    return raw;
  } catch (error) {
    console.error("[customerAccount] Şifre belirleme token'ı üretilemedi:", error);
    return null;
  }
};

/**
 * Teslimat/ödeme maillerinde kullanılacak şifre belirleme token'ı.
 * Hesap yoksa ya da şifresi zaten varsa null döner — mail butonsuz gider.
 */
export const issueSetPasswordTokenIfUnclaimed = async (userId) => {
  if (!userId) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, password: true },
    });
    if (!user || user.role !== ROLES.CUSTOMER || user.password !== null) return null;
    return await issueSetPasswordToken(userId);
  } catch (error) {
    console.error("[customerAccount] Şifre durumu okunamadı:", error);
    return null;
  }
};

/**
 * Girişli kullanıcı rezervasyon/sipariş verdiğinde profildeki BOŞ sporcu alanlarını
 * formdan doldurur. Dolu olanı asla ezmez (findOrCreateCustomerByEmail'deki kuralın
 * aynısı) — veli iki çocuk için sipariş verebilir, profildeki isim kaymasın.
 *
 * Bu değişiklikten önce açılmış hesapların kulüp/doğum yılı boş; bu yardımcı
 * sayesinde ilk rezervasyondan sonra form ön-doldurması kendiliğinden çalışır.
 *
 * Fire-and-forget: hata siparişi düşürmemeli, sadece loglanır.
 */
export const syncProfileGaps = async (userId, customer) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true, clubName: true, birthYear: true, phone: true },
    });
    if (!user || user.role !== ROLES.CUSTOMER) return;

    const data = {};
    if (!user.name && customer.athleteName) data.name = customer.athleteName;
    if (!user.clubName && customer.clubName) data.clubName = customer.clubName;
    if (!user.birthYear && customer.birthYear) data.birthYear = customer.birthYear;
    if (!user.phone && customer.customerPhone) data.phone = customer.customerPhone;

    if (Object.keys(data).length === 0) return;
    await prisma.user.update({ where: { id: userId }, data });
  } catch (error) {
    console.error("[customerAccount] Profil boşlukları doldurulamadı:", error);
  }
};
