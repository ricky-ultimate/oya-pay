import { Router } from "express";
import { initiateOnboarding, onboardingCallback } from "./paystack.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.get("/onboard", authenticate, initiateOnboarding);
router.get("/onboard/callback", onboardingCallback);

export default router;
