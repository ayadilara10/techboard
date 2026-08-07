# TechBoard
> A data-backed reference showing which technologies developers actually adopt, broken down by category and industry — so a technology choice can be made against real evidence instead of opinion.

**Stack:** Node.js/Express · MySQL · Flask · PHP · nginx · Docker · **Status:** Functional prototype (local)

## Problem

There is no universally correct tech stack. The right tool depends on industry, use case, and what is actually being built. The context needed to make that call is scattered across surveys, blog posts, and forum threads, none of it organized by industry or use case.

TechBoard consolidates that context. It draws on real adoption numbers from Stack Overflow, State of JS, and JetBrains developer surveys and organizes them by category and industry. It does not prescribe a stack — it surfaces the evidence and leaves the decision to the user.

The outcome it targets: a developer reaches a technology decision backed by adoption data rather than anecdote.

## Overview

A full-stack platform of five containerized services. A public dashboard presents adoption data by category and industry; a stack-builder recommends a starting stack for a given industry and product type; an intelligence service scores trends and compares tools; an admin panel manages the underlying data.

## Data

Three developer surveys, seeded into an 8-table relational schema as adoption percentages per tool, per category, over time.

| Survey | Publisher | Respondents | Used for |
| --- | --- | --- | --- |
| Stack Overflow Annual Developer Survey | Stack Overflow | ~90,000/year | Broad technology adoption |
| State of JS | Sacha Greif et al. | ~30,000/year | JavaScript ecosystem |
| JetBrains Developer Ecosystem Survey | JetBrains | ~26,000/year | DevOps, backend, tooling |

Current data is a static seed. Live ingestion is scoped under Roadmap.

## Method

Five services, each with a real, non-trivial role — no technology included to tick a box.

```
                      ┌─────────────────────────────────────────────┐
                      │              Docker Network                  │
Browser               │  ┌──────────────┐     ┌──────────────────┐  │
   │  HTTP :80        │  │  Frontend    │────▶│   Backend        │  │
   └─────────────────▶│  │  nginx       │     │   Node/Express   │  │
                      │  └──────────────┘     └────────┬─────────┘  │
Admin :8080           │  ┌──────────────┐              │ SQL        │
   └─────────────────▶│  │  Admin PHP   │─────────┐    ▼            │
                      │  └──────────────┘     ┌────▼─────────────┐  │
                      │  ┌──────────────┐     │   MySQL 8.0      │  │
                      │  │ Intelligence │────▶│                 │  │
                      │  │ Flask :5001  │     └──────────────────┘  │
                      │  └──────────────┘                           │
                      └─────────────────────────────────────────────┘
```

| Service | Role | Why this choice |
| --- | --- | --- |
| nginx (Alpine) | Static frontend + API reverse proxy | Eliminates CORS in production; efficient static serving |
| Node.js / Express | REST API, CRUD, stats, JWT auth | Non-blocking I/O suits a data-heavy API |
| MySQL 8.0 | Relational store | Survey data maps naturally to tables with foreign-key integrity |
| Flask (Python) | Trend scoring, pattern detection, comparison | Python's data ecosystem fits the analytical work |
| PHP 8.2 / Apache | Admin panel | PDO parameterised queries for safe data management |

Design decisions:
- Analytical work runs as its own Flask service rather than inside Node — keeps the API thin and lets the analysis scale or be replaced independently.
- Reverse proxy chosen over CORS configuration — production-realistic and removes a class of client-side failure.
- Docker Compose runs all five services with one command — reproducible environments.

## Results

**Public API**

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/api/categories` | 15 technical categories |
| GET | `/api/tools` | Active tools |
| GET | `/api/industries` | 10 industry filters |
| GET | `/api/stats/top` | Top tools in a category; optional `?industry=` |
| GET | `/api/stats/usage` | Historical usage % for a tool (Chart.js data) |
| GET | `/api/stack-builder` | Recommended stack for an industry + product type |
| GET | `/api/trends` | Trend scores from the intelligence engine |
| GET | `/feed.xml` | Full data export as XML |

**Intelligence engine (Flask)**

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/intelligence/trends` | Trend scores with direction (rising/stable/falling) |
| GET | `/intelligence/rising` | Strongest upward trends |
| GET | `/intelligence/patterns` | Cross-category adoption patterns |
| GET | `/intelligence/compare` | Side-by-side tool comparison |

**Admin (JWT required)**

| Method | Path | Action |
| --- | --- | --- |
| POST | `/api/auth/login` | Authenticate, receive JWT |
| POST | `/api/stats` | Insert a usage stat row |

## Screenshots

| Dashboard | Category detail |
| --- | --- |
| ![Dashboard](screenshots/dashboard.png) | ![Category](screenshots/category.png) |

| Stack builder | Admin panel |
| --- | --- |
| ![Stack Builder](screenshots/stack-builder.png) | ![Admin](screenshots/admin.png) |

| Dark mode | Light mode |
| --- | --- |
| ![Dark Mode](screenshots/dark-mode.png) | ![Light Mode](screenshots/light-mode.png) |

## Reproduce

```bash
git clone https://github.com/ayadilara10/techboard.git
cd techboard
cp .env.example .env        # fill DB_ROOT_PASSWORD, DB_USER, DB_PASSWORD, JWT_SECRET, ADMIN_SECRET
docker compose up --build
docker compose ps           # all five containers show Up / healthy
```
Expected output: dashboard at `http://localhost`, admin at `:8080`, API at `:3000`, Flask health at `:5001/intelligence/health`. First build takes 2–4 minutes.

## Roadmap

Each item is a state to reach, with the measure that confirms it.

**Now — Reachable and trustworthy.** The product is usable by someone other than its author, and they trust the numbers.
- Public deployment: VPS with nginx reverse proxy and SSL.
- Visible data-freshness signal ("data as of …") so a static seed is not mistaken for stale data.
- Confirmed by: a first external user completing one lookup without questioning the data's age.

**Next — Users return.** There is a reason to come back beyond a single visit.
- Candidate solutions, to validate before building: saved stacks and bookmarked comparisons behind accounts, or a lighter-weight periodic digest.
- Confirmed by: week-4 return rate.

**Later — Decision tool, then revenue.** The product moves from browsing to deciding, and monetizes only once value is proven.
- Adoption forecasting: extend from past trends to projected direction.
- Enterprise tier: industry breakdowns as a paid capability.
- Gate: monetization follows validated return rate and willingness-to-pay — not before.

## Structure

```
techboard/
├── docker-compose.yml     orchestrates all five services
├── .env.example           required secrets template
├── database/              8-table schema + seed files
├── backend/               Node.js/Express API — routes, middleware, JWT
├── frontend/              static dashboard (nginx) — HTML/CSS/JS, Chart.js
├── admin/                 PHP 8.2 admin panel — PDO, CSV import
├── intelligence/          Flask analytics service — trends, patterns, compare
└── screenshots/
```

## Conventions

- Comments: intent-comments on non-obvious SQL blocks and service-boundary calls (why, not what).
- JavaScript: JSDoc on exported route handlers and utilities (`@param` / `@returns`).
- Python (Flask): Google-style docstrings (Args / Returns / Raises) on analysis functions.
- PHP: PHPDoc on admin controllers.
- Configuration: all secrets via `.env`; never commit a real `.env`.
- Data interchange: XML for the export and import feed.
