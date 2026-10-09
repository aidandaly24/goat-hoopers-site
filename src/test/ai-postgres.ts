import { Socket } from "node:net";
import { createGuardedConnect } from "./network-guard";

if (process.env.GITHUB_ACTIONS !== "true" || process.env.CI !== "true" || process.env.RUN_AI_POSTGRES_TEST !== "1") throw new Error("Disposable AI PostgreSQL CI opt-in is required");
globalThis.fetch = async () => { throw new Error("AI PostgreSQL tests cannot fetch providers or remote resources"); };
// Other local integration flags deliberately do not enter this guard.
Socket.prototype.connect = createGuardedConnect(Socket.prototype.connect, {
  GITHUB_ACTIONS: "true", CI: "true", RUN_AI_POSTGRES_TEST: "1",
});
delete process.env.DATABASE_URL;
delete process.env.PRICE_HISTORY_IMPORT_URL;
delete process.env.OPENAI_API_KEY;
delete process.env.GOAT_AI_DECIDES_ENABLED;
