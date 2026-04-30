import { Request, Response } from "express";
import prisma from "../../config/db.config";
import { ENV } from "../../constants/env";
import logger from "../../utils/logger.utils";

const TRACKING_PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export const trackEmailOpen = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { invoiceId } = req.params as { invoiceId: string };

  prisma.emailOpen
    .create({ data: { invoiceId } })
    .catch((err: unknown) => logger("Email open tracking error:", err));

  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.send(TRACKING_PIXEL);
};

export const trackPayLinkClick = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { invoiceId } = req.params as { invoiceId: string };

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { paystackRef: true },
    });

    if (!invoice) {
      res.redirect(302, ENV.CLIENT_URL);
      return;
    }

    prisma.payLinkClick
      .create({ data: { invoiceId } })
      .catch((err: unknown) => logger("Pay link click tracking error:", err));

    if (!invoice.paystackRef) {
      res.redirect(302, ENV.CLIENT_URL);
      return;
    }

    res.redirect(302, `https://paystack.com/pay/${invoice.paystackRef}`);
  } catch (err) {
    logger("Pay link click redirect error:", err);
    res.redirect(302, ENV.CLIENT_URL);
  }
};
