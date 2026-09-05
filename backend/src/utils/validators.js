import { AppError } from "./errors.js";

const PHONE_REGEX = /^[0-9\s\+\-()]{10,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-z0-9._-]{3,30}$/;

// Personel kullanıcı adı — lowercase'e normalize edilir (login'de birebir aranıyor)
export const validateUsername = (value) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!USERNAME_REGEX.test(normalized)) {
    throw new AppError(
      "Kullanıcı adı 3-30 karakter olmalı; sadece küçük harf, rakam, nokta, tire ve alt çizgi",
      400,
    );
  }
  return normalized;
};

// register akışıyla aynı kural (en az 8 karakter)
export const validatePassword = (value) => {
  const password = String(value ?? "");
  if (password.length < 8) {
    throw new AppError("Şifre en az 8 karakter olmalı", 400);
  }
  return password;
};

export const validateFullName = (value) => {
  const trimmed = String(value ?? "").trim();
  if (trimmed.length < 2 || trimmed.length > 100) {
    throw new AppError("Ad soyad 2-100 karakter arasında olmalı", 400);
  }
  return trimmed;
};

const validateAthleteName = (value) => {
  const trimmed = String(value).trim();
  if (trimmed.length < 2 || trimmed.length > 100) {
    throw new AppError("Sporcu adı 2-100 karakter arasında olmalı", 400);
  }
  return trimmed;
};

const validateClubName = (value) => {
  const trimmed = String(value).trim();
  if (trimmed.length < 2 || trimmed.length > 100) {
    throw new AppError("Kulüp adı 2-100 karakter arasında olmalı", 400);
  }
  return trimmed;
};

export const validatePhone = (value) => {
  const trimmed = String(value).trim();
  if (!PHONE_REGEX.test(trimmed)) {
    throw new AppError("Geçersiz telefon numarası", 400);
  }
  return trimmed;
};

export const validateEmail = (value) => {
  const trimmed = String(value).trim().toLowerCase();
  if (!EMAIL_REGEX.test(trimmed) || trimmed.length > 100) {
    throw new AppError("Geçersiz e-posta adresi", 400);
  }
  return trimmed;
};

const sanitizeBirthYear = (value) => String(value).trim().slice(0, 20);

export const sanitizeNotes = (value) =>
  value ? String(value).trim().slice(0, 500) : null;

// Create akışı için: tüm zorunlu alanları doğrular, normalize edilmiş veriyi döner.
export const validateRequiredCustomerInfo = (input) => {
  const { athleteName, clubName, birthYear, customerPhone, customerEmail } = input;
  if (!athleteName || !clubName || !birthYear || !customerPhone || !customerEmail) {
    throw new AppError("Tüm zorunlu alanları doldurun", 400);
  }
  return {
    athleteName: validateAthleteName(athleteName),
    clubName: validateClubName(clubName),
    birthYear: sanitizeBirthYear(birthYear),
    customerPhone: validatePhone(customerPhone),
    customerEmail: validateEmail(customerEmail),
  };
};

// Update akışı için: gönderilen alanları doğrular, undefined'ları atlar.
// data objesine (Prisma update payload) yazılabilecek formatta döner.
export const buildPartialCustomerUpdate = (input) => {
  const data = {};
  if (input.athleteName !== undefined) data.athleteName = validateAthleteName(input.athleteName);
  if (input.clubName !== undefined) data.clubName = validateClubName(input.clubName);
  if (input.birthYear !== undefined) data.birthYear = sanitizeBirthYear(input.birthYear);
  if (input.customerPhone !== undefined) data.customerPhone = validatePhone(input.customerPhone);
  if (input.customerEmail !== undefined) data.customerEmail = validateEmail(input.customerEmail);
  if (input.notes !== undefined) data.notes = sanitizeNotes(input.notes);
  return data;
};
