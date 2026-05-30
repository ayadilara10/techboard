-- ============================================================
-- TechBoard — Sample Data (dev/demo)
-- Covers all 6 live categories × top 5+ tools
-- Industries: saas (id=2), fintech (id=3), ecommerce (id=1)
-- Years: 2022, 2023, 2024
-- Global rows use industry_id = NULL
-- Source: modelled after Stack Overflow Survey 2024 / State of JS 2024
-- ============================================================

USE techboard;

-- ============================================================
-- TOOLS
-- ============================================================

-- ---- BACKEND (category_id = 1) ----------------------------
INSERT INTO tools (category_id, slug, name, description, website_url, open_source, first_released) VALUES
(1, 'nodejs',     'Node.js',      'JavaScript runtime built on Chrome V8 engine',                    'https://nodejs.org',      TRUE,  2009),
(1, 'python',     'Python',       'High-level, general-purpose programming language',                 'https://python.org',      TRUE,  1991),
(1, 'java',       'Java',         'Object-oriented language, widely used in enterprise',              'https://java.com',        TRUE,  1995),
(1, 'dotnet',     '.NET / C#',    'Microsoft platform for building server-side applications',         'https://dotnet.microsoft.com', TRUE, 2002),
(1, 'go',         'Go',           'Statically typed, compiled language designed at Google',           'https://go.dev',          TRUE,  2009),
(1, 'ruby-rails', 'Ruby on Rails','Convention-over-configuration full-stack web framework',           'https://rubyonrails.org', TRUE,  2004),
(1, 'php',        'PHP',          'General-purpose scripting language for web development',           'https://php.net',         TRUE,  1994);

-- ---- FRONTEND (category_id = 2) ---------------------------
INSERT INTO tools (category_id, slug, name, description, website_url, open_source, first_released) VALUES
(2, 'react',      'React',        'JavaScript library for building user interfaces',                  'https://react.dev',        TRUE, 2013),
(2, 'vue',        'Vue.js',       'Progressive JavaScript framework for building UIs',                'https://vuejs.org',        TRUE, 2014),
(2, 'angular',    'Angular',      'Platform for building mobile and desktop web apps',                'https://angular.io',       TRUE, 2016),
(2, 'svelte',     'Svelte',       'Compiler-based UI framework with no virtual DOM',                  'https://svelte.dev',       TRUE, 2016),
(2, 'nextjs',     'Next.js',      'React framework for production with SSR and SSG',                  'https://nextjs.org',       TRUE, 2016),
(2, 'nuxt',       'Nuxt',         'Intuitive Vue framework for building web applications',            'https://nuxt.com',         TRUE, 2016),
(2, 'remix',      'Remix',        'Full-stack web framework focused on web standards',                'https://remix.run',        TRUE, 2021);

-- ---- DATABASES (category_id = 3) --------------------------
INSERT INTO tools (category_id, slug, name, description, website_url, open_source, first_released) VALUES
(3, 'postgresql', 'PostgreSQL',   'Advanced open-source relational database',                         'https://postgresql.org',   TRUE, 1996),
(3, 'mysql',      'MySQL',        'World\'s most popular open-source relational database',            'https://mysql.com',        TRUE, 1995),
(3, 'mongodb',    'MongoDB',      'Document-oriented NoSQL database',                                 'https://mongodb.com',      TRUE, 2009),
(3, 'redis',      'Redis',        'In-memory data structure store used as cache and message broker',  'https://redis.io',         TRUE, 2009),
(3, 'sqlite',     'SQLite',       'Self-contained, serverless SQL database engine',                   'https://sqlite.org',       TRUE, 2000),
(3, 'mssql',      'SQL Server',   'Microsoft relational database management system',                  'https://microsoft.com/sql-server', FALSE, 1989),
(3, 'elasticsearch','Elasticsearch','Distributed search and analytics engine',                        'https://elastic.co',       TRUE, 2010);

-- ---- CLOUD (category_id = 4) ------------------------------
INSERT INTO tools (category_id, slug, name, description, website_url, open_source, first_released) VALUES
(4, 'aws',        'AWS',          'Amazon Web Services — leading cloud platform',                     'https://aws.amazon.com',   FALSE, 2006),
(4, 'azure',      'Azure',        'Microsoft cloud computing platform',                               'https://azure.microsoft.com', FALSE, 2010),
(4, 'gcp',        'Google Cloud', 'Google Cloud Platform — cloud computing services',                 'https://cloud.google.com', FALSE, 2008),
(4, 'vercel',     'Vercel',       'Platform for frontend frameworks and static sites',                'https://vercel.com',       FALSE, 2015),
(4, 'netlify',    'Netlify',      'Platform for web development with git-based deployments',          'https://netlify.com',      FALSE, 2014),
(4, 'digitalocean','DigitalOcean','Cloud infrastructure for developers',                              'https://digitalocean.com', FALSE, 2011),
(4, 'cloudflare', 'Cloudflare',  'Edge network, CDN, and serverless compute platform',               'https://cloudflare.com',   FALSE, 2009);

-- ---- DEVOPS (category_id = 5) -----------------------------
INSERT INTO tools (category_id, slug, name, description, website_url, open_source, first_released) VALUES
(5, 'docker',     'Docker',       'Platform for building, running, and sharing containerized apps',   'https://docker.com',       TRUE,  2013),
(5, 'kubernetes', 'Kubernetes',   'Container orchestration system for automating deployments',        'https://kubernetes.io',    TRUE,  2014),
(5, 'github-actions','GitHub Actions','CI/CD platform integrated into GitHub',                       'https://github.com/features/actions', FALSE, 2018),
(5, 'terraform',  'Terraform',    'Infrastructure as code tool by HashiCorp',                        'https://terraform.io',     TRUE,  2014),
(5, 'jenkins',    'Jenkins',      'Open-source automation server for CI/CD pipelines',               'https://jenkins.io',       TRUE,  2004),
(5, 'gitlab-ci',  'GitLab CI/CD', 'Integrated CI/CD platform built into GitLab',                    'https://gitlab.com',       TRUE,  2012),
(5, 'ansible',    'Ansible',      'IT automation platform for configuration management',             'https://ansible.com',      TRUE,  2012);

-- ---- APIS (category_id = 6) --------------------------------
INSERT INTO tools (category_id, slug, name, description, website_url, open_source, first_released) VALUES
(6, 'rest',       'REST',         'Representational State Transfer — the dominant API style',         NULL,                       TRUE,  2000),
(6, 'graphql',    'GraphQL',      'Query language for APIs developed by Facebook',                   'https://graphql.org',      TRUE,  2015),
(6, 'grpc',       'gRPC',         'High-performance RPC framework by Google',                        'https://grpc.io',          TRUE,  2015),
(6, 'websockets', 'WebSockets',   'Full-duplex communication channels over TCP',                     NULL,                       TRUE,  2011),
(6, 'trpc',       'tRPC',         'End-to-end typesafe APIs for TypeScript',                        'https://trpc.io',          TRUE,  2020),
(6, 'openapi',    'OpenAPI',      'Standard for describing RESTful APIs (Swagger)',                  'https://openapis.org',     TRUE,  2011),
(6, 'webhooks',   'Webhooks',     'HTTP callbacks for event-driven integrations',                    NULL,                       TRUE,  2007);

-- ============================================================
-- USAGE STATS
-- Columns: tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source
-- industry_id NULL = global
-- ============================================================

-- ----------------------------------------------------------------
-- BACKEND TOOLS
-- Node.js (id=1), Python (id=2), Java (id=3), .NET (id=4),
-- Go (id=5), Ruby on Rails (id=6), PHP (id=7)
-- ----------------------------------------------------------------

-- Node.js — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(1, NULL, 2022, 46.40, 4.1, 71000, 'Stack Overflow Survey 2022'),
(1, NULL, 2023, 49.80, 4.2, 89000, 'Stack Overflow Survey 2023'),
(1, NULL, 2024, 52.10, 4.3, 65000, 'Stack Overflow Survey 2024');
-- Node.js — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(1, 2, 2022, 61.20, 4.3, 12000, 'Stack Overflow Survey 2022'),
(1, 2, 2023, 65.50, 4.4, 14500, 'Stack Overflow Survey 2023'),
(1, 2, 2024, 68.00, 4.5, 11000, 'Stack Overflow Survey 2024');
-- Node.js — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(1, 3, 2022, 38.10, 4.0, 8000, 'Stack Overflow Survey 2022'),
(1, 3, 2023, 42.30, 4.1, 9500, 'Stack Overflow Survey 2023'),
(1, 3, 2024, 45.70, 4.2, 7200, 'Stack Overflow Survey 2024');
-- Node.js — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(1, 1, 2022, 53.00, 4.2, 10000, 'Stack Overflow Survey 2022'),
(1, 1, 2023, 57.40, 4.3, 12000, 'Stack Overflow Survey 2023'),
(1, 1, 2024, 60.20, 4.4, 9500, 'Stack Overflow Survey 2024');

-- Python — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(2, NULL, 2022, 47.70, 4.4, 71000, 'Stack Overflow Survey 2022'),
(2, NULL, 2023, 49.30, 4.5, 89000, 'Stack Overflow Survey 2023'),
(2, NULL, 2024, 51.00, 4.5, 65000, 'Stack Overflow Survey 2024');
-- Python — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(2, 2, 2022, 42.00, 4.3, 12000, 'Stack Overflow Survey 2022'),
(2, 2, 2023, 44.80, 4.4, 14500, 'Stack Overflow Survey 2023'),
(2, 2, 2024, 47.50, 4.5, 11000, 'Stack Overflow Survey 2024');
-- Python — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(2, 3, 2022, 55.30, 4.5, 8000, 'Stack Overflow Survey 2022'),
(2, 3, 2023, 58.20, 4.6, 9500, 'Stack Overflow Survey 2023'),
(2, 3, 2024, 61.10, 4.6, 7200, 'Stack Overflow Survey 2024');
-- Python — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(2, 1, 2022, 35.60, 4.2, 10000, 'Stack Overflow Survey 2022'),
(2, 1, 2023, 38.40, 4.3, 12000, 'Stack Overflow Survey 2023'),
(2, 1, 2024, 41.20, 4.4, 9500, 'Stack Overflow Survey 2024');

-- Java — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(3, NULL, 2022, 33.20, 3.8, 71000, 'Stack Overflow Survey 2022'),
(3, NULL, 2023, 30.50, 3.7, 89000, 'Stack Overflow Survey 2023'),
(3, NULL, 2024, 28.30, 3.7, 65000, 'Stack Overflow Survey 2024');
-- Java — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(3, 3, 2022, 62.00, 3.9, 8000, 'Stack Overflow Survey 2022'),
(3, 3, 2023, 59.10, 3.8, 9500, 'Stack Overflow Survey 2023'),
(3, 3, 2024, 56.40, 3.8, 7200, 'Stack Overflow Survey 2024');
-- Java — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(3, 1, 2022, 41.00, 3.8, 10000, 'Stack Overflow Survey 2022'),
(3, 1, 2023, 38.20, 3.7, 12000, 'Stack Overflow Survey 2023'),
(3, 1, 2024, 36.10, 3.7, 9500, 'Stack Overflow Survey 2024');
-- Java — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(3, 2, 2022, 28.50, 3.7, 12000, 'Stack Overflow Survey 2022'),
(3, 2, 2023, 26.20, 3.6, 14500, 'Stack Overflow Survey 2023'),
(3, 2, 2024, 24.10, 3.6, 11000, 'Stack Overflow Survey 2024');

