// GET /api/reservations/my yanıtı — profil listesi ve rezervasyon düzenleme formu ortak

export interface MyReservationItem {
  package: { id: string; name: string; category: string };
  seriesCount: number;
  quantity: number;
  price: number;
  apparatuses: string[];
  priority?: boolean;
}

export interface MyReservation {
  id: string;
  athleteName: string;
  clubName: string;
  birthYear: string;
  customerPhone: string;
  customerEmail: string;
  notes: string | null;
  subtotal: number | null;
  discountPercent: number;
  discountAmount: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  items: MyReservationItem[];
}

// Backend'deki kuralların aynısı (reservation.controller.js):
// tek rezervasyon kuralında sayılanlar / müşterinin düzenleyip silebildikleri
export const ACTIVE_RESERVATION_STATUSES = ["PENDING", "CONFIRMED", "PAID", "DELIVERED"];
export const CUSTOMER_EDITABLE_STATUSES = ["PENDING", "CONFIRMED"];

export const isCustomerEditable = (status: string) =>
  CUSTOMER_EDITABLE_STATUSES.includes(status);
