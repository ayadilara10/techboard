# CLAUDE.md — TechBoard Intelligence Platform
## Complete Build Specification for Claude Code

---

## PROJECT OVERVIEW

**Product Name:** TechBoard  
**Tagline:** Tech Stack Intelligence for Product Builders  
**Type:** Full-stack web application — B2B data intelligence platform  
**University course:** Tehnologii WEB, Anul II, UTM Bucharest  
**Deployment target:** Summer 2025 (Docker-ready from day one)  
**Access model:** Public read access (free tier) + Premium gated features (paid — infrastructure ready, payment not yet integrated)  

### What It Does
TechBoard tracks which technical tools, frameworks, languages, databases, and infrastructure decisions are being adopted across industries. It pulls from real developer survey data (Stack Overflow, State of JS, JetBrains) and surfaces trends, patterns, and comparisons via an intelligence engine. Users can filter by industry domain (Fintech, Healthcare, SaaS, etc.) and see what the real-world tech stack looks like for any product category.

---

## TECHNOLOGY STACK

| Layer | Technology | Version | Role |
|---|---|---|---|
| Frontend | HTML5 + CSS3 | — | Structure and styling |
| Frontend interactivity | JavaScript (ES6+) | — | DOM manipulation, API calls |
| Frontend enhancement | jQuery | 3.7.x | AJAX, animations, DOM shortcuts |
| Frontend charts | Chart.js | 4.x | Trend graphs, usage charts |
| Backend API | Node.js + Express | 20 LTS | Primary REST API, auth, business logic |
| Admin panel | PHP | 8.2 | Data management UI, CSV import |
| Database | MySQL | 8.0 | Primary data store |
| Intelligence engine | Python Flask | 3.x | Trend analysis, pattern detection, stats |
| Data format | XML | — | RSS feed + dataset export |
| Containerization | Docker + docker-compose | — | Full stack runs with one command |
| Auth | JWT | — | Admin authentication |

---

## COMPLETE FOLDER STRUCTURE

