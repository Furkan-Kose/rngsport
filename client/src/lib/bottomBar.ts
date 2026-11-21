import { useEffect } from "react";

/**
 * Ekranın altında sabit bir çubuk gösteren bileşenler bunu çağırır; WhatsApp düğmesi
 * çubuğun üstüne kayar (index.css: body[data-bottom-bar] .wp-float). Sayaç tutulur,
 * çünkü aynı anda birden fazla çubuk açık olabilir.
 */
let count = 0;

export const useBottomBar = (active: boolean) => {
  useEffect(() => {
    if (!active) return;
    count += 1;
    document.body.dataset.bottomBar = "1";
    return () => {
      count -= 1;
      if (count === 0) delete document.body.dataset.bottomBar;
    };
  }, [active]);
};