-- .NET / C# — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(4, NULL, 2022, 26.70, 3.9, 71000, 'Stack Overflow Survey 2022'),
(4, NULL, 2023, 27.80, 4.0, 89000, 'Stack Overflow Survey 2023'),
(4, NULL, 2024, 28.50, 4.1, 65000, 'Stack Overflow Survey 2024');
-- .NET — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(4, 3, 2022, 45.20, 4.0, 8000, 'Stack Overflow Survey 2022'),
(4, 3, 2023, 46.80, 4.1, 9500, 'Stack Overflow Survey 2023'),
(4, 3, 2024, 48.30, 4.2, 7200, 'Stack Overflow Survey 2024');
-- .NET — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(4, 1, 2022, 32.10, 3.9, 10000, 'Stack Overflow Survey 2022'),
(4, 1, 2023, 33.50, 4.0, 12000, 'Stack Overflow Survey 2023'),
(4, 1, 2024, 35.20, 4.1, 9500, 'Stack Overflow Survey 2024');
-- .NET — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(4, 2, 2022, 24.30, 3.9, 12000, 'Stack Overflow Survey 2022'),
(4, 2, 2023, 25.60, 4.0, 14500, 'Stack Overflow Survey 2023'),
(4, 2, 2024, 27.10, 4.1, 11000, 'Stack Overflow Survey 2024');

-- Go — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(5, NULL, 2022, 11.20, 4.3, 71000, 'Stack Overflow Survey 2022'),
(5, NULL, 2023, 13.50, 4.4, 89000, 'Stack Overflow Survey 2023'),
(5, NULL, 2024, 15.80, 4.5, 65000, 'Stack Overflow Survey 2024');
-- Go — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(5, 2, 2022, 18.40, 4.5, 12000, 'Stack Overflow Survey 2022'),
(5, 2, 2023, 22.10, 4.6, 14500, 'Stack Overflow Survey 2023'),
(5, 2, 2024, 26.30, 4.6, 11000, 'Stack Overflow Survey 2024');
-- Go — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(5, 3, 2022, 14.00, 4.3, 8000, 'Stack Overflow Survey 2022'),
(5, 3, 2023, 17.50, 4.4, 9500, 'Stack Overflow Survey 2023'),
(5, 3, 2024, 21.20, 4.5, 7200, 'Stack Overflow Survey 2024');
-- Go — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(5, 1, 2022, 9.10,  4.2, 10000, 'Stack Overflow Survey 2022'),
(5, 1, 2023, 11.30, 4.3, 12000, 'Stack Overflow Survey 2023'),
(5, 1, 2024, 13.80, 4.4, 9500, 'Stack Overflow Survey 2024');

-- Ruby on Rails — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(6, NULL, 2022, 8.10, 3.9, 71000, 'Stack Overflow Survey 2022'),
(6, NULL, 2023, 7.40, 3.8, 89000, 'Stack Overflow Survey 2023'),
(6, NULL, 2024, 6.80, 3.8, 65000, 'Stack Overflow Survey 2024');
-- Rails — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(6, 2, 2022, 15.20, 4.1, 12000, 'Stack Overflow Survey 2022'),
(6, 2, 2023, 14.10, 4.0, 14500, 'Stack Overflow Survey 2023'),
(6, 2, 2024, 13.30, 4.0, 11000, 'Stack Overflow Survey 2024');
-- Rails — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(6, 1, 2022, 10.80, 4.0, 10000, 'Stack Overflow Survey 2022'),
(6, 1, 2023, 9.70,  3.9, 12000, 'Stack Overflow Survey 2023'),
(6, 1, 2024, 8.90,  3.9, 9500, 'Stack Overflow Survey 2024');
-- Rails — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(6, 3, 2022, 6.20, 3.8, 8000, 'Stack Overflow Survey 2022'),
(6, 3, 2023, 5.60, 3.7, 9500, 'Stack Overflow Survey 2023'),
(6, 3, 2024, 5.10, 3.7, 7200, 'Stack Overflow Survey 2024');

-- PHP — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(7, NULL, 2022, 21.90, 3.5, 71000, 'Stack Overflow Survey 2022'),
(7, NULL, 2023, 20.10, 3.4, 89000, 'Stack Overflow Survey 2023'),
(7, NULL, 2024, 18.80, 3.4, 65000, 'Stack Overflow Survey 2024');
-- PHP — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(7, 1, 2022, 38.50, 3.6, 10000, 'Stack Overflow Survey 2022'),
(7, 1, 2023, 35.20, 3.5, 12000, 'Stack Overflow Survey 2023'),
(7, 1, 2024, 33.10, 3.5, 9500, 'Stack Overflow Survey 2024');
-- PHP — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(7, 2, 2022, 14.30, 3.4, 12000, 'Stack Overflow Survey 2022'),
(7, 2, 2023, 12.90, 3.3, 14500, 'Stack Overflow Survey 2023'),
(7, 2, 2024, 11.60, 3.3, 11000, 'Stack Overflow Survey 2024');
-- PHP — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(7, 3, 2022, 12.80, 3.3, 8000, 'Stack Overflow Survey 2022'),
(7, 3, 2023, 11.20, 3.2, 9500, 'Stack Overflow Survey 2023'),
(7, 3, 2024, 10.10, 3.2, 7200, 'Stack Overflow Survey 2024');

-- ----------------------------------------------------------------
-- FRONTEND TOOLS
-- React (id=8), Vue (id=9), Angular (id=10), Svelte (id=11),
-- Next.js (id=12), Nuxt (id=13), Remix (id=14)
-- ----------------------------------------------------------------

-- React — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(8, NULL, 2022, 42.60, 4.4, 71000, 'Stack Overflow Survey 2022'),
(8, NULL, 2023, 44.80, 4.4, 89000, 'Stack Overflow Survey 2023'),
(8, NULL, 2024, 46.90, 4.5, 65000, 'Stack Overflow Survey 2024');
-- React — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(8, 2, 2022, 58.10, 4.5, 12000, 'Stack Overflow Survey 2022'),
(8, 2, 2023, 61.40, 4.6, 14500, 'Stack Overflow Survey 2023'),
(8, 2, 2024, 64.30, 4.6, 11000, 'Stack Overflow Survey 2024');
-- React — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(8, 3, 2022, 48.20, 4.4, 8000, 'Stack Overflow Survey 2022'),
(8, 3, 2023, 51.70, 4.5, 9500, 'Stack Overflow Survey 2023'),
(8, 3, 2024, 55.20, 4.5, 7200, 'Stack Overflow Survey 2024');
-- React — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(8, 1, 2022, 52.30, 4.4, 10000, 'Stack Overflow Survey 2022'),
(8, 1, 2023, 55.80, 4.5, 12000, 'Stack Overflow Survey 2023'),
(8, 1, 2024, 58.40, 4.5, 9500, 'Stack Overflow Survey 2024');

-- Vue.js — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(9, NULL, 2022, 18.80, 4.1, 71000, 'Stack Overflow Survey 2022'),
(9, NULL, 2023, 17.60, 4.0, 89000, 'Stack Overflow Survey 2023'),
(9, NULL, 2024, 16.40, 4.0, 65000, 'Stack Overflow Survey 2024');
-- Vue — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(9, 1, 2022, 22.10, 4.2, 10000, 'Stack Overflow Survey 2022'),
(9, 1, 2023, 20.80, 4.1, 12000, 'Stack Overflow Survey 2023'),
(9, 1, 2024, 19.60, 4.1, 9500, 'Stack Overflow Survey 2024');
-- Vue — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(9, 2, 2022, 17.50, 4.0, 12000, 'Stack Overflow Survey 2022'),
(9, 2, 2023, 16.40, 3.9, 14500, 'Stack Overflow Survey 2023'),
(9, 2, 2024, 15.20, 3.9, 11000, 'Stack Overflow Survey 2024');
-- Vue — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(9, 3, 2022, 14.30, 4.0, 8000, 'Stack Overflow Survey 2022'),
(9, 3, 2023, 13.20, 3.9, 9500, 'Stack Overflow Survey 2023'),
(9, 3, 2024, 12.50, 3.9, 7200, 'Stack Overflow Survey 2024');

-- Angular — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(10, NULL, 2022, 20.10, 3.7, 71000, 'Stack Overflow Survey 2022'),
(10, NULL, 2023, 18.90, 3.7, 89000, 'Stack Overflow Survey 2023'),
(10, NULL, 2024, 17.80, 3.8, 65000, 'Stack Overflow Survey 2024');
-- Angular — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(10, 3, 2022, 35.60, 3.9, 8000, 'Stack Overflow Survey 2022'),
(10, 3, 2023, 33.80, 3.9, 9500, 'Stack Overflow Survey 2023'),
(10, 3, 2024, 32.10, 3.9, 7200, 'Stack Overflow Survey 2024');
-- Angular — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(10, 1, 2022, 18.90, 3.7, 10000, 'Stack Overflow Survey 2022'),
(10, 1, 2023, 17.60, 3.7, 12000, 'Stack Overflow Survey 2023'),
(10, 1, 2024, 16.50, 3.8, 9500, 'Stack Overflow Survey 2024');
-- Angular — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(10, 2, 2022, 21.30, 3.8, 12000, 'Stack Overflow Survey 2022'),
(10, 2, 2023, 20.10, 3.8, 14500, 'Stack Overflow Survey 2023'),
(10, 2, 2024, 19.20, 3.9, 11000, 'Stack Overflow Survey 2024');

-- Svelte — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(11, NULL, 2022, 4.60,  4.6, 71000, 'State of JS 2022'),
(11, NULL, 2023, 6.90,  4.7, 89000, 'State of JS 2023'),
(11, NULL, 2024, 9.40,  4.7, 65000, 'State of JS 2024');
-- Svelte — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(11, 2, 2022, 6.10,  4.6, 12000, 'State of JS 2022'),
(11, 2, 2023, 9.30,  4.7, 14500, 'State of JS 2023'),
(11, 2, 2024, 12.80, 4.8, 11000, 'State of JS 2024');
-- Svelte — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(11, 1, 2022, 3.40, 4.5, 10000, 'State of JS 2022'),
(11, 1, 2023, 5.20, 4.6, 12000, 'State of JS 2023'),
(11, 1, 2024, 7.30, 4.7, 9500, 'State of JS 2024');
-- Svelte — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(11, 3, 2022, 2.80, 4.5, 8000, 'State of JS 2022'),
(11, 3, 2023, 4.30, 4.6, 9500, 'State of JS 2023'),
(11, 3, 2024, 6.50, 4.7, 7200, 'State of JS 2024');

-- Next.js — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(12, NULL, 2022, 22.30, 4.5, 71000, 'State of JS 2022'),
(12, NULL, 2023, 27.80, 4.5, 89000, 'State of JS 2023'),
(12, NULL, 2024, 33.40, 4.4, 65000, 'State of JS 2024');
-- Next.js — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(12, 2, 2022, 34.50, 4.6, 12000, 'State of JS 2022'),
(12, 2, 2023, 41.80, 4.6, 14500, 'State of JS 2023'),
(12, 2, 2024, 49.20, 4.5, 11000, 'State of JS 2024');
-- Next.js — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(12, 1, 2022, 28.70, 4.5, 10000, 'State of JS 2022'),
(12, 1, 2023, 35.40, 4.5, 12000, 'State of JS 2023'),
(12, 1, 2024, 41.60, 4.5, 9500, 'State of JS 2024');
-- Next.js — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(12, 3, 2022, 19.10, 4.4, 8000, 'State of JS 2022'),
(12, 3, 2023, 24.50, 4.5, 9500, 'State of JS 2023'),
(12, 3, 2024, 30.80, 4.5, 7200, 'State of JS 2024');

