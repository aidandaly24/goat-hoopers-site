import type { Socket } from "node:net";

type TestEnvironment = Readonly<Record<string, string | undefined>>;
const loopbackHost = "127.0.0.1";

function connectionTarget(args: readonly unknown[]): { host: string; port: number } | null {
  // net.createConnection passes Node's normalized [options, listener] array
  // to Socket.connect; pg calls Socket.connect(port, host) directly.
  const values = Array.isArray(args[0]) && args.length === 1 ? args[0] : args;
  const first: unknown = values[0];
  if (typeof first === "number" && typeof values[1] === "string") {
    return { port: first, host: values[1] };
  }
  if (typeof first !== "object" || first === null || Array.isArray(first)) return null;
  const options = first as Record<string, unknown>;
  // Unix sockets and implicit/default hosts are never an integration target.
  const host = options.host;
  const requestedPort = options.port;
  if ("path" in options || typeof host !== "string") return null;
  const port = typeof requestedPort === "number" ? requestedPort
    : typeof requestedPort === "string" && /^\d+$/.test(requestedPort) ? Number(requestedPort) : NaN;
  return { host, port };
}

/** Explicit flags allow only their fixed synthetic TCP target, never a remote host. */
export function createGuardedConnect(original: Socket["connect"], env: TestEnvironment): Socket["connect"] {
  const ports = new Set<number>();
  if (env.RUN_PRICE_HISTORY_LOCAL_TEST === "1") ports.add(55438);
  if (env.RUN_CLAIM_TEAM_LOCAL_TEST === "1") ports.add(55441);
  if (env.GITHUB_ACTIONS === "true" && env.CI === "true" && env.RUN_AI_POSTGRES_TEST === "1") ports.add(55447);

  return function (this: Socket, ...args: unknown[]) {
    const target = connectionTarget(args);
    if (target?.host === loopbackHost && ports.has(target.port)) {
      // Forward only the validated endpoint and connect listener. Caller DNS,
      // path or changing option getters cannot replace the approved target.
      const values = Array.isArray(args[0]) && args.length === 1 ? args[0] : args;
      const listener: unknown = typeof values[0] === "number" ? values[2] : values[1];
      const approved: unknown[] = [target.port, loopbackHost];
      if (typeof listener === "function") approved.push(listener);
      return Reflect.apply(original, this, approved) as Socket;
    }
    // Error after TLS/HTTP/pg register listeners, without calling real connect.
    queueMicrotask(() => this.destroy(new Error(
      "Offline tests cannot use the network; inject a fake client or use an explicit synthetic loopback target",
    )));
    return this;
  };
}
