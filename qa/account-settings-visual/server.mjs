import { createServer as createHttpServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";
const root = process.cwd(), here = path.join(root, "qa/account-settings-visual");
const mocks = path.join(here, "mocks.ts");
const vite = await createServer({ root, configFile: false, appType: "custom", server: { middlewareMode: true, watch: { ignored: ["**/.next/**", "**/evidence/**", "**/next-env.d.ts"] } }, resolve: { alias: [
  ...["@/data/friends-auth/runtime", "@/data/friends-auth/config", "@/app/actions", "@/data/league", "@/data/arcade", "next/headers", "next/navigation"].map(find => ({ find, replacement: mocks })),
  { find: "next/link", replacement: path.join(here, "Link.tsx") },
  { find: "@", replacement: path.join(root, "src") },
] } });
async function fontFile(family) {
  for (const file of await readdir(path.join(root, ".next/static/chunks"))) {
    if (!file.endsWith(".css")) continue;
    const css = await readFile(path.join(root, ".next/static/chunks", file), "utf8");
    for (const block of css.matchAll(/@font-face\s*\{[^}]+\}/g)) {
      if (block[0].includes(`font-family:${family};`) && block[0].includes("U+??")) return /src:url\(\.\.\/media\/([^)]+)\)/.exec(block[0])[1];
    }
  }
  throw new Error("Run npm run build before starting the fixture to provide the existing site fonts.");
}
const server = createHttpServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1:4181");
    if (url.pathname.startsWith("/fixture-font/")) {
      const file = await fontFile(url.pathname.includes("inter") ? "Inter" : "Geist Mono");
      res.writeHead(200, { "Content-Type": "font/woff2" }); res.end(await readFile(path.join(root, ".next/static/media", file))); return;
    }
    if (["/", "/account", "/account/login", "/account/password", "/team", "/fixture/form"].includes(url.pathname)) {
      res.writeHead(200, { "Content-Type": "text/html", "Cache-Control": "no-store" });
      res.end(await vite.transformIndexHtml(req.url, await readFile(path.join(here, "index.html"), "utf8"))); return;
    }
    vite.middlewares(req, res, () => { res.statusCode = 404; res.end(); });
  } catch (error) { console.error(error); res.statusCode = 500; res.end("Synthetic fixture error"); }
});
server.listen(4181, "127.0.0.1", () => console.log("Synthetic application pages ready at http://127.0.0.1:4181"));