```
techboard/
│
├── docker-compose.yml              # Runs everything with: docker-compose up
├── CLAUDE.md                       # This file
├── README.md                       # GitHub portfolio README
│
├── frontend/                       # Static HTML/CSS/JS site
│   ├── index.html                  # Main dashboard page
│   ├── category.html               # Category detail page (e.g., /category/frontend)
│   ├── stack-builder.html          # Tech Stack Builder tool
│   ├── admin/
│   │   └── login.html              # Admin login page (leads to PHP panel)
│   ├── css/
│   │   ├── variables.css           # CSS custom properties (brand tokens, both modes)
│   │   ├── base.css                # Reset, typography, global
│   │   ├── components.css          # Cards, buttons, badges, tags
│   │   ├── dashboard.css           # Main dashboard layout
│   │   ├── category.css            # Category detail page layout
│   │   └── stack-builder.css       # Stack Builder layout
│   ├── js/
│   │   ├── theme.js                # Dark/light mode toggle
│   │   ├── api.js                  # Central API client (all fetch/AJAX calls)
│   │   ├── dashboard.js            # Dashboard page logic
│   │   ├── category.js             # Category page logic + filters
│   │   ├── charts.js               # Chart.js wrappers and renderers
│   │   └── stack-builder.js        # Stack Builder tool logic
│   └── assets/
│       ├── logo.svg                # TechBoard logo
│       └── icons/                  # Category icons (SVG)
│
├── backend/                        # Node.js + Express API
│   ├── package.json
│   ├── server.js                   # Entry point
│   ├── config/
│   │   ├── database.js             # MySQL connection pool
│   │   └── constants.js            # App-wide constants
│   ├── routes/
│   │   ├── categories.js           # GET /api/categories
│   │   ├── tools.js                # GET /api/tools
│   │   ├── industries.js           # GET /api/industries
│   │   ├── stats.js                # GET /api/stats
│   │   ├── trends.js               # GET /api/trends (proxies Flask)
│   │   ├── xml.js                  # GET /feed.xml, GET /api/export/xml
│   │   └── auth.js                 # POST /api/auth/login
│   ├── middleware/
│   │   ├── auth.js                 # JWT verification middleware
│   │   └── cors.js                 # CORS configuration
│   └── utils/
│       └── flaskClient.js          # HTTP client for Flask intelligence engine
│
├── admin/                          # PHP admin panel
│   ├── index.php                   # Admin dashboard (requires session)
│   ├── login.php                   # Auth handler
│   ├── logout.php
│   ├── tools/
│   │   ├── list.php                # View/edit all tools
│   │   ├── add.php                 # Add a single tool manually
│   │   └── edit.php                # Edit existing tool
│   ├── import/
│   │   ├── upload.php              # CSV upload form
│   │   └── process.php             # CSV parser and DB importer
│   ├── categories/
│   │   └── manage.php              # Add/edit categories
│   └── includes/
│       ├── db.php                  # PDO MySQL connection
│       ├── auth.php                # Session-based auth helpers
│       ├── header.php              # Admin panel header/nav
│       └── footer.php
│
├── intelligence/                   # Python Flask microservice
│   ├── requirements.txt
│   ├── app.py                      # Flask entry point
│   ├── routes/
│   │   ├── trends.py               # /intelligence/trends
│   │   ├── patterns.py             # /intelligence/patterns
│   │   └── compare.py              # /intelligence/compare
│   └── analysis/
│       ├── trend_detector.py       # Core trend algorithm
│       ├── pattern_finder.py       # Cross-category pattern logic
│       └── stats_engine.py         # Statistical computations
│
├── database/
│   ├── schema.sql                  # Full database schema (run once)
│   ├── seed_categories.sql         # All 15 categories
│   ├── seed_industries.sql         # All 10 industries
│   └── seed_sample_data.sql        # Sample tool data for dev/demo
│
└── data/
    ├── stackoverflow_2024.csv      # Raw survey data (download instructions in README)
    ├── stateof_js_2024.json        # State of JS data
    └── import_instructions.md      # How to populate the DB from these files
```

---

## DATABASE SCHEMA

### Complete schema — all tables and relationships

