import { Router } from "express";
import { log, listByInvoice, remove } from "./payments.controller";
import { validate } from "../../middleware/validate.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { logPaymentSchema } from "./payments.schema";

const router = Router();

router.use(authenticate);

router.post("/", validate(logPaymentSchema), log);
router.get("/invoice/:invoiceId", listByInvoice);
router.delete("/:id", remove);

export default router;
