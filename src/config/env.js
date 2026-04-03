import { cleanEnv, str, port, url, num } from 'envalid';
import dotenv from 'dotenv';

// Load .env before validation
dotenv.config();

const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
  PORT: port({ default: 5000 }),
  APP_BASE_URL: url({ default: 'http://localhost:5000' }),
  CORS_ORIGIN: str({ default: 'http://localhost:3000' }),
  
  MONGO_URI: str(),
  REDIS_URL: str({ default: '' }),
  
  JWT_SECRET: str(),
  
  CHAPA_SECRET_KEY: str(),
  CHAPA_PUBLIC_KEY: str(),
  CHAPA_WEBHOOK_SECRET: str(),
  CHAPA_BASE_URL: url({ default: 'https://api.chapa.co' }),
  
  RATE_LIMIT_POINTS: num({ default: 100 }),
  RATE_LIMIT_DURATION: num({ default: 60 }),
  RATE_LIMIT_EXEMPT: str({ default: '' }),
  RATE_LIMIT_ROUTES: str({ default: '' }),
  RATE_LIMIT_ROLE_QUOTAS: str({ default: '' }),
  RATE_LIMIT_USER_KEY_STRATEGY: str({ default: 'auth-only' }),
  
  // ───────── Cloud Media (Phase 3) ─────────
  CLOUDINARY_CLOUD_NAME: str({ default: '' }),
  CLOUDINARY_API_KEY: str({ default: '' }),
  CLOUDINARY_API_SECRET: str({ default: '' }),
  
  // ───────── Email Settings (SMTP) ─────────
  SMTP_HOST: str({ default: '' }),
  SMTP_PORT: num({ default: 2525 }),
  SMTP_USER: str({ default: '' }),
  SMTP_PASS: str({ default: '' }),
  FROM_NAME: str({ default: 'SkillHub' }),
  FROM_EMAIL: str({ default: 'noreply@skillhub.com' }),
});

export default env;
