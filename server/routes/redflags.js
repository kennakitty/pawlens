import { Router } from "express";
import db from "../db.js";

const router = Router();

// GET /api/red-flags — list all, optional appliesTo filter
router.get("/", (req, res) => {
  const { appliesTo } = req.query;
  let query = "SELECT * FROM red_flags";
  const params = [];
  if (appliesTo && appliesTo !== "all") {
    query += " WHERE (appliesTo = ? OR appliesTo = 'both')";
    params.push(appliesTo);
  }
  query += " ORDER BY severity DESC, title ASC";
  res.json(db.prepare(query).all(...params));
});

export default router;
