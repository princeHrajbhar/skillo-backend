// modules/auth/auth.controller.js
import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service.js";
import { buildToken } from "./auth.service.js";
import type { AuthRequest } from "../../middlewares/auth.middleware.js";

// ─── Cookie options ───────────────────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === "production";
const accessCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict" as const,
  maxAge: 15 * 60 * 1000, // 15 min — matches JWT expiry
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/api/auth/refresh", // scoped — not sent on every request
};

const clearRefreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict" as const,
  path: "/api/auth/refresh",
};

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json({
      success: true,
      message: "Registration successful. Please check your email for the OTP.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────
export const verifyOtpController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.verifyOTP(req.body);
    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────
export const resendOtpController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, type } = req.body;
    const result = await authService.resendOtp(email, type);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
export const loginController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Debug logging
    console.log('=== Login Controller ===');
    console.log('Request body:', req.body);
    console.log('Email:', req.body?.email);
    console.log('Password:', req.body?.password ? '***' : 'undefined');
    
    const { email, password } = req.body;
    
    // Validate presence
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
        received: { email: !!email, password: !!password }
      });
      return;
    }
    
    const { accessToken, refreshToken } = await authService.loginUser(email, password, {
      userAgent: req.headers["user-agent"],
      ip: req.ip ?? req.socket?.remoteAddress,
    });
    
    res.cookie("accessToken", accessToken, accessCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);
    
    res.status(200).json({
      success: true,
      message: "Logged in successfully"
    });
  } catch (error) {
    next(error);
  }
};

// ─── Refresh ──────────────────────────────────────────────────────────────────
export const refreshController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken as string | undefined;
    if (!token) {
      res.status(401).json({
        success: false,
        code: "TOKEN_INVALID",
        message: "No refresh token provided"
      });
      return;
    }
    
    const { newAccessToken, newRefreshToken } = await authService.refreshTokenService(token);
    res.cookie("accessToken", newAccessToken, accessCookieOptions);
    res.cookie("refreshToken", newRefreshToken, refreshCookieOptions);
    res.status(200).json({
      success: true,
      message: "Tokens refreshed"
    });
  } catch (error) {
    next(error);
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logoutController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken as string | undefined;
    if (token) {
      await authService.logoutService(token);
    }
    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", clearRefreshCookieOptions);
    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    next(error);
  }
};

// ─── Logout all devices ───────────────────────────────────────────────────────
export const logoutAllController = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.logoutAllService(req.user!.userId);
    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", clearRefreshCookieOptions);
    res.status(200).json({
      success: true,
      message: "Logged out from all devices"
    });
  } catch (error) {
    next(error);
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPasswordController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPasswordController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.resetPassword(req.body);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

// ─── Change Password (authenticated) ─────────────────────────────────────────
export const changePasswordController = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.changePassword({
      userId: req.user!.userId,
      sessionId: req.user!.sessionId!,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get active sessions ──────────────────────────────────────────────────────
export const getSessionsController = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessions = await authService.getActiveSessions(req.user!.userId);
    res.status(200).json({
      success: true,
      data: { sessions }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get current user (me) ────────────────────────────────────────────────────
export const meController = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: {
        userId: req.user!.userId,
        role: req.user!.role,
      },
    });
  } catch (error) {
    next(error);
  }
};