import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  dotenv.config({ path: path.resolve(__dirname, '../../../../.env.local') });
}


import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().default(4000),
  FIREBASE_PROJECT_ID: z.string(),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string(),
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_USERNAME: z.string().default('default'),
  REDIS_PASSWORD: z.string().optional(),
  RAZORPAY_KEY_ID: z.string(),
  RAZORPAY_KEY_SECRET: z.string(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  AI_SERVICE_URL: z.string().default('http://localhost:8000'),
  NEXT_PUBLIC_API_URL: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  METERED_DOMAIN: z.string().optional(),
  METERED_SECRET_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  const formatted = parsed.error.format();
  for (const [key, value] of Object.entries(formatted)) {
    if (key === '_errors') continue;
    const fieldErrors = value as { _errors?: string[] };
    if (fieldErrors._errors && fieldErrors._errors.length > 0) {
      console.error(`  ${key}: ${fieldErrors._errors.join(', ')}`);
    }
  }
  process.exit(1);
}

const validatedEnv: Env = parsed.data;

export const env = validatedEnv;
