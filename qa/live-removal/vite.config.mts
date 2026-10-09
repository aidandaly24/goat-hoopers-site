import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  publicDir: `${root}/public`,
  cacheDir: `${root}/node_modules/.cache/live-removal-vite`,
  resolve: { alias: {
    "next/link": fileURLToPath(new URL("../paper-slate/link.tsx", import.meta.url)),
    "next/navigation": fileURLToPath(new URL("../paper-slate/navigation.ts", import.meta.url)),
    "@": `${root}/src`,
  } },
  define: { "process.env": JSON.stringify({ NODE_ENV: "development" }) },
  server: { host: "127.0.0.1", port: 8869, strictPort: true, fs: { allow: [root] } },
});
