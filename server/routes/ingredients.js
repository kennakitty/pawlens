import { Router } from "express";
import db, { parseProduct } from "../db.js";

const router = Router();

// GET /api/ingredients — list all, optional search
router.get("/", (req, res) => {
  const { search, appliesTo } = req.query;
  let query = "SELECT * FROM ingredients WHERE 1=1";
  const params = [];
  if (appliesTo && appliesTo !== "all") {
    query += " AND (appliesTo = ? OR appliesTo = 'both')";
    params.push(appliesTo);
  }
  if (search) {
    query += " AND (name LIKE ? OR category LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  query += " ORDER BY name ASC";
  res.json(db.prepare(query).all(...params));
});

// GET /api/ingredients/:id
router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM ingredients WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Ingredient not found" });
  res.json(row);
});

// GET /api/ingredients/:id/products — find products containing this ingredient
router.get("/:id/products", (req, res) => {
  const ingredient = db.prepare("SELECT * FROM ingredients WHERE id = ?").get(req.params.id);
  if (!ingredient) return res.status(404).json({ error: "Ingredient not found" });

  // Search fullIngredients text for the ingredient name (case-insensitive via LIKE)
  const { type } = req.query;
  let query = "SELECT id, name, brand, imageUrl, transparencyScore, lifeStage, type FROM products WHERE fullIngredients LIKE ?";
  const params = [`%${ingredient.name}%`];
  if (type && type !== "All") {
    query += " AND type = ?";
    params.push(type);
  }
  query += " ORDER BY brand, name";
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

// POST /api/ingredients (admin)
router.post("/", (req, res) => {
  const { name, rating, category, explanation, misleading, healthNotes } = req.body;
  const result = db.prepare(
    "INSERT INTO ingredients (name, rating, category, explanation, misleading, healthNotes) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(name, rating, category, explanation, misleading, healthNotes);
  const created = db.prepare("SELECT * FROM ingredients WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/ingredients/:id (admin)
router.put("/:id", (req, res) => {
  const { name, rating, category, explanation, misleading, healthNotes } = req.body;
  const existing = db.prepare("SELECT id FROM ingredients WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Ingredient not found" });
  db.prepare(
    "UPDATE ingredients SET name=?, rating=?, category=?, explanation=?, misleading=?, healthNotes=? WHERE id=?"
  ).run(name, rating, category, explanation, misleading, healthNotes, req.params.id);
  res.json(db.prepare("SELECT * FROM ingredients WHERE id = ?").get(req.params.id));
});

// DELETE /api/ingredients/:id (admin)
router.delete("/:id", (req, res) => {
  const existing = db.prepare("SELECT id FROM ingredients WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Ingredient not found" });
  db.prepare("DELETE FROM ingredients WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

export default router;
