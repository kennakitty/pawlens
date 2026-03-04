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

    -- Identity & source
    name TEXT NOT NULL,
    brand TEXT,
    sku TEXT,
    petsmartUrl TEXT,
    imageUrl TEXT,
    gtin13 TEXT,

    -- Classification
    type TEXT DEFAULT 'Dry',
    retailer TEXT DEFAULT 'PetSmart',
    lifeStage TEXT,
    foodType TEXT,
    breed TEXT,
    flavor TEXT,

    -- Nutrition (all stored as raw text, no parsed numbers)
    fullIngredients TEXT,
    guaranteedAnalysis TEXT,
    calorieContent TEXT,
    aafco TEXT,

    -- Product attributes (from PetSmart attribute section)
    nutritionalOptions TEXT,
    healthConsiderations TEXT,

    -- Content
    benefits TEXT,
    description TEXT,
    directions TEXT,

    -- Dynamic attributes (catches any extra headings not in fixed columns)
    extraAttributes TEXT,

    -- PawLens-specific (populated later / manually)
    transparencyScore REAL,
    concerns TEXT,
    bestFor TEXT,
    avoid TEXT,
    keyFeatures TEXT,
    recallHistory TEXT,
    country TEXT,

    -- Metadata
    lastUpdated TEXT
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
    category TEXT,
    description TEXT,
    whatToLookFor TEXT
  );
`);

// JSON array fields that get parsed when reading from DB
const JSON_ARRAY_FIELDS = [
  "nutritionalOptions", "healthConsiderations", "benefits",
  "concerns", "bestFor", "avoid", "keyFeatures"
];

// JSON object fields
const JSON_OBJECT_FIELDS = ["extraAttributes"];

// Helper: parse JSON fields on product rows coming out of the database
export function parseProduct(row) {
  if (!row) return null;
  const out = { ...row };
  for (const field of JSON_ARRAY_FIELDS) {
    out[field] = JSON.parse(out[field] || "[]");
  }
  for (const field of JSON_OBJECT_FIELDS) {
    out[field] = JSON.parse(out[field] || "{}");
  }
  return out;
}

// Helper: stringify array/object fields before saving to database
export function serializeProduct(data) {
  const out = { ...data };
  for (const field of [...JSON_ARRAY_FIELDS, ...JSON_OBJECT_FIELDS]) {
    if (typeof out[field] === "object" && out[field] !== null) {
      out[field] = JSON.stringify(out[field]);
    }
  }
  return out;
}

export default db;
