import { FastifyInstance, FastifyRequest, preHandlerHookHandler } from "fastify";

/**
 * The caller's real IP, for rate limiting and logs.
 *
 * Not `request.ip`: with `trustProxy` that's the leftmost X-Forwarded-For
 * entry, which the client writes itself. Sending a different made-up IP on
 * each request gave a fresh rate-limit quota every time (tested in production
 * before this fix). Render sits behind Cloudflare, which sets
 * `CF-Connecting-IP` to the address that actually connected and overwrites
 * any value the client sent. Locally and in tests there's no Cloudflare, and
 * the socket address is the right answer anyway.
 */
export function clientIp(request: FastifyRequest): string {
  const header = request.headers["cf-connecting-ip"];
  const value = Array.isArray(header) ? header[0] : header;
  return value?.trim() || request.ip;
}

/**
 * A second limit on routes that take an email, counted per address rather
 * than per caller: many IPs together still can't flood one inbox or guess one
 * account's password faster than this. Runs as a preHandler, once the body is
 * parsed. Without the rate-limit plugin (tests) it does nothing.
 *
 * Built on `createRateLimit`, not `rateLimit`: the plugin runs only one of its
 * own handlers per request, so a second one next to the route's per-IP limit
 * would silently never count.
 */
export function limitPerEmail(
  app: FastifyInstance,
  options: { group: string; max: number; timeWindow: string },
): preHandlerHookHandler {
  if (!app.hasDecorator("createRateLimit")) {
    return (_request, _reply, done) => done();
  }

  const check = app.createRateLimit({
    max: options.max,
    timeWindow: options.timeWindow,
    keyGenerator: (request) => {
      const email = (request.body as { email?: unknown } | undefined)?.email;
      // Its own counter per route: three password resets shouldn't use up
      // the sign-in attempts of the same address.
      return typeof email === "string"
        ? `${options.group}:email:${email.trim().toLowerCase()}`
        : `${options.group}:ip:${clientIp(request)}`;
    },
  });

  return async (request, reply) => {
    const result = await check(request);
    // `isAllowed` only means "on the allow list" (nothing to count); whether
    // the limit is used up is `isExceeded`.
    if (!result.isAllowed && result.isExceeded) {
      return reply
        .status(429)
        .header("retry-after", result.ttlInSeconds)
        .send({ message: "Too many requests. Please try again later." });
    }
  };
}