-- Nuxt — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(13, NULL, 2022, 7.20, 4.2, 71000, 'State of JS 2022'),
(13, NULL, 2023, 8.80, 4.3, 89000, 'State of JS 2023'),
(13, NULL, 2024, 10.40, 4.3, 65000, 'State of JS 2024');
-- Nuxt — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(13, 1, 2022, 9.10,  4.3, 10000, 'State of JS 2022'),
(13, 1, 2023, 11.30, 4.4, 12000, 'State of JS 2023'),
(13, 1, 2024, 13.70, 4.4, 9500, 'State of JS 2024');
-- Nuxt — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(13, 2, 2022, 8.40, 4.2, 12000, 'State of JS 2022'),
(13, 2, 2023, 10.10, 4.3, 14500, 'State of JS 2023'),
(13, 2, 2024, 12.20, 4.3, 11000, 'State of JS 2024');
-- Nuxt — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(13, 3, 2022, 5.60, 4.1, 8000, 'State of JS 2022'),
(13, 3, 2023, 6.90, 4.2, 9500, 'State of JS 2023'),
(13, 3, 2024, 8.40, 4.2, 7200, 'State of JS 2024');

-- Remix — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(14, NULL, 2022, 2.10, 4.4, 71000, 'State of JS 2022'),
(14, NULL, 2023, 4.30, 4.5, 89000, 'State of JS 2023'),
(14, NULL, 2024, 6.80, 4.4, 65000, 'State of JS 2024');
-- Remix — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(14, 2, 2022, 3.20, 4.5, 12000, 'State of JS 2022'),
(14, 2, 2023, 6.50, 4.6, 14500, 'State of JS 2023'),
(14, 2, 2024, 10.10, 4.5, 11000, 'State of JS 2024');
-- Remix — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(14, 1, 2022, 1.80, 4.4, 10000, 'State of JS 2022'),
(14, 1, 2023, 3.70, 4.5, 12000, 'State of JS 2023'),
(14, 1, 2024, 5.90, 4.4, 9500, 'State of JS 2024');
-- Remix — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(14, 3, 2022, 1.40, 4.3, 8000, 'State of JS 2022'),
(14, 3, 2023, 2.90, 4.4, 9500, 'State of JS 2023'),
(14, 3, 2024, 4.80, 4.4, 7200, 'State of JS 2024');

-- ----------------------------------------------------------------
-- DATABASES TOOLS
-- PostgreSQL (id=15), MySQL (id=16), MongoDB (id=17), Redis (id=18),
-- SQLite (id=19), SQL Server (id=20), Elasticsearch (id=21)
-- ----------------------------------------------------------------

-- PostgreSQL — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(15, NULL, 2022, 46.50, 4.6, 71000, 'Stack Overflow Survey 2022'),
(15, NULL, 2023, 49.20, 4.7, 89000, 'Stack Overflow Survey 2023'),
(15, NULL, 2024, 53.10, 4.7, 65000, 'Stack Overflow Survey 2024');
-- PostgreSQL — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(15, 2, 2022, 58.30, 4.7, 12000, 'Stack Overflow Survey 2022'),
(15, 2, 2023, 62.10, 4.8, 14500, 'Stack Overflow Survey 2023'),
(15, 2, 2024, 66.40, 4.8, 11000, 'Stack Overflow Survey 2024');
-- PostgreSQL — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(15, 3, 2022, 52.10, 4.7, 8000, 'Stack Overflow Survey 2022'),
(15, 3, 2023, 56.30, 4.7, 9500, 'Stack Overflow Survey 2023'),
(15, 3, 2024, 60.80, 4.8, 7200, 'Stack Overflow Survey 2024');
-- PostgreSQL — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(15, 1, 2022, 42.70, 4.6, 10000, 'Stack Overflow Survey 2022'),
(15, 1, 2023, 46.90, 4.7, 12000, 'Stack Overflow Survey 2023'),
(15, 1, 2024, 51.20, 4.7, 9500, 'Stack Overflow Survey 2024');

-- MySQL — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(16, NULL, 2022, 45.80, 3.9, 71000, 'Stack Overflow Survey 2022'),
(16, NULL, 2023, 43.60, 3.9, 89000, 'Stack Overflow Survey 2023'),
(16, NULL, 2024, 41.10, 3.9, 65000, 'Stack Overflow Survey 2024');
-- MySQL — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(16, 1, 2022, 58.20, 4.0, 10000, 'Stack Overflow Survey 2022'),
(16, 1, 2023, 55.40, 4.0, 12000, 'Stack Overflow Survey 2023'),
(16, 1, 2024, 52.60, 4.0, 9500, 'Stack Overflow Survey 2024');
-- MySQL — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(16, 2, 2022, 41.20, 3.9, 12000, 'Stack Overflow Survey 2022'),
(16, 2, 2023, 38.90, 3.8, 14500, 'Stack Overflow Survey 2023'),
(16, 2, 2024, 36.50, 3.8, 11000, 'Stack Overflow Survey 2024');
-- MySQL — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(16, 3, 2022, 38.40, 3.8, 8000, 'Stack Overflow Survey 2022'),
(16, 3, 2023, 36.10, 3.8, 9500, 'Stack Overflow Survey 2023'),
(16, 3, 2024, 34.20, 3.8, 7200, 'Stack Overflow Survey 2024');

-- MongoDB — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(17, NULL, 2022, 28.30, 3.8, 71000, 'Stack Overflow Survey 2022'),
(17, NULL, 2023, 27.10, 3.7, 89000, 'Stack Overflow Survey 2023'),
(17, NULL, 2024, 25.90, 3.7, 65000, 'Stack Overflow Survey 2024');
-- MongoDB — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(17, 2, 2022, 32.60, 3.9, 12000, 'Stack Overflow Survey 2022'),
(17, 2, 2023, 30.80, 3.8, 14500, 'Stack Overflow Survey 2023'),
(17, 2, 2024, 29.40, 3.8, 11000, 'Stack Overflow Survey 2024');
-- MongoDB — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(17, 1, 2022, 30.10, 3.8, 10000, 'Stack Overflow Survey 2022'),
(17, 1, 2023, 28.50, 3.7, 12000, 'Stack Overflow Survey 2023'),
(17, 1, 2024, 27.10, 3.7, 9500, 'Stack Overflow Survey 2024');
-- MongoDB — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(17, 3, 2022, 18.70, 3.6, 8000, 'Stack Overflow Survey 2022'),
(17, 3, 2023, 17.40, 3.6, 9500, 'Stack Overflow Survey 2023'),
(17, 3, 2024, 16.20, 3.6, 7200, 'Stack Overflow Survey 2024');

-- Redis — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(18, NULL, 2022, 30.60, 4.4, 71000, 'Stack Overflow Survey 2022'),
(18, NULL, 2023, 33.40, 4.5, 89000, 'Stack Overflow Survey 2023'),
(18, NULL, 2024, 36.10, 4.5, 65000, 'Stack Overflow Survey 2024');
-- Redis — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(18, 2, 2022, 42.30, 4.5, 12000, 'Stack Overflow Survey 2022'),
(18, 2, 2023, 46.80, 4.6, 14500, 'Stack Overflow Survey 2023'),
(18, 2, 2024, 51.20, 4.6, 11000, 'Stack Overflow Survey 2024');
-- Redis — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(18, 3, 2022, 38.90, 4.4, 8000, 'Stack Overflow Survey 2022'),
(18, 3, 2023, 43.10, 4.5, 9500, 'Stack Overflow Survey 2023'),
(18, 3, 2024, 47.60, 4.5, 7200, 'Stack Overflow Survey 2024');
-- Redis — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(18, 1, 2022, 35.40, 4.4, 10000, 'Stack Overflow Survey 2022'),
(18, 1, 2023, 39.20, 4.5, 12000, 'Stack Overflow Survey 2023'),
(18, 1, 2024, 43.50, 4.5, 9500, 'Stack Overflow Survey 2024');

-- SQLite — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(19, NULL, 2022, 32.40, 4.2, 71000, 'Stack Overflow Survey 2022'),
(19, NULL, 2023, 34.80, 4.3, 89000, 'Stack Overflow Survey 2023'),
(19, NULL, 2024, 36.50, 4.3, 65000, 'Stack Overflow Survey 2024');
-- SQLite — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(19, 2, 2022, 18.30, 4.1, 12000, 'Stack Overflow Survey 2022'),
(19, 2, 2023, 20.10, 4.2, 14500, 'Stack Overflow Survey 2023'),
(19, 2, 2024, 22.40, 4.2, 11000, 'Stack Overflow Survey 2024');
-- SQLite — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(19, 1, 2022, 15.20, 4.0, 10000, 'Stack Overflow Survey 2022'),
(19, 1, 2023, 16.80, 4.1, 12000, 'Stack Overflow Survey 2023'),
(19, 1, 2024, 18.50, 4.1, 9500, 'Stack Overflow Survey 2024');
-- SQLite — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(19, 3, 2022, 10.60, 4.0, 8000, 'Stack Overflow Survey 2022'),
(19, 3, 2023, 11.90, 4.0, 9500, 'Stack Overflow Survey 2023'),
(19, 3, 2024, 13.20, 4.1, 7200, 'Stack Overflow Survey 2024');

-- SQL Server — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(20, NULL, 2022, 26.40, 3.7, 71000, 'Stack Overflow Survey 2022'),
(20, NULL, 2023, 24.90, 3.7, 89000, 'Stack Overflow Survey 2023'),
(20, NULL, 2024, 23.10, 3.7, 65000, 'Stack Overflow Survey 2024');
-- SQL Server — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(20, 3, 2022, 48.30, 3.8, 8000, 'Stack Overflow Survey 2022'),
(20, 3, 2023, 46.10, 3.8, 9500, 'Stack Overflow Survey 2023'),
(20, 3, 2024, 44.20, 3.8, 7200, 'Stack Overflow Survey 2024');
-- SQL Server — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(20, 1, 2022, 22.80, 3.6, 10000, 'Stack Overflow Survey 2022'),
(20, 1, 2023, 21.50, 3.6, 12000, 'Stack Overflow Survey 2023'),
(20, 1, 2024, 20.10, 3.6, 9500, 'Stack Overflow Survey 2024');
-- SQL Server — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(20, 2, 2022, 19.40, 3.7, 12000, 'Stack Overflow Survey 2022'),
(20, 2, 2023, 18.20, 3.7, 14500, 'Stack Overflow Survey 2023'),
(20, 2, 2024, 17.10, 3.7, 11000, 'Stack Overflow Survey 2024');

-- Elasticsearch — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(21, NULL, 2022, 14.80, 4.1, 71000, 'Stack Overflow Survey 2022'),
(21, NULL, 2023, 15.90, 4.2, 89000, 'Stack Overflow Survey 2023'),
(21, NULL, 2024, 17.20, 4.2, 65000, 'Stack Overflow Survey 2024');
-- Elasticsearch — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(21, 1, 2022, 28.60, 4.3, 10000, 'Stack Overflow Survey 2022'),
(21, 1, 2023, 31.40, 4.3, 12000, 'Stack Overflow Survey 2023'),
(21, 1, 2024, 34.80, 4.3, 9500, 'Stack Overflow Survey 2024');
-- Elasticsearch — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(21, 2, 2022, 20.10, 4.2, 12000, 'Stack Overflow Survey 2022'),
(21, 2, 2023, 22.80, 4.2, 14500, 'Stack Overflow Survey 2023'),
(21, 2, 2024, 25.30, 4.3, 11000, 'Stack Overflow Survey 2024');
-- Elasticsearch — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(21, 3, 2022, 16.30, 4.1, 8000, 'Stack Overflow Survey 2022'),
(21, 3, 2023, 18.50, 4.2, 9500, 'Stack Overflow Survey 2023'),
(21, 3, 2024, 20.90, 4.2, 7200, 'Stack Overflow Survey 2024');

-- ----------------------------------------------------------------
-- CLOUD TOOLS
-- AWS (id=22), Azure (id=23), GCP (id=24), Vercel (id=25),
-- Netlify (id=26), DigitalOcean (id=27), Cloudflare (id=28)
-- ----------------------------------------------------------------

