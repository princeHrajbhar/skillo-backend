import { Router } from "express";
import * as authController from "./auth.controller.js";
import { protect, authorize } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  loginLimiter,
  otpLimiter,
  authLimiter,
  resetPasswordLimiter,
} from "../../middlewares/Ratelimiter.middleware .js";
import {
  registerSchema,
  verifyOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendOtpSchema,
  changePasswordSchema,
} from "./auth.validators.js";

const router = Router();

// ─── Public routes ────────────────────────────────────────────────────────────

router.post("/register",
  otpLimiter,
  validate(registerSchema),
  authController.register
);

router.post("/verify-otp",
  authLimiter,
  validate(verifyOtpSchema),
  authController.verifyOtpController
);

router.post("/resend-otp",
  otpLimiter,
  validate(resendOtpSchema),
  authController.resendOtpController
);

router.post("/login",
  loginLimiter,
  validate(loginSchema),
  authController.loginController
);

router.post("/refresh",
  authLimiter,
  authController.refreshController
);

router.post("/logout",
  authController.logoutController
);

router.post("/forgot-password",
  otpLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPasswordController
);

router.post("/reset-password",
  resetPasswordLimiter,
  validate(resetPasswordSchema),
  authController.resetPasswordController
);

// ─── Authenticated routes ─────────────────────────────────────────────────────

router.get("/me",
  protect,
  authController.meController
);

router.get("/sessions",
  protect,
  authController.getSessionsController
);

router.post("/logout-all",
  protect,
  authController.logoutAllController
);

router.post("/change-password",
  protect,
  validate(changePasswordSchema),
  authController.changePasswordController
);

// ─── Admin-only example ───────────────────────────────────────────────────────

router.get("/admin",
  protect,
  authorize("admin"),
  (req, res) => {
    res.status(200).json({ message: "Welcome, admin." });
  }
);

export default router;