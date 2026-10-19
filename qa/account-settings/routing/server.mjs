import { createServer as createHttpServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";
const root = process.cwd();
const here = path.join(root, "qa/account-settings/routing");
const vite = await createServer({ root, configFile: false, server: { middlewareMode: true, watch: { ignored: ["**/.next/**", "**/next-env.d.ts", "**/qa/account-settings/evidence/**"] } }, appType: "custom", resolve: { alias: [
  { find: "@/data/friends-auth/runtime", replacement: path.join(here, "runtime.ts") },
  { find: "@/data/friends-auth/config", replacement: path.join(here, "config.ts") },
  { find: "next/link", replacement: path.join(here, "Link.tsx") },
  { find: "next/navigation", replacement: path.join(here, "navigation.ts") },
  { find: "@", replacement: path.join(root, "src") },
] } });
const server = createHttpServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1:4179");
    if (url.pathname === "/account/continue") {
      const { GET } = await vite.ssrLoadModule("/src/app/account/continue/route.ts");
      const response = await GET(new Request(url, { headers: { cookie: req.headers.cookie ?? "" } }));
      res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(); return;
    }
    if (req.method === "POST" && ["/api/auth/sign-in/email", "/api/accounts/claim"].includes(url.pathname)) {
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks));
      const failed = body.email === "failed@example.test";
      const member = url.pathname === "/api/accounts/claim" || body.email !== "unclaimed@example.test";
      await new Promise(resolve => setTimeout(resolve, 150));
      res.writeHead(failed ? 403 : 200, { "Content-Type": "application/json", ...(failed ? {} : { "Set-Cookie": `fixture-account=${member ? "member" : "unclaimed"}; Path=/; HttpOnly; SameSite=Lax` }) });
      res.end("{}"); return;
    }
    if (["/", "/team", "/account/password", "/fixture/start"].includes(url.pathname)) {
      const { loadHomeViewer } = await vite.ssrLoadModule("/src/data/home-viewer.ts");
      const runtime = await vite.ssrLoadModule("/qa/account-settings/routing/runtime.ts");
      const headers = new Headers({ cookie: req.headers.cookie ?? "" });
      const viewer = await loadHomeViewer({ member: () => runtime.getProviderUser(headers), account: () => runtime.getVerifiedAccount(headers), hasMembership: async () => false });
      res.writeHead(200, { "Content-Type": "text/html", "Cache-Control": "no-store" });
      res.end(`<!doctype html><html lang="en"><head><title>Offline destination</title></head><body><main data-viewer="${viewer.kind}" data-team="${viewer.teamId ?? ""}"><h1>${url.pathname === "/fixture/start" ? "Fixture start" : url.pathname === "/team" ? "Protected team destination" : url.pathname === "/account/password" ? "Protected password destination" : "Personalized home fixture"}</h1><p>Local synthetic session; no live account operation.</p></main></body></html>`); return;
    }
    if (["/login", "/account/login"].includes(url.pathname) && req.headers.cookie?.includes("fixture-account=")) {
      const next = url.searchParams.get("next");
      res.writeHead(303, { Location: `/account/continue${next ? `?next=${encodeURIComponent(next)}` : ""}`, "Cache-Control": "no-store" }); res.end(); return;
    }
    if (["/login", "/account/login", "/account"].includes(url.pathname)) {
      const html = await vite.transformIndexHtml(req.url, await readFile(path.join(here, "index.html"), "utf8"));
      res.writeHead(200, { "Content-Type": "text/html", "Cache-Control": "no-store" }); res.end(html); return;
    }
    vite.middlewares(req, res, () => { res.statusCode = 404; res.end(); });
  } catch (error) { vite.ssrFixStacktrace(error); console.error(error); res.statusCode = 500; res.end("Fixture error"); }
});
server.listen(4179, "127.0.0.1", () => console.log("Offline routing fixture ready at http://127.0.0.1:4179"));