-- AWS — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(22, NULL, 2022, 51.10, 4.2, 71000, 'Stack Overflow Survey 2022'),
(22, NULL, 2023, 53.40, 4.3, 89000, 'Stack Overflow Survey 2023'),
(22, NULL, 2024, 55.80, 4.3, 65000, 'Stack Overflow Survey 2024');
-- AWS — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(22, 3, 2022, 62.30, 4.3, 8000, 'Stack Overflow Survey 2022'),
(22, 3, 2023, 65.10, 4.4, 9500, 'Stack Overflow Survey 2023'),
(22, 3, 2024, 67.80, 4.4, 7200, 'Stack Overflow Survey 2024');
-- AWS — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(22, 2, 2022, 58.60, 4.3, 12000, 'Stack Overflow Survey 2022'),
(22, 2, 2023, 61.20, 4.4, 14500, 'Stack Overflow Survey 2023'),
(22, 2, 2024, 63.90, 4.4, 11000, 'Stack Overflow Survey 2024');
-- AWS — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(22, 1, 2022, 55.80, 4.2, 10000, 'Stack Overflow Survey 2022'),
(22, 1, 2023, 58.40, 4.3, 12000, 'Stack Overflow Survey 2023'),
(22, 1, 2024, 60.90, 4.3, 9500, 'Stack Overflow Survey 2024');

-- Azure — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(23, NULL, 2022, 28.70, 3.9, 71000, 'Stack Overflow Survey 2022'),
(23, NULL, 2023, 31.20, 4.0, 89000, 'Stack Overflow Survey 2023'),
(23, NULL, 2024, 33.60, 4.0, 65000, 'Stack Overflow Survey 2024');
-- Azure — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(23, 3, 2022, 42.10, 4.0, 8000, 'Stack Overflow Survey 2022'),
(23, 3, 2023, 45.30, 4.1, 9500, 'Stack Overflow Survey 2023'),
(23, 3, 2024, 48.10, 4.1, 7200, 'Stack Overflow Survey 2024');
-- Azure — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(23, 2, 2022, 29.40, 3.9, 12000, 'Stack Overflow Survey 2022'),
(23, 2, 2023, 32.10, 4.0, 14500, 'Stack Overflow Survey 2023'),
(23, 2, 2024, 34.80, 4.1, 11000, 'Stack Overflow Survey 2024');
-- Azure — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(23, 1, 2022, 24.60, 3.8, 10000, 'Stack Overflow Survey 2022'),
(23, 1, 2023, 26.90, 3.9, 12000, 'Stack Overflow Survey 2023'),
(23, 1, 2024, 29.30, 4.0, 9500, 'Stack Overflow Survey 2024');

-- GCP — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(24, NULL, 2022, 24.10, 4.1, 71000, 'Stack Overflow Survey 2022'),
(24, NULL, 2023, 25.90, 4.1, 89000, 'Stack Overflow Survey 2023'),
(24, NULL, 2024, 27.40, 4.2, 65000, 'Stack Overflow Survey 2024');
-- GCP — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(24, 2, 2022, 28.30, 4.2, 12000, 'Stack Overflow Survey 2022'),
(24, 2, 2023, 30.80, 4.2, 14500, 'Stack Overflow Survey 2023'),
(24, 2, 2024, 33.10, 4.3, 11000, 'Stack Overflow Survey 2024');
-- GCP — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(24, 3, 2022, 22.40, 4.1, 8000, 'Stack Overflow Survey 2022'),
(24, 3, 2023, 24.70, 4.2, 9500, 'Stack Overflow Survey 2023'),
(24, 3, 2024, 27.10, 4.2, 7200, 'Stack Overflow Survey 2024');
-- GCP — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(24, 1, 2022, 18.90, 4.0, 10000, 'Stack Overflow Survey 2022'),
(24, 1, 2023, 20.70, 4.1, 12000, 'Stack Overflow Survey 2023'),
(24, 1, 2024, 22.60, 4.1, 9500, 'Stack Overflow Survey 2024');

-- Vercel — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(25, NULL, 2022, 8.40,  4.5, 71000, 'State of JS 2022'),
(25, NULL, 2023, 12.10, 4.6, 89000, 'State of JS 2023'),
(25, NULL, 2024, 16.30, 4.6, 65000, 'State of JS 2024');
-- Vercel — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(25, 2, 2022, 13.40, 4.6, 12000, 'State of JS 2022'),
(25, 2, 2023, 19.80, 4.7, 14500, 'State of JS 2023'),
(25, 2, 2024, 26.40, 4.7, 11000, 'State of JS 2024');
-- Vercel — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(25, 1, 2022, 10.80, 4.5, 10000, 'State of JS 2022'),
(25, 1, 2023, 16.30, 4.6, 12000, 'State of JS 2023'),
(25, 1, 2024, 22.10, 4.6, 9500, 'State of JS 2024');
-- Vercel — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(25, 3, 2022, 5.60, 4.4, 8000, 'State of JS 2022'),
(25, 3, 2023, 8.90, 4.5, 9500, 'State of JS 2023'),
(25, 3, 2024, 12.80, 4.5, 7200, 'State of JS 2024');

-- Netlify — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(26, NULL, 2022, 9.20,  4.3, 71000, 'State of JS 2022'),
(26, NULL, 2023, 9.80,  4.3, 89000, 'State of JS 2023'),
(26, NULL, 2024, 10.10, 4.2, 65000, 'State of JS 2024');
-- Netlify — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(26, 2, 2022, 12.40, 4.4, 12000, 'State of JS 2022'),
(26, 2, 2023, 13.10, 4.3, 14500, 'State of JS 2023'),
(26, 2, 2024, 13.60, 4.3, 11000, 'State of JS 2024');
-- Netlify — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(26, 1, 2022, 11.30, 4.3, 10000, 'State of JS 2022'),
(26, 1, 2023, 11.90, 4.2, 12000, 'State of JS 2023'),
(26, 1, 2024, 12.40, 4.2, 9500, 'State of JS 2024');
-- Netlify — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(26, 3, 2022, 6.10, 4.2, 8000, 'State of JS 2022'),
(26, 3, 2023, 6.60, 4.2, 9500, 'State of JS 2023'),
(26, 3, 2024, 7.20, 4.2, 7200, 'State of JS 2024');

-- DigitalOcean — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(27, NULL, 2022, 13.80, 4.3, 71000, 'Stack Overflow Survey 2022'),
(27, NULL, 2023, 13.20, 4.3, 89000, 'Stack Overflow Survey 2023'),
(27, NULL, 2024, 12.60, 4.2, 65000, 'Stack Overflow Survey 2024');
-- DigitalOcean — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(27, 2, 2022, 18.20, 4.4, 12000, 'Stack Overflow Survey 2022'),
(27, 2, 2023, 17.50, 4.3, 14500, 'Stack Overflow Survey 2023'),
(27, 2, 2024, 16.80, 4.3, 11000, 'Stack Overflow Survey 2024');
-- DigitalOcean — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(27, 1, 2022, 14.60, 4.3, 10000, 'Stack Overflow Survey 2022'),
(27, 1, 2023, 13.90, 4.2, 12000, 'Stack Overflow Survey 2023'),
(27, 1, 2024, 13.10, 4.2, 9500, 'Stack Overflow Survey 2024');
-- DigitalOcean — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(27, 3, 2022, 9.80, 4.2, 8000, 'Stack Overflow Survey 2022'),
(27, 3, 2023, 9.20, 4.1, 9500, 'Stack Overflow Survey 2023'),
(27, 3, 2024, 8.70, 4.1, 7200, 'Stack Overflow Survey 2024');

-- Cloudflare — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(28, NULL, 2022, 11.60, 4.4, 71000, 'Stack Overflow Survey 2022'),
(28, NULL, 2023, 15.30, 4.5, 89000, 'Stack Overflow Survey 2023'),
(28, NULL, 2024, 19.80, 4.6, 65000, 'Stack Overflow Survey 2024');
-- Cloudflare — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(28, 2, 2022, 15.30, 4.5, 12000, 'Stack Overflow Survey 2022'),
(28, 2, 2023, 20.80, 4.6, 14500, 'Stack Overflow Survey 2023'),
(28, 2, 2024, 27.40, 4.7, 11000, 'Stack Overflow Survey 2024');
-- Cloudflare — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(28, 1, 2022, 13.80, 4.4, 10000, 'Stack Overflow Survey 2022'),
(28, 1, 2023, 18.50, 4.5, 12000, 'Stack Overflow Survey 2023'),
(28, 1, 2024, 24.10, 4.6, 9500, 'Stack Overflow Survey 2024');
-- Cloudflare — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(28, 3, 2022, 10.20, 4.3, 8000, 'Stack Overflow Survey 2022'),
(28, 3, 2023, 14.10, 4.4, 9500, 'Stack Overflow Survey 2023'),
(28, 3, 2024, 18.60, 4.5, 7200, 'Stack Overflow Survey 2024');

-- ----------------------------------------------------------------
-- DEVOPS TOOLS
-- Docker (id=29), Kubernetes (id=30), GitHub Actions (id=31),
-- Terraform (id=32), Jenkins (id=33), GitLab CI (id=34), Ansible (id=35)
-- ----------------------------------------------------------------

-- Docker — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(29, NULL, 2022, 55.30, 4.5, 71000, 'Stack Overflow Survey 2022'),
(29, NULL, 2023, 58.90, 4.5, 89000, 'Stack Overflow Survey 2023'),
(29, NULL, 2024, 62.40, 4.5, 65000, 'Stack Overflow Survey 2024');
-- Docker — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(29, 2, 2022, 68.10, 4.6, 12000, 'Stack Overflow Survey 2022'),
(29, 2, 2023, 72.50, 4.6, 14500, 'Stack Overflow Survey 2023'),
(29, 2, 2024, 76.80, 4.6, 11000, 'Stack Overflow Survey 2024');
-- Docker — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(29, 3, 2022, 59.40, 4.5, 8000, 'Stack Overflow Survey 2022'),
(29, 3, 2023, 63.80, 4.5, 9500, 'Stack Overflow Survey 2023'),
(29, 3, 2024, 67.90, 4.6, 7200, 'Stack Overflow Survey 2024');
-- Docker — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(29, 1, 2022, 52.70, 4.5, 10000, 'Stack Overflow Survey 2022'),
(29, 1, 2023, 56.80, 4.5, 12000, 'Stack Overflow Survey 2023'),
(29, 1, 2024, 60.40, 4.5, 9500, 'Stack Overflow Survey 2024');

-- Kubernetes — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(30, NULL, 2022, 26.40, 4.1, 71000, 'Stack Overflow Survey 2022'),
(30, NULL, 2023, 30.10, 4.2, 89000, 'Stack Overflow Survey 2023'),
(30, NULL, 2024, 34.20, 4.3, 65000, 'Stack Overflow Survey 2024');
-- Kubernetes — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(30, 2, 2022, 38.60, 4.3, 12000, 'Stack Overflow Survey 2022'),
(30, 2, 2023, 44.20, 4.4, 14500, 'Stack Overflow Survey 2023'),
(30, 2, 2024, 50.10, 4.4, 11000, 'Stack Overflow Survey 2024');
-- Kubernetes — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(30, 3, 2022, 32.10, 4.2, 8000, 'Stack Overflow Survey 2022'),
(30, 3, 2023, 37.40, 4.3, 9500, 'Stack Overflow Survey 2023'),
(30, 3, 2024, 42.80, 4.3, 7200, 'Stack Overflow Survey 2024');
-- Kubernetes — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(30, 1, 2022, 24.30, 4.1, 10000, 'Stack Overflow Survey 2022'),
(30, 1, 2023, 28.60, 4.2, 12000, 'Stack Overflow Survey 2023'),
(30, 1, 2024, 33.10, 4.2, 9500, 'Stack Overflow Survey 2024');

