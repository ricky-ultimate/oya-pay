import nodemailer from "nodemailer";
import dns from "dns/promises";
import { ENV } from "../constants/env";
import logger from "../utils/logger.utils";

async function createTransporter() {
  let host = ENV.SMTP_HOST;

  try {
    const addresses = await dns.resolve4(ENV.SMTP_HOST);
    if (addresses[0]) {
      host = addresses[0];
      logger(`SMTP resolved to IPv4: ${host}`);
    }
  } catch (err) {
    logger("SMTP DNS resolve4 failed, falling back to hostname:", err);
  }

  return nodemailer.createTransport({
    host,
    port: ENV.SMTP_PORT,
    secure: ENV.SMTP_PORT === 465,
    auth: {
      user: ENV.SMTP_USER,
      pass: ENV.SMTP_PASS,
    },
    tls: {
      servername: ENV.SMTP_HOST,
    },
  });
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  fromName?: string;
  attachments?: { filename: string; content: Buffer }[];
}

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

export const sendEmail = async (
  options: SendEmailOptions,
): Promise<boolean> => {
  try {
    if (!transporterPromise) {
      transporterPromise = createTransporter();
    }
    const transporter = await transporterPromise;

    await transporter.sendMail({
      from: `"${options.fromName ?? "OyaPay"}" <${ENV.SMTP_FROM}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      ...(options.replyTo && { replyTo: options.replyTo }),
      attachments: options.attachments,
    });
    return true;
  } catch (error) {
    logger("Email send error:", error);
    transporterPromise = null;
    return false;
  }
};
