// verify-cat-flavors.js — Extract flavor labels from product title, calorie content, and ingredient list
// Compares against stored flavor and outputs a diff
// Usage: node server/scripts/verify-cat-flavors.js [--fix]

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const wet = JSON.parse(readFileSync(join(__dirname, "../data/products-petsmart-cat-wet.json"), "utf8"));
const dry = JSON.parse(readFileSync(join(__dirname, "../data/products-petsmart-cat-dry.json"), "utf8"));
const all = [...dry.map(p => ({ ...p, src: "dry" })), ...wet.map(p => ({ ...p, src: "wet" }))];

// ─── Known flavor/protein words — a valid label must contain at least one ────
const FLAVOR_WORDS = [
  "chicken", "turkey", "salmon", "tuna", "beef", "duck", "lamb", "shrimp",
  "mackerel", "whitefish", "ocean fish", "tilapia", "sardine", "sardines",
  "cod", "herring", "venison", "rabbit", "quail", "liver", "pork", "lobster",
  "crab", "scallop", "trout", "pollock", "sole", "prawn", "egg", "pumpkin",
  "rice", "peas", "fish", "seafood", "poultry", "ocean", "skipjack", "seabass",
  "sweet potato", "vegetable", "cheese", "anchovy",
];

function containsFlavorWord(text) {
  const lower = text.toLowerCase();
  return FLAVOR_WORDS.some(w => lower.includes(w));
}

// ─── Non-flavor terms to strip from title extraction ─────────────────────────
const NON_FLAVOR = /\b(Grain Free|Natural|High[- ]?Protein|With Organ Meat|Limited Ingredient|Non-?GMO|Probiotics|Prebiotics|Omegas|Organic|Holistic|Sensitive|Urinary|Indoor|Hairball|Weight[^,]*?Care|Digestive|Dental|Mobility|Light|Skin|Coat|No Artificial\b[^,]*|With-?Grain|Corn Free|Wheat Free|Soy Free|Potato Free|Gluten Free|Freeze[- ]?Dried|Antioxidants?|Complete|Balanced|Hydrolyzed|Everyday Health|True Instinct|Pro Plan|Science Diet|Prescription Diet|Blue Buffalo|Wilderness|Fancy Feast|Gourmet Naturals|Perfect Portions|Proactive Health|Wholesome Essentials|MedalSeries|Prowess|Original|Classic|Medleys|Savory Centers|Bone Broth Infused)\b/gi;
const SIZE_COUNT = /,?\s*\d+(\.\d+)?\s*(oz|OZ|Oz|lb|LB|Lb|g|kg|ct|CT|Ct|Count|Pack|Can|Cans|Cups?)\b.*/i;
const FORMAT_WORDS = /\b(Pate|Paté|Mousse|Stew|Shredded|Minced|Flaked|Grilled|Chunks?|Cuts|Bits|Morsels|Loaf|Gravy|Broth|Sauce|In Gravy|In Broth|In Sauce|Au Jus|Variety Pack|Adult|Kitten|Senior|All Life Stages?|Cat Food|Wet Food|Dry Food|Cat Dry Food|Cat Wet Food|Kibble)\b/gi;
const SKIP_CALORIE = /Calorie|Content|Calculated|ME\b|kcal|metabolizable|This food|energy|as fed|Guaranteed|Feeding|Instructions|Description|Features|Benefits|Download|Item Number|Species|Directions|For nursing|Contains|ENHANCED|Beneficial|Antioxidants|Fiber|Probiotics/i;
const SKIP_INGREDIENT = /^(Minerals|Vitamins|MINERALS|VITAMINS|Crude|Moisture|Ash|Taurine|Includes|INGREDIENTS|Contains|ENHANCED|Beneficial|Antioxidants|Fiber|Probiotics|Features|Description|Directions|Download|Feeding|Instructions|Guaranteed|Species|For nursing)\b/i;

