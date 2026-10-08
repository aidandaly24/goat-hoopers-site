import { Socket } from "node:net";

// Fail before a real request or database connection can leave the test worker.
// Tests can still inject fake fetches/clients at the existing data-layer seams.
const offlineError = () => new Error("Offline tests cannot use the network; inject a fake client instead");

globalThis.fetch = async () => { throw offlineError(); };
Socket.prototype.connect = function (this: Socket) {
  // Use the stream's normal error event so clients can release pooled slots.
  // Let TLS/HTTP finish registering listeners before destroying the socket.
  // No original connect() is called, so no connection is attempted.
  queueMicrotask(() => this.destroy(offlineError()));
  return this;
};

// Do not let a developer's ambient application credentials affect fixtures.
delete process.env.DATABASE_URL;
delete process.env.PRICE_HISTORY_IMPORT_URL;
