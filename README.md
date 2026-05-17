# Linux Tutor

An interactive Linux tutor. Pick a topic, work through lessons in a three-pane
workspace, use a live shell, and let the AI tutor verify your work in a real
sandbox.

Built with Next.js 16, TypeScript, Prisma, PostgreSQL, xterm.js, node-pty, and
the Anthropic API.

## Requirements

- Node.js 20+
- PostgreSQL
- An Anthropic API key
- Windows only: WSL with Ubuntu or another Linux distro installed

The recommended Windows setup is PostgreSQL inside WSL, exposed to Windows at
`127.0.0.1:5433` by the included proxy script.

## Quick Start

```powershell
git clone <this-repo>
cd linlearn

npm install
copy .env.example .env
```

Edit `.env` and set:

```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/linuxtutor?sslmode=disable"
ANTHROPIC_API_KEY="your-api-key"
```

Then run the app:

```powershell
npm.cmd run dev
```

`npm.cmd run dev` prepares the database automatically:

- checks the WSL Postgres proxy
- applies Prisma migrations
- seeds starter lessons
- starts the website at `http://localhost:3000`

If PowerShell blocks `npm`, use `npm.cmd` as shown above.

## Windows + WSL PostgreSQL

Open Ubuntu/WSL and install/start PostgreSQL:

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib python3
sudo service postgresql start
```

Create the database and set the local password:

```bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres createdb linuxtutor 2>/dev/null || true
```

From Windows PowerShell, in the project directory:

```powershell
npm.cmd run db:proxy
```

If the proxy is already running, that is fine. Your `.env` should use:

```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/linuxtutor?sslmode=disable"
```

You can test the proxy from Windows:

```powershell
Test-NetConnection 127.0.0.1 -Port 5433
```

You want:

```text
TcpTestSucceeded : True
```

Then start everything:

```powershell
npm.cmd run dev
```

## Linux/macOS PostgreSQL

Install PostgreSQL with your package manager, then create the database:

```bash
createdb linuxtutor
```

Use this `.env` value:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/linuxtutor"
```

Then:

```bash
npm install
npm run dev
```

## Scripts

- `npm.cmd run dev` - prepare DB, seed data, and start the dev server
- `npm.cmd run db:prepare` - run proxy check, migrations, and seed only
- `npm.cmd run db:proxy` - start/check the Windows-to-WSL Postgres proxy
- `npm.cmd run build` - build for production
- `npm.cmd run start` - start production server
- `npm.cmd run lint` - run ESLint

On Linux/macOS, `npm run ...` is fine. On Windows, `npm.cmd run ...` avoids
PowerShell execution-policy issues.

## Prisma

Prisma configuration lives in `prisma.config.ts`.

Manual database commands:

```powershell
node_modules\.bin\prisma.cmd migrate deploy
node_modules\.bin\prisma.cmd db seed
node_modules\.bin\prisma.cmd studio
```

The seed command uses `node --import tsx prisma/seed.ts`, so it does not depend
on the `tsx` binary being available on PATH.

## Project Layout

| Path | What |
| --- | --- |
| `server.ts` | Custom HTTP + WebSocket server |
| `prisma/` | Schema, migrations, and seed script |
| `prisma.config.ts` | Prisma CLI config |
| `scripts/` | WSL proxy and local DB preparation scripts |
| `src/lib/orchestrator.ts` | Core lesson state machine |
| `src/lib/sandbox.ts` | Sandbox creation and PTY shell |
| `src/lib/claude.ts` | Anthropic API wrapper |
| `src/components/` | UI components |
| `src/app/` | Next.js routes and server actions |

## Troubleshooting

### Prisma cannot reach `127.0.0.1:5433`

Start PostgreSQL inside Ubuntu:

```bash
sudo service postgresql start
```

Then from Windows:

```powershell
npm.cmd run db:proxy
Test-NetConnection 127.0.0.1 -Port 5433
```

### `tsx` is not recognized

Use the configured scripts instead of calling `tsx` directly:

```powershell
npm.cmd run dev
```

or:

```powershell
node_modules\.bin\prisma.cmd db seed
```

### Hydration warning with Grammarly attributes

Warnings containing attributes such as `data-new-gr-c-s-check-loaded` or
`data-gr-ext-installed` usually come from browser extensions. Test in an
Incognito window with extensions disabled to confirm.
