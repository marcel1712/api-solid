import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
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
