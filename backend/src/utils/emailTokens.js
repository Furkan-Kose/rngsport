import crypto from "node:crypto";

// DB'ye asla ham token yazılmaz — sadece sha256 hash'i saklanır.
export const hashEmailToken = (raw) =>
  crypto.createHash("sha256").update(raw).digest("hex");

export const createEmailToken = () => {
  const raw = crypto.randomBytes(32).toString("hex");
  return { raw, hash: hashEmailToken(raw) };
};
