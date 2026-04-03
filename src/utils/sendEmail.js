import nodemailer from "nodemailer";
import env from "../config/env.js";
import { logError, logInfo } from "../logs/logger.js";

const sendEmail = async (options) => {
  try {
    // 1. Create a transporter
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    // 2. Define the email options
    const mailOptions = {
      from: `"${env.FROM_NAME}" <${env.FROM_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      // html: options.html, // Note: You can add HTML templates later
    };

    // 3. Actually send the email
    const info = await transporter.sendMail(mailOptions);
    logInfo(`Email sent to ${options.email} (MessageId: ${info.messageId})`);
  } catch (error) {
    logError(`Email dispatch error: ${error.message}`);
    throw new Error("There was an error sending the email. Try again later!");
  }
};

export default sendEmail;
