import dotenv from "dotenv";
dotenv.config();

import express from "express";
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
import analyticsRoutes from "./core/analytics/analytics.routes";
import trackingRoutes from "./core/tracking/tracking.routes";
import paystackRoutes from "./core/paystack/paystack.routes";

const requiredEnv: (keyof typeof ENV)[] = [
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "DATABASE_URL",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "PAYSTACK_SECRET_KEY",
];

for (const key of requiredEnv) {
  if (!ENV[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();

const corsOrigins =
  ENV.NODE_ENV === "production"
    ? [
        ENV.CLIENT_URL,
        /\.vercel\.app$/,
        /\.netlify\.app$/,
        ...(ENV.ADDITIONAL_ORIGINS
          ? ENV.ADDITIONAL_ORIGINS.split(",").map((o) => o.trim())
          : []),
      ]
    : [ENV.CLIENT_URL, "http://localhost:3000", "http://localhost:3001"];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan(ENV.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/paystack", paystackRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/track", trackingRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(ENV.PORT, () => {
  logger(`Server running on port ${ENV.PORT} in ${ENV.NODE_ENV} mode`);
  startScheduler();
});
