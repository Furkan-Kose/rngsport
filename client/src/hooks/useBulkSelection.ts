import { useCallback, useState } from 'react';

/**
 * Liste sayfalarında "Seç (toplu işlem)" modu: seçili id'ler sayfa değişse de korunur.
 * Paket Siparişleri ve Rezervasyonlar kullanır.
 */
export const useBulkSelection = () => {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback(
    (id: string) =>
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    [],
  );

  /** Verilen id'lerin hepsi seçiliyse çıkarır, değilse ekler (sayfanın tümü kutusu) */
  const toggleAll = useCallback(
    (ids: string[]) =>
      setSelectedIds((prev) => {
        const next = new Set(prev);
        const allOn = ids.length > 0 && ids.every((id) => next.has(id));
        for (const id of ids) {
          if (allOn) next.delete(id);
          else next.add(id);
        }
        return next;
      }),
    [],
  );

  const clear = useCallback(() => setSelectedIds(new Set()), []);
  const exit = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  return { selectMode, setSelectMode, selectedIds, toggle, toggleAll, clear, exit };
};
