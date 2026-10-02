import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Uji regresi logika murni & route handler (tanpa browser, tanpa jaringan).
// Alias "@/..." disamakan dengan tsconfig.json.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    restoreMocks: true,
  },
});
