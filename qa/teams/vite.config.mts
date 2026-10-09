import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  publicDir: `${root}/public`, cacheDir: `${root}/qa/teams/.cache`,
  resolve: { alias: {
    "next/link": fileURLToPath(new URL("./link.tsx", import.meta.url)),
    "@": `${root}/src`,
  } },
  server: { host: "127.0.0.1", port: 8796, strictPort: true, fs: { allow: [root] } },
});
