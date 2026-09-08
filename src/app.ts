import Fastify from "fastify";
import { orgRoutes, petRoutes } from "@/http/routes";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import { errorHandler } from "@/http/error-handler";
import env from "@/env/env";

const app = Fastify();

app.get("/", async function handler() {
  return "Findafriend";
});
app.register(fastifyCors, {
  origin: env.FRONTEND_URL,
  credentials: true,
});
app.register(orgRoutes, { prefix: "orgs" });
app.register(petRoutes, { prefix: "pets" });
app.register(fastifyCookie)

app.setErrorHandler(errorHandler);

export default app;
