// modules/auth/auth.controller.js
import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
import { buildToken } from './auth.service.js';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import { UserService } from '../user/user.service.js';

// ─── Cookie options ───────────────────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';
const accessCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  maxAge: 15 * 60 * 1000, // 15 min
  path: '/',
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

const clearCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
};

const userService = new UserService();

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for the OTP.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────
export const verifyOtpController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await authService.verifyOTP(req.body);
    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────
export const resendOtpController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, type } = req.body;
    const result = await authService.resendOtp(email, type);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    console.log('=== Login Controller ===');
    console.log('📧 Email:', req.body?.email);
    console.log('🔑 Password:', req.body?.password ? '***' : 'undefined');

    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
        received: { email: !!email, password: !!password },
      });
      return;
    }

    const { accessToken, refreshToken } = await authService.loginUser(email, password, {
      userAgent: req.headers['user-agent'],
      ip: req.ip ?? req.socket?.remoteAddress,
    });

    console.log('✅ Login successful for:', email);
    console.log('🍪 Setting cookies...');

    res.cookie('accessToken', accessToken, accessCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        accessToken, // Return token in body for client storage
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Refresh ──────────────────────────────────────────────────────────────────
export const refreshController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    console.log('🔄 Refresh request received');
    console.log('🍪 Cookies received:', req.cookies);

    const token = req.cookies?.refreshToken as string | undefined;
    
    if (!token) {
      console.log('❌ No refresh token in cookies');
      res.status(401).json({
        success: false,
        code: 'TOKEN_INVALID',
        message: 'No refresh token provided',
      });
      return;
    }

    console.log('✅ Refresh token found, processing...');
    const { newAccessToken, newRefreshToken } = await authService.refreshTokenService(token);
    
    res.cookie('accessToken', newAccessToken, accessCookieOptions);
    res.cookie('refreshToken', newRefreshToken, refreshCookieOptions);
    
    console.log('✅ Tokens refreshed successfully');
    res.status(200).json({
      success: true,
      message: 'Tokens refreshed',
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    console.error('❌ Refresh error:', error);
    next(error);
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logoutController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken as string | undefined;
    if (token) {
      await authService.logoutService(token);
    }
    res.clearCookie('accessToken', clearCookieOptions);
    res.clearCookie('refreshToken', clearCookieOptions);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Logout all devices ───────────────────────────────────────────────────────
export const logoutAllController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await authService.logoutAllService(req.user!.userId);
    res.clearCookie('accessToken', clearCookieOptions);
    res.clearCookie('refreshToken', clearCookieOptions);
    res.status(200).json({
      success: true,
      message: 'Logged out from all devices',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await authService.resetPassword(req.body);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Change Password (authenticated) ─────────────────────────────────────────
export const changePasswordController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await authService.changePassword({
      userId: req.user!.userId,
      sessionId: req.user!.sessionId!,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get active sessions ──────────────────────────────────────────────────────
export const getSessionsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sessions = await authService.getActiveSessions(req.user!.userId);
    res.status(200).json({
      success: true,
      data: { sessions },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get current user (me) ────────────────────────────────────────────────────
export const meController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await userService.getUserById(req.user!.userId);
    res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};