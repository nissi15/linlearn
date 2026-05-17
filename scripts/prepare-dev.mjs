/**
 * Prepare the local development environment before the app server starts.
 *
 * This intentionally uses local tool paths instead of npx/tsx shims so it works
 * in Windows shells with restrictive PowerShell execution policies.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const binDir = path.join(root, "node_modules", ".bin");
const prisma = path.join(binDir, process.platform === "win32" ? "prisma.cmd" : "prisma");

function run(label, command, args) {
  console.log(`\n> ${label}`);

  const useShell = process.platform === "win32" && command.endsWith(".cmd");
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: useShell,
    windowsHide: true,
    env: {
      ...process.env,
      PATH: `${binDir}${path.delimiter}${process.env.PATH ?? ""}`,
    },
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("Checking database proxy", process.execPath, ["scripts/ensure-database.mjs"]);
run("Applying database migrations", prisma, ["migrate", "deploy"]);
run("Seeding starter content", prisma, ["db", "seed"]);
