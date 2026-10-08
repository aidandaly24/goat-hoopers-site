import { Socket } from "node:net";
import { createGuardedConnect } from "./network-guard";

// Fail before a real request or database connection can leave the test worker.
// Tests can still inject fake fetches/clients at the existing data-layer seams.
const offlineError = () => new Error("Offline tests cannot use the network; inject a fake client instead");

globalThis.fetch = async () => { throw offlineError(); };
Socket.prototype.connect = createGuardedConnect(Socket.prototype.connect, process.env);

// Do not let a developer's ambient application credentials affect fixtures.
delete process.env.DATABASE_URL;
delete process.env.PRICE_HISTORY_IMPORT_URL;
