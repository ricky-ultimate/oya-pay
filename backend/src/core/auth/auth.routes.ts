import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  refresh,
  logout,
  me,
  patchProfile,
  verify,
  resendCode,
} from "./auth.controller";
import { validate } from "../../middleware/validate.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  verifyEmailSchema,
  resendCodeSchema,
} from "./auth.schema";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/verify", authLimiter, validate(verifyEmailSchema), verify);
router.post(
  "/resend-code",
  resendLimiter,
  validate(resendCodeSchema),
  resendCode,
);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, me);
router.patch(
  "/profile",
  authenticate,
  validate(updateProfileSchema),
  patchProfile,
);

export default router;
