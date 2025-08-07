import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { sendMail } from '../utils/emailService.js';
import { success, error } from '../utils/apiResponse.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { validateRegistration, validateLogin, validateRefreshToken } from '../validators/authValidation.js';

const prisma = new PrismaClient();

//Register
export async function register(req, res) {
  const { name, email, password, confirmPassword, plan = "free" } = req.body;

  const validationErrors = validateRegistration({ name, email, password, confirmPassword });
  if (validationErrors.length > 0) {
    return error(res, "Validation failed", 400, validationErrors);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return error(res, "Validation failed", 400, [
      { field: "email", message: "Email already exists" }
    ]);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      plan,
    },
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return success(res, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.created_at,
      plan: user.plan,
    },
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: 3600,
    },
  }, "User registered successfully", 201);
}

//Login 
export async function login(req, res) {
  const { email, password } = req.body;

  const validationErrors = validateLogin({ email, password });
  if (validationErrors.length > 0) {
    return error(res, "Validation failed", 400, validationErrors);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return error(res, "Invalid email or password", 400);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return success(res, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      membershipType: user.membershipType || "free",
      createdAt: user.created_at,
    },
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: 3600,
    }
  }, "Login successful");
}

//Refresh Token 
export async function refresh(req, res) {
  const { refreshToken } = req.body;

  const validationErrors = validateRefreshToken({ refreshToken });
  if (validationErrors.length > 0) {
    return error(res, "Validation failed", 400, validationErrors);
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId, email: decoded.email } });

    if (!user) {
      return error(res, "Invalid token", 401);
    }

    const accessToken = generateAccessToken(user);

    return success(res, {
      accessToken,
      expiresIn: 3600
    }, "Access token refreshed");
  } catch (err) {
    return error(res, "Invalid or expired refresh token", 401);
  }
}

//forgotPassword
export async function forgotPassword(req, res) {
  const { email } = req.body;

  if (!email) {
    return error(res, "Validation failed", 400, [
      { field: "email", message: "Email is required" }
    ]);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return error(res, "User not found", 404);
  }

  const token = crypto.randomBytes(32).toString('hex');
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.upsert({
    where: { user_id: user.id },
    update: { token: otp, expires_at: expires },
    create: { user_id: user.id, token: otp, expires_at: expires }
  });
  
  await sendMail(
    user.name,
    email,
    'Reset Your Password',
    `Your password reset OTP is: <strong>${otp}</strong>. It will expire in 10 minutes.`,
    null
  );

  return success(res, null, "Password reset link sent to email");
}

// Reset Password 
export async function resetPassword(req, res) {
  const { email, otp, newPassword, confirmPassword } = req.body;

  const errors = [];
  if (!email) errors.push({ field: "email", message: "Email is required" });
  if (!otp) errors.push({ field: "otp", message: "OTP is required" });
  if (!newPassword) errors.push({ field: "password", message: "Password is required" });
  if (!confirmPassword) errors.push({ field: "confirmPassword", message: "Confirm password is required" });
  if (newPassword !== confirmPassword) errors.push({ field: "confirmPassword", message: "Passwords do not match" });

  if (errors.length > 0) {
    return error(res, "Validation failed", 400, errors);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return error(res, "User not found", 404);
  }

  const record = await prisma.passwordResetToken.findUnique({ where: { user_id: user.id } });

  if (!record || record.token !== otp || record.expires_at < new Date()) {
    return error(res, "Invalid or expired OTP", 400);
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
  await prisma.passwordResetToken.delete({ where: { user_id: user.id } });

  return success(res, null, "Password has been reset successfully");
}

