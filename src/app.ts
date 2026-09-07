import Fastify from "fastify";
import { orgRoutes, petRoutes } from "@/http/routes";
import fastifyCookie from "@fastify/cookie";
import { errorHandler } from "@/http/error-handler";

const app = Fastify();

app.get("/", async function handler() {
  return "Findafriend";
});
app.register(orgRoutes, { prefix: "orgs" });
app.register(petRoutes, { prefix: "pets" });
app.register(fastifyCookie)

app.setErrorHandler(errorHandler);

export default app;
