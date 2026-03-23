import { z } from 'zod';

export const envSchema = z
  .object({
    ENV: z.enum(['dev', 'prod']).default('dev'),

    PORT: z.coerce.number().int().positive().default(3000),
    HOST: z.string().default('0.0.0.0'),
    CORS_ORIGIN: z.string().default('*'),
    BACKEND_URL: z.string().default('http://localhost:4000/v1'),

    MONGO_URI: z.string().trim().min(1).optional(),
    MONGO_DB: z.string().trim().min(1).optional(),
    MONGO_CONNECT_TIMEOUT_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(5),
    MONGO_MAX_RETRIES: z.coerce.number().int().nonnegative().default(5),
    MONGO_RETRY_DELAY_SECONDS: z.coerce.number().int().nonnegative().default(2),
    MONGO_COOLDOWN_SECONDS: z.coerce.number().int().nonnegative().default(30),
    INTERNAL_API_KEY: z
      .string()
      .min(8, 'INTERNAL_API_KEY must be at least 8 characters')
      .max(10, 'INTERNAL_API_KEY must 10 characters'),
    JWT_ACCESS_SECRET: z
      .string()
      .min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
    JWT_REFRESH_SECRET: z
      .string()
      .min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),

    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    AWS_REGION: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_SQS_EMAIL_QUEUE_URL: z.string().optional(),
    AWS_SQS_EMAIL_QUEUE_ARN: z.string().optional(),

    OTP_ATTEMPTS: z.coerce.number().int().positive().default(5),
    MAX_OTP_RESEND_ATTEMPTS: z.coerce.number().int().positive().default(5),
    RESEND_COOLDOWN_MINUTES: z.coerce.number().positive().default(5),
    OTP_EXPIRATION_MINUTES: z.coerce.number().positive().default(1),
    SIGNUP_SESSION_MINUTES: z.coerce.number().positive().default(5),
    FORGET_PASSWORD_MINUTES: z.coerce.number().positive().default(10),

    REDIS_HOST: z.string().trim().optional(),
    REDIS_PORT: z.coerce.number().int().positive().default(6379),
    REDIS_PASSWORD: z.string().optional().default(''),
    REDIS_DB: z.coerce.number().int().nonnegative().default(0),
    REDIS_TTL_HOURS: z.coerce.number().positive().default(1),

    REDIS_CONNECT_TIMEOUT_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(5),
    REDIS_MAX_RETRIES: z.coerce.number().int().nonnegative().default(5),
    REDIS_RETRY_DELAY_SECONDS: z.coerce.number().int().nonnegative().default(2),
    REDIS_COOLDOWN_SECONDS: z.coerce.number().int().nonnegative().default(30),

    UPSTASH_REDIS_URL: z.string().trim().optional(),
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
