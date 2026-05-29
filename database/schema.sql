-- ============================================================
-- TechBoard Intelligence Platform — Database Schema
-- MySQL 8.0
-- Run once to initialize the database structure.
-- ============================================================

CREATE DATABASE IF NOT EXISTS techboard
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE techboard;

-- ============================================================
-- CATEGORIES — the 15 technical decision domains
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    slug        VARCHAR(60) UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    icon        VARCHAR(100),
    sort_order  INT DEFAULT 0,
    data_status ENUM('live', 'coming_soon') DEFAULT 'coming_soon',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TOOLS — every tracked technology
-- ============================================================
CREATE TABLE IF NOT EXISTS tools (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    category_id     INT NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,
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
CREATE TABLE IF NOT EXISTS industries (
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
CREATE TABLE IF NOT EXISTS usage_stats (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    tool_id         INT NOT NULL,
    industry_id     INT,
    year            YEAR NOT NULL,
    usage_percent   DECIMAL(5,2),
    satisfaction    DECIMAL(4,2),
    sample_size     INT,
    source          VARCHAR(150),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tool_id) REFERENCES tools(id),
    FOREIGN KEY (industry_id) REFERENCES industries(id)
);

-- ============================================================
-- TRENDS — computed by Flask, cached here
-- ============================================================
CREATE TABLE IF NOT EXISTS trends (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    tool_id         INT NOT NULL,
    industry_id     INT,
    trend_score     DECIMAL(6,3),
    trend_direction ENUM('rising','stable','falling'),
    year_from       YEAR,
    year_to         YEAR,
    computed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tool_id) REFERENCES tools(id),
    FOREIGN KEY (industry_id) REFERENCES industries(id)
);

-- ============================================================
-- STACK_PROFILES — for Tech Stack Builder
-- ============================================================
CREATE TABLE IF NOT EXISTS stack_profiles (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    industry_id     INT NOT NULL,
    product_type    VARCHAR(100) NOT NULL,
    description     TEXT,
    is_published    BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (industry_id) REFERENCES industries(id)
);

-- ============================================================
-- STACK_PROFILE_TOOLS — which tools go in which profile
-- ============================================================
CREATE TABLE IF NOT EXISTS stack_profile_tools (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    profile_id      INT NOT NULL,
    tool_id         INT NOT NULL,
    category_id     INT NOT NULL,
    rationale       TEXT,
    is_primary      BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (profile_id) REFERENCES stack_profiles(id),
    FOREIGN KEY (tool_id) REFERENCES tools(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- ============================================================
-- ADMIN_USERS — for PHP admin panel + Node JWT auth
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(150),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- DATA_IMPORT_LOG — tracks every CSV import
-- ============================================================
CREATE TABLE IF NOT EXISTS data_import_log (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    filename        VARCHAR(255),
    source          VARCHAR(150),
    rows_imported   INT,
    imported_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    imported_by     INT,
    FOREIGN KEY (imported_by) REFERENCES admin_users(id)
);
