// modules/auth/auth.service.js
import bcrypt from 'bcrypt';
import { User, OTP, Session, OTPType } from './auth.model.js';
import { generateOTP, generateSecureToken } from './auth.utils.js';
import { addEmailJob } from '../../bullMQ/queues/emailQueue.js';
import { otpTemplate, resetPasswordTemplate } from '../../bullMQ/utils/emailTemplate.js';
import { generateAccessTokenForSession } from './auth.jwt.js';
import { AppError, ErrorCode } from '../../errors/AppError.js';
import { logger } from '../../config/Logger.js';
import crypto from 'crypto';

// ─── Constants ───────────────────────────────────────────────────────────────

const BCRYPT_ROUNDS = 12;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 min
const OTP_COOLDOWN_MS = 60 * 1000; // 1 min between resends
const OTP_MAX_ATTEMPTS = 5;
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_SESSIONS_PER_USER = 5;
const LOGIN_LOCK_ATTEMPTS = 10;
const LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000; // 15 min
const RESET_TOKEN_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// ─── Types ───────────────────────────────────────────────────────────────────

interface SessionMeta {
  userAgent?: string;
  ip?: string;
}

// ─── Token helpers (sessionId prefix for O(1) lookup) ────────────────────────

const TOKEN_SEPARATOR = '.';

export function buildToken(sessionId: string, secret: string): string {
  return `${sessionId}${TOKEN_SEPARATOR}${secret}`;
}

export function splitToken(token: string): [string, string] {
  if (!token) return ['', ''];
  const idx = token.indexOf(TOKEN_SEPARATOR);
  if (idx === -1) return ['', ''];
  return [token.slice(0, idx), token.slice(idx + 1)];
}

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerUser = async (payload: { email: string; password: string }) => {
  const { email, password } = payload;

  const existingUser = await User.findOne({ email });
  if (existingUser?.isVerified) {
    throw new AppError('User already exists', 409, ErrorCode.USER_EXISTS);
  }

  await assertOtpCooldown(email, 'REGISTER');

  const [hashedPassword, otp] = await Promise.all([
    bcrypt.hash(password, BCRYPT_ROUNDS),
    Promise.resolve(generateOTP()),
  ]);

  const hashedOtp = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await User.findOneAndUpdate(
    { email },
    { email, password: hashedPassword, isVerified: false },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await OTP.deleteMany({ email, type: 'REGISTER' });

  await Promise.all([
    OTP.create({ email, otp: hashedOtp, type: 'REGISTER', expiresAt }),
    addEmailJob({ to: email, subject: 'Verify your account', html: otpTemplate(otp) }),
  ]);

  logger.info({ email }, 'Registration initiated — OTP sent');
  return { email };
};

// ─── Verify OTP ──────────────────────────────────────────────────────────────

export const verifyOTP = async (payload: { email: string; otp: string }) => {
  const { email, otp } = payload;

  const otpDoc = await OTP.findOne({ email, type: 'REGISTER' }).select('+otp');
  if (!otpDoc) {
    throw new AppError('OTP not found or expired', 400, ErrorCode.OTP_NOT_FOUND);
  }

  await assertOtpValid(otpDoc, otp);

  const user = await User.findOneAndUpdate({ email }, { isVerified: true }, { new: true });
  if (!user) {
    throw new AppError('User not found', 404, ErrorCode.USER_NOT_FOUND);
  }

  await OTP.deleteOne({ _id: otpDoc._id });

  logger.info({ email }, 'Email verified successfully');
  return { id: user._id, email: user.email, isVerified: user.isVerified };
};

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginUser = async (email: string, password: string, meta: SessionMeta = {}) => {
  const user = await User.findOne({ email }).select('+password +failedLoginAttempts +lockedUntil');

  if (!user) {
    await bcrypt.hash(password, BCRYPT_ROUNDS);
    throw new AppError('Invalid credentials', 401, ErrorCode.INVALID_CREDENTIALS);
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const retryAfterSec = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
    throw new AppError(
      `Account temporarily locked. Try again in ${Math.ceil(retryAfterSec / 60)} minute(s).`,
      429,
      ErrorCode.INVALID_CREDENTIALS,
    );
  }

  if (!user.isVerified) {
    throw new AppError(
      'Please verify your account before logging in',
      403,
      ErrorCode.ACCOUNT_NOT_VERIFIED,
    );
  }

  const isMatch = await bcrypt.compare(password, user.password ?? '');

  if (!isMatch) {
    const attempts = user.failedLoginAttempts + 1;
    const shouldLock = attempts >= LOGIN_LOCK_ATTEMPTS;
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          failedLoginAttempts: shouldLock ? 0 : attempts,
          ...(shouldLock && { lockedUntil: new Date(Date.now() + LOGIN_LOCK_DURATION_MS) }),
        },
      },
    );
    logger.warn({ email, attempts }, 'Failed login attempt');
    throw new AppError('Invalid credentials', 401, ErrorCode.INVALID_CREDENTIALS);
  }

  await User.updateOne({ _id: user._id }, { $set: { failedLoginAttempts: 0, lockedUntil: null } });

  const sessionCount = await Session.countDocuments({ userId: user._id });
  if (sessionCount >= MAX_SESSIONS_PER_USER) {
    const oldest = await Session.find({ userId: user._id })
      .sort({ lastUsedAt: 1 })
      .limit(sessionCount - MAX_SESSIONS_PER_USER + 1)
      .select('_id');
    await Session.deleteMany({ _id: { $in: oldest.map((s) => s._id) } });
    logger.info({ userId: user._id }, 'Pruned oldest sessions due to session cap');
  }

  const refreshToken = generateSecureToken();
  const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);

  const session = await Session.create({
    userId: user._id,
    refreshTokenHash,
    userAgent: meta.userAgent,
    ip: meta.ip,
    expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS),
    lastUsedAt: new Date(),
  });

  const accessToken = generateAccessTokenForSession(
    user._id.toString(),
    user.role,
    session._id.toString(),
  );

  logger.info({ userId: user._id, sessionId: session._id }, 'User logged in');
  const tokenWithId = buildToken(session._id.toString(), refreshToken);
  
  return { accessToken, refreshToken: tokenWithId };
};

