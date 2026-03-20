import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    server: {
        host: true,
        port: 8080,
        open: true,
    },
    build: {
        outDir: "build",
    },
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: "./src/setupTests.ts",
        include: ["src/**/*.test.{ts,tsx}"],
    },
});
