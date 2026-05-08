import { Response } from "express";
import { Request } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { sendSuccess, sendError } from "../../utils/response.utils";
import { ENV } from "../../constants/env";
import prisma from "../../config/db.config";
import { verifySubaccountCode } from "../../services/paystack.service";
import logger from "../../utils/logger.utils";

export const initiateOnboarding = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) {
    sendError(res, 404, "User not found");
    return;
  }

  const callbackUrl = `${ENV.APP_URL}/api/paystack/onboard/callback?userId=${user.id}`;
  const onboardingUrl = `https://paystack.com/signup/subaccount?callback=${encodeURIComponent(callbackUrl)}`;

  sendSuccess(res, 200, "Onboarding URL generated", { url: onboardingUrl });
};

export const onboardingCallback = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { userId, subaccount_code } = req.query as {
    userId?: string;
    subaccount_code?: string;
  };

  if (!userId || !subaccount_code) {
    res.redirect(
      `${ENV.CLIENT_URL}/profile?paystack=error&reason=missing_params`,
    );
    return;
  }

  try {
    const valid = await verifySubaccountCode(subaccount_code);
    if (!valid) {
      res.redirect(
        `${ENV.CLIENT_URL}/profile?paystack=error&reason=invalid_code`,
      );
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        paystackSubaccountCode: subaccount_code,
        paystackSubaccountActive: true,
      },
    });

    res.redirect(`${ENV.CLIENT_URL}/profile?paystack=success`);
  } catch (err) {
    logger("Paystack callback error:", err);
    res.redirect(
      `${ENV.CLIENT_URL}/profile?paystack=error&reason=server_error`,
    );
  }
};
