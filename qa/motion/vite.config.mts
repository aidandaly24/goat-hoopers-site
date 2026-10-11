import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)), publicDir: `${root}/public`,
  cacheDir: fileURLToPath(new URL("./.cache/vite", import.meta.url)),
  resolve: { alias: { "@": `${root}/src`,
    "next/link": fileURLToPath(new URL("./link.tsx", import.meta.url)),
    "next/navigation": `${root}/src/test/site-shell/navigation.ts` } },
  server: { host: "127.0.0.1", port: 8796, strictPort: true },
  build: { copyPublicDir: false },
});
