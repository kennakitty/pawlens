import { Router } from "express";
import db from "../db.js";

const router = Router();

// GET /api/red-flags — list all
router.get("/", (req, res) => {
  res.json(db.prepare("SELECT * FROM red_flags ORDER BY severity DESC, title ASC").all());
});

export default router;