-- GitHub Actions — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(31, NULL, 2022, 38.10, 4.4, 71000, 'Stack Overflow Survey 2022'),
(31, NULL, 2023, 46.80, 4.5, 89000, 'Stack Overflow Survey 2023'),
(31, NULL, 2024, 54.30, 4.5, 65000, 'Stack Overflow Survey 2024');
-- GitHub Actions — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(31, 2, 2022, 49.30, 4.5, 12000, 'Stack Overflow Survey 2022'),
(31, 2, 2023, 59.20, 4.6, 14500, 'Stack Overflow Survey 2023'),
(31, 2, 2024, 68.40, 4.6, 11000, 'Stack Overflow Survey 2024');
-- GitHub Actions — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(31, 1, 2022, 36.80, 4.4, 10000, 'Stack Overflow Survey 2022'),
(31, 1, 2023, 45.10, 4.5, 12000, 'Stack Overflow Survey 2023'),
(31, 1, 2024, 52.60, 4.5, 9500, 'Stack Overflow Survey 2024');
-- GitHub Actions — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(31, 3, 2022, 32.40, 4.3, 8000, 'Stack Overflow Survey 2022'),
(31, 3, 2023, 40.90, 4.4, 9500, 'Stack Overflow Survey 2023'),
(31, 3, 2024, 48.70, 4.5, 7200, 'Stack Overflow Survey 2024');

-- Terraform — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(32, NULL, 2022, 22.30, 4.3, 71000, 'Stack Overflow Survey 2022'),
(32, NULL, 2023, 26.80, 4.4, 89000, 'Stack Overflow Survey 2023'),
(32, NULL, 2024, 31.10, 4.4, 65000, 'Stack Overflow Survey 2024');
-- Terraform — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(32, 2, 2022, 30.40, 4.4, 12000, 'Stack Overflow Survey 2022'),
(32, 2, 2023, 36.90, 4.5, 14500, 'Stack Overflow Survey 2023'),
(32, 2, 2024, 43.20, 4.5, 11000, 'Stack Overflow Survey 2024');
-- Terraform — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(32, 3, 2022, 28.10, 4.3, 8000, 'Stack Overflow Survey 2022'),
(32, 3, 2023, 34.50, 4.4, 9500, 'Stack Overflow Survey 2023'),
(32, 3, 2024, 40.80, 4.5, 7200, 'Stack Overflow Survey 2024');
-- Terraform — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(32, 1, 2022, 18.60, 4.2, 10000, 'Stack Overflow Survey 2022'),
(32, 1, 2023, 23.10, 4.3, 12000, 'Stack Overflow Survey 2023'),
(32, 1, 2024, 28.40, 4.3, 9500, 'Stack Overflow Survey 2024');

-- Jenkins — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(33, NULL, 2022, 29.60, 3.4, 71000, 'Stack Overflow Survey 2022'),
(33, NULL, 2023, 25.80, 3.3, 89000, 'Stack Overflow Survey 2023'),
(33, NULL, 2024, 22.40, 3.2, 65000, 'Stack Overflow Survey 2024');
-- Jenkins — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(33, 3, 2022, 42.10, 3.5, 8000, 'Stack Overflow Survey 2022'),
(33, 3, 2023, 37.80, 3.4, 9500, 'Stack Overflow Survey 2023'),
(33, 3, 2024, 33.60, 3.3, 7200, 'Stack Overflow Survey 2024');
-- Jenkins — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(33, 1, 2022, 28.30, 3.4, 10000, 'Stack Overflow Survey 2022'),
(33, 1, 2023, 24.80, 3.3, 12000, 'Stack Overflow Survey 2023'),
(33, 1, 2024, 21.50, 3.2, 9500, 'Stack Overflow Survey 2024');
-- Jenkins — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(33, 2, 2022, 22.50, 3.3, 12000, 'Stack Overflow Survey 2022'),
(33, 2, 2023, 19.20, 3.2, 14500, 'Stack Overflow Survey 2023'),
(33, 2, 2024, 16.30, 3.1, 11000, 'Stack Overflow Survey 2024');

-- GitLab CI/CD — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(34, NULL, 2022, 21.40, 4.1, 71000, 'Stack Overflow Survey 2022'),
(34, NULL, 2023, 23.10, 4.2, 89000, 'Stack Overflow Survey 2023'),
(34, NULL, 2024, 24.60, 4.2, 65000, 'Stack Overflow Survey 2024');
-- GitLab CI — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(34, 2, 2022, 24.30, 4.2, 12000, 'Stack Overflow Survey 2022'),
(34, 2, 2023, 26.10, 4.2, 14500, 'Stack Overflow Survey 2023'),
(34, 2, 2024, 27.80, 4.3, 11000, 'Stack Overflow Survey 2024');
-- GitLab CI — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(34, 3, 2022, 26.80, 4.1, 8000, 'Stack Overflow Survey 2022'),
(34, 3, 2023, 28.60, 4.2, 9500, 'Stack Overflow Survey 2023'),
(34, 3, 2024, 30.20, 4.2, 7200, 'Stack Overflow Survey 2024');
-- GitLab CI — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(34, 1, 2022, 18.90, 4.0, 10000, 'Stack Overflow Survey 2022'),
(34, 1, 2023, 20.40, 4.1, 12000, 'Stack Overflow Survey 2023'),
(34, 1, 2024, 21.90, 4.1, 9500, 'Stack Overflow Survey 2024');

-- Ansible — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(35, NULL, 2022, 16.80, 4.0, 71000, 'Stack Overflow Survey 2022'),
(35, NULL, 2023, 17.30, 4.0, 89000, 'Stack Overflow Survey 2023'),
(35, NULL, 2024, 17.80, 4.1, 65000, 'Stack Overflow Survey 2024');
-- Ansible — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(35, 3, 2022, 22.40, 4.1, 8000, 'Stack Overflow Survey 2022'),
(35, 3, 2023, 23.10, 4.1, 9500, 'Stack Overflow Survey 2023'),
(35, 3, 2024, 23.80, 4.2, 7200, 'Stack Overflow Survey 2024');
-- Ansible — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(35, 2, 2022, 14.30, 3.9, 12000, 'Stack Overflow Survey 2022'),
(35, 2, 2023, 14.90, 4.0, 14500, 'Stack Overflow Survey 2023'),
(35, 2, 2024, 15.60, 4.0, 11000, 'Stack Overflow Survey 2024');
-- Ansible — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(35, 1, 2022, 12.10, 3.9, 10000, 'Stack Overflow Survey 2022'),
(35, 1, 2023, 12.60, 4.0, 12000, 'Stack Overflow Survey 2023'),
(35, 1, 2024, 13.20, 4.0, 9500, 'Stack Overflow Survey 2024');

-- ----------------------------------------------------------------
-- APIS TOOLS
-- REST (id=36), GraphQL (id=37), gRPC (id=38), WebSockets (id=39),
-- tRPC (id=40), OpenAPI (id=41), Webhooks (id=42)
-- ----------------------------------------------------------------

-- REST — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(36, NULL, 2022, 81.30, 4.0, 71000, 'Stack Overflow Survey 2022'),
(36, NULL, 2023, 82.10, 4.0, 89000, 'Stack Overflow Survey 2023'),
(36, NULL, 2024, 82.80, 4.0, 65000, 'Stack Overflow Survey 2024');
-- REST — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(36, 2, 2022, 86.40, 4.1, 12000, 'Stack Overflow Survey 2022'),
(36, 2, 2023, 87.10, 4.1, 14500, 'Stack Overflow Survey 2023'),
(36, 2, 2024, 87.80, 4.1, 11000, 'Stack Overflow Survey 2024');
-- REST — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(36, 3, 2022, 88.20, 4.1, 8000, 'Stack Overflow Survey 2022'),
(36, 3, 2023, 88.90, 4.1, 9500, 'Stack Overflow Survey 2023'),
(36, 3, 2024, 89.50, 4.1, 7200, 'Stack Overflow Survey 2024');
-- REST — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(36, 1, 2022, 84.10, 4.0, 10000, 'Stack Overflow Survey 2022'),
(36, 1, 2023, 84.80, 4.0, 12000, 'Stack Overflow Survey 2023'),
(36, 1, 2024, 85.30, 4.0, 9500, 'Stack Overflow Survey 2024');

-- GraphQL — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(37, NULL, 2022, 22.40, 4.2, 71000, 'Stack Overflow Survey 2022'),
(37, NULL, 2023, 25.80, 4.3, 89000, 'Stack Overflow Survey 2023'),
(37, NULL, 2024, 29.10, 4.3, 65000, 'Stack Overflow Survey 2024');
-- GraphQL — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(37, 2, 2022, 34.60, 4.4, 12000, 'Stack Overflow Survey 2022'),
(37, 2, 2023, 39.30, 4.4, 14500, 'Stack Overflow Survey 2023'),
(37, 2, 2024, 44.20, 4.5, 11000, 'Stack Overflow Survey 2024');
-- GraphQL — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(37, 1, 2022, 28.10, 4.3, 10000, 'Stack Overflow Survey 2022'),
(37, 1, 2023, 32.40, 4.3, 12000, 'Stack Overflow Survey 2023'),
(37, 1, 2024, 36.80, 4.4, 9500, 'Stack Overflow Survey 2024');
-- GraphQL — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(37, 3, 2022, 18.30, 4.2, 8000, 'Stack Overflow Survey 2022'),
(37, 3, 2023, 22.10, 4.3, 9500, 'Stack Overflow Survey 2023'),
(37, 3, 2024, 26.40, 4.3, 7200, 'Stack Overflow Survey 2024');

-- gRPC — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(38, NULL, 2022, 9.80,  4.2, 71000, 'Stack Overflow Survey 2022'),
(38, NULL, 2023, 12.30, 4.3, 89000, 'Stack Overflow Survey 2023'),
(38, NULL, 2024, 15.10, 4.4, 65000, 'Stack Overflow Survey 2024');
-- gRPC — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(38, 2, 2022, 14.20, 4.3, 12000, 'Stack Overflow Survey 2022'),
(38, 2, 2023, 18.60, 4.4, 14500, 'Stack Overflow Survey 2023'),
(38, 2, 2024, 23.40, 4.5, 11000, 'Stack Overflow Survey 2024');
-- gRPC — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(38, 3, 2022, 12.60, 4.3, 8000, 'Stack Overflow Survey 2022'),
(38, 3, 2023, 16.40, 4.4, 9500, 'Stack Overflow Survey 2023'),
(38, 3, 2024, 20.80, 4.5, 7200, 'Stack Overflow Survey 2024');
-- gRPC — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(38, 1, 2022, 7.30, 4.1, 10000, 'Stack Overflow Survey 2022'),
(38, 1, 2023, 9.80, 4.2, 12000, 'Stack Overflow Survey 2023'),
(38, 1, 2024, 12.60, 4.3, 9500, 'Stack Overflow Survey 2024');

-- WebSockets — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(39, NULL, 2022, 31.40, 4.1, 71000, 'Stack Overflow Survey 2022'),
(39, NULL, 2023, 34.20, 4.2, 89000, 'Stack Overflow Survey 2023'),
(39, NULL, 2024, 37.10, 4.2, 65000, 'Stack Overflow Survey 2024');
-- WebSockets — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(39, 2, 2022, 38.60, 4.2, 12000, 'Stack Overflow Survey 2022'),
(39, 2, 2023, 42.30, 4.3, 14500, 'Stack Overflow Survey 2023'),
(39, 2, 2024, 45.90, 4.3, 11000, 'Stack Overflow Survey 2024');
-- WebSockets — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(39, 1, 2022, 28.10, 4.1, 10000, 'Stack Overflow Survey 2022'),
(39, 1, 2023, 31.40, 4.2, 12000, 'Stack Overflow Survey 2023'),
(39, 1, 2024, 34.80, 4.2, 9500, 'Stack Overflow Survey 2024');
-- WebSockets — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(39, 3, 2022, 34.20, 4.2, 8000, 'Stack Overflow Survey 2022'),
(39, 3, 2023, 38.10, 4.3, 9500, 'Stack Overflow Survey 2023'),
(39, 3, 2024, 42.60, 4.3, 7200, 'Stack Overflow Survey 2024');

