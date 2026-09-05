import jwt from 'jsonwebtoken';

const isProd = process.env.NODE_ENV === 'production';

// Prod: Netlify frontend + ayrı API host → cross-site cookie (secure + none) şart.
// Dev: localhost:5173 → localhost:3001 same-site sayılır, lax yeterli (http'de secure cookie set edilemez).
export const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
};

const generateToken = (res, user) => {
  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  res.cookie('token', token, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

export default generateToken;
