import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { ENV } from "./constants/env";
import logger from "./utils/logger.utils";
import { errorHandler, notFound } from "./middleware/error.middleware";
import { startScheduler } from "./services/scheduler.service";

import authRoutes from "./core/auth/auth.routes";
import clientRoutes from "./core/clients/clients.routes";
import invoiceRoutes from "./core/invoices/invoices.routes";
import paymentRoutes from "./core/payments/payments.routes";
import dashboardRoutes from "./core/dashboard/dashboard.routes";
import webhookRoutes from "./core/webhooks/webhooks.routes";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: ENV.CLIENT_URL,
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan(ENV.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/webhooks", webhookRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(ENV.PORT, () => {
  logger(`Server running on port ${ENV.PORT} in ${ENV.NODE_ENV} mode`);
  startScheduler();
});
