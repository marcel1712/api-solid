import app from "@/app";
import { registerOrgController } from "@/http/controllers/org/registerOrgController";
import { FastifyInstance } from "fastify";

export async function routes(app: FastifyInstance) {
  app.post("/", registerOrgController);
}
