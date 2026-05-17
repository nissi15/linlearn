"use client";

import { useEffect, useRef, useState } from "react";
import type { Terminal as XTerm } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

interface TerminalPanelProps {
  progressId: string;
  visible: boolean;
  onDone?: () => void;
  donePending?: boolean;
}

// A dark, Ubuntu-ish 16-colour palette so ANSI output (ls, git, prompts, …)
// renders with proper colours instead of leaking raw escape codes.
const THEME = {
  background: "#060706",
  foreground: "#f3f1e8",
  cursor: "#ff5a1f",
  cursorAccent: "#060706",
  selectionBackground: "#3d4038",
  black: "#111211",
  red: "#ff6464",
  green: "#76f06a",
  yellow: "#d8c36b",
  blue: "#9aa8a2",
  magenta: "#b8a7a0",
  cyan: "#9fb9ac",
  white: "#f3f1e8",
  brightBlack: "#737067",
  brightRed: "#ff8a63",
  brightGreen: "#a2ff95",
  brightYellow: "#ffe28a",
  brightBlue: "#c6d4cf",
  brightMagenta: "#d4c2bc",
  brightCyan: "#c3ded1",
  brightWhite: "#ffffff",
};

export default function TerminalPanel({
  progressId,
  visible,
  onDone,
  donePending = false,
}: TerminalPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const termRef = useRef<XTerm | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!visible || !containerRef.current) return;

    let disposed = false;
    let resizeObserver: ResizeObserver | undefined;

    (async () => {
      // Loaded lazily so xterm's DOM code never runs during SSR.
      const [{ Terminal }, { FitAddon }] = await Promise.all([
        import("@xterm/xterm"),
        import("@xterm/addon-fit"),
      ]);
      if (disposed || !containerRef.current) return;

      const term = new Terminal({
        convertEol: true,
        cursorBlink: true,
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
        fontSize: 13,
        lineHeight: 1.2,
        scrollback: 5000,
        theme: THEME,
      });
      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(containerRef.current);
      try {
        fit.fit();
      } catch {
        /* container not measured yet — harmless */
      }
      termRef.current = term;

      const sendResize = () => {
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ resize: [term.cols, term.rows] }));
        }
      };

      resizeObserver = new ResizeObserver(() => {
        try {
          fit.fit();
          sendResize();
        } catch {
          /* ignore */
        }
      });
      resizeObserver.observe(containerRef.current);

      term.write("\x1b[90mOpening sandbox terminal…\x1b[0m\r\n");

      const protocol =
        window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(
        `${protocol}//${window.location.host}/api/sandbox/${progressId}`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        sendResize();
        term.focus();
      };
      ws.onmessage = (event) => {
        if (typeof event.data === "string") term.write(event.data);
      };
      ws.onerror = () => {
        term.write("\r\n\x1b[31mTerminal connection failed.\x1b[0m\r\n");
      };
      ws.onclose = () => {
        setConnected(false);
        term.write("\r\n\x1b[90mDisconnected.\x1b[0m\r\n");
      };

      // Forward every keystroke straight to the shell.
      term.onData((data) => {
        const sock = wsRef.current;
        if (sock && sock.readyState === WebSocket.OPEN) sock.send(data);
      });
    })();

    return () => {
      disposed = true;
      setConnected(false);
      resizeObserver?.disconnect();
      try {
        wsRef.current?.close();
      } catch {
        /* ignore */
      }
      wsRef.current = null;
      try {
        termRef.current?.dispose();
      } catch {
        /* ignore */
      }
      termRef.current = null;
    };
  }, [progressId, visible]);

  if (!visible) return null;

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2 bg-black/10">
        <div
          className={`w-3 h-3 ${
            connected ? "bg-[var(--success)]" : "bg-[var(--warning)]"
          }`}
        />
        <span className="obsidian-label">
          Terminal
        </span>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden xl:inline text-[10px] uppercase text-[var(--foreground)]/35">
            click and type - it&apos;s a real shell
          </span>
          {onDone && (
            <button
              type="button"
              onClick={onDone}
              disabled={donePending}
              className="obsidian-action obsidian-label obsidian-success shrink-0 px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            >
              {donePending ? "Checking..." : "Done"}
            </button>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        onClick={() => termRef.current?.focus()}
        className="flex-1 min-h-0 overflow-hidden bg-[#060706]/95 p-3 cursor-text"
      />
    </div>
  );
}
