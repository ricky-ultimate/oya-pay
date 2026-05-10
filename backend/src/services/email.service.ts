import { google } from "googleapis";
import MailComposer from "nodemailer/lib/mail-composer";
import { ENV } from "../constants/env";
import logger from "../utils/logger.utils";

const oauth2Client = new google.auth.OAuth2(
  ENV.GMAIL_OAUTH_CLIENT_ID,
  ENV.GMAIL_OAUTH_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground",
);

oauth2Client.setCredentials({
  refresh_token: ENV.GMAIL_OAUTH_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: "v1", auth: oauth2Client });

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  fromName?: string;
  attachments?: { filename: string; content: Buffer }[];
}

async function buildRawMessage(options: SendEmailOptions): Promise<string> {
  const fromLabel = options.fromName
    ? `"${options.fromName}" <${ENV.GMAIL_SENDER_ADDRESS}>`
    : `OyaPay <${ENV.GMAIL_SENDER_ADDRESS}>`;

  const mailOptions: ConstructorParameters<typeof MailComposer>[0] = {
    from: fromLabel,
    to: options.to,
    subject: options.subject,
    html: options.html,
    textEncoding: "base64",
    ...(options.replyTo !== undefined && { replyTo: options.replyTo }),
    ...(options.attachments !== undefined && {
      attachments: options.attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
    }),
  };

  const mail = new MailComposer(mailOptions);
  const message = await mail.compile().build();

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export const sendEmail = async (
  options: SendEmailOptions,
): Promise<boolean> => {
  try {
    const raw = await buildRawMessage(options);

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });

    return true;
  } catch (error) {
    logger("Email send error:", error);
    return false;
  }
};
