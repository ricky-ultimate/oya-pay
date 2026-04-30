import { Router } from "express";
import { followUpAnalytics } from "./analytics.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticate);
router.get("/followups", followUpAnalytics);

export default router;
