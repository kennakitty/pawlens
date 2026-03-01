import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "../pawlens.db");

const db = new Database(DB_PATH);

// Create all tables if they don't exist yet
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    brand TEXT,
    line TEXT,
    type TEXT DEFAULT 'Dry',
    lifeStage TEXT,
    retailer TEXT DEFAULT 'PetSmart',
    priceRange TEXT,
    sizes TEXT,
    proteinPct REAL,
    fatPct REAL,
    fiberPct REAL,
    moisturePct REAL,
    calPerCup INTEGER,
    firstIngredients TEXT,
    keyFeatures TEXT,
    concerns TEXT,
    transparencyScore REAL,
    aafco TEXT,
    bestFor TEXT,
    avoid TEXT,
    recallHistory TEXT,
    country TEXT
  );

  CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rating TEXT,
    category TEXT,
    explanation TEXT,
    misleading TEXT,
    healthNotes TEXT
  );

  CREATE TABLE IF NOT EXISTS red_flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    severity TEXT,
    description TEXT,
    whatToLookFor TEXT
  );
`);

// Helper: parse JSON fields on product rows coming out of the database
export function parseProduct(row) {
  if (!row) return null;
  return {
    ...row,
    sizes: JSON.parse(row.sizes || "[]"),
    firstIngredients: JSON.parse(row.firstIngredients || "[]"),
    keyFeatures: JSON.parse(row.keyFeatures || "[]"),
    concerns: JSON.parse(row.concerns || "[]"),
    bestFor: JSON.parse(row.bestFor || "[]"),
    avoid: JSON.parse(row.avoid || "[]"),
  };
}

// Helper: stringify array fields before saving to database
export function serializeProduct(data) {
  const out = { ...data };
  for (const field of ["sizes", "firstIngredients", "keyFeatures", "concerns", "bestFor", "avoid"]) {
    if (Array.isArray(out[field])) out[field] = JSON.stringify(out[field]);
  }
  return out;
}

export default db;
