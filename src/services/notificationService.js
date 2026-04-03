import nodemailer from 'nodemailer';
import env from '../config/env.js';
import { logInfo, logError } from '../logs/logger.js';

// Setup email transporter
// For dev, we'll use a local Ethereal account if no creds are provided
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"SkillHub Platform" <${process.env.SMTP_FROM || 'noreply@skillhub.com'}>`,
      to,
      subject,
      html,
    });
    logInfo(`Email sent to ${to}: ${info.messageId}`);
    
    // Ethereal URL logging for testing
    if (transporter.options.host.includes('ethereal')) {
      logInfo(`[DEV] View email: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return info;
  } catch (error) {
    logError(`Email failed for ${to}: ${error.message}`);
    throw error;
  }
};

// --- Templates ---

export const getWelcomeTemplate = (username, courseTitle) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
    <h2 style="color: #4a90e2;">Welcome to SkillHub, ${username}!</h2>
    <p>You've successfully enrolled in <strong>${courseTitle}</strong>.</p>
    <p>Your learning path is initialized and Lesson 1 is now unlocked. Let's get started!</p>
    <a href="${env.APP_BASE_URL}/learn/${courseTitle.toLowerCase().replace(/\s+/g, '-')}" 
       style="background: #4a90e2; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">
       Go to Course
    </a>
  </div>
`;

export const getQuizPassTemplate = (username, lessonTitle, score) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
    <h2 style="color: #27ae60;">Congratulations!</h2>
    <p>Well done, ${username}! You've passed the quiz for <strong>${lessonTitle}</strong> with a score of <strong>${score}%</strong>.</p>
    <p>The next lesson in your sequence has been unlocked. Keep the momentum going!</p>
  </div>
`;

export const getCourseCompleteTemplate = (username, courseTitle) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; text-align: center;">
    <h1 style="color: #f1c40f;">🎓 Course Completed!</h1>
    <p>Amazing job, ${username}! You've officially finished <strong>${courseTitle}</strong>.</p>
    <p>Your certificate of completion is being generated. You can now view it in your dashboard.</p>
    <p>We're proud of your dedication to learning!</p>
  </div>
`;