-- tRPC — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(40, NULL, 2022, 2.80,  4.6, 71000, 'State of JS 2022'),
(40, NULL, 2023, 5.40,  4.7, 89000, 'State of JS 2023'),
(40, NULL, 2024, 8.90,  4.7, 65000, 'State of JS 2024');
-- tRPC — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(40, 2, 2022, 4.30,  4.7, 12000, 'State of JS 2022'),
(40, 2, 2023, 8.60,  4.8, 14500, 'State of JS 2023'),
(40, 2, 2024, 14.20, 4.8, 11000, 'State of JS 2024');
-- tRPC — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(40, 1, 2022, 2.10, 4.6, 10000, 'State of JS 2022'),
(40, 1, 2023, 4.30, 4.7, 12000, 'State of JS 2023'),
(40, 1, 2024, 7.20, 4.7, 9500, 'State of JS 2024');
-- tRPC — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(40, 3, 2022, 1.60, 4.5, 8000, 'State of JS 2022'),
(40, 3, 2023, 3.40, 4.6, 9500, 'State of JS 2023'),
(40, 3, 2024, 6.10, 4.6, 7200, 'State of JS 2024');

-- OpenAPI — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(41, NULL, 2022, 38.20, 4.2, 71000, 'Stack Overflow Survey 2022'),
(41, NULL, 2023, 42.80, 4.3, 89000, 'Stack Overflow Survey 2023'),
(41, NULL, 2024, 47.30, 4.3, 65000, 'Stack Overflow Survey 2024');
-- OpenAPI — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(41, 2, 2022, 48.60, 4.3, 12000, 'Stack Overflow Survey 2022'),
(41, 2, 2023, 54.30, 4.4, 14500, 'Stack Overflow Survey 2023'),
(41, 2, 2024, 59.80, 4.4, 11000, 'Stack Overflow Survey 2024');
-- OpenAPI — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(41, 3, 2022, 52.30, 4.3, 8000, 'Stack Overflow Survey 2022'),
(41, 3, 2023, 57.80, 4.4, 9500, 'Stack Overflow Survey 2023'),
(41, 3, 2024, 63.20, 4.4, 7200, 'Stack Overflow Survey 2024');
-- OpenAPI — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(41, 1, 2022, 36.10, 4.2, 10000, 'Stack Overflow Survey 2022'),
(41, 1, 2023, 40.80, 4.3, 12000, 'Stack Overflow Survey 2023'),
(41, 1, 2024, 45.60, 4.3, 9500, 'Stack Overflow Survey 2024');

-- Webhooks — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(42, NULL, 2022, 44.10, 4.0, 71000, 'Stack Overflow Survey 2022'),
(42, NULL, 2023, 47.30, 4.1, 89000, 'Stack Overflow Survey 2023'),
(42, NULL, 2024, 50.40, 4.1, 65000, 'Stack Overflow Survey 2024');
-- Webhooks — E-Commerce
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(42, 1, 2022, 58.30, 4.2, 10000, 'Stack Overflow Survey 2022'),
(42, 1, 2023, 62.40, 4.2, 12000, 'Stack Overflow Survey 2023'),
(42, 1, 2024, 66.10, 4.3, 9500, 'Stack Overflow Survey 2024');
-- Webhooks — SaaS
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(42, 2, 2022, 52.60, 4.1, 12000, 'Stack Overflow Survey 2022'),
(42, 2, 2023, 56.80, 4.2, 14500, 'Stack Overflow Survey 2023'),
(42, 2, 2024, 60.90, 4.2, 11000, 'Stack Overflow Survey 2024');
-- Webhooks — Fintech
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(42, 3, 2022, 48.20, 4.1, 8000, 'Stack Overflow Survey 2022'),
(42, 3, 2023, 52.60, 4.1, 9500, 'Stack Overflow Survey 2023'),
(42, 3, 2024, 57.10, 4.2, 7200, 'Stack Overflow Survey 2024');

-- ---- MOBILE (category_id = 8) --------------------------------
INSERT INTO tools (category_id, slug, name, description, website_url, open_source, first_released) VALUES
(8, 'react-native', 'React Native', 'Cross-platform mobile framework using React and native components',   'https://reactnative.dev',  TRUE,  2015),
(8, 'flutter',      'Flutter',      'Google UI toolkit for building natively compiled mobile apps',         'https://flutter.dev',      TRUE,  2018),
(8, 'swift',        'Swift',        'Apple\'s general-purpose language for iOS and macOS development',      'https://swift.org',        TRUE,  2014),
(8, 'kotlin',       'Kotlin',       'Modern language for Android development, officially endorsed by Google','https://kotlinlang.org',  TRUE,  2016),
(8, 'xamarin',      'Xamarin',      'Microsoft platform for building mobile apps with .NET and C#',         'https://dotnet.microsoft.com/apps/xamarin', TRUE, 2011);

-- React Native — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(43, NULL, 2022, 64.10, 4.1, 71000, 'Stack Overflow Survey 2022'),
(43, NULL, 2023, 68.30, 4.2, 89000, 'Stack Overflow Survey 2023'),
(43, NULL, 2024, 72.00, 4.2, 65000, 'Stack Overflow Survey 2024');

-- Flutter — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(44, NULL, 2022, 42.00, 4.4, 71000, 'Stack Overflow Survey 2022'),
(44, NULL, 2023, 50.10, 4.5, 89000, 'Stack Overflow Survey 2023'),
(44, NULL, 2024, 58.00, 4.5, 65000, 'Stack Overflow Survey 2024');

-- Swift — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(45, NULL, 2022, 36.20, 4.3, 71000, 'Stack Overflow Survey 2022'),
(45, NULL, 2023, 38.60, 4.3, 89000, 'Stack Overflow Survey 2023'),
(45, NULL, 2024, 41.00, 4.4, 65000, 'Stack Overflow Survey 2024');

-- Kotlin — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(46, NULL, 2022, 32.10, 4.2, 71000, 'Stack Overflow Survey 2022'),
(46, NULL, 2023, 35.20, 4.3, 89000, 'Stack Overflow Survey 2023'),
(46, NULL, 2024, 38.00, 4.3, 65000, 'Stack Overflow Survey 2024');

-- Xamarin — global
INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source) VALUES
(47, NULL, 2022, 18.40, 3.2, 71000, 'Stack Overflow Survey 2022'),
(47, NULL, 2023, 15.10, 3.1, 89000, 'Stack Overflow Survey 2023'),
(47, NULL, 2024, 12.00, 3.0, 65000, 'Stack Overflow Survey 2024');

-- ============================================================
-- TRENDS (pre-computed seed values for demo)
-- Positive trend_score = rising, negative = falling
-- ============================================================

-- Backend trends (global)
INSERT INTO trends (tool_id, industry_id, trend_score, trend_direction, year_from, year_to) VALUES
(1,  NULL, 2.85,  'rising',  2022, 2024),  -- Node.js rising
(2,  NULL, 1.65,  'rising',  2022, 2024),  -- Python rising
(3,  NULL, -2.45, 'falling', 2022, 2024),  -- Java falling
(4,  NULL, 0.90,  'rising',  2022, 2024),  -- .NET slowly rising
(5,  NULL, 2.30,  'rising',  2022, 2024),  -- Go rising fast
(6,  NULL, -0.65, 'falling', 2022, 2024),  -- Rails slowly falling
(7,  NULL, -1.55, 'falling', 2022, 2024);  -- PHP declining

-- Frontend trends (global)
INSERT INTO trends (tool_id, industry_id, trend_score, trend_direction, year_from, year_to) VALUES
(8,  NULL, 2.15,  'rising',  2022, 2024),  -- React rising
(9,  NULL, -1.20, 'falling', 2022, 2024),  -- Vue slowly declining
(10, NULL, -1.15, 'falling', 2022, 2024),  -- Angular declining
(11, NULL, 2.40,  'rising',  2022, 2024),  -- Svelte rising fast
(12, NULL, 5.55,  'rising',  2022, 2024),  -- Next.js rising very fast
(13, NULL, 1.60,  'rising',  2022, 2024),  -- Nuxt rising
(14, NULL, 2.35,  'rising',  2022, 2024);  -- Remix rising fast

-- Database trends (global)
INSERT INTO trends (tool_id, industry_id, trend_score, trend_direction, year_from, year_to) VALUES
(15, NULL, 3.30,  'rising',  2022, 2024),  -- PostgreSQL rising strongly
(16, NULL, -2.35, 'falling', 2022, 2024),  -- MySQL declining
(17, NULL, -1.20, 'falling', 2022, 2024),  -- MongoDB declining slightly
(18, NULL, 2.75,  'rising',  2022, 2024),  -- Redis rising
(19, NULL, 2.05,  'rising',  2022, 2024),  -- SQLite rising
(20, NULL, -1.65, 'falling', 2022, 2024),  -- SQL Server declining
(21, NULL, 1.20,  'rising',  2022, 2024);  -- Elasticsearch rising

-- Cloud trends (global)
INSERT INTO trends (tool_id, industry_id, trend_score, trend_direction, year_from, year_to) VALUES
(22, NULL, 2.35,  'rising',  2022, 2024),  -- AWS rising
(23, NULL, 2.45,  'rising',  2022, 2024),  -- Azure rising
(24, NULL, 1.65,  'rising',  2022, 2024),  -- GCP rising
(25, NULL, 3.95,  'rising',  2022, 2024),  -- Vercel rising fast
(26, NULL, 0.45,  'stable',  2022, 2024),  -- Netlify stable
(27, NULL, -0.60, 'stable',  2022, 2024),  -- DigitalOcean stable/slight fall
(28, NULL, 4.10,  'rising',  2022, 2024);  -- Cloudflare rising very fast

-- DevOps trends (global)
INSERT INTO trends (tool_id, industry_id, trend_score, trend_direction, year_from, year_to) VALUES
(29, NULL, 3.55,  'rising',  2022, 2024),  -- Docker rising strongly
(30, NULL, 3.90,  'rising',  2022, 2024),  -- Kubernetes rising strongly
(31, NULL, 8.10,  'rising',  2022, 2024),  -- GitHub Actions rising very fast
(32, NULL, 4.40,  'rising',  2022, 2024),  -- Terraform rising fast
(33, NULL, -3.60, 'falling', 2022, 2024),  -- Jenkins falling fast
(34, NULL, 1.60,  'rising',  2022, 2024),  -- GitLab CI rising
(35, NULL, 0.50,  'stable',  2022, 2024);  -- Ansible stable

-- API trends (global)
INSERT INTO trends (tool_id, industry_id, trend_score, trend_direction, year_from, year_to) VALUES
(36, NULL, 0.75,  'stable',  2022, 2024),  -- REST dominant and stable
(37, NULL, 3.35,  'rising',  2022, 2024),  -- GraphQL rising
(38, NULL, 2.65,  'rising',  2022, 2024),  -- gRPC rising
(39, NULL, 2.85,  'rising',  2022, 2024),  -- WebSockets rising
(40, NULL, 3.05,  'rising',  2022, 2024),  -- tRPC rising fast
(41, NULL, 4.55,  'rising',  2022, 2024),  -- OpenAPI rising strongly
(42, NULL, 3.15,  'rising',  2022, 2024);  -- Webhooks rising