// ─── Refresh Token ────────────────────────────────────────────────────────────

export const refreshTokenService = async (oldToken: string) => {
  console.log('🔄 Processing refresh token...');
  
  const [sessionId, secret] = splitToken(oldToken);
  console.log('📝 Session ID:', sessionId);
  console.log('🔑 Secret length:', secret?.length || 0);

  if (!sessionId || !secret) {
    console.log('❌ Invalid refresh token format');
    throw new AppError('Invalid refresh token format', 401, ErrorCode.TOKEN_INVALID);
  }

  const session = await Session.findById(sessionId).select('+refreshTokenHash');
  if (!session || session.expiresAt < new Date()) {
    logger.warn({ sessionId }, 'Refresh token reuse attempt or session not found');
    throw new AppError('Session not found or expired', 401, ErrorCode.SESSION_NOT_FOUND);
  }

  const isValid = await bcrypt.compare(secret, session.refreshTokenHash);
  if (!isValid) {
    logger.warn(
      { sessionId, userId: session.userId },
      'Refresh token hash mismatch — possible replay attack',
    );
    await Session.deleteOne({ _id: session._id });
    throw new AppError('Invalid refresh token', 401, ErrorCode.TOKEN_INVALID);
  }

  const user = await User.findById(session.userId);
  if (!user) {
    await Session.deleteOne({ _id: session._id });
    throw new AppError('User not found', 401, ErrorCode.USER_NOT_FOUND);
  }

  const newRefreshToken = generateSecureToken();
  const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, BCRYPT_ROUNDS);

  await Session.updateOne(
    { _id: session._id },
    {
      refreshTokenHash: newRefreshTokenHash,
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS),
    },
  );

  const newAccessToken = generateAccessTokenForSession(
    user._id.toString(),
    user.role,
    session._id.toString(),
  );

  const newTokenWithId = buildToken(session._id.toString(), newRefreshToken);

  logger.info({ userId: user._id, sessionId: session._id }, 'Token refreshed');
  return { newAccessToken, newRefreshToken: newTokenWithId };
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logoutService = async (refreshToken: string) => {
  const [sessionId] = splitToken(refreshToken);
  if (sessionId) {
    await Session.deleteOne({ _id: sessionId });
    logger.info({ sessionId }, 'Session deleted on logout');
  }
};

export const logoutAllService = async (userId: string) => {
  const result = await Session.deleteMany({ userId });
  logger.info({ userId, deleted: result.deletedCount }, 'All sessions terminated');
};

// ─── Forgot Password ──────────────────────────────────────────────────────────