```sql
-- ============================================================
-- CATEGORIES — the 15 technical decision domains
-- ============================================================
CREATE TABLE categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    slug        VARCHAR(60) UNIQUE NOT NULL,   -- 'frontend', 'backend', 'databases'
    name        VARCHAR(100) NOT NULL,          -- 'Frontend Frameworks & Languages'
    description TEXT,
    icon        VARCHAR(100),                   -- filename of SVG icon
    sort_order  INT DEFAULT 0,
    data_status ENUM('live', 'coming_soon') DEFAULT 'coming_soon',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TOOLS — every tracked technology
-- ============================================================
CREATE TABLE tools (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    category_id     INT NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,  -- 'react', 'postgresql'
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    website_url     VARCHAR(255),
    logo_url        VARCHAR(255),
    open_source     BOOLEAN DEFAULT TRUE,
    first_released  YEAR,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- ============================================================
-- INDUSTRIES — the 10 domain filters
-- ============================================================
CREATE TABLE industries (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    slug        VARCHAR(60) UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    icon        VARCHAR(100),
    sort_order  INT DEFAULT 0
);

-- ============================================================
-- USAGE_STATS — the core data table
-- One row = one tool's usage % in one industry in one year
-- ============================================================
CREATE TABLE usage_stats (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    tool_id         INT NOT NULL,
    industry_id     INT,                        -- NULL = global (all industries)
    year            YEAR NOT NULL,
    usage_percent   DECIMAL(5,2),               -- e.g. 42.30 means 42.30%
    satisfaction    DECIMAL(4,2),               -- optional: developer satisfaction score
    sample_size     INT,                         -- how many respondents this is based on
    source          VARCHAR(150),                -- 'Stack Overflow 2024', 'State of JS 2024'
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tool_id) REFERENCES tools(id),
    FOREIGN KEY (industry_id) REFERENCES industries(id)
);

-- ============================================================
-- TRENDS — computed by Flask, cached here
-- ============================================================
CREATE TABLE trends (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    tool_id         INT NOT NULL,
    industry_id     INT,
    trend_score     DECIMAL(6,3),               -- positive = rising, negative = falling
    trend_direction ENUM('rising','stable','falling'),
    year_from       YEAR,
    year_to         YEAR,
    computed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tool_id) REFERENCES tools(id),
    FOREIGN KEY (industry_id) REFERENCES industries(id)
);

-- ============================================================
-- STACK_PROFILES — for Tech Stack Builder
-- A "profile" is a typical stack for a product type in an industry
-- ============================================================
CREATE TABLE stack_profiles (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    industry_id     INT NOT NULL,
    product_type    VARCHAR(100) NOT NULL,  -- 'Mobile Banking App', 'E-commerce Store'
    description     TEXT,
    is_published    BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (industry_id) REFERENCES industries(id)
);

-- ============================================================
-- STACK_PROFILE_TOOLS — which tools go in which profile
-- ============================================================
CREATE TABLE stack_profile_tools (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    profile_id      INT NOT NULL,
    tool_id         INT NOT NULL,
    category_id     INT NOT NULL,
    rationale       TEXT,                   -- why this tool is in this stack
    is_primary      BOOLEAN DEFAULT TRUE,   -- primary recommendation vs alternative
    FOREIGN KEY (profile_id) REFERENCES stack_profiles(id),
    FOREIGN KEY (tool_id) REFERENCES tools(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- ============================================================
-- ADMIN_USERS — for PHP admin panel + Node JWT auth
-- ============================================================
CREATE TABLE admin_users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(150),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- DATA_IMPORT_LOG — tracks every CSV import
-- ============================================================
CREATE TABLE data_import_log (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    filename        VARCHAR(255),
    source          VARCHAR(150),
    rows_imported   INT,
    imported_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    imported_by     INT,
    FOREIGN KEY (imported_by) REFERENCES admin_users(id)
);
```

---

## SEED DATA — 15 CATEGORIES

```sql
INSERT INTO categories (slug, name, description, sort_order, data_status) VALUES
('backend',       'Backend Languages & Frameworks', 'Server-side languages, runtimes, and web frameworks',              1,  'live'),
('frontend',      'Frontend Frameworks & Languages','Client-side frameworks, UI libraries, and JavaScript variants',    2,  'live'),
('databases',     'Databases',                      'Relational, document, key-value, graph, and time-series databases',3,  'live'),
('cloud',         'Cloud & Hosting',                'Cloud providers, PaaS, edge deployment, and serverless platforms', 4,  'live'),
('devops',        'DevOps & CI/CD',                 'Containerization, orchestration, pipelines, and IaC tools',        5,  'live'),
('apis',          'APIs & Communication',           'API paradigms, protocols, and real-time communication patterns',   6,  'live'),
('auth',          'Authentication & Security',      'Identity providers, auth protocols, and security tooling',         7,  'coming_soon'),
('mobile',        'Mobile Development',             'Native, cross-platform, and hybrid mobile frameworks',             8,  'live'),
('testing',       'Testing & QA',                   'Unit, integration, E2E testing frameworks and tools',              9,  'coming_soon'),
('monitoring',    'Monitoring & Observability',     'APM, logging, alerting, and infrastructure monitoring tools',      10, 'coming_soon'),
('ai_ml',         'AI/ML Integration',              'AI APIs, ML frameworks, and LLM tooling used in production apps',  11, 'coming_soon'),
('search',        'Search',                         'Full-text search engines, vector search, and autocomplete services',12,'coming_soon'),
('messaging',     'Message Queues & Streaming',     'Event streaming, pub/sub, and async messaging infrastructure',     13, 'coming_soon'),
('cms',           'CMS & Content',                  'Headless CMS, traditional CMS, and content management platforms',  14, 'coming_soon'),
('analytics',     'Analytics & Tracking',           'Product analytics, web analytics, and user tracking tools',        15, 'coming_soon');
```

