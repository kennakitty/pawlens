import { Router } from "express";
import db, { parseProduct, serializeProduct } from "../db.js";

const router = Router();

// Table name based on product type
function getTable(type) {
  return type === "Wet" ? "products_petsmart_cat_wet" : "products_petsmart_cat_dry";
}

// All columns in the dry products table (for insert/update)
const PRODUCT_COLUMNS = [
  "name", "brand", "sku", "petsmartUrl", "imageUrl", "gtin13",
  "type", "retailer", "lifeStage", "foodType", "breed", "flavor",
  "fullIngredients", "guaranteedAnalysis", "calorieContent", "aafco",
  "nutritionalOptions", "healthConsiderations",
  "benefits", "description", "directions",
  "extraAttributes",
  "transparencyScore", "concerns", "bestFor", "avoid", "keyFeatures",
  "recallHistory", "country", "lastUpdated"
];

// GET /api/products — list all products with optional filters
router.get("/", (req, res) => {
  const { brand, lifeStage, foodType, breed, type, sort = "name", search } = req.query;

  const table = getTable(type);
  let query = `SELECT * FROM ${table} WHERE 1=1`;
  const params = [];

  if (brand && brand !== "All") {
    query += " AND brand = ?";
    params.push(brand);
  }
  if (lifeStage && lifeStage !== "All") {
    query += " AND lifeStage = ?";
    params.push(lifeStage);
  }
  if (foodType && foodType !== "All") {
    query += " AND foodType = ?";
    params.push(foodType);
  }
  if (breed && breed !== "All") {
    query += " AND breed = ?";
    params.push(breed);
  }
  if (search) {
    query += " AND (name LIKE ? OR brand LIKE ? OR flavor LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const validSorts = { name: "ASC", brand: "ASC", lifeStage: "ASC", transparencyScore: "DESC" };
  const dir = validSorts[sort] || "ASC";
  query += ` ORDER BY ${Object.keys(validSorts).includes(sort) ? sort : "name"} ${dir}`;

  const rows = db.prepare(query).all(...params);
  res.json(rows.map(parseProduct));
});

// GET /api/products/filters — get available filter values
router.get("/filters", (req, res) => {
  const { type } = req.query;
  const table = getTable(type);

  const brands = db.prepare(`SELECT DISTINCT brand FROM ${table} WHERE brand IS NOT NULL ORDER BY brand`).all().map(r => r.brand);
  const lifeStages = db.prepare(`SELECT DISTINCT lifeStage FROM ${table} WHERE lifeStage IS NOT NULL ORDER BY lifeStage`).all().map(r => r.lifeStage);
  const foodTypes = db.prepare(`SELECT DISTINCT foodType FROM ${table} WHERE foodType IS NOT NULL ORDER BY foodType`).all().map(r => r.foodType);
  const breeds = db.prepare(`SELECT DISTINCT breed FROM ${table} WHERE breed IS NOT NULL ORDER BY breed`).all().map(r => r.breed);
  res.json({ brands, lifeStages, foodTypes, breeds });
});

// GET /api/products/:id — single product (check both tables)
router.get("/:id", (req, res) => {
  let row = db.prepare("SELECT * FROM products_petsmart_cat_dry WHERE id = ?").get(req.params.id);
  if (!row) row = db.prepare("SELECT * FROM products_petsmart_cat_wet WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Product not found" });
  res.json(parseProduct(row));
});

// POST /api/products — create product (admin only)
router.post("/", (req, res) => {
  const data = serializeProduct(req.body);
  const table = getTable(data.type);
  const cols = PRODUCT_COLUMNS.filter(c => data[c] !== undefined);
  const placeholders = cols.map(c => `@${c}`).join(", ");
  const result = db.prepare(
    `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`
  ).run(data);
  const created = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(result.lastInsertRowid);
  res.status(201).json(parseProduct(created));
});

// PUT /api/products/:id — update product (admin only)
router.put("/:id", (req, res) => {
  const type = req.body.type || "Dry";
  const table = getTable(type);
  const existing = db.prepare(`SELECT id FROM ${table} WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Product not found" });

  const data = serializeProduct(req.body);
  const cols = PRODUCT_COLUMNS.filter(c => data[c] !== undefined);
  const setClause = cols.map(c => `${c}=@${c}`).join(", ");
  db.prepare(`UPDATE ${table} SET ${setClause} WHERE id=@id`).run({ ...data, id: req.params.id });

  const updated = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
  res.json(parseProduct(updated));
});

// DELETE /api/products/:id — delete product (admin only)
router.delete("/:id", (req, res) => {
  // Try both tables
  let existing = db.prepare("SELECT id, type FROM products_petsmart_cat_dry WHERE id = ?").get(req.params.id);
  let table = "products_petsmart_cat_dry";
  if (!existing) {
    existing = db.prepare("SELECT id, type FROM products_petsmart_cat_wet WHERE id = ?").get(req.params.id);
    table = "products_petsmart_cat_wet";
  }
  if (!existing) return res.status(404).json({ error: "Product not found" });
  db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
  res.json({ success: true });
});

export default router;