// ─── Extract flavor from product title ───────────────────────────────────────
function extractFromTitle(name) {
  if (!name) return null;
  const dashIdx = name.indexOf(" - ");
  if (dashIdx < 0) return null;
  let after = name.substring(dashIdx + 3).trim();

  // Strip size/count
  after = after.replace(SIZE_COUNT, "");
  // Strip format/texture words
  after = after.replace(FORMAT_WORDS, "");
  // Strip non-flavor descriptors
  after = after.replace(NON_FLAVOR, "");
  // Clean up
  after = after.replace(/,\s*,/g, ",").replace(/^[,\s\-]+|[,\s\-]+$/g, "").trim();

  if (!after || after.length < 2) return null;
  // Must contain at least one flavor/protein word
  if (!containsFlavorWord(after)) return null;
  return after;
}

// ─── Extract formula labels from calorie content ─────────────────────────────
function extractFromCalories(cal) {
  if (!cal || typeof cal !== "string") return [];
  const labels = [];
  // Match "Recipe Name:" or "Recipe Name Recipe:" patterns
  const regex = /([A-ZÀ-Ý][A-Za-zÀ-ÿ0-9,&''\-–\s]{2,55}?)(?:\s+Recipe)?(?:\s+(?:in|In)\s+\w+(?:\s+\w+)?)?\s*:/g;
  let m;
  while ((m = regex.exec(cal)) !== null) {
    const label = m[1].trim();
    if (!SKIP_CALORIE.test(label) && label.length > 2 && containsFlavorWord(label)) {
      // Strip product codes like "B654322"
      const clean = label.replace(/^[A-Z]\d{5,}\s*;?\s*/, "").trim();
      if (clean.length > 2) labels.push(clean);
    }
  }
  return labels;
}

// ─── Extract formula labels from ingredient list ─────────────────────────────
function extractFromIngredients(ing) {
  if (!ing || typeof ing !== "string") return [];
  const cleaned = ing.replace(/\[[^\]]*\]/g, "[]");
  const labels = [];
  const regex = /([A-ZÀ-Ý][A-Za-zÀ-ÿ0-9,&''\-–\s]{2,55}?)(?:\s+Recipe)?(?:\s+(?:in|In)\s+\w+(?:\s+\w+)?)?\s*:/g;
  let m;
  while ((m = regex.exec(cleaned)) !== null) {
    const label = m[1].trim();
    if (!SKIP_INGREDIENT.test(label) && label.length > 2 && containsFlavorWord(label)) {
      const clean = label
        .replace(/^[A-Z]\d{5,}\s*;?\s*/, "")
        .replace(/^.*?(?:supplement|chloride|sulfate|oxide|iodate|carbonate)\s*/i, "")
        .trim();
      if (clean.length > 2) labels.push(clean);
    }
  }
  return labels;
}

