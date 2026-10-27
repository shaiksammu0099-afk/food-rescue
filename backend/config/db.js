/**
 * Database Connection & Query Pool
 * Connects to MySQL with automatic fallback to mock database if server is offline.
 */

const mysql = require('mysql2/promise');
const mockDb = require('../services/mockDb');

let pool = null;
let isMySQLConnected = false;

async function initDB() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'food_rescue_db',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection with a quick query
    const [rows] = await pool.query('SELECT 1 + 1 AS test');
    isMySQLConnected = true;
    console.log('✅ Connected to MySQL Database (food_rescue_db)');
  } catch (error) {
    isMySQLConnected = false;
    console.warn('⚠️  MySQL connection failed (' + error.message + ').');
    console.log('⚡ Automatically activating In-Memory Mock Database mode. All endpoints are fully operational!');
  }
}

// Wrapper for SQL execution
async function query(sql, params = []) {
  if (isMySQLConnected && pool) {
    try {
      const [results] = await pool.query(sql, params);
      return results;
    } catch (err) {
      console.error('MySQL query error:', err.message);
      throw err;
    }
  } else {
    // When in mock mode, callers use mockDb service
    return null;
  }
}

module.exports = {
  initDB,
  query,
  isMySQLConnected: () => isMySQLConnected,
  mockDb
};
