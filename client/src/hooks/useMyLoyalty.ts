import { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../lib/roles";
import type { LoyaltySummary } from "../lib/loyalty";

// Girişli müşterinin puan özeti; misafir/admin için null.
// Hata sessizce null'a düşer — puan kartı/indirim satırı görünmez, form çalışmaya devam eder.
export const useMyLoyalty = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const isCustomer = user?.role === ROLES.CUSTOMER;

  useEffect(() => {
    if (!isCustomer) return;
    let cancelled = false;
    api
      .get("/api/loyalty/me")
      .then(({ data }) => {
        if (!cancelled) setSummary(data);
      })
      .catch((error) => console.error("Puan bilgisi yüklenemedi:", error));
    return () => {
      cancelled = true;
    };
  }, [isCustomer]);

  return isCustomer ? summary : null;
};
