// Reuse the production fixture's fetch guard, then guard raw TCP/TLS connects.
import '../../src/test/arcade/block-external.mjs';
import net from 'node:net';
const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const value = args[0];
  const options = Array.isArray(value) ? value[0] : value;
  const host = typeof options === 'object' && options !== null ? options.host : typeof args[1] === 'string' ? args[1] : undefined;
  const socketPath = typeof options === 'object' && options !== null ? options.path : typeof options === 'string' ? options : undefined;
  if (socketPath || host !== '127.0.0.1') throw Error('Ticker fixture blocks non-loopback and Unix socket connections');
  return connect.apply(this, args);
};
