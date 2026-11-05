import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

/**
 * Liste sayfalarının filtrelerini (sekme, arama, sayfa, sıralama, açık detay id'si) adres
 * çubuğunda tutar. Sayfa yenilense, link paylaşılsa ya da geri tuşuyla dönülse de kaybolmaz.
 *
 * Varsayılan değere eşit olan anahtar URL'den silinir (adres temiz kalsın).
 * Yazdıkça geçmişe kayıt eklenmesin diye her güncelleme `replace` ile yapılır.
 */
export const useUrlState = <T extends Record<string, string>>(defaults: T) => {
  const [params, setParams] = useSearchParams();
  // İlk render'daki varsayılanlar sabit tutulur (çağıran her render'da yeni nesne verse de)
  const [initial] = useState(defaults);

  const state = useMemo(() => {
    const result = { ...initial };
    for (const key of Object.keys(result) as (keyof T)[]) {
      const value = params.get(key as string);
      if (value !== null) result[key] = value as T[keyof T];
    }
    return result;
  }, [params, initial]);

  const update = useCallback(
    (patch: Partial<T>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value === undefined || value === null || value === '' || value === initial[key]) {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams, initial],
  );

  return [state, update] as const;
};
