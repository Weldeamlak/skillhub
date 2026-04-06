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

export const getNewSaleTemplate = (instructorName, courseTitle, amount) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px dotted #ccc;">
    <h2 style="color: #27ae60;">New Sale! 💰</h2>
    <p>Good news, ${instructorName}!</p>
    <p>A student has just purchased your course: <strong>${courseTitle}</strong>.</p>
    <p>Your net earnings for this sale: <strong>${amount} ETB</strong>.</p>
    <p>Your dashboard has been updated. Keep up the great work!</p>
  </div>
`;

export const getVerifyEmailTemplate = (username, verificationUrl) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #4a90e2; border-radius: 8px;">
    <h2 style="color: #4a90e2;">Verify Your Email</h2>
    <p>Hello ${username},</p>
    <p>Thank you for joining SkillHub! Please verify your email address to activate your account and start learning.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" 
         style="background: #4a90e2; color: white; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold;">
         Verify Email Address
      </a>
    </div>
    <p style="font-size: 12px; color: #777;">If the button above doesn't work, copy and paste this link into your browser: <br>${verificationUrl}</p>
    <p>This link is valid for 24 hours.</p>
  </div>
`;

export const getForgotPasswordTemplate = (username, resetUrl) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e74c3c; border-radius: 8px;">
    <h2 style="color: #e74c3c;">Reset Your Password</h2>
    <p>Hello ${username},</p>
    <p>We received a request to reset the password for your SkillHub account. Click the button below to choose a new one:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" 
         style="background: #e74c3c; color: white; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold;">
         Reset Password
      </a>
    </div>
    <p>This link is only valid for 10 minutes for your security.</p>
    <p style="font-size: 12px; color: #777;">If you didn't request a password reset, you can safely ignore this email.</p>
  </div>
`;

export const getNewReviewTemplate = (instructorName, courseTitle, reviewerName, rating, comment) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #f39c12; border-radius: 8px;">
    <h2 style="color: #f39c12;">New Course Review! ⭐</h2>
    <p>Hello ${instructorName},</p>
    <p><strong>${reviewerName}</strong> just left a ${rating}-star review for your course: <strong>${courseTitle}</strong>.</p>
    <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #f39c12; margin: 20px 0;">
      <p style="font-style: italic; margin: 0;">"${comment}"</p>
    </div>
    <p>Head to your dashboard to reply to the student!</p>
  </div>
`;

export const getNewLessonTemplate = (studentName, courseTitle, lessonTitle) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #2ecc71; border-radius: 8px;">
    <h2 style="color: #2ecc71;">New Lesson Added! 📖</h2>
    <p>Hello ${studentName},</p>
    <p>Great news! A new lesson has been added to the course you're enrolled in: <strong>${courseTitle}</strong>.</p>
    <p>Check out the new content now: <strong>${lessonTitle}</strong></p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${env.APP_BASE_URL}/learn/${courseTitle.toLowerCase().replace(/\s+/g, '-')}" 
         style="background: #2ecc71; color: white; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold;">
         Start Learning
      </a>
    </div>
  </div>
`;
