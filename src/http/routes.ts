import { registerOrgController } from "@/http/controllers/org/registerOrgController";
import { registerPetController } from "@/http/controllers/pet/registerPetController";
import { getPetDetailsController } from "@/http/controllers/pet/getPetDetailsController";
import { getOrgDetailsController } from "@/http/controllers/org/getOrgDetailsController";
import { updateOrgController } from "@/http/controllers/org/updateOrgController";
import { getOrgPetsController } from "@/http/controllers/org/getOrgPetsController";
import { FastifyInstance } from "fastify";
import { authenticateOrgController } from "./controllers/org/authenticateOrgController";
import { fetchPetByCityController } from "./controllers/pet/fetchPetByCityController";
import { markPetAsAdoptedController } from "./controllers/pet/markPetAsAdoptedController";
import { updatePetController } from "./controllers/pet/updatePetController";
import { requestPetImageUploadController } from "./controllers/pet/requestPetImageUploadController";
import { deletePetImageController } from "./controllers/pet/deletePetImageController";
import { verifyJwt } from "./middlewares/verify-jwt";

export async function orgRoutes(app: FastifyInstance) {
  app.post("/", registerOrgController);
  app.post("/sessions", authenticateOrgController);
  app.get("/:id", getOrgDetailsController);
  app.patch("/:id", { onRequest: [verifyJwt] }, updateOrgController);
  app.get("/me/pets", { onRequest: [verifyJwt] }, getOrgPetsController);
}

export async function petRoutes(app: FastifyInstance) {
  app.post("/", { onRequest: [verifyJwt] }, registerPetController);
  app.get("/:id", getPetDetailsController);
  app.get("/search", fetchPetByCityController);
  app.patch("/:id", { onRequest: [verifyJwt] }, updatePetController);
  app.patch("/:id/adopt", { onRequest: [verifyJwt] }, markPetAsAdoptedController);
  app.post(
    "/:id/images",
    { onRequest: [verifyJwt] },
    requestPetImageUploadController,
  );
  app.delete(
    "/:id/images/:imageId",
    { onRequest: [verifyJwt] },
    deletePetImageController,
  );
}