export const forgotPassword = async (email: string) => {
  const SAFE_RESPONSE = {
    message: 'If that email is registered, a reset link has been sent.',
  };

  const user = await User.findOne({ email });
  if (!user) return SAFE_RESPONSE;

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = await bcrypt.hash(rawToken, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  await OTP.deleteMany({ email, type: 'RESET_PASSWORD' });

  await OTP.create({
    email,
    otp: hashedToken,
    type: 'RESET_PASSWORD',
    expiresAt,
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}&email=${email}`;

  await addEmailJob({
    to: email,
    subject: 'Reset your password',
    html: resetPasswordTemplate(resetUrl),
  });

  logger.info({ email }, 'Password reset link sent');
  return SAFE_RESPONSE;
};

// ─── Reset Password ───────────────────────────────────────────────────────────

export const resetPassword = async (payload: { resetUrl: string; newPassword: string }) => {
  const { resetUrl, newPassword } = payload;

  try {
    const url = new URL(resetUrl);
    const token = url.searchParams.get('token');
    const email = url.searchParams.get('email');

    if (!token || !email) {
      throw new AppError('Invalid reset link', 400, ErrorCode.BAD_REQUEST);
    }

    const record = await OTP.findOne({
      email,
      type: 'RESET_PASSWORD',
    }).select('+otp');

    if (!record) {
      throw new AppError('Invalid or expired reset link', 400, ErrorCode.TOKEN_INVALID);
    }

    if (record.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: record._id });
      throw new AppError('Reset link expired', 400, ErrorCode.TOKEN_EXPIRED);
    }

    const isValid = await bcrypt.compare(token, record.otp);
    if (!isValid) {
      throw new AppError('Invalid reset token', 400, ErrorCode.TOKEN_INVALID);
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    const user = await User.findOneAndUpdate({ email }, { password: hashedPassword });

    if (!user) {
      throw new AppError('User not found', 404, ErrorCode.USER_NOT_FOUND);
    }

    await Promise.all([
      OTP.deleteOne({ _id: record._id }),
      Session.deleteMany({ userId: user._id }),
    ]);

    logger.info({ email }, 'Password reset successful via link');
    return {
      message: 'Password reset successful. Please log in again.',
    };
  } catch (err: any) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError('Something went wrong during password reset', 500, ErrorCode.INTERNAL);
  }
};

// ─── Change Password (authenticated) ─────────────────────────────────────────

export const changePassword = async (payload: {
  userId: string;
  sessionId: string;
  currentPassword: string;
  newPassword: string;
}) => {
  const { userId, sessionId, currentPassword, newPassword } = payload;

  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError('User not found', 404, ErrorCode.USER_NOT_FOUND);
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password ?? '');
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 401, ErrorCode.INVALID_CREDENTIALS);
  }

  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await User.updateOne({ _id: userId }, { password: hashedPassword });
  await Session.deleteMany({ userId, _id: { $ne: sessionId } });

  logger.info({ userId }, 'Password changed — other sessions invalidated');
  return { message: 'Password changed successfully.' };
};

// ─── Get active sessions ──────────────────────────────────────────────────────

export const getActiveSessions = async (userId: string) => {
  const sessions = await Session.find({ userId, expiresAt: { $gt: new Date() } })
    .select('_id userAgent ip lastUsedAt createdAt')
    .sort({ lastUsedAt: -1 });

  return sessions.map((s) => ({
    id: s._id,
    userAgent: s.userAgent,
    ip: s.ip,
    lastUsedAt: s.lastUsedAt,
    createdAt: s.createdAt,
  }));
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────

export const resendOtp = async (email: string, type: OTPType) => {
  await assertOtpCooldown(email, type);

  if (type === 'REGISTER') {
    const user = await User.findOne({ email });
    if (!user || user.isVerified) {
      return { message: 'If applicable, a new OTP has been sent.' };
    }
  }

  const otp = generateOTP();
  const hashedOtp = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await OTP.deleteMany({ email, type });
  await Promise.all([
    OTP.create({ email, otp: hashedOtp, type, expiresAt }),
    addEmailJob({
      to: email,
      subject: type === 'REGISTER' ? 'Verify your account' : 'Reset your password',
      html: otpTemplate(otp),
    }),
  ]);

  logger.info({ email, type }, 'OTP resent');
  return { message: 'If applicable, a new OTP has been sent.' };
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function assertOtpCooldown(email: string, type: OTPType) {
  const recent = await OTP.findOne({
    email,
    type,
    createdAt: { $gt: new Date(Date.now() - OTP_COOLDOWN_MS) },
  });
  if (recent) {
    throw new AppError(
      'Please wait 60 seconds before requesting a new OTP',
      429,
      ErrorCode.OTP_COOLDOWN,
    );
  }
}

async function assertOtpValid(
  otpDoc: { _id: any; otp: string; expiresAt: Date; attempts: number },
  providedOtp: string,
) {
  if (otpDoc.expiresAt < new Date()) {
    await OTP.deleteOne({ _id: otpDoc._id });
    throw new AppError('OTP expired', 400, ErrorCode.OTP_EXPIRED);
  }

  if (otpDoc.attempts >= OTP_MAX_ATTEMPTS) {
    await OTP.deleteOne({ _id: otpDoc._id });
    throw new AppError(
      'Too many failed attempts. Request a new OTP.',
      429,
      ErrorCode.OTP_MAX_ATTEMPTS,
    );
  }

  const isMatch = await bcrypt.compare(providedOtp, otpDoc.otp);
  if (!isMatch) {
    await OTP.updateOne({ _id: otpDoc._id }, { $inc: { attempts: 1 } });
    throw new AppError('Invalid OTP', 400, ErrorCode.OTP_INVALID);
  }
}