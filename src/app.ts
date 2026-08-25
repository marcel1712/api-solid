import Fastify from "fastify";
import { orgRoutes, petRoutes } from "@/http/routes";

const app = Fastify();

app.get("/", async function handler(request, reply) {
  return "Findafriend";
});
app.register(orgRoutes, { prefix: "org" });
app.register(petRoutes, { prefix: "pets" });

export default app;