-- Mobile trends (global)
INSERT INTO trends (tool_id, industry_id, trend_score, trend_direction, year_from, year_to) VALUES
(43, NULL, 4.00,  'rising',  2022, 2024),  -- React Native rising
(44, NULL, 8.00,  'rising',  2022, 2024),  -- Flutter rising very fast
(45, NULL, 2.50,  'rising',  2022, 2024),  -- Swift rising
(46, NULL, 3.00,  'rising',  2022, 2024),  -- Kotlin rising
(47, NULL, -3.20, 'falling', 2022, 2024);  -- Xamarin declining

-- ============================================================
-- STACK PROFILES — sample stacks for Tech Stack Builder
-- ============================================================

INSERT INTO stack_profiles (industry_id, product_type, description, is_published) VALUES
(3, 'Mobile Banking App',     'Secure, high-performance stack for mobile-first banking applications',    TRUE),
(2, 'SaaS Dashboard',         'Scalable web application stack for B2B SaaS products',                   TRUE),
(1, 'E-Commerce Store',       'Full-featured online store with real-time inventory and payments',        TRUE),
(3, 'Payment Gateway',        'High-throughput, PCI-compliant payment processing infrastructure',        TRUE),
(3, 'Trading Platform',       'Low-latency data pipeline and UI for real-time financial trading',        TRUE),
(2, 'Customer Support Tool',  'Real-time ticketing and chat platform for SaaS customer success teams',   TRUE),
(2, 'Analytics Dashboard',    'Data-heavy reporting platform with complex queries and visualisations',   TRUE),
(1, 'Marketplace Platform',   'Multi-vendor marketplace with listings, payments, and seller management', TRUE),
(1, 'Subscription Box',       'Recurring-order e-commerce with billing, inventory, and fulfilment',      TRUE);

-- Stack 1: Mobile Banking App (profile_id=1, industry=fintech)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(1, 1,  1, 'Node.js handles high-throughput async operations ideal for real-time banking transactions', TRUE),
(1, 8,  2, 'React provides the component architecture needed for complex financial dashboards',         TRUE),
(1, 15, 3, 'PostgreSQL ACID compliance is critical for financial data integrity',                      TRUE),
(1, 22, 4, 'AWS dominates fintech for compliance certifications and global infrastructure',            TRUE),
(1, 29, 5, 'Docker ensures consistent environments across development and regulated production',       TRUE),
(1, 36, 6, 'REST remains the standard for banking APIs due to broad support and auditing tooling',    TRUE);

-- Stack 2: SaaS Dashboard (profile_id=2, industry=saas)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(2, 1,  1, 'Node.js excels at serving many concurrent dashboard users with low latency',              TRUE),
(2, 12, 2, 'Next.js SSR improves time-to-first-paint for SaaS dashboards and helps with SEO',        TRUE),
(2, 15, 3, 'PostgreSQL handles complex relational data for multi-tenant SaaS architecture',           TRUE),
(2, 25, 4, 'Vercel provides zero-config deployments and edge network optimized for Next.js',          TRUE),
(2, 31, 5, 'GitHub Actions integrates directly into code review workflow for fast CI/CD',             TRUE),
(2, 37, 6, 'GraphQL lets dashboard clients request exactly the data fields they need',                TRUE);

-- Stack 3: E-Commerce Store (profile_id=3, industry=ecommerce)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(3, 1,  1, 'Node.js handles the async nature of product catalog, cart, and payment flows',            TRUE),
(3, 12, 2, 'Next.js SSG and ISR provide fast page loads critical for e-commerce conversion rates',    TRUE),
(3, 16, 3, 'MySQL is the proven choice for e-commerce order management and product catalogs',         TRUE),
(3, 22, 4, 'AWS S3, CloudFront, and Lambda provide scalable infrastructure for traffic spikes',       TRUE),
(3, 31, 5, 'GitHub Actions automates testing and deployment on every product catalog update',         TRUE),
(3, 42, 6, 'Webhooks power real-time payment notifications, inventory updates, and order events',     TRUE);

-- Stack 4: Payment Gateway (profile_id=4, industry=fintech)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(4, 1,  1, 'Node.js event loop handles thousands of concurrent payment requests without blocking',     TRUE),
(4, 8,  2, 'React enables smooth checkout flows with real-time validation feedback',                   TRUE),
(4, 15, 3, 'PostgreSQL transactions and row-level locking prevent double-charges under concurrency',   TRUE),
(4, 22, 4, 'AWS provides PCI DSS-compliant infrastructure with VPC isolation and KMS encryption',     TRUE),
(4, 30, 5, 'Kubernetes auto-scales payment workers during peak transaction periods',                   TRUE),
(4, 41, 6, 'OpenAPI specification ensures payment endpoints are auditable and well-documented',        TRUE);

-- Stack 5: Trading Platform (profile_id=5, industry=fintech)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(5, 2,  1, 'Python drives the data pipeline and algorithmic logic with NumPy and pandas',              TRUE),
(5, 8,  2, 'React with lightweight charting libraries renders tick-by-tick price data efficiently',    TRUE),
(5, 15, 3, 'PostgreSQL with TimescaleDB extension handles time-series price and order book data',      TRUE),
(5, 22, 4, 'AWS EC2 instances in low-latency availability zones minimise order execution delays',      TRUE),
(5, 30, 5, 'Kubernetes orchestrates separate services for market data, order routing, and risk',       TRUE),
(5, 38, 6, 'gRPC provides the low-latency binary protocol required for high-frequency order flow',     TRUE);

-- Stack 6: Customer Support Tool (profile_id=6, industry=saas)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(6, 1,  1, 'Node.js powers the real-time event bus that routes tickets and chat messages',             TRUE),
(6, 9,  2, 'Vue.js reactive data binding keeps the support queue UI in sync without full reloads',    TRUE),
(6, 15, 3, 'PostgreSQL stores ticket history with full-text search for knowledge base lookups',        TRUE),
(6, 24, 4, 'GCP Pub/Sub and Cloud Run provide serverless, event-driven message routing',               TRUE),
(6, 31, 5, 'GitHub Actions runs automated regression tests on every deployment',                       TRUE),
(6, 39, 6, 'WebSockets enable real-time chat between agents and customers with sub-second delivery',   TRUE);

-- Stack 7: Analytics Dashboard (profile_id=7, industry=saas)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(7, 2,  1, 'Python handles ETL pipelines and statistical aggregations before serving to the API',      TRUE),
(7, 8,  2, 'React with Chart.js and D3 renders interactive drill-down charts efficiently',             TRUE),
(7, 15, 3, 'PostgreSQL window functions and materialized views make complex report queries fast',      TRUE),
(7, 24, 4, 'GCP BigQuery handles petabyte-scale analytical queries behind the report API',             TRUE),
(7, 32, 5, 'Terraform provisions consistent analytics infrastructure across staging and production',   TRUE),
(7, 37, 6, 'GraphQL allows dashboard widgets to independently fetch only the metrics they display',    TRUE);

-- Stack 8: Marketplace Platform (profile_id=8, industry=ecommerce)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(8, 1,  1, 'Node.js microservices isolate seller, buyer, and payment domains independently',           TRUE),
(8, 12, 2, 'Next.js ISR regenerates seller listing pages on-demand without full rebuilds',            TRUE),
(8, 15, 3, 'PostgreSQL handles the complex relational model of sellers, listings, and orders',         TRUE),
(8, 22, 4, 'AWS manages image storage (S3), CDN (CloudFront), and serverless functions (Lambda)',      TRUE),
(8, 31, 5, 'GitHub Actions runs seller onboarding integration tests on every merge',                   TRUE),
(8, 37, 6, 'GraphQL lets buyer and seller apps fetch tailored views of the same data model',           TRUE);

-- Stack 9: Subscription Box (profile_id=9, industry=ecommerce)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(9, 1,  1, 'Node.js manages the recurring billing scheduler and fulfilment event queue',               TRUE),
(9, 8,  2, 'React powers the subscription management portal where customers edit their boxes',         TRUE),
(9, 16, 3, 'MySQL reliably handles subscription plans, billing cycles, and shipment records',          TRUE),
(9, 22, 4, 'AWS SQS queues fulfilment jobs so warehouse systems process orders asynchronously',        TRUE),
(9, 29, 5, 'Docker containers isolate the billing service from the storefront for independent deploys',TRUE),
(9, 42, 6, 'Webhooks notify the warehouse, carrier, and customer at each fulfilment milestone',        TRUE);

-- ============================================================
-- ADDITIONAL STACK PROFILES — remaining 8 industries
-- Profiles 10-25
-- ============================================================

INSERT INTO stack_profiles (industry_id, product_type, description, is_published) VALUES
(2,  'B2B Dashboard',              'Scalable multi-tenant dashboard platform for enterprise SaaS',                  TRUE),
(2,  'Developer API Platform',     'High-performance API gateway with developer portal and documentation',          TRUE),
(4,  'Patient Portal',             'HIPAA-compliant patient record and appointment management system',              TRUE),
(4,  'Telemedicine App',           'Real-time video consultation and remote patient monitoring platform',           TRUE),
(6,  'Learning Management System', 'Interactive LMS with progress tracking and recommendation engine',              TRUE),
(6,  'Online Course Platform',     'SEO-optimized course catalog with streaming video and payment integration',     TRUE),
(5,  'Streaming Platform',         'High-throughput video streaming service with global CDN delivery',              TRUE),
(5,  'Content Management System',  'Headless CMS with editorial workflow and multi-channel publishing',             TRUE),
(8,  'Fleet Management System',    'Real-time GPS tracking and dispatch platform for logistics fleets',             TRUE),
(8,  'Supply Chain Platform',      'Enterprise supply chain visibility and inventory management system',            TRUE),
(7,  'Citizen Portal',             'Accessible government services portal meeting WCAG 2.1 standards',              TRUE),
(7,  'Data Reporting System',      'Automated public data aggregation and interactive reporting dashboard',          TRUE),
(9,  'Project Management Platform','Collaborative construction project planning with Gantt and resource tracking',  TRUE),
(9,  'Field Operations App',       'Offline-capable mobile app for site inspections and progress reporting',        TRUE),
(10, 'Investment Dashboard',       'Real-time portfolio analytics with quantitative analysis and risk metrics',     TRUE),
(10, 'Banking Mobile App',         'PCI-compliant cross-platform mobile banking with biometric authentication',     TRUE);

-- Stack 10: B2B Dashboard (profile_id=10, industry=saas)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(10, 1,  1, 'Node.js handles thousands of concurrent dashboard sessions without blocking',              TRUE),
(10, 8,  2, 'React component architecture supports complex multi-widget dashboard layouts',             TRUE),
(10, 15, 3, 'PostgreSQL row-level security enables clean multi-tenant data isolation',                  TRUE),
(10, 22, 4, 'AWS enterprise certifications satisfy B2B procurement and compliance reviews',             TRUE),
(10, 31, 5, 'GitHub Actions integrates directly into pull request workflow for fast iteration',         TRUE),
(10, 37, 6, 'GraphQL lets each dashboard widget fetch exactly the data fields it displays',             TRUE);

-- Stack 11: Developer API Platform (profile_id=11, industry=saas)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(11, 5,  1, 'Go delivers sub-millisecond latency under heavy API load with minimal memory use',         TRUE),
(11, 12, 2, 'Next.js SSG builds the docs portal with instant page loads and great SEO',                 TRUE),
(11, 15, 3, 'PostgreSQL tracks API keys, rate limits, and usage quotas reliably',                       TRUE),
(11, 28, 4, 'Cloudflare edge network caches API responses globally and blocks DDoS attacks',            TRUE),
(11, 32, 5, 'Terraform provisions reproducible environments for staging and production parity',         TRUE),
(11, 41, 6, 'OpenAPI spec drives automatic client SDKs, docs generation, and API linting',             TRUE);

