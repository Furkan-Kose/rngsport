// Beklenen, kullanıcıya gösterilebilir hata. Status kodu ile fırlatılır,
// global error middleware tarafından yakalanır ve mesajı response olarak döner.
export class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
    this.isAppError = true;
  }
}

// Prisma hata kodlarını kullanıcı dostu AppError'a çevirir.
// Kullanım: .catch(rethrowPrismaError({ notFound: 'X bulunamadı' }))
export const rethrowPrismaError = (messages = {}) => (error) => {
  if (error.code === "P2025") {
    throw new AppError(messages.notFound || "Kayıt bulunamadı", 404);
  }
  if (error.code === "P2002") {
    throw new AppError(messages.duplicate || "Bu kayıt zaten mevcut", 400);
  }
  throw error;
};
