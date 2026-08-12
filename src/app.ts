import Fastify from "fastify";
import { routes } from "@/http/routes";

const app = Fastify();

app.get("/", async function handler(request, reply) {
  return "Findafriend";
});
app.register(routes, { prefix: "org" });

export default app;
