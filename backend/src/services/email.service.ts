import nodemailer from "nodemailer";
import { ENV } from "../constants/env";
import logger from "../utils/logger.utils";

const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: ENV.SMTP_PORT,
  secure: ENV.SMTP_PORT === 465,
  auth: {
    user: ENV.SMTP_USER,
    pass: ENV.SMTP_PASS,
  },
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  fromName?: string;
  attachments?: { filename: string; content: Buffer }[];
}

export const sendEmail = async (
  options: SendEmailOptions,
): Promise<boolean> => {
  try {
    await transporter.sendMail({
      from: `"OyaPay" <${ENV.SMTP_FROM}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      ...(options.replyTo && { replyTo: options.replyTo }),
      attachments: options.attachments,
    });
    return true;
  } catch (error) {
    logger("Email send error:", error);
    return false;
  }
};
