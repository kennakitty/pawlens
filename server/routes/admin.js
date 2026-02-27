import { Router } from "express";

const router = Router();

// POST /api/admin/auth — check admin password
// Returns 200 if correct, 401 if wrong
router.post("/auth", (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Incorrect password." });
  }
});

export default router;
