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
  paymentLink,
  followUpActivity,
  cancelFollowUpSchedule,
  previewFollowUp,
  triggerFollowUp,
  escalateNow,
  pauseFollowUps,
  resumeFollowUps,
} from "./invoices.controller";
import { validate } from "../../middleware/validate.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  sendInvoiceSchema,
  previewFollowUpSchema,
  triggerFollowUpSchema,
  escalateFollowUpSchema,
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
router.get("/:id/payment-link", paymentLink);

router.get("/:id/followups", followUpActivity);
router.post(
  "/:id/followups/preview",
  validate(previewFollowUpSchema),
  previewFollowUp,
);
router.post(
  "/:id/followups/escalate",
  validate(escalateFollowUpSchema),
  escalateNow,
);
router.patch("/:id/followups/pause", pauseFollowUps);
router.patch("/:id/followups/resume", resumeFollowUps);
router.delete("/:id/followups/:scheduleId", cancelFollowUpSchedule);
router.post(
  "/:id/followups/:scheduleId/trigger",
  validate(triggerFollowUpSchema),
  triggerFollowUp,
);

export default router;
