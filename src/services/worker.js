import { Worker } from 'bullmq';
import { sendEmail, getWelcomeTemplate, getQuizPassTemplate, getCourseCompleteTemplate } from './notificationService.js';
import env from '../config/env.js';
import { logInfo, logError } from '../logs/logger.js';
import { isRedisAvailable } from '../config/redis.js';

// Connection details
const connection = {
  host: env.REDIS_URL ? new URL(env.REDIS_URL).hostname : '127.0.0.1',
  port: env.REDIS_URL ? new URL(env.REDIS_URL).port : 6379,
  maxRetriesPerRequest: null, // Critical for modern ioredis/bullmq compatibility
};

// Main background worker process
export let emailWorker = null;

export const startWorker = () => {
  if (!isRedisAvailable || !env.REDIS_URL) {
    logInfo('REDIS_URL not set or offline — BullMQ Worker is dormant');
    return null;
  }

  try {
    emailWorker = new Worker('emailQueue', async (job) => {
      const { data } = job;
      const { to, username, courseTitle, lessonTitle, score } = data;

      logInfo(`Processing ${job.name} job for ${to}`);

      try {
        let subject = '';
        let html = '';

        switch (job.name) {
          case 'welcome':
            subject = `Welcome to SkillHub - ${courseTitle}`;
            html = getWelcomeTemplate(username, courseTitle);
            break;
          
          case 'quizPass':
            subject = `Congratulations on passing ${lessonTitle}!`;
            html = getQuizPassTemplate(username, lessonTitle, score);
            break;
          
          case 'courseComplete':
            subject = `Course Completed! - ${courseTitle}`;
            html = getCourseCompleteTemplate(username, courseTitle);
            break;

          default:
            logError(`Unknown job type: ${job.name}`);
            return;
        }

        await sendEmail(to, subject, html);
        logInfo(`Successfully sent ${job.name} email to ${to}`);
        
      } catch (error) {
        logError(`Error processing ${job.name} job: ${error.message}`);
        throw error; // Let BullMQ handle retries
      }
    }, { connection });

    emailWorker.on('completed', (job) => {
      logInfo(`Job ${job.id} completed successfully`);
    });

    emailWorker.on('failed', (job, err) => {
      logError(`Job ${job.id} failed with error: ${err.message}`);
    });
    
    logInfo('BullMQ Email Worker started successfully');
    return emailWorker;
  } catch (err) {
    logError('Failed to start BullMQ Worker during bootstrap');
    return null;
  }
};

export default emailWorker;
