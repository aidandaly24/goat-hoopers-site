import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: [
    { find: "@/data/espn-client", replacement: fileURLToPath(new URL("./hook.ts", import.meta.url)) },
    { find: "@", replacement: fileURLToPath(new URL("../../", import.meta.url)) },
  ] },
  define: { "process.env": JSON.stringify({ NODE_ENV: "development" }) },
  server: { host: "127.0.0.1", port: 8816, strictPort: true },
});
