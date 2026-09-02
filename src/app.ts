import Fastify from "fastify";
import { orgRoutes, petRoutes } from "@/http/routes";
import fastifyCookie from "@fastify/cookie";

const app = Fastify();

app.get("/", async function handler() {
  return "Findafriend";
});
app.register(orgRoutes, { prefix: "org" });
app.register(petRoutes, { prefix: "pets" });
app.register(fastifyCookie)

export default app;
