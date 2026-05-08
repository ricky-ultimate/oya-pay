import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import {
  getWhatsAppStatus,
  getWhatsAppQr,
  provisionInstance,
  restartWhatsApp,
  logoutWhatsApp,
  disconnectWhatsApp,
} from "./whatsapp.controller";

const router = Router();

router.use(authenticate);

router.get("/status", getWhatsAppStatus);
router.get("/qr", getWhatsAppQr);
router.post("/provision", provisionInstance);
router.post("/restart", restartWhatsApp);
router.post("/logout", logoutWhatsApp);
router.delete("/disconnect", disconnectWhatsApp);

export default router;
