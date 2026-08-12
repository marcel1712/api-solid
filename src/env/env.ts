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
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("Invalid eviorment variables", _env.error.format());
  throw new Error("Invalid environment variables");
}
const env = _env.data;
export default env;
