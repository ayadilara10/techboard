-- ============================================================
-- TechBoard — Seed: 15 Categories
-- ============================================================

USE techboard;

INSERT INTO categories (slug, name, description, sort_order, data_status) VALUES
('backend',    'Backend Languages & Frameworks', 'Server-side languages, runtimes, and web frameworks',               1,  'live'),
('frontend',   'Frontend Frameworks & Languages','Client-side frameworks, UI libraries, and JavaScript variants',     2,  'live'),
('databases',  'Databases',                      'Relational, document, key-value, graph, and time-series databases', 3,  'live'),
('cloud',      'Cloud & Hosting',                'Cloud providers, PaaS, edge deployment, and serverless platforms',  4,  'live'),
('devops',     'DevOps & CI/CD',                 'Containerization, orchestration, pipelines, and IaC tools',         5,  'live'),
('apis',       'APIs & Communication',           'API paradigms, protocols, and real-time communication patterns',    6,  'live'),
('auth',       'Authentication & Security',      'Identity providers, auth protocols, and security tooling',          7,  'coming_soon'),
('mobile',     'Mobile Development',             'Native, cross-platform, and hybrid mobile frameworks',              8,  'live'),
('testing',    'Testing & QA',                   'Unit, integration, E2E testing frameworks and tools',               9,  'coming_soon'),
('monitoring', 'Monitoring & Observability',     'APM, logging, alerting, and infrastructure monitoring tools',       10, 'coming_soon'),
('ai_ml',      'AI/ML Integration',              'AI APIs, ML frameworks, and LLM tooling used in production apps',   11, 'coming_soon'),
('search',     'Search',                         'Full-text search engines, vector search, and autocomplete services',12, 'coming_soon'),
('messaging',  'Message Queues & Streaming',     'Event streaming, pub/sub, and async messaging infrastructure',      13, 'coming_soon'),
('cms',        'CMS & Content',                  'Headless CMS, traditional CMS, and content management platforms',   14, 'coming_soon'),
('analytics',  'Analytics & Tracking',           'Product analytics, web analytics, and user tracking tools',         15, 'coming_soon');