---

## SEED DATA — 10 INDUSTRIES

```sql
INSERT INTO industries (slug, name, sort_order) VALUES
('ecommerce',   'E-Commerce',           1),
('saas',        'SaaS',                 2),
('fintech',     'Fintech',              3),
('healthcare',  'Healthcare',           4),
('media',       'Media & Entertainment',5),
('education',   'Education',            6),
('government',  'Government',           7),
('logistics',   'Logistics',            8),
('construction','Construction',         9),
('finance',     'Finance & Banking',   10);
```

---

## ALL API ENDPOINTS (Node.js / Express)

### Public endpoints (no auth required)

| Method | Path | Returns |
|---|---|---|
| GET | `/api/categories` | All categories with data_status |
| GET | `/api/categories/:slug` | Single category with tools |
| GET | `/api/tools` | All tools (paginated) |
| GET | `/api/tools/:slug` | Single tool with usage stats |
| GET | `/api/industries` | All industries |
| GET | `/api/stats/top?category=frontend&limit=3` | Top N tools in a category |
| GET | `/api/stats/top?category=frontend&industry=fintech&limit=3` | Filtered by industry |
| GET | `/api/stats/usage?tool=react&years=2020,2021,2022,2023,2024` | Historical usage for charts |
| GET | `/api/stats/global` | Overall platform summary stats |
| GET | `/api/trends?category=backend&industry=saas` | Trend data (proxied from Flask) |
| GET | `/api/trends/rising` | Top rising tools across all categories |
| GET | `/api/patterns?industry=fintech` | Pattern analysis (proxied from Flask) |
| GET | `/api/compare?tools=react,vue,angular` | Side-by-side comparison |
| GET | `/api/stack-builder?industry=fintech&type=mobile-app` | Full stack recommendation |
| GET | `/feed.xml` | RSS feed of new/trending tools |
| GET | `/api/export/xml` | Full dataset as XML download |

### Admin endpoints (JWT required)

| Method | Path | Action |
|---|---|---|
| POST | `/api/auth/login` | Returns JWT token |
| POST | `/api/auth/logout` | Invalidates token |
| POST | `/api/tools` | Create tool |
| PUT | `/api/tools/:id` | Update tool |
| DELETE | `/api/tools/:id` | Delete tool |
| POST | `/api/stats` | Add usage stat manually |
| GET | `/api/admin/import-log` | View import history |

---

## FLASK INTELLIGENCE ENGINE ENDPOINTS

Flask runs on port 5001. Node.js calls it internally.

| Method | Path | What it computes |
|---|---|---|
| GET | `/intelligence/trends?category=backend&industry=saas&years=5` | YoY growth rates, trend direction classification |
| GET | `/intelligence/patterns?industry=fintech` | Which tools appear together, co-adoption patterns |
| GET | `/intelligence/compare?tools=react,vue,angular&industry=saas` | Statistical comparison with confidence intervals |
| GET | `/intelligence/rising?limit=10` | Fastest-growing tools platform-wide |
| GET | `/intelligence/predict?tool=bun&years=2` | Simple projection based on trajectory |
| GET | `/intelligence/health` | Health check |

---

## FRONTEND PAGES

### 1. Dashboard (`index.html`)
- Header with logo, dark/light toggle, "Admin" link
- Hero section: platform tagline + live stats ticker (total tools tracked, industries, data sources)
- 15 Category cards in a responsive grid
  - Each card: category name, icon, top 3 tools with usage %, trend badge (↑ ↓ →)
  - Cards with `data_status = 'coming_soon'` show a "Data Coming Soon" overlay
- "Trending Now" horizontal strip below cards: top 5 rising tools platform-wide
- Footer: data sources attribution, RSS feed link, XML export link

