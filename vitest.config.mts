import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: [
      "**/node_modules/**",
      "reference/**",
      "functions/**",
      ".next/**",
      "out/**",
      ".opencode/**",
      "tests/integration/**",
      "tests/smoke/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      // Measure the code we own. Vendored shadcn/ui primitives are excluded so
      // the threshold tracks application and domain logic.
      include: ["lib/**/*.{ts,tsx}", "app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
      exclude: ["**/*.test.{ts,tsx}", "**/*.d.ts", "components/ui/**"],
      // Ratchet: set just below the measured baseline. Raise as coverage grows.
      thresholds: {
        statements: 50,
        branches: 55,
        functions: 44,
        lines: 51,
      },
    },
  },
});
