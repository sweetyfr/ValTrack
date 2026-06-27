# ValTrack — Valorant Stats Tracker

A full-stack Valorant player analytics dashboard. Search any player by Riot ID to view their rank, last 50 matches, KDA trends, agent/map breakdowns, performance insights, and a downloadable stat card.

**Live Demo:** https://val-track-zeta.vercel.app  
**Source:** github.com/sweetyfr/ValTrack

---

## Features

- Search any Valorant player by name + tag (region auto-detected)
- Current rank, RR, and peak rank with icons
- Last 50 competitive matches — no act restriction
- Per-match expandable scorecards with full team rosters
- Agent and map breakdown tables — sortable by WR, KDA, HS%, ADR
- Insights card — best agent, best map, overall stats
- Performance trend — compares last 10 games against overall average
- Rank history bar chart (last 10 games, RR gained/lost per game)
- Player comparison — search a second player to compare side-by-side
- Shareable stat card — generates a downloadable image via Canvas API
- Recent searches saved to localStorage (up to 8 players)
- Dark / light theme toggle
- In-memory caching (5 min TTL) to respect API rate limits
- Multi-region support: NA, EU, AP, KR, LATAM, BR

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, React Router v7, Recharts |
| Backend | Node.js, Express |
| Data APIs | Henrik's Unofficial Valorant API (v3), valorant-api.com |
| Styling | Custom CSS with CSS variables (no UI framework) |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Project Structure

```
valtrack/
├── backend/
│   ├── server.js        # Express proxy server with in-memory caching
│   ├── .env             # API keys (never commit this!)
│   └── package.json
└── frontend/
    └── src/
        ├── pages/
        │   ├── Home.jsx          # Search page + recent searches
        │   └── Profile.jsx       # Full player profile orchestrator
        ├── components/
        │   ├── PlayerHeader      # Name, level, rank, recent form dots
        │   ├── PlayerInsights    # Best agent, best map, overview stats
        │   ├── StatsOverview     # Win rate, KDA, HS%, ADR (filterable)
        │   ├── PerformanceTrend  # Last 10 vs overall KDA & win rate
        │   ├── RankHistory       # RR change bar chart (last 10 games)
        │   ├── MatchHistory      # Expandable match list with filters
        │   ├── Scorecard         # Full match team scorecard
        │   ├── BreakdownTables   # Agent + map breakdown tabs
        │   ├── PlayerComparison  # Side-by-side player comparison
        │   ├── ShareCard         # Canvas-based downloadable stat card
        │   └── ThemeToggle       # Dark / light mode switch
        └── utils/
            ├── api.js            # All API calls + extractPlayerStats()
            └── useFavourites.js  # localStorage recent searches hook
```

---

## Getting Started

### 1. Get a free API key

1. Join the Henrik Dev Discord: https://discord.gg/henrikdev
2. Go to the `#get-key` channel — a Basic key is issued instantly

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder:
```
HENRIK_API_KEY=your_key_here
```

Then start the server:
```bash
npm run dev    # runs on http://localhost:5001
```

### 3. Set up the frontend

```bash
cd frontend
npm install
npm start      # runs on http://localhost:3000
```

### 4. Search a player

Open [http://localhost:3000](http://localhost:3000), enter a Riot ID like `TenZ` with tag `na1`, and hit Search.

---

## Backend API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/player/:name/:tag` | Account info + region |
| GET | `/api/mmr/:region/:name/:tag` | Current rank, RR, and peak |
| GET | `/api/matches/:region/:name/:tag` | Last 50 matches (paginated) |
| GET | `/api/mmr-history/:region/:name/:tag` | RR history for rank chart |
| GET | `/api/agents` | All playable agents + images |
| GET | `/api/tiers` | Competitive tier icons |
| GET | `/api/maps` | Map images |
| GET | `/api/health` | Health check |

Pass `?size=N` to the matches endpoint to request a specific count (default 50, max 50).

---

## Deployment

- **Frontend** → [Vercel](https://vercel.com) — set `REACT_APP_API_URL` to your backend URL
- **Backend** → [Render](https://render.com) — set `HENRIK_API_KEY` in environment variables

---

## Disclaimer

This project is not affiliated with or endorsed by Riot Games. Valorant and all related marks are trademarks of Riot Games, Inc.
