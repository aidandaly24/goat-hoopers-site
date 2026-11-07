import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  publicDir: fileURLToPath(new URL("../../public", import.meta.url)),
  plugins: [{ name: "qa-current-home-feature", enforce: "pre", resolveId(source, importer) {
    // Substitute only the composite's feature import in this QA build.
    // Other production consumers and the source comparison stay original.
    if (source === "./CourtsideFeature" && importer?.endsWith("/src/surfaces/season-hub/CourtsideHome.tsx")) {
      return fileURLToPath(new URL("./EditorialFeature.tsx", import.meta.url));
    }
  } }],
  resolve: { alias: [
    { find: "next/link", replacement: fileURLToPath(new URL("./link.tsx", import.meta.url)) },
    { find: "next/navigation", replacement: fileURLToPath(new URL("./navigation.ts", import.meta.url)) },
    { find: "@", replacement: fileURLToPath(new URL("../../src", import.meta.url)) },
  ] },
  define: { "process.env": JSON.stringify({ NODE_ENV: "development" }) },
  build: { outDir: "/tmp/goat-editorial-home-build", emptyOutDir: true, copyPublicDir: false },
  server: { host: "127.0.0.1", port: 4197, strictPort: true },
});
