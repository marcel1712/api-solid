import { registerOrgController } from "@/http/controllers/org/registerOrgController";
import { registerPetController } from "@/http/controllers/pet/registerPetController";
import { getPetDetailsController } from "@/http/controllers/pet/getPetDetailsController";
import { getOrgDetailsController } from "@/http/controllers/org/getOrgDetailsController";
import { updateOrgController } from "@/http/controllers/org/updateOrgController";
import { getOrgPetsController } from "@/http/controllers/org/getOrgPetsController";
import { requestPasswordResetController } from "@/http/controllers/org/requestPasswordResetController";
import { resetPasswordController } from "@/http/controllers/org/resetPasswordController";
import { verifyEmailController } from "@/http/controllers/org/verifyEmailController";
import { resendEmailVerificationController } from "@/http/controllers/org/resendEmailVerificationController";
import { FastifyInstance } from "fastify";
import { authenticateOrgController } from "./controllers/org/authenticateOrgController";
import { refreshSessionController } from "./controllers/org/refreshSessionController";
import { signOutController } from "./controllers/org/signOutController";
import { fetchPetByCityController } from "./controllers/pet/fetchPetByCityController";
import { markPetAsAdoptedController } from "./controllers/pet/markPetAsAdoptedController";
import { updatePetController } from "./controllers/pet/updatePetController";
import { requestPetImageUploadController } from "./controllers/pet/requestPetImageUploadController";
import { confirmPetImageUploadController } from "./controllers/pet/confirmPetImageUploadController";
import { deletePetImageController } from "./controllers/pet/deletePetImageController";
import { verifyJwt } from "./middlewares/verify-jwt";
import { readOptionalJwt } from "./middlewares/read-optional-jwt";
import { verifyAdmin } from "./middlewares/verify-admin";
import { getOwnOrgController } from "./controllers/org/getOwnOrgController";
import { requestOrgDocumentUploadController } from "./controllers/org/requestOrgDocumentUploadController";
import { confirmOrgDocumentUploadController } from "./controllers/org/confirmOrgDocumentUploadController";
import { listOrgsForReviewController } from "./controllers/admin/listOrgsForReviewController";
import { reviewOrgController } from "./controllers/admin/reviewOrgController";
import { recheckOrgCnpjController } from "./controllers/admin/recheckOrgCnpjController";
import { deleteOrgController } from "./controllers/admin/deleteOrgController";
import { adminUpdateOrgController } from "./controllers/admin/updateOrgController";

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
  app.post(
    "/sessions/refresh",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    refreshSessionController,
  );
  app.delete("/sessions", signOutController);
  app.get("/:id", getOrgDetailsController);
  app.patch("/:id", { onRequest: [verifyJwt] }, updateOrgController);
  app.get("/me", { onRequest: [verifyJwt] }, getOwnOrgController);
  app.get("/me/pets", { onRequest: [verifyJwt] }, getOrgPetsController);
  app.post(
    "/me/documents",
    {
      onRequest: [verifyJwt],
      config: { rateLimit: { max: 20, timeWindow: "1 hour" } },
    },
    requestOrgDocumentUploadController,
  );
  app.post(
    "/me/documents/confirm",
    { onRequest: [verifyJwt] },
    confirmOrgDocumentUploadController,
  );
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
  app.get(
    "/verify-email",
    { config: { rateLimit: { max: 20, timeWindow: "1 hour" } } },
    verifyEmailController,
  );
  app.post(
    "/verify-email/resend",
    { config: { rateLimit: { max: 5, timeWindow: "1 hour" } } },
    resendEmailVerificationController,
  );
}

export async function petRoutes(app: FastifyInstance) {
  app.post("/", { onRequest: [verifyJwt] }, registerPetController);
  app.get("/:id", { onRequest: [readOptionalJwt] }, getPetDetailsController);
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
export async function adminRoutes(app: FastifyInstance) {
  app.addHook("onRequest", verifyJwt);
  app.addHook("onRequest", verifyAdmin);

  app.get("/orgs", listOrgsForReviewController);
  app.post("/orgs/:id/review", reviewOrgController);
  app.post("/orgs/:id/cnpj-check", recheckOrgCnpjController);
  app.patch("/orgs/:id", adminUpdateOrgController);
  app.delete("/orgs/:id", deleteOrgController);
}
