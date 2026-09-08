import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({
  path: "./.env",
  debug: true,
});

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID is required"),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required"),
  R2_BUCKET_NAME: z.string().min(1, "R2_BUCKET_NAME is required"),
  R2_PUBLIC_URL: z
    .string()
    .url()
    .transform((url) => url.replace(/\/+$/, "")),
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  MAIL_FROM: z.string().min(1, "MAIL_FROM is required"),
  FRONTEND_URL: z
    .string()
    .url()
    .transform((url) => url.replace(/\/+$/, "")),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("Invalid eviorment variables", _env.error.format());
  throw new Error("Invalid environment variables");
}
const env = _env.data;
export default env;
