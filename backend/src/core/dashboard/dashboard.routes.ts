import { Router } from "express";
import { stats } from "./dashboard.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticate);
router.get("/", stats);

export default router;
