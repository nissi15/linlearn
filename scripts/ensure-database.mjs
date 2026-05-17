/**
 * On Windows + WSL Postgres, starts the TCP proxy (5433 -> 127.0.0.1:5432)
 * so Prisma can reach the DB from the host. No-op on Linux/macOS.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import net from "node:net";

if (process.platform !== "win32") {
  process.exit(0);
}

function canConnect(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const done = (ok) => {
      socket.destroy();
      resolve(ok);
    };

    socket.setTimeout(1_000);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

if (await canConnect("127.0.0.1", 5433)) {
  console.log("Postgres proxy already reachable at 127.0.0.1:5433.");
  process.exit(0);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const proxyScript = path.join(scriptDir, "start-wsl-pg-proxy.ps1");

const result = spawnSync(
  "powershell",
  ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", proxyScript],
  { stdio: "inherit", windowsHide: true },
);

process.exit(result.status ?? 1);
