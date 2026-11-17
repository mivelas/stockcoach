import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import * as logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Consistently locate stockcoach.db in the server directory, or override via DB_PATH
const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../../stockcoach.db');
const db = new Database(dbPath);
// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS favorites (
    symbol TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS recommendation_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    model TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    quantity REAL NOT NULL,
    purchase_price REAL NOT NULL,
    purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Add model column if it doesn't exist (for existing databases)
const tableInfo = db.prepare("PRAGMA table_info(recommendation_history)").all() as any[];
const hasModelColumn = tableInfo.some(col => col.name === 'model');
if (!hasModelColumn) {
  try {
    db.exec("ALTER TABLE recommendation_history ADD COLUMN model TEXT DEFAULT 'unknown'");
    logger.info('Migration: Added model column to recommendation_history');
  } catch (err: any) {
    logger.error('Migration: Failed to add model column', { error: err.message });
  }
}

// ... existing functions ...

export const addHolding = (symbol: string, quantity: number, purchase_price: number) => {
  const stmt = db.prepare('INSERT INTO portfolio (symbol, quantity, purchase_price) VALUES (?, ?, ?)');
  const info = stmt.run(symbol, quantity, purchase_price);
  return info.lastInsertRowid;
};

export const getPortfolio = () => {
  const stmt = db.prepare('SELECT * FROM portfolio');
  return stmt.all();
};

export const removeHolding = (id: number) => {
  const stmt = db.prepare('DELETE FROM portfolio WHERE id = ?');
  const info = stmt.run(id);
  return info.changes > 0;
};

logger.info('Database initialized', { dbPath });

export const addFavorite = (symbol: string) => {
  const stmt = db.prepare('INSERT OR IGNORE INTO favorites (symbol) VALUES (?)');
  const info = stmt.run(symbol);
  return info.changes > 0;
};

export const removeFavorite = (symbol: string) => {
  const stmt = db.prepare('DELETE FROM favorites WHERE symbol = ?');
  const info = stmt.run(symbol);
  return info.changes > 0;
};

export const getFavorites = (): string[] => {
  const stmt = db.prepare('SELECT symbol FROM favorites ORDER BY created_at DESC');
  const rows = stmt.all() as { symbol: string }[];
  return rows.map(r => r.symbol);
};

export const isFavorite = (symbol: string): boolean => {
  const stmt = db.prepare('SELECT 1 FROM favorites WHERE symbol = ?');
  const row = stmt.get(symbol);
  return !!row;
};

export const saveRecommendationHistory = (symbol: string, recommendation: string, model: string = 'unknown') => {
  const stmt = db.prepare('INSERT INTO recommendation_history (symbol, recommendation, model) VALUES (?, ?, ?)');
  stmt.run(symbol, recommendation, model);
};

export const saveRecommendationHistoryWithDate = (
  symbol: string,
  recommendation: string,
  model: string = 'unknown',
  createdAt?: string
) => {
  if (createdAt) {
    const stmt = db.prepare('INSERT INTO recommendation_history (symbol, recommendation, model, created_at) VALUES (?, ?, ?, ?)');
    stmt.run(symbol, recommendation, model, createdAt);
  } else {
    saveRecommendationHistory(symbol, recommendation, model);
  }
};

export const hasRecommendationForDate = (symbol: string, dateStr: string, model?: string): boolean => {
  if (model) {
    const stmt = db.prepare("SELECT 1 FROM recommendation_history WHERE symbol = ? AND model = ? AND date(created_at) = date(?)");
    return !!stmt.get(symbol, model, dateStr);
  } else {
    const stmt = db.prepare("SELECT 1 FROM recommendation_history WHERE symbol = ? AND date(created_at) = date(?)");
    return !!stmt.get(symbol, dateStr);
  }
};

export const ensureRecommendationHistory = (
  symbol: string,
  recommendation: string,
  model: string = 'unknown',
  createdAt?: string
): boolean => {
  const dateStr = createdAt ? createdAt.substring(0, 10) : new Date().toISOString().substring(0, 10);
  if (!hasRecommendationForDate(symbol, dateStr, model)) {
    saveRecommendationHistoryWithDate(symbol, recommendation, model, createdAt);
    return true;
  }
  return false;
};

export const getRecommendationHistory = (symbol: string) => {
  const stmt = db.prepare('SELECT recommendation, model, created_at FROM recommendation_history WHERE symbol = ? ORDER BY created_at DESC');
  return stmt.all(symbol) as { recommendation: string, model: string, created_at: string }[];
};
