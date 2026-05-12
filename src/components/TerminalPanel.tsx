"use client";

import { useEffect, useRef, useState } from "react";
import type { Terminal as XTerm } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

interface TerminalPanelProps {
  progressId: string;
  visible: boolean;
}

// A dark, Ubuntu-ish 16-colour palette so ANSI output (ls, git, prompts, …)
// renders with proper colours instead of leaking raw escape codes.
const THEME = {
  background: "#08111f",
  foreground: "#dbeafe",
  cursor: "#60a5fa",
  cursorAccent: "#08111f",
  selectionBackground: "#1e3a5f",
  black: "#1e293b",
  red: "#f87171",
  green: "#4ade80",
  yellow: "#fbbf24",
  blue: "#60a5fa",
  magenta: "#c084fc",
  cyan: "#22d3ee",
  white: "#e2e8f0",
  brightBlack: "#64748b",
  brightRed: "#fca5a5",
  brightGreen: "#86efac",
  brightYellow: "#fde047",
  brightBlue: "#93c5fd",
  brightMagenta: "#d8b4fe",
  brightCyan: "#67e8f9",
  brightWhite: "#f8fafc",
};

export default function TerminalPanel({
  progressId,
  visible,
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
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--panel)] flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            connected ? "bg-[var(--success)]" : "bg-[var(--warning)]"
          }`}
        />
        <span className="text-xs font-semibold text-[var(--foreground)]/70 uppercase tracking-wider">
          Terminal
        </span>
        <span className="ml-auto text-[10px] text-[var(--foreground)]/35">
          click and type — it&apos;s a real shell
        </span>
      </div>

      <div
        ref={containerRef}
        onClick={() => termRef.current?.focus()}
        className="flex-1 min-h-0 overflow-hidden bg-[#08111f] p-2 cursor-text"
      />
    </div>
  );
}
