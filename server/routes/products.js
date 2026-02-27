import { Router } from "express";
import db, { parseProduct, serializeProduct } from "../db.js";

const router = Router();

// GET /api/products — list all products with optional filters
router.get("/", (req, res) => {
  const { brand, lifeStage, sort = "transparencyScore", search } = req.query;

  let query = "SELECT * FROM products WHERE 1=1";
  const params = [];

  if (brand && brand !== "All") {
    query += " AND brand = ?";
    params.push(brand);
  }
  if (lifeStage && lifeStage !== "All") {
    query += " AND lifeStage = ?";
    params.push(lifeStage);
  }
  if (search) {
    query += " AND (name LIKE ? OR brand LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  const validSorts = { transparencyScore: "DESC", proteinPct: "DESC", fatPct: "ASC", name: "ASC" };
  const dir = validSorts[sort] || "DESC";
  query += ` ORDER BY ${Object.keys(validSorts).includes(sort) ? sort : "transparencyScore"} ${dir}`;

  const rows = db.prepare(query).all(...params);
  res.json(rows.map(parseProduct));
});

// GET /api/products/:id — single product
router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Product not found" });
  res.json(parseProduct(row));
});

// POST /api/products — create product (admin only — middleware applied in index.js)
router.post("/", (req, res) => {
  const data = serializeProduct(req.body);
  const result = db.prepare(`
    INSERT INTO products (
      name, brand, line, type, lifeStage, retailer, priceRange,
      sizes, proteinPct, fatPct, fiberPct, moisturePct, calPerCup,
      firstIngredients, keyFeatures, concerns, transparencyScore,
      aafco, bestFor, avoid, recallHistory, country
    ) VALUES (
      @name, @brand, @line, @type, @lifeStage, @retailer, @priceRange,
      @sizes, @proteinPct, @fatPct, @fiberPct, @moisturePct, @calPerCup,
      @firstIngredients, @keyFeatures, @concerns, @transparencyScore,
      @aafco, @bestFor, @avoid, @recallHistory, @country
    )
  `).run(data);
  const created = db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(parseProduct(created));
});

// PUT /api/products/:id — update product (admin only)
router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT id FROM products WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Product not found" });

  const data = serializeProduct(req.body);
  db.prepare(`
    UPDATE products SET
      name=@name, brand=@brand, line=@line, type=@type, lifeStage=@lifeStage,
      retailer=@retailer, priceRange=@priceRange, sizes=@sizes,
      proteinPct=@proteinPct, fatPct=@fatPct, fiberPct=@fiberPct,
      moisturePct=@moisturePct, calPerCup=@calPerCup,
      firstIngredients=@firstIngredients, keyFeatures=@keyFeatures,
      concerns=@concerns, transparencyScore=@transparencyScore,
      aafco=@aafco, bestFor=@bestFor, avoid=@avoid,
      recallHistory=@recallHistory, country=@country
    WHERE id=@id
  `).run({ ...data, id: req.params.id });

  const updated = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  res.json(parseProduct(updated));
});

// DELETE /api/products/:id — delete product (admin only)
router.delete("/:id", (req, res) => {
  const existing = db.prepare("SELECT id FROM products WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Product not found" });
  db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

export default router;
