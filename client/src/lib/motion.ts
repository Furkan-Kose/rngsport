/**
 * Müşteri sitesindeki hareketin tek kaynağı. Yeni bir animasyon yazarken süreyi ve
 * eğriyi buradan al; sayfalara elle süre/eğri yazma — site her yerde aynı hızda
 * hareket etsin.
 *
 * Kullanılan yerler:
 *  - Reveal (kaydırınca beliren bölüm ve kartlar)      → REVEAL
 *  - MainLayout sayfa girişi (yalnızca opaklık)        → PAGE
 *  - Hero'nun sıralı girişi, SSS aç/kapa               → EASE + süreler
 * Pencereler (Modal, lightbox) CSS ile: index.css `animate-dialog-in`.
 * "Hareketi azalt" ayarı MainLayout'taki MotionConfig ile hepsini kapatır.
 */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Kaydırınca belirme: 16px aşağıdan, 0.45 sn */
export const REVEAL = { y: 16, duration: 0.45 };

/** Kart ızgaralarında kartlar arası gecikme (sn) ve üst sınırı */
export const STAGGER = 0.05;
export const MAX_DELAY = 0.2;

/** Sayfa girişi: kısa bir belirme. Kaydırma (transform) bilerek yok — sayfadaki
    sabit çubuklar (sepet özeti, seçim çubuğu) transform altında yerinden oynar. */
export const PAGE = { duration: 0.3 };

/** Aç/kapa (SSS cevabı) */
export const COLLAPSE = { duration: 0.3 };