### 2. Category Detail (`category.html?slug=frontend`)
- Category title + description
- Industry filter bar (horizontal chips: All, E-Commerce, SaaS, Fintech…)
- Year range slider (2020–2024)
- Left column: ranked list of all tools with usage bars
- Right column: Chart.js line chart — usage over time for top 5 tools
- "Compare" button: select up to 3 tools → modal with side-by-side comparison
- Premium gate: full historical data + pattern analysis shown as blurred with "Premium" badge

### 3. Tech Stack Builder (`stack-builder.html`)
- Step 1: Select industry (card grid)
- Step 2: Select product type (e.g., "Mobile Banking App", "SaaS Dashboard")
- Result: Full recommended stack — one tool per category, with rationale
- Each tool card links to its category detail page
- "Export this stack" button → downloads as XML

### 4. Admin Login (`admin/login.html`)
- Simple centered login form
- Calls POST `/api/auth/login`
- On success: redirects to PHP admin panel (`/admin/`)

---

## CSS DESIGN SYSTEM

### CSS Custom Properties (variables.css)

```css
/* ============================================================
   BRAND TOKENS
   ============================================================ */
:root {
  /* Base palette */
  --color-navy:       #0A1F33;
  --color-steel:      #4A6FA5;
  --color-graphite:   #1B1B1D;
  --color-titanium:   #D1D9E6;
  --color-cyan:       #2DD4D4;
  --color-gold:       #C5A572;

  /* Dark mode (default) */
  --bg-primary:       #0A1F33;
  --bg-secondary:     #0F2840;
  --bg-surface:       #1B1B1D;
  --bg-card:          #12253A;
  --text-primary:     #D1D9E6;
  --text-secondary:   #4A6FA5;
  --text-muted:       #6B7FA3;
  --border-color:     #1E3A5F;
  --accent-primary:   #2DD4D4;
  --accent-secondary: #C5A572;

  /* Typography */
  --font-sans:  'Inter', system-ui, sans-serif;
  --font-mono:  'JetBrains Mono', 'Fira Code', monospace;

  /* Spacing scale */
  --space-xs:   4px;
  --space-sm:   8px;
  --space-md:   16px;
  --space-lg:   24px;
  --space-xl:   40px;
  --space-2xl:  64px;

  /* Border radius */
  --radius-sm:  4px;
  --radius-md:  8px;
  --radius-lg:  16px;
  --radius-xl:  24px;

  /* Shadows */
  --shadow-card: 0 2px 12px rgba(0,0,0,0.4);
  --shadow-hover: 0 4px 24px rgba(45,212,212,0.15);

  /* Transitions */
  --transition: 0.2s ease;
}

/* Light mode — applied when <html data-theme="light"> */
[data-theme="light"] {
  --bg-primary:       #F4F7FB;
  --bg-secondary:     #EBF0F8;
  --bg-surface:       #FFFFFF;
  --bg-card:          #FFFFFF;
  --text-primary:     #0A1F33;
  --text-secondary:   #4A6FA5;
  --text-muted:       #6B7FA3;
  --border-color:     #D1D9E6;
  --shadow-card: 0 2px 12px rgba(10,31,51,0.08);
  --shadow-hover: 0 4px 24px rgba(45,212,212,0.20);
}
```

---

## COURSE REQUIREMENTS COVERAGE MAP

| Course Unit | Where it appears in TechBoard |
|---|---|
| HTML5 | All frontend pages — semantic elements, forms, meta tags, DOCTYPE |
| CSS3 | Full design system — custom properties, flexbox, grid, transitions, media queries |
| JavaScript (ES6+) | `api.js`, `dashboard.js`, `category.js`, `charts.js`, `stack-builder.js`, `theme.js` |
| jQuery | AJAX calls in `api.js`, DOM manipulation for filter chips, animations |
| Node.js | Entire backend API — Express server, routes, middleware, JWT auth |
| PHP | Admin panel — all 6 PHP files, PDO MySQL, session auth, CSV import |
| MySQL | Full relational schema — 9 tables, foreign keys, queries across joins |
| XML | RSS feed at `/feed.xml` + XML export at `/api/export/xml` — both generated server-side |
| Python Flask | Intelligence engine — 6 analysis endpoints, trend algorithms, statistical patterns |

