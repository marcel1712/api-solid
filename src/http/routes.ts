import { registerOrgController } from "@/http/controllers/org/registerOrgController";
import { registerPetController } from "@/http/controllers/pet/registerPetController";
import { getPetDetailsController } from "@/http/controllers/pet/getPetDetailsController";
import { FastifyInstance } from "fastify";
import { authenticateOrgController } from "./controllers/org/authenticateOrgController";

export async function orgRoutes(app: FastifyInstance) {
  app.post("/", registerOrgController);
  app.post("/sessions", authenticateOrgController);
}

export async function petRoutes(app: FastifyInstance) {
  app.post("/", registerPetController);
  app.get("/:id", getPetDetailsController);
}
