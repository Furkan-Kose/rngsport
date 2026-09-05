import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { ROLES } from '../utils/roles.js';

export const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Yetkilendirme gerekli' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // role, rol alanı eklenmeden önce kesilmiş tokenlarda undefined olabilir
    req.user = { id: decoded.userId, role: decoded.role };
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token geçersiz' });
  }
};

// authMiddleware'den SONRA kullanılır. Eski (role içermeyen) tokenlar için DB fallback.
export const requireRoles =
  (...roles) =>
  async (req, res, next) => {
    try {
      let role = req.user.role;
      if (role === undefined) {
        const user = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { role: true },
        });
        role = user?.role;
      }
      if (!roles.includes(role)) {
        return res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok' });
      }
      req.user.role = role;
      next();
    } catch (err) {
      next(err);
    }
  };

export const requireAdmin = requireRoles(ROLES.ADMIN);

// Token varsa çözer, yoksa/geçersizse misafir olarak devam eder — asla 401 dönmez.
// Misafir sipariş/rezervasyon akışını bozmadan girişli kullanıcıyı bağlamak için.
export const optionalAuth = (req, _res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.userId, role: decoded.role };
    } catch {
      // geçersiz/süresi dolmuş token → misafir
    }
  }
  next();
};
