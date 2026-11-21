import { toast } from 'react-toastify';

/** Sunucunun döndürdüğü mesaj (varsa) */
export const serverMessage = (err: unknown): string | undefined =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

/**
 * Başarısız bir işlemi kullanıcıya bildirir (ve konsola yazar).
 * Panelde hiçbir hata yalnızca konsolda kalmamalı: kullanıcı işlemin olmadığını
 * görmezse kaydın değiştiğini sanar.
 */
export const notifyError = (err: unknown, fallback: string) => {
  console.error(fallback, err);
  toast.error(serverMessage(err) || fallback);
};
