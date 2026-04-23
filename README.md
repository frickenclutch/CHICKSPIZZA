# 🍕 Chick's Pizza — The Best Pizza Game Ever

> A 29-year-old young lady. Tiny kitchen. 4 days a week. 4–8 PM only. 3 months a year.
> And she STILL makes the world's greatest pizza. Nobody knows how.

**Live:** [chickspizza.com](https://chickspizza.com)

## Stack
- React 18 + Vite 4
- Tailwind CSS 3
- lucide-react icons
- Deployed on **Cloudflare Pages**

## Run locally
```bash
npm install
npm run dev
```

Then open the Vite URL it prints.

## Build
```bash
npm run build     # production build to dist/
npm run preview   # serve the built site locally
```

## Deploy
Cloudflare Pages auto-deploys every push to `main`.

- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Node version:** 20 (see `.nvmrc`)

Custom domains (`chickspizza.com` and `www.chickspizza.com`) are wired through the Cloudflare DNS zone for `chickspizza.com`.

## Project layout
```
chicks-pizza/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .nvmrc
├── public/
│   ├── _redirects       # SPA fallback (all routes → index.html)
│   └── _headers         # Security headers + long-cache for hashed assets
└── src/
    ├── main.jsx
    ├── index.css
    └── App.jsx          ← the entire game
```

## Accessibility
The app targets **WCAG 2.2 AA**:
- Skip-to-main-content link, semantic landmarks, focus-visible outlines
- `aria-live` on Chick's commentary so screen readers hear phase changes
- `role="progressbar"` on the three mini-game meters
- Dialog semantics + Escape + focus move/restore on the C4 modal
- `prefers-reduced-motion` honored for the heavier animations

## Features
- 6-stage pizza pipeline with real interactivity
- Tip scoring system, speed bonuses, topping points
- Dynamic Chick quotes per stage
- Confetti + particle effects
- Phone-Unplugged ending when dough runs out
- Wing sauce: with pizza ONLY. No wings. Don't.