---

## BUILD SEQUENCE FOR CLAUDE CODE

Build in this exact order. Each phase is independently testable before moving to the next.

### Phase 1 — Database Foundation
1. Write `database/schema.sql`
2. Write all seed SQL files
3. Set up MySQL Docker container
4. Test: can connect, tables exist, seed data loads

### Phase 2 — Node.js Backend Core
1. `backend/package.json`, `server.js`, `config/database.js`
2. Route: `GET /api/categories` — returns all categories
3. Route: `GET /api/tools` — returns paginated tools
4. Route: `GET /api/industries` — returns all industries
5. Route: `GET /api/stats/top` — top N tools per category, with optional industry filter
6. Test: all 4 endpoints return correct JSON

### Phase 3 — Frontend Dashboard
1. `css/variables.css` — full design system
2. `css/base.css`, `css/components.css`
3. `index.html` — structure
4. `js/api.js` — central API client
5. `js/dashboard.js` — fetches and renders category cards
6. `js/theme.js` — dark/light toggle
7. Test: dashboard loads, cards render, theme toggle works

### Phase 4 — Category Detail Page
1. `category.html` structure
2. `css/category.css`
3. `js/category.js` — reads ?slug= param, fetches data, renders tool list
4. `js/charts.js` — Chart.js usage-over-time chart
5. Route: `GET /api/stats/usage` for chart data
6. Industry filter chips with jQuery
7. Test: filter by industry updates both list and chart

### Phase 5 — XML Layer
1. Route: `GET /feed.xml` — RSS feed of newest/trending tools
2. Route: `GET /api/export/xml` — full dataset as downloadable XML
3. Both generated in Node.js using string templating or xmlbuilder2
4. Test: valid XML, correct Content-Type headers

### Phase 6 — Flask Intelligence Engine
1. `intelligence/app.py`, `requirements.txt`
2. `/intelligence/trends` — compute YoY growth per tool
3. `/intelligence/rising` — sort tools by trend_score descending
4. Add `backend/utils/flaskClient.js` — Node calls Flask
5. Route: `GET /api/trends/rising` — proxies Flask result to frontend
6. Test: trends show on dashboard "Trending Now" strip

### Phase 7 — PHP Admin Panel
1. `admin/includes/db.php` — PDO connection
2. `admin/login.php` — session auth
3. `admin/index.php` — dashboard showing counts
4. `admin/tools/list.php`, `add.php`, `edit.php`
5. `admin/import/upload.php`, `process.php` — CSV import
6. Test: can log in, add a tool, import a CSV row

### Phase 8 — Tech Stack Builder
1. `stack-builder.html` + `css/stack-builder.css`
2. `js/stack-builder.js` — step-by-step UI
3. Route: `GET /api/stack-builder` — queries stack_profiles + profile_tools
4. XML export of selected stack
5. Test: select Fintech + Mobile App → renders full stack

### Phase 9 — JWT Admin Auth for Node.js
1. `backend/routes/auth.js` — POST `/api/auth/login`
2. `backend/middleware/auth.js` — JWT verify
3. Protect all admin POST/PUT/DELETE routes
4. Frontend admin login page calling the API
5. Test: protected routes reject requests without valid token

### Phase 10 — Docker + Final Integration
1. `docker-compose.yml` — MySQL + Node + PHP + Flask containers
2. Environment variables for all config (DB creds, JWT secret, Flask URL)
3. Test: `docker-compose up` starts everything, all services talk to each other

---

## DOCKER COMPOSE STRUCTURE

