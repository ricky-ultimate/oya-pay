import { Router } from "express";
import {
  getBanks,
  resolveAccount,
  createSubaccountHandler,
  verifySubaccount,
  verifyPaymentByReference,
} from "../paystack/paystack.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.get("/banks", getBanks);
router.get("/resolve-account", resolveAccount);
router.get("/verify/:reference", verifyPaymentByReference);
router.post("/subaccount", authenticate, createSubaccountHandler);
router.post("/subaccount/verify/:code", authenticate, verifySubaccount);

export default router;
