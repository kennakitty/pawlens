import "dotenv/config";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Run seed/fixups on startup (imports wet products if missing, applies corrections)
import { execSync } from "child_process";
try {
  execSync("node server/seed.js", { cwd: join(__dirname, ".."), stdio: "inherit" });
} catch (e) {
  console.error("Seed error (non-fatal):", e.message);
}

import productsRouter from "./routes/products.js";
import ingredientsRouter from "./routes/ingredients.js";
import redflagsRouter from "./routes/redflags.js";
import recommendRouter from "./routes/recommend.js";
import adminRouter from "./routes/admin.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── Admin password middleware ─────────────────────────────────────────────
const requireAdmin = (req, res, next) => {
  const password = req.headers["x-admin-password"];
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Admin access required." });
  }
  next();
};

// Guard write operations on products and ingredients with admin check
const guardWrites = (req, res, next) => {
  if (["POST", "PUT", "DELETE"].includes(req.method)) {
    return requireAdmin(req, res, next);
  }
  next();
};

// ─── API routes ────────────────────────────────────────────────────────────
app.use("/api/admin", adminRouter);
app.use("/api/red-flags", redflagsRouter);
app.use("/api/recommend", recommendRouter);
app.use("/api/products", guardWrites, productsRouter);
app.use("/api/ingredients", guardWrites, ingredientsRouter);

// ─── Serve React frontend in production ───────────────────────────────────
if (process.env.NODE_ENV === "production") {
  const distPath = join(__dirname, "../dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`\nPawLens server running at http://localhost:${PORT}`);
  if (process.env.NODE_ENV !== "production") {
    console.log("Frontend dev server: http://localhost:5173");
  }
});
