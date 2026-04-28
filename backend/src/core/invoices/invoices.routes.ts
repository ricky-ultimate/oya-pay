import { Router } from "express";
import {
  create,
  list,
  getOne,
  update,
  remove,
  send,
  downloadPDF,
  updateStatus,
} from "./invoices.controller";
import { validate } from "../../middleware/validate.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  sendInvoiceSchema,
} from "./invoices.schema";

const router = Router();

router.use(authenticate);

router.get("/", list);
router.post("/", validate(createInvoiceSchema), create);
router.get("/:id", getOne);
router.patch("/:id", validate(updateInvoiceSchema), update);
router.delete("/:id", remove);
router.post("/:id/send", validate(sendInvoiceSchema), send);
router.get("/:id/pdf", downloadPDF);
router.patch("/:id/status", updateStatus);

export default router;
