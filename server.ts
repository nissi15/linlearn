import { config } from "dotenv";
config({ path: ".env.local", override: true });
config({ path: ".env", override: true });

import { createServer } from "http";
import next from "next";
import { parse } from "url";
import { WebSocketServer, WebSocket } from "ws";
import {
  createSandbox,
  getSandboxDir,
  isCommandSafe,
  sandboxExists,
  SandboxShell,
  spawnShell,
} from "./src/lib/sandbox";
import { addCommand } from "./src/lib/command-log";
import { prisma } from "./src/lib/prisma";

/**
 * Resolve a usable sandbox directory for a progress record, creating it from
 * the lesson's setup commands if it's missing (fresh server, /tmp cleared, …).
 * Returns null when the progress doesn't exist.
 */
async function ensureSandboxForProgress(
  progressId: string
): Promise<string | null> {
  const dir = getSandboxDir(progressId);
  if (sandboxExists(dir)) return dir;

  const progress = await prisma.lessonProgress.findUnique({
    where: { id: progressId },
    include: { lesson: true },
  });
  if (!progress) return null;

  const retry = progress.retryTask as { setupCommands?: string[] } | null;
  const setupCommands =
    retry?.setupCommands ?? (progress.lesson.setupCommands as string[]) ?? [];

  // Lenient: a failing setup command shouldn't block the terminal.
  const created = createSandbox(progressId, setupCommands, true);
  if (progress.sandboxDir !== created) {
    await prisma.lessonProgress.update({
      where: { id: progressId },
      data: { sandboxDir: created },
    });
  }
  return created;
}

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = parseInt(process.env.PORT || "3000", 10);

const shells = new Map<string, SandboxShell>();

function killShell(shell: SandboxShell) {
  try {
    shell.kill();
  } catch (error) {
    console.warn("Failed to kill sandbox shell:", error);
  }
}

app.prepare().then(() => {
  const upgradeHandler = app.getUpgradeHandler();

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || "", true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const url = parse(request.url || "", true);
    const match = url.pathname?.match(/^\/api\/sandbox\/(.+)$/);

    if (!match) {
      // Hand everything else (e.g. Next.js dev HMR at /_next/webpack-hmr)
      // back to Next so the dev runtime and Fast Refresh keep working.
      void upgradeHandler(request, socket, head);
      return;
    }

    const progressId = match[1];

    ensureSandboxForProgress(progressId)
      .then((sandboxDir) => {
        if (!sandboxDir) {
          socket.destroy();
          return;
        }
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request, progressId, sandboxDir);
        });
      })
      .catch((error) => {
        console.error("Failed to prepare sandbox for", progressId, error);
        socket.destroy();
      });
  });

  wss.on(
    "connection",
    (ws: WebSocket, _request: unknown, progressId: string, sandboxDir: string) => {
      const existing = shells.get(progressId);
      if (existing) {
        killShell(existing);
      }

      const shell = spawnShell(sandboxDir);

      shells.set(progressId, shell);

      let currentLine = "";

      shell.onData((data: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });

      ws.on("message", (rawData: Buffer | string) => {
        const input = rawData.toString();

        // Control messages (terminal resize) arrive as JSON; raw keystrokes
        // from xterm are never valid JSON objects, so this is unambiguous.
        if (input.startsWith("{")) {
          try {
            const msg = JSON.parse(input);
            if (msg && Array.isArray(msg.resize)) {
              shell.resize(Number(msg.resize[0]) || 80, Number(msg.resize[1]) || 24);
              return;
            }
          } catch {
            /* not JSON — treat as terminal input below */
          }
        }

        // Best-effort tracking of the line currently being typed, so we can
        // run the safety check and persist commands to the hint context.
        for (const char of input) {
          if (char === "\r" || char === "\n") {
            const trimmed = currentLine.trim();
            currentLine = "";
            if (trimmed && !isCommandSafe(trimmed)) {
              shell.write("\x03"); // Ctrl-C: abandon the typed line in bash
              if (ws.readyState === WebSocket.OPEN) {
                ws.send("\r\n\x1b[31m  ⛔  blocked: unsafe command\x1b[0m\r\n");
              }
              return;
            }
            if (trimmed) {
              void addCommand(progressId, trimmed).catch((error) => {
                console.error("Failed to persist sandbox command:", error);
              });
            }
          } else if (char === "\x7f" || char === "\x08") {
            currentLine = currentLine.slice(0, -1);
          } else if (char >= " ") {
            currentLine += char;
          }
          // other control chars (arrow keys, Ctrl-C, …): not part of the line
        }

        shell.write(input);
      });

      ws.on("close", () => {
        killShell(shell);
        shells.delete(progressId);
      });

      shell.onExit(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
        shells.delete(progressId);
      });
    }
  );

  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
