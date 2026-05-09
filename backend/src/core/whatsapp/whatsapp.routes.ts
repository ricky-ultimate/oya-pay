import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { getPlatformWhatsAppStatus } from "./whatsapp.controller";

const router = Router();

router.use(authenticate);

router.get("/status", getPlatformWhatsAppStatus);

export default router;
