/**
 * Rezervasyon ve sepet formlarının ortak müşteri alanları.
 *
 * İki sayfa da aynı altı alanı gönderiyor ve aynı ön-doldurma mantığını
 * kullanıyor; kopyalanmış kalmasın diye tek yerde toplandı.
 */
export interface CustomerForm {
  athleteName: string;
  clubName: string;
  birthYear: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
}

/** Profil bilgisi olmayan (misafir) kullanıcı için boş form */
export const emptyCustomerForm: CustomerForm = {
  athleteName: '',
  clubName: '',
  birthYear: '',
  customerPhone: '',
  customerEmail: '',
  notes: '',
};

interface ProfileSource {
  name?: string | null;
  clubName?: string | null;
  birthYear?: string | null;
  phone?: string | null;
  email?: string | null;
}

/**
 * Girişli kullanıcının profilinden başlangıç değerleri.
 * Alanlar yine düzenlenebilir: tek hesabı paylaşan veli ikinci çocuğu için
 * sporcu adını değiştirebilmeli.
 */
export const customerFormFromUser = (user: ProfileSource | null): CustomerForm => ({
  ...emptyCustomerForm,
  athleteName: user?.name ?? '',
  clubName: user?.clubName ?? '',
  birthYear: user?.birthYear ?? '',
  customerPhone: user?.phone ?? '',
  customerEmail: user?.email ?? '',
});

/**
 * Boş alanları profilden doldurur, kullanıcının YAZDIĞI değeri asla ezmez.
 * `notes` profilden gelmez, olduğu gibi korunur.
 */
export const fillCustomerFormGaps = (
  prev: CustomerForm,
  user: ProfileSource | null,
): CustomerForm => {
  const fromUser = customerFormFromUser(user);
  return {
    ...prev,
    athleteName: prev.athleteName || fromUser.athleteName,
    clubName: prev.clubName || fromUser.clubName,
    birthYear: prev.birthYear || fromUser.birthYear,
    customerPhone: prev.customerPhone || fromUser.customerPhone,
    customerEmail: prev.customerEmail || fromUser.customerEmail,
  };
};

export type CustomerFormErrors = Partial<Record<keyof CustomerForm, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Alan bazlı doğrulama: her hatalı alan için çevrilmiş mesaj döner (boş nesne = geçerli).
 * Yalnızca biçim denetimi; asıl doğrulama sunucuda.
 */
export const validateCustomerForm = (
  form: CustomerForm,
  t: (key: string) => string,
): CustomerFormErrors => {
  const errors: CustomerFormErrors = {};
  const e = (key: string) => t(`checkout.form.errors.${key}`);

  if (!form.athleteName.trim()) errors.athleteName = e("athleteName");
  if (!form.clubName.trim()) errors.clubName = e("clubName");

  const year = form.birthYear.trim();
  if (!year) errors.birthYear = e("birthYear");
  else if (!/^\d{4}$/.test(year) || Number(year) < 1950 || Number(year) > new Date().getFullYear())
    errors.birthYear = e("birthYearInvalid");

  const phone = form.customerPhone.trim();
  if (!phone) errors.customerPhone = e("phone");
  else if (phone.replace(/\D/g, "").length < 10) errors.customerPhone = e("phoneInvalid");

  const email = form.customerEmail.trim();
  if (!email) errors.customerEmail = e("email");
  else if (!EMAIL_RE.test(email)) errors.customerEmail = e("emailInvalid");

  return errors;
};

/** İlk hatalı alana kaydırır ve odaklar (alan id'si: `${idPrefix}-${alan}`) */
export const focusFirstError = (errors: CustomerFormErrors, idPrefix: string) => {
  const first = Object.keys(errors)[0];
  if (!first) return;
  const el = document.getElementById(`${idPrefix}-${first}`);
  el?.scrollIntoView({ block: "center", behavior: "smooth" });
  el?.focus({ preventScroll: true });
};
