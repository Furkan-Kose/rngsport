import { useCallback, useState } from "react";

// "Seç" modu durumu: müşteri galerisi ve ödül törenleri ortak (bkz. components/MediaSelection)
export const useMediaSelection = () => {
  const [active, setActive] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = useCallback(
    (id: string) =>
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    []
  );
  const selectMany = useCallback((ids: string[]) => setSelected(new Set(ids)), []);
  const clear = useCallback(() => setSelected(new Set()), []);
  const start = useCallback(() => setActive(true), []);
  const stop = useCallback(() => {
    setActive(false);
    setSelected(new Set());
  }, []);
  return { active, selected, toggle, selectMany, clear, start, stop };
};
