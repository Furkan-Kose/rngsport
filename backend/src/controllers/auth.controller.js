import prisma from "../lib/prisma.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Kullanıcı adı ve şifre gerekli' 
      });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json({
        success: false, 
        message: 'Kullanıcı bulunamadı' 
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false, 
        message: 'Kullanıcı adı veya şifre hatalı' 
      });
    }

    generateToken(res, user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
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
      select: { id: true, username: true, role: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      user
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
    res.clearCookie('token', {
        httpOnly: true,
        secure: true, // Development için false, production'da true olmalı
        sameSite: 'none', // Localhost için Lax yeterli
    });

    res.status(200).json({
        success: true,
        message: "User logged out successfully",
    });
};