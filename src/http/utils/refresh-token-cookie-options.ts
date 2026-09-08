import { CookieSerializeOptions } from "@fastify/cookie";
import env from "@/env/env";

export const refreshTokenCookieOptions: CookieSerializeOptions =
  env.NODE_ENV === "production"
    ? {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "none",
      }
    : {
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      };
