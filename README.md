# HabitForge Lite 🚀

A beautiful, production-ready personal productivity dashboard built with Next.js App Router, using a **private GitHub repository as the database**.

## ✨ Features

- 📊 **Dashboard** — Animated stats, weekly focus chart, quick navigation
- 📂 **Categories** — Hierarchical categories → subcategories with icons and colors
- ✅ **Tasks** — Full CRUD with priority, duration targets, search and filter
- ⏱️ **Focus Timer** — Circular progress timer with session saving
- 📋 **Daily Logs** — Date-navigable logs with completion tracking
- 📈 **Analytics** — Weekly/monthly trends, heatmap, category breakdowns (Recharts)
- 🔐 **Auth** — Password-based login with JWT HTTP-only cookies
- 📱 **Responsive** — Mobile-first, works on all screen sizes

## 🏗️ Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router) |
| Language | JavaScript |
| State | Zustand |
| Charts | Recharts |
| GitHub API | Octokit |
| Auth | JWT via `jose` |
| Styling | Plain CSS Modules |
| Deployment | Vercel |

## 📁 Project Structure

```
├── app/
│   ├── (app)/            # Protected pages (dashboard, tasks, etc.)
│   ├── api/              # Server-side API routes
│   ├── login/            # Auth page
│   └── globals.css       # Design system
├── components/
│   ├── AppShell/
│   ├── Navbar/
│   └── Sidebar/
├── lib/
│   ├── github.js         # Octokit GitHub wrapper
│   ├── storage.js        # Data access layer
│   ├── analytics.js      # Analytics calculations
│   └── auth.js           # JWT session utilities
└── store/
    └── appStore.js       # Zustand global store
```

## ⚙️ Setup

### 1. Clone & Install

```bash
git clone <your-repo>
cd habitforgelite
npm install
```

### 2. Create Private GitHub Repository

Create a **new private repository** on GitHub (e.g., `habitforge-data`). This will store all your data as JSON files.

### 3. GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate a new token with **`repo`** scope
3. Copy the token

### 4. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars
APP_PASSWORD=your-custom-password
GITHUB_TOKEN=ghp_your_token_here
GITHUB_OWNER=your-github-username
GITHUB_REPO=habitforge-data
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your `APP_PASSWORD`.

## 🚀 Deploy to Vercel

1. Push your code to GitHub
2. Import the project on [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.local` in Vercel's dashboard
4. Deploy!

## 📊 Data Structure

All data is stored as JSON in your private GitHub repo:

```
habitforge-data/
├── data/
│   ├── categories.json
│   ├── subcategories.json
│   ├── tasks.json
│   └── logs/
│       ├── 2026-05-18.json
│       └── 2026-05-19.json
```

## 🔐 Security

- GitHub token is **never exposed to the frontend** — all GitHub API calls go through Next.js API routes
- Sessions are stored in **HTTP-only cookies** (not accessible via JavaScript)
- Middleware protects all pages and API routes
- JWT expires after 7 days

## 🎨 Design

- Color theme: **Graphite (#2b2b2b)** + **Pastel Pink (#febfca)**
- Dark mode by default
- Glassmorphism effects
- Smooth micro-animations
- Fully responsive (mobile → desktop)