```yaml
version: '3.8'
services:

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: techboard
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01_schema.sql
      - ./database/seed_categories.sql:/docker-entrypoint-initdb.d/02_categories.sql
      - ./database/seed_industries.sql:/docker-entrypoint-initdb.d/03_industries.sql
      - ./database/seed_sample_data.sql:/docker-entrypoint-initdb.d/04_sample.sql
    ports:
      - "3306:3306"

  backend:
    build: ./backend
    environment:
      DB_HOST: mysql
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: techboard
      JWT_SECRET: ${JWT_SECRET}
      FLASK_URL: http://intelligence:5001
    ports:
      - "3000:3000"
    depends_on:
      - mysql

  frontend:
    image: nginx:alpine
    volumes:
      - ./frontend:/usr/share/nginx/html
    ports:
      - "80:80"
    depends_on:
      - backend

  admin:
    image: php:8.2-apache
    volumes:
      - ./admin:/var/www/html
    environment:
      DB_HOST: mysql
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: techboard
      ADMIN_SECRET: ${ADMIN_SECRET}
    ports:
      - "8080:80"
    depends_on:
      - mysql

  intelligence:
    build: ./intelligence
    ports:
      - "5001:5001"
    depends_on:
      - mysql

volumes:
  mysql_data:
```

---

## ENVIRONMENT VARIABLES (.env file — never commit to Git)

```
DB_ROOT_PASSWORD=your_root_password
DB_USER=techboard_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret_here
ADMIN_SECRET=your_admin_panel_secret
```

---

## PREMIUM ARCHITECTURE (ready, not yet activated)

The premium tier is architecturally supported from day one. These are the gates:

| Feature | Free | Premium |
|---|---|---|
| Top 3 tools per category | ✅ | ✅ |
| Full ranked list (all tools) | ❌ blurred | ✅ |
| Industry filter | ❌ blurred | ✅ |
| Historical charts (2020–2024) | Latest year only | ✅ |
| Trend analysis | ↑↓→ badge only | Full trend chart |
| Pattern analysis | ❌ | ✅ |
| Tool comparisons | ❌ | ✅ |
| Tech Stack Builder | Preview only | ✅ Full |
| XML export | ❌ | ✅ |
| RSS feed | ✅ | ✅ |

Implementation: a `user_tier` flag in localStorage (free/premium), checked in JavaScript before rendering. Upgrading to real Stripe payments later requires only adding a `/api/payment` route and setting a server-side flag. The gates are already there.

---

## DATA SOURCES & IMPORT GUIDE

| Source | URL | Format | Categories covered |
|---|---|---|---|
| Stack Overflow Survey 2024 | insights.stackoverflow.com/survey | CSV | 1,2,3,4,5,6,8 |
| State of JS 2024 | stateofjs.com | JSON | 2 (deep) |
| State of CSS 2024 | stateofcss.com | JSON | 2 (CSS) |
| JetBrains Dev Survey 2024 | jetbrains.com/lp/devecosystem | PDF/CSV | 1,2,8 |
| npm download stats | api.npmjs.org | JSON API | 2 (JS libs) |

Import all CSV files via the PHP admin panel at `/admin/import/`.

---

## NOTES FOR IMPLEMENTATION

1. All JavaScript must include explanatory comments (course requirement)
2. All PHP files must include explanatory comments
3. HTML must use semantic elements: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`
4. CSS must not use inline styles — all styling via class-based CSS
5. jQuery must be used for at least: AJAX calls, DOM traversal, event handling, animations
6. XML files must be valid and served with correct `Content-Type: application/xml` headers
7. PHP must use PDO (not mysqli) for all database access
8. Node.js must use environment variables for all credentials — never hardcoded
9. All forms must have proper validation on both client side (JS) and server side (Node/PHP)
10. The admin password must be bcrypt-hashed in the database

---

*End of CLAUDE.md — version 1.0*
*Project: TechBoard Intelligence Platform*
*Specification date: 2025*
