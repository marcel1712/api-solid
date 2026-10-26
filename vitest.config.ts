import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: [
      "./src/test/setup-resend-mock.ts",
      "./src/test/setup-cnpj-lookup-mock.ts",
    ],
    env: {
      ADMIN_EMAILS: "admin@tailhop.test",
      R2_DOCUMENTS_BUCKET_NAME: "tailhop-documents-test",
    },
  },
  resolve: {
    alias: [
      {
        find: /^@prisma\/client$/,
        replacement: path.resolve(__dirname, "generated/prisma/client"),
      },
      { find: "@", replacement: path.resolve(__dirname, "src") },
    ],
  },
});
