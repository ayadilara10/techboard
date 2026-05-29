/**
 * config/database.js — MySQL Connection Pool
 *
 * Creates a mysql2 promise-based connection pool that all route handlers share.
 *
 * Why a pool instead of a single connection?
 *   A pool keeps N connections open and hands them out to concurrent requests.
 *   Without it, requests would queue behind each other waiting for one connection.
 *   mysql2's promise API lets us use async/await instead of callbacks.
 *
 * Usage in any route file:
 *   const pool = require('../config/database');
 *   const [rows] = await pool.execute('SELECT * FROM categories');
 */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306', 10),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME     || 'techboard',

  // When all connections are busy, queue new requests rather than throwing immediately
  waitForConnections: true,

  // Maximum simultaneous open connections to MySQL
  connectionLimit: 10,

  // 0 = unlimited queue depth (requests wait as long as needed)
  queueLimit: 0,

  // Automatically reconnect dropped idle connections
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

module.exports = pool;
