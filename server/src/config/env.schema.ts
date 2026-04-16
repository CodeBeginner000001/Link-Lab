import { z } from 'zod';

export const envSchema = z
  .object({
    ENV: z.enum(['dev', 'prod']).default('dev'),
    HOST: z.string().default('0.0.0.0'),
    PORT: z.coerce.number().int().positive().default(3000),
    // URLs
    CORS_ALLOWED_ORIGINS: z.string().optional(),
    BACKEND_URL: z.string().default('https://linklab-server.vercel.app/v1'),
    FRONTEND_URL: z.string().default('https://linklab-solutions.vercel.app'),
    // MongoDB connection
    MONGO_URI: z.string().trim().min(1).default('mongodb://127.0.0.1:27017'),
    MONGO_DB: z.string().trim().min(1).default('linklab'),
    MONGO_CONNECT_TIMEOUT_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(5),
    MONGO_MAX_RETRIES: z.coerce.number().int().nonnegative().default(5),
    MONGO_RETRY_DELAY_SECONDS: z.coerce.number().int().nonnegative().default(2),
    MONGO_COOLDOWN_SECONDS: z.coerce.number().int().nonnegative().default(30),

    // Redis connection
    REDIS_HOST: z.string().trim().default('127.0.0.1'),
    REDIS_PORT: z.coerce.number().int().positive().default(6379),
    REDIS_PASSWORD: z.string().optional().default(''),
    REDIS_DB: z.coerce.number().int().nonnegative().default(0),

    REDIS_CONNECT_TIMEOUT_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(5),
    REDIS_MAX_RETRIES: z.coerce.number().int().nonnegative().default(5),
    REDIS_RETRY_DELAY_SECONDS: z.coerce.number().int().nonnegative().default(2),
    REDIS_COOLDOWN_SECONDS: z.coerce.number().int().nonnegative().default(30),

    UPSTASH_REDIS_URL: z.string().trim().optional(),

    // JWT
    JWT_ACCESS_SECRET: z
      .string()
      .min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
    JWT_REFRESH_SECRET: z
      .string()
      .min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
    RESET_TOKEN_SECRET: z
      .string()
      .min(16, 'RESET_TOKEN_SECRET must be at least 16 characters')
      .optional(),

    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    // AWS
    AWS_REGION: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_SQS_EMAIL_QUEUE_URL: z.string().optional(),
    AWS_SQS_EMAIL_QUEUE_ARN: z.string().optional(),
    INTERNAL_API_KEY: z
      .string()
      .min(8, 'INTERNAL_API_KEY must be at least 8 characters')
      .max(10, 'INTERNAL_API_KEY must 10 characters'),

    OTP_ATTEMPTS: z.coerce.number().int().positive().default(5),
    MAX_OTP_RESEND_ATTEMPTS: z.coerce.number().int().positive().default(5),
    RESEND_COOLDOWN_SECOND: z.coerce.number().positive().default(60),
    OTP_EXPIRATION_MINUTES: z.coerce.number().positive().default(2),
    RESET_LINK_EXPIRATION_MINUTES: z.coerce.number().positive().default(10),
    SIGNUP_SESSION_TTL_MINUTES: z.coerce.number().positive().default(60),
    FORGOT_PASSWORD_TTL_MINUTES: z.coerce.number().positive().default(10),
    CRON_SECRET: z.coerce.string(),
  })
  .superRefine((env, ctx) => {
    if (!env.REDIS_HOST && !env.UPSTASH_REDIS_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['REDIS_HOST'],
        message: 'Either REDIS_HOST or UPSTASH_REDIS_URL is required',
      });
    }

    if (env.ENV === 'prod' && !env.MONGO_URI) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['MONGO_URI'],
        message: 'MONGO_URI is required when ENV=prod',
      });
    }
  });

export type EnvSchema = z.infer<typeof envSchema>;
