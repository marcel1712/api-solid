import Fastify, { FastifyRequest } from "fastify";
import { orgRoutes, petRoutes } from "@/http/routes";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import { errorHandler } from "@/http/error-handler";
import env from "@/env/env";

// Logs go to stdout, which is what Render's log viewer reads. Off in tests to
// keep the output readable.
const app = Fastify({
  trustProxy: true,
  logger: env.NODE_ENV !== "test" && {
    serializers: {
      // The query string is left out on purpose: email verification links
      // carry their token there, and logs are no place for live tokens.
      req: (request: FastifyRequest) => ({
        method: request.method,
        url: request.url.split("?")[0],
        ip: request.ip,
      }),
    },
  },
});

app.get("/", async function handler() {
  return "Findafriend";
});
// The API only ever answers JSON, so nothing it serves should be framed,
// sniffed or allowed to run a script.
app.register(fastifyHelmet, {
  contentSecurityPolicy: {
    directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
  },
});
app.register(fastifyCors, {
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "HEAD", "POST", "PATCH", "DELETE"],
});
if (env.NODE_ENV !== "test") {
  app.register(fastifyRateLimit, {
    global: true,
    max: 100,
    timeWindow: "1 minute",
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: "Too Many Requests",
      message: "Too many requests. Please try again later.",
    }),
  });
}
// Registered before the routes so its onRequest hook parses `request.cookies`
// for every one of them.
app.register(fastifyCookie);
app.register(orgRoutes, { prefix: "orgs" });
app.register(petRoutes, { prefix: "pets" });

app.setErrorHandler(errorHandler);

export default app;
