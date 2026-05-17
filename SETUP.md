# Linux Tutor - Installation & Setup Guide

A mastery-based Linux concept tutor with hands-on practice, powered by Claude AI and Next.js with a custom sandbox environment.

## Table of Contents
- [Requirements](#requirements)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Features](#features)
- [Troubleshooting](#troubleshooting)

## Requirements

### System Requirements
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **PostgreSQL**: v12.0 or higher (running and accessible)
- **Git**: for version control
- **Windows/Linux/macOS**: with bash or PowerShell support

### Required Ports
- **3000**: Next.js dev server (web application)
- **5433**: PostgreSQL proxy (database)
- **5432**: PostgreSQL database (if running locally)

## Environment Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd linlearn
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Environment Files

Create `.env.local` in the root directory:
```env
# Anthropic API Configuration
ANTHROPIC_API_KEY=your_api_key_here

# Database Configuration (if using local PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/linuxtutor
```

Create `.env` in the root directory:
```env
# Public environment variables (visible to frontend)
NEXT_PUBLIC_APP_NAME=LINLEARN
```

### 4. Get Anthropic API Key
1. Visit [Anthropic Console](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy the key to `.env.local` as `ANTHROPIC_API_KEY`

## Database Setup

### Option A: Using WSL PostgreSQL (Windows)

The application includes a built-in PostgreSQL proxy for WSL. It will automatically:
1. Detect WSL PostgreSQL on startup
2. Create the database if it doesn't exist
3. Apply migrations

**Prerequisites**: WSL 2 with PostgreSQL installed
```bash
# In WSL
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start

# Create database
sudo -u postgres createdb linuxtutor
```

### Option B: Using Docker PostgreSQL

```bash
# Start PostgreSQL in Docker
docker run --name linuxtutor-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=linuxtutor \
  -p 5432:5432 \
  -d postgres:15
```

Update `DATABASE_URL` in `.env.local`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/linuxtutor
```

### Option C: Local PostgreSQL Installation

1. Install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)
2. Create database:
   ```bash
   createdb linuxtutor
   ```
3. Update `DATABASE_URL` in `.env.local`

## Installation

### 1. Install Project Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create `.env.local`:
```env
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/linuxtutor
```

### 3. Run Database Migrations
Migrations run automatically on server startup via `scripts/prepare-dev.mjs`, but you can manually run:
```bash
npx prisma migrate deploy
```

### 4. Seed Initial Content
Initial content (File Permissions topic with lessons) is seeded automatically on server startup.

## Running the Application

### Development Mode
```bash
npm run dev
```

The application will:
1. Start PostgreSQL proxy (if using WSL)
2. Apply database migrations
3. Seed starter content
4. Start the Next.js dev server on `http://localhost:3000`

### Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```

### Stopping the Server
Press `Ctrl+C` in the terminal running the dev server.

## Project Structure

```
linlearn/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home page with topic list
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Global styles & Sora font
│   │   ├── lesson/
│   │   │   └── [progressId]/
│   │   │       └── page.tsx      # Lesson page with chat
│   │   ├── topic-test/
│   │   │   └── [topicId]/
│   │   │       └── page.tsx      # Topic assessment page
│   │   └── api/
│   │       └── lesson/
│   │           └── [progressId]/
│   │               ├── message    # Chat message endpoint
│   │               └── hint       # Hint request endpoint
│   ├── components/
│   │   ├── LessonHeader.tsx       # Header with nav & music controls
│   │   ├── LessonClient.tsx       # Main lesson component
│   │   ├── ChatPanel.tsx          # Tutor chat interface
│   │   ├── TerminalPanel.tsx      # Linux terminal sandbox
│   │   ├── MusicPlayer.tsx        # YouTube music player
│   │   ├── ConfidenceBadge.tsx    # Confidence indicator
│   │   ├── Markdown.tsx           # Markdown renderer
│   │   └── BackgroundMusic.tsx    # Ambient background audio
│   └── lib/
│       ├── prisma.ts             # Database client
│       ├── sandbox.ts            # Linux sandbox utilities
│       ├── command-log.ts        # Command history
│       └── sound.ts              # Sound effects
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── seed.ts                   # Database seeding script
│   └── migrations/               # Database migrations
├── scripts/
│   └── prepare-dev.mjs           # Pre-dev setup script
├── server.ts                     # Custom HTTP server with WebSockets
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript config
├── package.json                  # Dependencies & scripts
├── .env.example                  # Example environment variables
├── README.md                     # Project overview
└── SETUP.md                      # This file
```

## Features

### 1. Interactive Lessons
- Step-by-step guided learning
- Real-time tutor feedback via Claude AI
- Confidence tracking (0-10 scale)

### 2. Linux Sandbox
- Safe, isolated Linux terminal environment
- Auto-setup for each lesson (setup commands)
- Command validation and success criteria checking

### 3. Music & Sound
- **Background Music**: Two curated tracks via YouTube
  - Claude FM (ambient)
  - Lock In | Build the Future (upbeat)
- **Sound Effects**: Click sounds and tutor response notifications
- **Volume Control**: Adjustable music volume (0-100%)
- **Toggle Settings**: Enable/disable sound effects

### 4. Progress Tracking
- Topic completion percentage
- Per-lesson confidence scores
- Lesson status (locked/in-progress/completed)

### 5. Topic Tests
- Assessment after completing all lessons in a topic
- Tests understanding of core concepts
- Feedback on performance

### 6. Responsive Design
- Sora font for modern typography
- Dark obsidian theme
- Mobile-friendly layout
- Collapsible panels

## Troubleshooting

### Issue: "Cannot find module" errors
**Solution**: Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Database connection fails
**Check**:
1. PostgreSQL is running:
   ```bash
   # Linux/macOS
   pg_isready
   
   # Windows (WSL)
   sudo service postgresql status
   ```
2. `DATABASE_URL` is correct in `.env.local`
3. Database exists:
   ```bash
   psql -l | grep linuxtutor
   ```

### Issue: Port 3000 already in use
**Solution**: Kill process using port 3000
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows (PowerShell)
Get-Process -Name node | Stop-Process -Force
```

### Issue: Anthropic API errors
**Check**:
1. `ANTHROPIC_API_KEY` is set in `.env.local`
2. API key is valid and not expired
3. Account has API credits

### Issue: No music playing
**Solution**:
1. Click the **▶ button** in top-right corner
2. Click **⚙** settings to adjust volume
3. Check browser console (F12) for errors
4. Ensure volume is not muted (browser/system)

### Issue: Sound effects not working
**Solution**:
1. Click **⚙ settings** button
2. Toggle "Sound Effects" to enable
3. Click buttons to test sounds
4. Check browser autoplay policy isn't blocking audio

### Issue: Sandbox terminal not responding
**Solution**:
1. Reload the page
2. Check system has enough disk space (`/tmp`)
3. Verify bash/sh is available in system PATH

## Development Notes

### Technology Stack
- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Next.js API routes, WebSockets
- **Database**: PostgreSQL, Prisma ORM
- **AI**: Anthropic Claude API
- **Sandbox**: Linux shell via child_process
- **Styling**: Sora font, custom CSS variables (obsidian theme)

### Key API Endpoints
- `POST /api/lesson/[progressId]/message` - Send chat message
- `POST /api/lesson/[progressId]/hint` - Request hint
- `POST /api/lesson/[progressId]/validate` - Validate task completion
- WebSocket: `/api/sandbox/[progressId]` - Terminal communication

### Adding New Lessons
1. Update `prisma/seed.ts` with new lesson data
2. Run: `npm run db:seed`
3. Topics and lessons are created in the database

### Customizing Theme
Edit `src/app/globals.css`:
- CSS variables in `:root` section
- Colors: `--background`, `--foreground`, `--accent`, `--success`, `--warning`, `--error`
- Update Sora font import if needed

## Support & Contribution

For issues, questions, or improvements:
1. Check this SETUP.md file
2. Review the code comments
3. Check git history for context
4. Create an issue with reproduction steps

---

**Last Updated**: 2026-05-17
**Version**: 1.0.0
