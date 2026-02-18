import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const sesUtils = {
  async sendEmail(params: SendEmailParams): Promise<string> {
    if (!process.env.SES_EMAIL_SENDER) {
      throw new Error("SES_EMAIL_SENDER is not configured");
    }

    const command = new SendEmailCommand({
      Destination: { ToAddresses: [params.to] },
      Message: {
        Body: {
          Html: { Charset: "UTF-8", Data: params.html },
          Text: params.text ? { Charset: "UTF-8", Data: params.text } : undefined,
        },
        Subject: { Charset: "UTF-8", Data: params.subject },
      },
      Source: process.env.SES_EMAIL_SENDER,
    });

    const response = await sesClient.send(command);
    return response.MessageId || "";
  },
};

export default sesClient;
