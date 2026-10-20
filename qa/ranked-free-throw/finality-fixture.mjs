// Private local browser fixture only. The app's finality parser stays real;
// this replaces just the publisher response, never a database/auth/score adapter.
import "../../src/test/arcade/block-external.mjs";
import { readFile } from "node:fs/promises";
const localFetch = globalThis.fetch;
globalThis.fetch = async (input, options) => {
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
  if (url.origin === "https://site.api.espn.com" && url.pathname === "/apis/site/v2/sports/basketball/nba/scoreboard") {
    const fixture = JSON.parse(await readFile(process.env.GOAT_QA_FINALITY_FIXTURE, "utf8"));
    if (url.searchParams.get("dates") !== fixture.date) throw new Error("Unexpected fixture date");
    return Response.json({ events: [{ id: fixture.id, status: { type: fixture.final
      ? { name: "STATUS_FINAL", state: "post", completed: true }
      : { name: "STATUS_IN_PROGRESS", state: "in", completed: false } } }] });
  }
  return localFetch(input, options);
};