-- Stack 12: Patient Portal (profile_id=12, industry=healthcare)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(12, 4,  1, '.NET is the dominant healthcare enterprise stack with mature HIPAA compliance tooling',    TRUE),
(12, 8,  2, 'React with Reach UI meets WCAG 2.1 accessibility requirements for patient-facing apps',   TRUE),
(12, 20, 3, 'SQL Server provides native encryption and auditing required for HIPAA compliance',         TRUE),
(12, 23, 4, 'Azure HIPAA BAA and compliance centre covers healthcare regulatory requirements',          TRUE),
(12, 31, 5, 'GitHub Actions provides audit trails for every deployment to satisfy compliance review',   TRUE),
(12, 36, 6, 'REST aligns with HL7 FHIR R4 standards for interoperability with EHR systems',           TRUE);

-- Stack 13: Telemedicine App (profile_id=13, industry=healthcare)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(13, 1,  1, 'Node.js event loop manages thousands of concurrent WebRTC signalling sessions',            TRUE),
(13, 44, 8, 'Flutter delivers a single native codebase for iOS and Android with smooth video UI',      TRUE),
(13, 15, 3, 'PostgreSQL stores encrypted patient records and session logs for compliance',              TRUE),
(13, 22, 4, 'AWS Chime SDK provides HIPAA-eligible video infrastructure with global reach',             TRUE),
(13, 30, 5, 'Kubernetes auto-scales video worker pods during peak appointment hours',                   TRUE),
(13, 39, 6, 'WebSockets carry real-time video signalling and in-session chat with sub-50ms latency',   TRUE);

-- Stack 14: Learning Management System (profile_id=14, industry=education)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(14, 2,  1, 'Python powers ML-based learning path recommendations and assessment analytics',            TRUE),
(14, 8,  2, 'React interactive components handle quizzes, progress bars, and video players',           TRUE),
(14, 15, 3, 'PostgreSQL models courses, students, enrollments, and progress with referential integrity',TRUE),
(14, 22, 4, 'AWS S3 and CloudFront store and stream course videos to students worldwide',               TRUE),
(14, 31, 5, 'GitHub Actions runs automated tests for grading logic on every content update',           TRUE),
(14, 36, 6, 'REST supports LTI 1.3 and SCORM integration with third-party educational tools',          TRUE);

-- Stack 15: Online Course Platform (profile_id=15, industry=education)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(15, 1,  1, 'Node.js handles concurrent video transcoding jobs and streaming API requests',             TRUE),
(15, 12, 2, 'Next.js ISR generates SEO-optimised course landing pages for organic discovery',           TRUE),
(15, 16, 3, 'MySQL is battle-tested for content-heavy platforms with complex category trees',           TRUE),
(15, 28, 4, 'Cloudflare Stream delivers global adaptive-bitrate video at minimal bandwidth cost',       TRUE),
(15, 29, 5, 'Docker ensures identical environments across local dev, staging, and production',          TRUE),
(15, 42, 6, 'Webhooks push enrollment confirmations, payment events, and certificate notifications',    TRUE);

-- Stack 16: Streaming Platform (profile_id=16, industry=media)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(16, 5,  1, 'Go sustains high concurrency for live stream ingestion and HLS segment serving',          TRUE),
(16, 8,  2, 'React renders adaptive video player UIs with real-time recommendation carousels',         TRUE),
(16, 15, 3, 'PostgreSQL stores content catalog, user watch history, and subscription state',            TRUE),
(16, 22, 4, 'AWS CloudFront and MediaConvert provide global CDN and live transcoding pipeline',        TRUE),
(16, 30, 5, 'Kubernetes auto-scales encoder pods for live event traffic spikes',                        TRUE),
(16, 39, 6, 'WebSockets power real-time comments, live reactions, and viewer count updates',           TRUE);

-- Stack 17: Content Management System (profile_id=17, industry=media)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(17, 1,  1, 'Node.js drives the headless CMS API and webhook delivery to downstream channels',         TRUE),
(17, 12, 2, 'Next.js ISR regenerates published article pages instantly without full rebuilds',          TRUE),
(17, 17, 3, 'MongoDB flexible schema accommodates varied content types — articles, galleries, podcasts',TRUE),
(17, 25, 4, 'Vercel provides zero-config Next.js deployments with per-PR preview environments',        TRUE),
(17, 31, 5, 'GitHub Actions automates content pipeline tests and deployment on every merge',            TRUE),
(17, 37, 6, 'GraphQL lets editorial tools and front-end apps query exactly the content fields needed', TRUE);

-- Stack 18: Fleet Management System (profile_id=18, industry=logistics)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(18, 1,  1, 'Node.js processes continuous GPS telemetry streams from thousands of vehicles',           TRUE),
(18, 8,  2, 'React with Mapbox renders live vehicle positions and route overlays for dispatchers',     TRUE),
(18, 15, 3, 'PostgreSQL with PostGIS extension handles geospatial queries for route optimisation',     TRUE),
(18, 22, 4, 'AWS IoT Core ingests device telemetry reliably at scale with low latency',                TRUE),
(18, 29, 5, 'Docker enables edge deployments on depot servers with limited connectivity',              TRUE),
(18, 39, 6, 'WebSockets push sub-second vehicle position updates to the dispatch dashboard',           TRUE);

-- Stack 19: Supply Chain Platform (profile_id=19, industry=logistics)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(19, 3,  1, 'Java enterprise patterns handle complex supplier integrations and event-driven workflows', TRUE),
(19, 8,  2, 'React data grids and workflow components manage complex order and inventory views',        TRUE),
(19, 15, 3, 'PostgreSQL models suppliers, purchase orders, inventory, and shipment relationships',     TRUE),
(19, 23, 4, 'Azure Logic Apps and B2B connectors simplify EDI integration with trading partners',      TRUE),
(19, 30, 5, 'Kubernetes provides high-availability for critical supply chain operations',               TRUE),
(19, 36, 6, 'REST integrates with WMS, ERP, and carrier systems via standard HTTP APIs',               TRUE);

-- Stack 20: Citizen Portal (profile_id=20, industry=government)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(20, 4,  1, '.NET is the dominant government backend stack with mature Active Directory integration',   TRUE),
(20, 8,  2, 'React with accessible component libraries meets WCAG 2.1 AA government requirements',    TRUE),
(20, 20, 3, 'SQL Server is the established government database with native Windows authentication',    TRUE),
(20, 23, 4, 'Azure Government cloud provides FedRAMP-authorised regions for public sector workloads', TRUE),
(20, 31, 5, 'GitHub Actions creates auditable deployment logs required for government change control', TRUE),
(20, 36, 6, 'REST follows government API standards with versioning and OpenAPI documentation',         TRUE);

-- Stack 21: Data Reporting System (profile_id=21, industry=government)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(21, 2,  1, 'Python processes open-data CSVs and generates statistical aggregations for reports',      TRUE),
(21, 8,  2, 'React interactive charts let citizens explore datasets without downloading raw files',    TRUE),
(21, 15, 3, 'PostgreSQL window functions and materialized views power fast aggregate report queries',  TRUE),
(21, 22, 4, 'AWS GovCloud regions satisfy US government data-residency and compliance requirements',   TRUE),
(21, 32, 5, 'Terraform provides auditable, version-controlled infrastructure for oversight reviews',   TRUE),
(21, 36, 6, 'REST exposes public data APIs for journalists, researchers, and third-party apps',        TRUE);

-- Stack 22: Project Management Platform (profile_id=22, industry=construction)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(22, 1,  1, 'Node.js real-time event bus syncs project updates across field and office teams',         TRUE),
(22, 8,  2, 'React renders complex Gantt charts and resource allocation grids for project managers',   TRUE),
(22, 15, 3, 'PostgreSQL models projects, tasks, resources, dependencies, and cost tracking',           TRUE),
(22, 22, 4, 'AWS provides reliable cloud hosting accessible from office and site offices globally',    TRUE),
(22, 29, 5, 'Docker enables on-premise deployment for sites with limited internet connectivity',       TRUE),
(22, 36, 6, 'REST integrates with Procore, AutoCAD, and ERP systems used in construction workflows',  TRUE);

-- Stack 23: Field Operations App (profile_id=23, industry=construction)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(23, 1,  1, 'Node.js sync API handles offline-first conflict resolution when field workers reconnect', TRUE),
(23, 43, 8, 'React Native delivers a single native codebase for iOS and Android field workers',       TRUE),
(23, 19, 3, 'SQLite stores inspection forms and punch list items locally during offline field work',   TRUE),
(23, 22, 4, 'AWS S3 stores site photos and documents uploaded when connectivity is restored',          TRUE),
(23, 31, 5, 'GitHub Actions automates mobile build and OTA update distribution to field devices',     TRUE),
(23, 36, 6, 'REST provides the sync API endpoint for offline data reconciliation',                     TRUE);

-- Stack 24: Investment Dashboard (profile_id=24, industry=finance)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(24, 2,  1, 'Python runs quantitative analysis, backtesting, and risk model computations',             TRUE),
(24, 8,  2, 'React with D3 renders interactive portfolio charts and drill-down analytics',             TRUE),
(24, 15, 3, 'PostgreSQL with TimescaleDB extension handles time-series price and return data',         TRUE),
(24, 22, 4, 'AWS low-latency zones and dedicated links minimise market data feed delays',              TRUE),
(24, 30, 5, 'Kubernetes maintains high availability during market hours with zero-downtime deploys',   TRUE),
(24, 37, 6, 'GraphQL allows portfolio widgets to independently query specific metrics and date ranges',TRUE);

-- Stack 25: Banking Mobile App (profile_id=25, industry=finance)
INSERT INTO stack_profile_tools (profile_id, tool_id, category_id, rationale, is_primary) VALUES
(25, 3,  1, 'Java Spring Boot is the enterprise banking backend standard with deep security tooling',  TRUE),
(25, 43, 8, 'React Native provides one codebase for iOS and Android with native biometric auth',      TRUE),
(25, 15, 3, 'PostgreSQL ACID transactions and row-level locking prevent double-processing payments',  TRUE),
(25, 22, 4, 'AWS PCI DSS Level 1 infrastructure with VPC isolation and KMS key management',           TRUE),
(25, 30, 5, 'Kubernetes maintains 99.99% availability for 24/7 banking with rolling updates',         TRUE),
(25, 36, 6, 'REST supports Open Banking API standards and third-party payment provider integration',   TRUE);

-- ============================================================
-- ADDITIONAL MOBILE USAGE STATS — Stack Overflow Survey 2024
-- Retrospective data for 2022-2024 from 2024 survey
-- ============================================================

INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, source) VALUES
(43, NULL, 2022, 72.00, 'Stack Overflow Survey 2024'),
(43, NULL, 2023, 76.00, 'Stack Overflow Survey 2024'),
(43, NULL, 2024, 79.00, 'Stack Overflow Survey 2024');

INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, source) VALUES
(44, NULL, 2022, 42.00, 'Stack Overflow Survey 2024'),
(44, NULL, 2023, 51.00, 'Stack Overflow Survey 2024'),
(44, NULL, 2024, 58.00, 'Stack Overflow Survey 2024');

INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, source) VALUES
(45, NULL, 2022, 45.00, 'Stack Overflow Survey 2024'),
(45, NULL, 2023, 43.00, 'Stack Overflow Survey 2024'),
(45, NULL, 2024, 41.00, 'Stack Overflow Survey 2024');

INSERT INTO usage_stats (tool_id, industry_id, year, usage_percent, source) VALUES
(46, NULL, 2022, 31.00, 'Stack Overflow Survey 2024'),
(46, NULL, 2023, 35.00, 'Stack Overflow Survey 2024'),
(46, NULL, 2024, 38.00, 'Stack Overflow Survey 2024');

-- ============================================================
-- DEFAULT ADMIN USER (password: admin123 — bcrypt hash)
-- Change immediately in production
-- ============================================================
INSERT INTO admin_users (email, password_hash, name) VALUES
('admin@techboard.dev', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgI7e5Ky4K1FBl.WLpqJCu', 'TechBoard Admin');
