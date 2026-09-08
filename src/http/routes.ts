import { registerOrgController } from "@/http/controllers/org/registerOrgController";
import { registerPetController } from "@/http/controllers/pet/registerPetController";
import { getPetDetailsController } from "@/http/controllers/pet/getPetDetailsController";
import { getOrgDetailsController } from "@/http/controllers/org/getOrgDetailsController";
import { updateOrgController } from "@/http/controllers/org/updateOrgController";
import { getOrgPetsController } from "@/http/controllers/org/getOrgPetsController";
import { requestPasswordResetController } from "@/http/controllers/org/requestPasswordResetController";
import { resetPasswordController } from "@/http/controllers/org/resetPasswordController";
import { FastifyInstance } from "fastify";
import { authenticateOrgController } from "./controllers/org/authenticateOrgController";
import { fetchPetByCityController } from "./controllers/pet/fetchPetByCityController";
import { markPetAsAdoptedController } from "./controllers/pet/markPetAsAdoptedController";
import { updatePetController } from "./controllers/pet/updatePetController";
import { requestPetImageUploadController } from "./controllers/pet/requestPetImageUploadController";
import { confirmPetImageUploadController } from "./controllers/pet/confirmPetImageUploadController";
import { deletePetImageController } from "./controllers/pet/deletePetImageController";
import { verifyJwt } from "./middlewares/verify-jwt";

export async function orgRoutes(app: FastifyInstance) {
  app.post(
    "/",
    { config: { rateLimit: { max: 5, timeWindow: "1 hour" } } },
    registerOrgController,
  );
  app.post(
    "/sessions",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
    authenticateOrgController,
  );
  app.get("/:id", getOrgDetailsController);
  app.patch("/:id", { onRequest: [verifyJwt] }, updateOrgController);
  app.get("/me/pets", { onRequest: [verifyJwt] }, getOrgPetsController);
  app.post(
    "/password/forgot",
    { config: { rateLimit: { max: 5, timeWindow: "1 hour" } } },
    requestPasswordResetController,
  );
  app.post(
    "/password/reset",
    { config: { rateLimit: { max: 10, timeWindow: "1 hour" } } },
    resetPasswordController,
  );
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
  app.post(
    "/:id/images/confirm",
    { onRequest: [verifyJwt] },
    confirmPetImageUploadController,
  );
  app.delete(
    "/:id/images/:imageId",
    { onRequest: [verifyJwt] },
    deletePetImageController,
  );
}