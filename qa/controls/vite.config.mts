import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../", import.meta.url));
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)), publicDir: `${root}/public`,
  resolve: { alias: {
    "next/link": fileURLToPath(new URL("../paper-slate/link.tsx", import.meta.url)),
    "next/navigation": fileURLToPath(new URL("./navigation.ts", import.meta.url)),
    "@/data/stock-detail-client": fileURLToPath(new URL("../paper-slate/detail.ts", import.meta.url)),
    "@": `${root}/src`,
  } },
  define: { "process.env": JSON.stringify({ NODE_ENV: "development" }) },
  server: { host: "127.0.0.1", port: 4199, strictPort: true, fs: { allow: [root] } },
});
