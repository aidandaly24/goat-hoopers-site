import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";
const root = fileURLToPath(new URL("../../", import.meta.url));
export default defineConfig({ root: fileURLToPath(new URL("./", import.meta.url)),
  publicDir: root + "/public", cacheDir: join(tmpdir(), "goat-free-throw-art-cache"),
  resolve: { alias: { "next/link": fileURLToPath(new URL("./link.tsx", import.meta.url)), "@": process.env.FREE_THROW_QA_SOURCE ?? root + "/src" } },
  define: { "process.env": JSON.stringify({ NODE_ENV: "production" }) },
  build: { outDir: process.env.FREE_THROW_QA_OUTPUT ?? join(tmpdir(), "goat-free-throw-art-dist"), emptyOutDir: true, copyPublicDir: false, target: "esnext" },
  server: { host: "127.0.0.1", port: 8798, strictPort: true, fs: { allow: [root] } } });
