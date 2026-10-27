# Sentinel: Security Operations Dashboard

A front-end SOC dashboard built with React, TypeScript, Tailwind CSS and Recharts. All data is simulated in the browser.

## Run
```bash
npm install
npm run dev
```

## Features
- Live event feed (new event every 4s, pausable)
- KPI cards, area chart (14 days) and bar chart (by attack type)
- Event table with search, severity filter, sorting, pagination
- Click a status to cycle open → investigating → resolved
- Dark mode (follows system preference)

## Ideas to extend
- Zustand store + TanStack Table
- World map of attack sources
- Event detail drawer
- Unit tests with Vitest + Testing Library
