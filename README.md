# 🍕 Chick's Pizza — The Best Pizza Game Ever

> A 29-year-old young lady. Tiny kitchen. 3 days a week. 4–7 PM only. 3 months a year.
> And she STILL makes the world's greatest pizza. Nobody knows how.

## Deploy to Vercel

### Option A — GitHub + Vercel (Recommended)
1. Create a new GitHub repo and push ALL these files (keep the `src/` folder)
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Vercel auto-detects Vite. Click **Deploy**. Done.

### Option B — Vercel CLI
```bash
npm install -g vercel
npm install
vercel
```

### Option C — Run locally
```bash
npm install
npm run dev
```

## File Structure
```
chicks-pizza/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    └── App.jsx   ← The entire game
```

## Features
- 6-stage pizza pipeline with real interactivity
- 10 unlockable achievements (persisted in localStorage)
- Tip scoring system, speed bonuses, topping points
- Dynamic Chick quotes per stage
- Confetti + particle effects
- Phone Unplugged ending when dough runs out
- Wing sauce: with pizza ONLY. No wings. Don't.
