import * as pty from "node-pty";
import * as fs from "fs";
import { execFileSync } from "child_process";

const isWindows = process.platform === "win32";

export interface SandboxShell {
  write(data: string): void;
  resize(cols: number, rows: number): void;
  kill(): void;
  onData(callback: (data: string) => void): void;
  onExit(callback: () => void): void;
}

export function getSandboxDir(sessionId: string): string {
  return `/tmp/lessons/${sessionId}`;
}

function runInSandbox(dir: string, cmd: string): string {
  if (isWindows) {
    return execFileSync("wsl.exe", ["--cd", dir, "--exec", "bash", "-lc", cmd])
      .toString()
      .trim();
  }

  return execFileSync("bash", ["-lc", cmd], { cwd: dir }).toString().trim();
}

export function ensureSandboxDir(sessionId: string): string {
  const dir = getSandboxDir(sessionId);

  if (isWindows) {
    execFileSync("wsl.exe", ["--exec", "mkdir", "-p", dir]);
  } else {
    fs.mkdirSync(dir, { recursive: true });
  }

  return dir;
}

export function sandboxExists(dir: string): boolean {
  if (isWindows) {
    try {
      execFileSync("wsl.exe", ["--exec", "test", "-d", dir]);
      return true;
    } catch {
      return false;
    }
  }

  return fs.existsSync(dir);
}

export function createSandbox(
  sessionId: string,
  setupCommands: string[],
  lenient = false
): string {
  const dir = ensureSandboxDir(sessionId);

  for (const cmd of setupCommands) {
    try {
      runInSandbox(dir, cmd);
    } catch (e) {
      if (!lenient) throw e;
      console.warn(`Setup command failed (lenient): ${cmd}`, e);
    }
  }

  return dir;
}

export function spawnShell(dir: string): SandboxShell {
  // Use a real pseudo-terminal on both platforms so bash gives us a TTY:
  // local echo, line editing, history, Ctrl-C, colours — i.e. you can type
  // directly into the terminal. On Windows we drive WSL bash through ConPTY.
  const shell = isWindows
    ? pty.spawn("wsl.exe", ["--cd", dir, "-e", "bash", "-i"], {
        name: "xterm-256color",
        cols: 80,
        rows: 24,
        cwd: process.cwd(),
        env: { ...process.env },
      })
    : pty.spawn("bash", ["-i"], {
        name: "xterm-256color",
        cols: 80,
        rows: 24,
        cwd: dir,
        env: { ...process.env, HOME: dir },
      });

  return {
    write(data: string) {
      shell.write(data);
    },
    resize(cols: number, rows: number) {
      try {
        shell.resize(Math.max(cols, 1), Math.max(rows, 1));
      } catch {
        /* shell may have exited — ignore */
      }
    },
    kill() {
      shell.kill();
    },
    onData(callback: (data: string) => void) {
      shell.onData(callback);
    },
    onExit(callback: () => void) {
      shell.onExit(() => callback());
    },
  };
}

const BLOCKED = [/sudo\b/, /rm\s+-rf\s+\//, /\.\.\/\.\.\//, /:\(\)\s*\{/];

export function isCommandSafe(cmd: string): boolean {
  return !BLOCKED.some((re) => re.test(cmd));
}

export async function inspectState(
  dir: string,
  checks: Array<{ check_command: string; expected_output: string; description: string }>
): Promise<Array<{ check_command: string; expected_output: string; description: string; actual: string; passed: boolean }>> {
  return checks.map((c) => {
    try {
      const actual = runInSandbox(dir, c.check_command);
      return { ...c, actual, passed: actual === c.expected_output };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ...c, actual: `ERROR: ${msg}`, passed: false };
    }
  });
}
