# CLAUDE.md — SustainAI Website

## Project Overview

**SustainAI** is a local-first AI platform for agriculture and field environments. This repository is the marketing and product showcase website — it explains the product, showcases the architecture, highlights use cases, and includes an interactive demo dashboard.

**Stack**: Pure HTML/CSS/JS frontend + FastAPI Python backend, deployed serverlessly on Vercel.

---

## Repository Structure

```
Website/
├── api/
│   └── index.py          # FastAPI backend (contact form, health check)
├── css/
│   ├── styles.css        # Main site styles (design system + layout)
│   └── demo.css          # Dashboard demo styles
├── js/
│   ├── main.js           # Main site JS (animations, forms, modals)
│   └── demo.js           # Demo dashboard logic (simulations, charts)
├── images/               # Team photos (Deepak, Yingling, Nahed, etc.)
├── New/                  # Backup/dev directory — do not touch unless asked
├── index.html            # Main marketing site (856 lines)
├── demo.html             # Interactive product dashboard demo (491 lines)
├── vercel.json           # Vercel deployment config
├── requirements.txt      # Python dependencies
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML5, CSS3, ES6+ JavaScript (no frameworks) |
| Backend | FastAPI (Python), Uvicorn (ASGI) |
| Hosting | Vercel (static assets + serverless functions) |
| Email | Resend API (primary), Web3Forms (contact form fallback) |
| Fonts | Google Fonts — Fraunces (headings), Outfit (body), JetBrains Mono (code) |

No Node.js. No npm. No build step. No React, Vue, or any JS framework.

---

## Running Locally

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run API server (if testing backend)
uvicorn api.index:app --reload

# Frontend: just open index.html in a browser — no build needed
```

---

## Key Files

### index.html
Main marketing page with:
- Hero (SENSE → HUB → EDGE architecture diagram with animated SVG lines)
- Problem / Solution sections
- Use cases (water quality, nutrients/runoff, livestock, compliance)
- Operator experience (phone mockups)
- PASTOR proof section (technical metrics)
- Team section (photos from `images/`)
- CTA section
- Contact form modal (uses Web3Forms API)
- Demo waitlist modal

### demo.html
Interactive product dashboard with 4 tabbed views:
1. **Operations** — live sensor readings, bar chart, ML anomaly detection, LLM reasoning log
2. **Hardware Nodes** — node status
3. **Intelligence Logs** — AI decision history
4. **Compliance** — compliance reporting

### css/styles.css
Design system using CSS custom properties:
- Primary green: `#1b3a23` (dark), `#4db866` (bright)
- Background: `#f5fbf6`
- Breakpoints: `768px` (tablet), `600px` (mobile)
- Scroll-reveal classes: `.sr`, `.sr-scale`, `.sr-left`, `.sr-right`

### js/main.js
- IntersectionObserver-based scroll reveals and count-up animations
- Debounced scroll listener (requestAnimationFrame)
- Modal open/close + Escape key support
- Contact form → Web3Forms API submission
- Mobile hamburger menu

### js/demo.js
- Sensor data simulation (updates every 2.5s with small random variations)
- Anomaly spike simulation — 5-step workflow:
  1. Hardware detects spike (conductivity +40%)
  2. ML detects anomaly (98% confidence)
  3. System alert fires
  4. LLM reasons locally (typewriter effect output)
  5. User action buttons unlock
- Bar chart rendering with spike visualization
- Tab navigation, mobile drawer

### api/index.py
FastAPI app serving:
- `GET /api/health` — health check
- `POST /api/contact` — contact form handler (validates via Pydantic, emails via Resend)
- Static files: CSS, JS, images
- HTML pages: `/` → `index.html`, `/demo` → `demo.html`

Resend API key read from environment variable. Falls back gracefully if key missing.

---

## Deployment

Vercel handles everything:
- Python API is a serverless function built by `@vercel/python`
- Static assets served by `@vercel/static`
- `/api/*` routes rewritten to `api/index.py`
- `/demo` rewritten to `demo.html`
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, strict referrer policy
- API endpoints: `Cache-Control: no-cache, no-store`

Push to `main` branch triggers auto-deploy.

---

## Design Conventions

- **No CSS frameworks** — all styles are hand-written with CSS variables
- **Glassmorphism panels** — `backdrop-filter: blur()` + semi-transparent backgrounds
- **Scroll animations** — add `.sr` (or variant) class to an element; JS adds `.visible` on scroll
- **Modals** — controlled via JS `openModal()` / `closeModal()` functions in `main.js`
- **Responsive** — mobile-first with hamburger nav at 768px and single-column at 600px
- **Accessibility** — ARIA labels, semantic HTML, keyboard support, skip link

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Resend email delivery for contact form |

Set in Vercel dashboard under project settings → environment variables.

---

## What NOT to Do

- Do not add Node.js, npm, or any JS framework — the vanilla approach is intentional
- Do not modify files in `New/` unless explicitly asked — it is a backup/dev directory
- Do not add analytics or tracking scripts — the site intentionally has none
- Do not change the font stack without updating Google Fonts imports in HTML `<head>`
- Do not introduce a build step — the project deploys as-is from source files
