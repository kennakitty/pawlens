// score-cat-dry.js — Calculate transparency scores for all dry cat food products
// Scores 0-100 based on ingredient quality, label transparency, and nutritional data
// Run: node server/score-cat-dry.js
import db from "./db.js";

// ─── Ingredient quality signals ──────────────────────────────────────────────
const GOOD_FIRST_INGREDIENTS = [
  "chicken", "turkey", "salmon", "tuna", "duck", "lamb", "venison",
  "rabbit", "trout", "whitefish", "herring", "pollock", "deboned",
  "fish", "beef", "pork"
];

const RED_FLAG_INGREDIENTS = [
  "by-product", "by product", "corn gluten meal", "soybean meal",
  "animal fat", "meat and bone meal", "animal digest", "artificial",
  "bha", "bht", "ethoxyquin", "propylene glycol", "food coloring",
  "red 40", "yellow 5", "yellow 6", "blue 2", "caramel color",
  "menadione", "sodium bisulfite"
];

const FILLER_INGREDIENTS = [
  "ground yellow corn", "corn", "wheat", "soy flour",
  "brewers rice", "wheat flour", "corn starch", "tapioca starch",
  "powdered cellulose"
];

const PREMIUM_SIGNALS = [
  "deboned", "fresh", "raw", "freeze-dried", "whole",
  "organic", "wild-caught", "free-range", "cage-free",
  "probiotics", "prebiotics", "l-carnitine", "glucosamine",
  "chondroitin", "taurine", "omega"
];

function scoreProduct(product) {
  let score = 50; // Start at middle
  const ingredients = (product.fullIngredients || "").toLowerCase();
  const ga = (product.guaranteedAnalysis || "").toLowerCase();
  const aafco = (product.aafco || "").toLowerCase();
  const nutritionOpts = JSON.parse(product.nutritionalOptions || "[]");
  const healthConsids = JSON.parse(product.healthConsiderations || "[]");
  const benefits = JSON.parse(product.benefits || "[]");

  // ─── 1. First ingredient quality (up to +15 / -10) ────────────────────────
  const firstIngredient = ingredients.split(",")[0] || "";
  if (GOOD_FIRST_INGREDIENTS.some(g => firstIngredient.includes(g))) {
    score += 15;
  } else if (FILLER_INGREDIENTS.some(f => firstIngredient.includes(f))) {
    score -= 10;
  }

  // ─── 2. Red flag ingredients (up to -20) ───────────────────────────────────
  let redFlagCount = 0;
  for (const flag of RED_FLAG_INGREDIENTS) {
    if (ingredients.includes(flag)) redFlagCount++;
  }
  score -= Math.min(redFlagCount * 5, 20);

  // ─── 3. Filler count (up to -10) ──────────────────────────────────────────
  let fillerCount = 0;
  for (const filler of FILLER_INGREDIENTS) {
    if (ingredients.includes(filler)) fillerCount++;
  }
  score -= Math.min(fillerCount * 3, 10);

  // ─── 4. Premium signals (up to +15) ───────────────────────────────────────
  let premiumCount = 0;
  for (const signal of PREMIUM_SIGNALS) {
    if (ingredients.includes(signal)) premiumCount++;
  }
  score += Math.min(premiumCount * 3, 15);

  // ─── 5. Label transparency — data completeness (up to +10) ────────────────
  if (ingredients.length > 50) score += 2;  // Has real ingredient list
  if (ga.length > 30) score += 2;           // Has guaranteed analysis
  if (aafco.length > 10) score += 2;        // Has AAFCO statement
  if (product.calorieContent) score += 2;    // Has calorie info
  if (product.description) score += 2;       // Has description

  // ─── 6. Nutritional claims (up to +10) ────────────────────────────────────
  const noFillerClaims = ["No Corn", "No Wheat", "No Soy", "Grain Free", "Gluten Free"];
  let claimCount = 0;
  for (const claim of noFillerClaims) {
    if (nutritionOpts.includes(claim)) claimCount++;
  }
  score += Math.min(claimCount * 2, 10);

  // ─── 7. Protein content bonus (up to +5) ──────────────────────────────────
  const proteinMatch = ga.match(/protein.*?(\d+\.?\d*)%/);
  if (proteinMatch) {
    const protein = parseFloat(proteinMatch[1]);
    if (protein >= 40) score += 5;
    else if (protein >= 35) score += 3;
    else if (protein >= 30) score += 1;
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ─── Run scoring ─────────────────────────────────────────────────────────────
const products = db.prepare("SELECT * FROM products_petsmart_cat_dry").all();
const update = db.prepare("UPDATE products_petsmart_cat_dry SET transparencyScore = ? WHERE id = ?");

db.exec("BEGIN");
let scored = 0;
for (const p of products) {
  const score = scoreProduct(p);
  update.run(score, p.id);
  scored++;
}
db.exec("COMMIT");

// Show distribution
const dist = db.prepare("SELECT MIN(transparencyScore) as min, MAX(transparencyScore) as max, AVG(transparencyScore) as avg FROM products_petsmart_cat_dry").get();
console.log(`Scored ${scored} products.`);
console.log(`Distribution: min=${dist.min}, max=${dist.max}, avg=${Math.round(dist.avg)}`);

// Show some examples
const examples = db.prepare("SELECT name, brand, transparencyScore FROM products_petsmart_cat_dry ORDER BY transparencyScore DESC LIMIT 5").all();
console.log("\nTop 5:");
examples.forEach(p => console.log(`  ${p.transparencyScore} — ${p.name} (${p.brand})`));

const bottom = db.prepare("SELECT name, brand, transparencyScore FROM products_petsmart_cat_dry ORDER BY transparencyScore ASC LIMIT 5").all();
console.log("\nBottom 5:");
bottom.forEach(p => console.log(`  ${p.transparencyScore} — ${p.name} (${p.brand})`));
