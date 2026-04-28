import { Router } from "express";
import { paystackWebhook } from "./webhooks.controller";

const router = Router();

router.post("/paystack", paystackWebhook);

export default router;
