import cron from "node-cron";
import { processDueFollowUps, markOverdueInvoices } from "./followup.service";
import { deleteExpiredPendingUsers } from "../core/auth/auth.service";
import logger from "../utils/logger.utils";

export const startScheduler = (): void => {
  cron.schedule("*/15 * * * *", async () => {
    logger("Scheduler: processing due follow-ups");
    await processDueFollowUps();
  });

  cron.schedule("0 1 * * *", async () => {
    logger("Scheduler: marking overdue invoices");
    await markOverdueInvoices();
  });

  cron.schedule("*/30 * * * *", async () => {
    logger("Scheduler: cleaning up expired pending users");
    const deleted = await deleteExpiredPendingUsers();
    if (deleted > 0) {
      logger(`Scheduler: removed ${deleted} expired pending registration(s)`);
    }
  });

  logger("Scheduler started");
};
