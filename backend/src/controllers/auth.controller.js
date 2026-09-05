import prisma from "../lib/prisma.js";
import generateToken, { cookieOptions } from "../utils/generateToken.js";
import bcrypt from "bcryptjs";
import { validateEmail, validatePhone } from "../utils/validators.js";
import { createEmailToken, hashEmailToken } from "../utils/emailTokens.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../lib/mail.js";

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 saat
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 saat

const publicUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  name: user.name,
  role: user.role,
  emailVerified: !!user.emailVerifiedAt,
});

// Yeni doğrulama token'ı üretir, kullanıcıya yazar ve maili gönderir (fire-and-forget)
const issueVerificationEmail = async (user) => {
  const { raw, hash } = createEmailToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      verifyTokenHash: hash,
      verifyTokenExpiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
    },
  });
  sendVerificationEmail(user.email, user.name, raw);
};

export const login = async (req, res) => {
  try {
    // identifier: e-posta (müşteri) veya kullanıcı adı (admin). Eski client'lar için username/email de kabul edilir.
    const identifier = req.body.identifier || req.body.username || req.body.email;
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'E-posta/kullanıcı adı ve şifre gerekli'
      });
    }

    const id = String(identifier).trim();
    const user = id.includes('@')
      ? await prisma.user.findUnique({ where: { email: id.toLowerCase() } })
      : await prisma.user.findUnique({ where: { username: id } });

    // Hesap var/yok bilgisini sızdırmamak için tek generic mesaj
    const isPasswordMatch = user ? await bcrypt.compare(password, user.password) : false;
    if (!user || !isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'E-posta/kullanıcı adı veya şifre hatalı'
      });
    }

    generateToken(res, user);

    res.status(200).json({ success: true, user: publicUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Ad soyad, e-posta ve şifre gerekli'
      });
    }

    const trimmedName = String(name).trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Ad soyad 2-100 karakter arasında olmalı'
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Şifre en az 8 karakter olmalı'
      });
    }

    const normalizedEmail = validateEmail(email); // trim + lowercase, geçersizse AppError(400)
    const normalizedPhone = phone ? validatePhone(phone) : null;

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const user = await prisma.user.create({
      data: {
        name: trimmedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        password: hashedPassword,
        role: 'customer',
      },
    });

    generateToken(res, user);

    // Doğrulama maili — başarısız olsa bile kayıt tamamlanmış sayılır
    await issueVerificationEmail(user).catch((err) =>
      console.error("Verification email error:", err)
    );

    res.status(201).json({ success: true, user: publicUser(user) });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Bu e-posta ile kayıtlı bir hesap var'
      });
    }
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, email: true, name: true, phone: true, role: true, emailVerifiedAt: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      user: { ...publicUser(user), phone: user.phone }
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};


export const logout = async (req, res) => {
    res.clearCookie('token', cookieOptions);

    res.status(200).json({
        success: true,
        message: "User logged out successfully",
    });
};

// E-posta doğrulama: linkteki ham token hash'lenip DB'deki hash ile eşleştirilir
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: 'Doğrulama bağlantısı geçersiz' });
    }

    const user = await prisma.user.findFirst({
      where: {
        verifyTokenHash: hashEmailToken(token),
        verifyTokenExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Doğrulama bağlantısı geçersiz veya süresi dolmuş'
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        verifyTokenHash: null,
        verifyTokenExpiresAt: null,
      },
    });

    res.status(200).json({ success: true, message: 'E-posta adresiniz doğrulandı' });
  } catch (error) {
    console.error('VerifyEmail error:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Girişli kullanıcı için doğrulama mailini yeniden gönder
export const resendVerification = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user || !user.email) {
      return res.status(400).json({ success: false, message: 'Hesabınızda e-posta adresi yok' });
    }
    if (user.emailVerifiedAt) {
      return res.status(400).json({ success: false, message: 'E-posta adresiniz zaten doğrulanmış' });
    }

    await issueVerificationEmail(user);

    res.status(200).json({ success: true, message: 'Doğrulama maili gönderildi' });
  } catch (error) {
    console.error('ResendVerification error:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Şifremi unuttum: hesap var/yok bilgisi sızdırılmaz — her durumda aynı yanıt
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const genericResponse = {
      success: true,
      message: 'Bu e-posta kayıtlıysa şifre sıfırlama bağlantısı gönderildi',
    };

    if (!email || typeof email !== 'string') {
      return res.status(200).json(genericResponse);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (user) {
      const { raw, hash } = createEmailToken();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetTokenHash: hash,
          resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });
      sendPasswordResetEmail(user.email, user.name, raw);
    }

    res.status(200).json(genericResponse);
  } catch (error) {
    console.error('ForgotPassword error:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Şifre sıfırlama: token tek kullanımlık, 1 saat geçerli
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: 'Sıfırlama bağlantısı geçersiz' });
    }
    if (!password || String(password).length < 8) {
      return res.status(400).json({ success: false, message: 'Şifre en az 8 karakter olmalı' });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetTokenHash: hashEmailToken(token),
        resetTokenExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Sıfırlama bağlantısı geçersiz veya süresi dolmuş'
      });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        // Sıfırlama linki maile gittiği için e-posta sahipliği kanıtlanmış oldu
        ...(user.emailVerifiedAt ? {} : { emailVerifiedAt: new Date() }),
      },
    });

    res.status(200).json({ success: true, message: 'Şifreniz güncellendi, giriş yapabilirsiniz' });
  } catch (error) {
    console.error('ResetPassword error:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Profilden şifre değiştirme (girişli, mevcut şifre doğrulanır)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Mevcut ve yeni şifre gerekli' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ success: false, message: 'Yeni şifre en az 8 karakter olmalı' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }

    const isMatch = await bcrypt.compare(String(currentPassword), user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mevcut şifreniz hatalı' });
    }

    const hashedPassword = await bcrypt.hash(String(newPassword), 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.status(200).json({ success: true, message: 'Şifreniz güncellendi' });
  } catch (error) {
    console.error('ChangePassword error:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};
