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
