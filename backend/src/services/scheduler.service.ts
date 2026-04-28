import cron from "node-cron";
import { processDueFollowUps, markOverdueInvoices } from "./followup.service";
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

  logger("Scheduler started");
};