// ─── Clean a label for comparison ────────────────────────────────────────────
function cleanLabel(label) {
  let s = label;
  // Fix run-on words like "ClassicTurkey" → "Turkey"
  s = s.replace(/^(Classic|Tender|Savory|Grilled|Indoor|Extra|Meaty|Prime|Gravies)\s*/gi, "");
  s = s.replace(/(Classic|Tender|Savory)(?=[A-Z])/g, ""); // no-space run-ons
  // Strip recipe/format suffixes
  s = s.replace(/\s+Recipe\b/gi, "");
  s = s.replace(/\s+(?:in|In)\s+(?:Gravy|Broth|Sauce|Jelly|Gelee|a Hydrating Puree|Pumpkin Consomme)\b/gi, "");
  s = s.replace(/\s+(?:Feast|Entree|Entrée|Dinner|Formula|Favorites|Medley)\b/gi, "");
  // Strip texture/format prefixes and suffixes
  s = s.replace(/\b(?:Paté|Pate|Savory Centers|Gravy Lovers|Consomme|Centers)\s*(?:With\s+)?/gi, "");
  s = s.replace(/\b(?:Shredded|Boneless|Flaked|Chunky|Grilled|Minced|Shreds|Filets|Prime Filets)\s*(?:With\s+)?/gi, "");
  s = s.replace(/\s+(?:Pate|Paté|Stew|Classic|PATE)\s*$/gi, ""); // trailing format
  s = s.replace(/\bPATE\b/gi, ""); // ALL CAPS PATE
  s = s.replace(/\bStew\b/gi, "");
  s = s.replace(/\bFeastIn\b/gi, ""); // run-on from data
  // Strip "With " prefix
  s = s.replace(/^With\s+/i, "");
  // Strip "Senior" suffix
  s = s.replace(/\s+Senior$/i, "");
  // Strip Sheba "Tray " prefix
  s = s.replace(/\bTray\s+/gi, "");
  // Normalize "and" → "&"
  s = s.replace(/\band\b/gi, "&");
  // Title-case ALL CAPS labels (Sheba)
  if (s === s.toUpperCase() && s.length > 3) {
    s = s.split(/(\s+|&)/).map(w => w.length > 1 && w === w.toUpperCase() ? w.charAt(0) + w.slice(1).toLowerCase() : w).join("");
  }
  // Clean up
  s = s.replace(/^[,\s&]+|[,\s&]+$/g, "").replace(/\s{2,}/g, " ").trim();
  return s;
}

// ─── Main verification ──────────────────────────────────────────────────────
const results = { match: 0, mismatch: 0, enriched: 0, noData: 0 };
const diffs = [];

for (const p of all) {
  const titleFlavor = extractFromTitle(p.name);
  const calLabels = extractFromCalories(p.calorieContent);
  const ingLabels = extractFromIngredients(p.fullIngredients);

  // Determine best flavor source
  let bestFlavor = null;
  let source = null;

  if (calLabels.length >= 2) {
    // Variety pack with calorie labels — use these (most reliable)
    bestFlavor = calLabels.map(l => cleanLabel(l)).filter(l => l.length > 1).join(", ");
    source = "calories";
  } else if (ingLabels.length >= 2) {
    // Variety pack with ingredient labels
    bestFlavor = ingLabels.map(l => cleanLabel(l)).filter(l => l.length > 1).join(", ");
    source = "ingredients";
  } else if (titleFlavor) {
    // Single product — use title
    bestFlavor = titleFlavor;
    source = "title";
  } else if (calLabels.length === 1) {
    bestFlavor = cleanLabel(calLabels[0]);
    source = "calories";
  }

  if (!bestFlavor || bestFlavor.length < 2) {
    if (!p.flavor) results.noData++;
    else results.noData++;
    continue;
  }

  // Compare against current flavor
  const currentFlavor = p.flavor || "";
  const normalize = s => s.toLowerCase().replace(/\band\b/g, "&").replace(/[,&\s]+/g, " ").replace(/\bbrown\s+/g, "").trim();
  const bestLower = normalize(bestFlavor);
  const currentLower = normalize(currentFlavor);

  if (bestLower === currentLower || currentLower.includes(bestLower) || bestLower.includes(currentLower)) {
    results.match++;
  } else {
    results.mismatch++;
    diffs.push({
      sku: p.sku,
      src: p.src,
      name: p.name?.substring(0, 65),
      current: currentFlavor || "(empty)",
      extracted: bestFlavor,
      source,
    });
  }
}

// ─── Output ──────────────────────────────────────────────────────────────────
console.log("=== FLAVOR VERIFICATION RESULTS ===");
console.log(`Match: ${results.match}`);
console.log(`Mismatch: ${results.mismatch}`);
console.log(`No extractable data: ${results.noData}`);
console.log(`Total: ${all.length}`);

console.log("\n=== MISMATCHES (current → extracted from labels) ===");
diffs.forEach(d => {
  console.log(`\n[${d.src}] SKU ${d.sku} (from ${d.source})`);
  console.log(`  Name:      ${d.name}`);
  console.log(`  Current:   "${d.current}"`);
  console.log(`  Extracted: "${d.extracted}"`);
});
