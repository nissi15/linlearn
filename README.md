# Linux Tutor

A Boot.dev-style interactive Linux tutor. Pick a topic → work through lessons in
a 3-pane workspace (lesson reference · task + AI chat · live shell) → an AI
verifies your work in a real sandbox and gives feedback. Built with Next.js 16,
TypeScript, Prisma + PostgreSQL, a WebSocket-backed terminal, and the Anthropic
API.

## Requirements

- **Node.js 20+**
- **PostgreSQL** running somewhere you can point a connection string at
- **An Anthropic API key** — lessons, hints, the Q&A chat, and answer
  verification all call Claude
- A native toolchain for [`node-pty`](https://github.com/microsoft/node-pty)
  (the terminal):
  - **Linux:** `sudo apt install build-essential python3`
  - **macOS:** Xcode command-line tools
  - **Windows:** the app shells out to **WSL** for the sandbox, so you need WSL
    with a Linux distro installed; build tools come via `windows-build-tools` /
    Visual Studio Build Tools

> The lesson sandbox runs `bash` directly on Linux/macOS, and via `wsl.exe` on
> Windows — no other setup difference.

## Setup

```bash
git clone <this-repo>
cd linux-tutor

cp .env.example .env          # then edit .env: DATABASE_URL + ANTHROPIC_API_KEY

npm install                   # also builds node-pty and runs `prisma generate`

npx prisma migrate deploy     # create the tables (or: npx prisma db push)
npx tsx prisma/seed.ts        # seed the starter topic + lessons

npm run dev                   # http://localhost:3000
```

`.env` is git-ignored — your database URL and API key never get committed.

## How it works

- `npm run dev` runs a custom server (`server.ts`) that wraps Next.js and adds a
  WebSocket endpoint (`/api/sandbox/:progressId`) bridging the browser terminal
  ([xterm.js](https://xtermjs.org/)) to a PTY-backed `bash` in a per-attempt
  sandbox directory under `/tmp/lessons/`.
- Lesson flow lives in `src/lib/orchestrator.ts`: open a lesson → it lands you in
  the task workspace → you work in the terminal → type `done` and an AI verifier
  checks your sandbox against the lesson's success criteria → pass and move on,
  or get a short pointer and keep going. You can also ask the tutor questions in
  the chat at any time (and dig deeper after you've passed).
- Prompts to Claude are in `src/lib/prompts/`; the Anthropic wrapper is
  `src/lib/claude.ts`.

## Project layout

| Path | What |
| --- | --- |
| `server.ts` | HTTP + WebSocket server (the `dev` script's entry point) |
| `prisma/` | Schema, migrations, and `seed.ts` |
| `src/lib/orchestrator.ts` | Core lesson state machine |
| `src/lib/sandbox.ts` | Sandbox dir creation + PTY shell (bash / WSL) |
| `src/lib/claude.ts`, `src/lib/prompts/` | Anthropic calls |
| `src/components/` | UI — `LessonClient`, `ChatPanel`, `TerminalPanel`, … |
| `src/app/` | Routes — home, `/lesson/[progressId]`, `/topic-test/[topicId]`, API routes |

## Scripts

- `npm run dev` — dev server (`tsx server.ts`)
- `npm run build` / `npm start` — production build / serve
- `npm run lint` — ESLint
- `npx prisma studio` — browse the DB
