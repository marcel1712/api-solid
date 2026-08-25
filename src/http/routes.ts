import { registerOrgController } from "@/http/controllers/org/registerOrgController";
import { registerPetController } from "@/http/controllers/pet/registerPetController";
import { FastifyInstance } from "fastify";

export async function orgRoutes(app: FastifyInstance) {
  app.post("/", registerOrgController);
}

export async function petRoutes(app: FastifyInstance) {
  app.post("/", registerPetController);
}
