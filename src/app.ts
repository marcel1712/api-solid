import Fastify from "fastify";
import { orgRoutes, petRoutes } from "@/http/routes";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyRateLimit from "@fastify/rate-limit";
import { errorHandler } from "@/http/error-handler";
import env from "@/env/env";

const app = Fastify({ trustProxy: true });

app.get("/", async function handler() {
  return "Findafriend";
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
app.register(orgRoutes, { prefix: "orgs" });
app.register(petRoutes, { prefix: "pets" });
app.register(fastifyCookie)

app.setErrorHandler(errorHandler);

export default app;
