import { Router } from "express";
import { trackEmailOpen, trackPayLinkClick } from "./tracking.controller";

const router = Router();

router.get("/open/:invoiceId", trackEmailOpen);
router.get("/click/:invoiceId", trackPayLinkClick);

export default router;
