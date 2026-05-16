import { AppError } from "../utils/errors.js";

// Global hata middleware'i. AppError ise mesajı + status'u döner; aksi halde
// 500 ile generic mesaj döner. Express 5 reject olan async handler'ları
// otomatik buraya iletir.
export const errorHandler = (error, req, res, next) => {
  if (error?.isAppError || error instanceof AppError) {
    return res.status(error.status).json({ message: error.message });
  }

  console.error(error);
  res.status(500).json({ message: "Sunucu hatası" });
};
