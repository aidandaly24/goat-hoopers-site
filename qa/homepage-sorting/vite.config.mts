import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  publicDir: `${root}/public`,
  cacheDir: `${root}/node_modules/.cache/homepage-sorting-vite`,
  resolve: { alias: { "@": `${root}/src`, "next/link": fileURLToPath(new URL("./link.tsx", import.meta.url)) } },
  server: { host: "127.0.0.1", port: 8794, strictPort: true },
});
