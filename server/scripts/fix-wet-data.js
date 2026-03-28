// fix-wet-data.js — Clean and normalize wet cat food data
// Run: node server/scripts/fix-wet-data.js

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, "../data/petsmart-wet-products.json");

const products = JSON.parse(readFileSync(dataPath, "utf-8"));
console.log(`Loaded ${products.length} wet food products`);

const stats = {
  brandFixed: 0,
  foodTypeFixed: 0,
  benefitsSplit: 0,
  flavorExtracted: 0,
  lifeStageFixed: 0,
  htmlCleaned: 0,
  duplicatesRemoved: 0,
};

// ═══════════════════════════════════════════════════════════════════════════════
// Brand normalization — map inconsistent RSC brands to clean names
// ═══════════════════════════════════════════════════════════════════════════════

const BRAND_MAP = {
  "Fancy Feast Pate": "Fancy Feast",
  "Fancy Feast Gravy Lovers": "Fancy Feast",
  "Fancy Feast Grilled": "Fancy Feast",
  "Fancy Feast Savory Centers": "Fancy Feast",
  "Fancy Feast Kitten": "Fancy Feast",
  "Fancy Feast Flaked": "Fancy Feast",
  "Purina Fancy Feast": "Fancy Feast",
  "Purina Fancy Feast Pate": "Fancy Feast",
  "Purina Fancy Feast Medleys": "Fancy Feast",
  "Purina Fancy Feast Petites": "Fancy Feast",
  "Purina Pro Plan Complete Essentials": "Purina Pro Plan",
  "Pro Plan Complete Essentials": "Purina Pro Plan",
  "Purina Pro Plan FOCUS": "Purina Pro Plan",
  "Purina Friskies Pate": "Friskies",
  "Purina Friskies": "Friskies",
  "Friskies Pate": "Friskies",
  "Friskies Prime Filets": "Friskies",
  "Purina": "Friskies", // generic "Purina" on Friskies products
  "Tiki Cat After Dark": "Tiki Cat",
  "Hill&#39;s Science Diet": "Hill's Science Diet",
  "Hill's Science Diet": "Hill's Science Diet",
};

// ═══════════════════════════════════════════════════════════════════════════════
// Food type normalization — clean up inconsistent wet food format labels
// ═══════════════════════════════════════════════════════════════════════════════

// Known clean food type values (exact match)
const FOOD_TYPE_EXACT = {
  "Pate": "Pate",
  "PATE": "Pate",
  "Wet – Pate": "Pate",
  "Wet, Pate": "Pate",
  "Wet – Shredded": "Shredded",
  "Wet, Shreds": "Shredded",
  "Canned/Shredded": "Shredded",
  "Shredded": "Shredded",
  "Gravy": "Gravy",
  "Gravy, Broth": "Gravy",
  "In Gravy": "Gravy",
  "Gravy, Chunks": "Chunks in Gravy",
  "Chunks and Gravy": "Chunks in Gravy",
  "Chunks In Gravy": "Chunks in Gravy",
  "Canned/Chunks": "Chunks in Gravy",
  "Chunks": "Chunks in Gravy",
  "Thin Slices in Gravy": "Sliced",
  "Morsels in Gravy": "Morsels",
  "Grilled": "Grilled",
  "Flaked": "Flaked",
  "Minced": "Minced",
  "Loaf": "Loaf",
  "Loaf in Sauce": "Loaf",
  "Broth": "Broth",
  "Mousse": "Mousse",
  "Stew": "Stew",
  "Aspic/Gelee": "Other",
  "Canned": "Canned",
  "Wet": "Canned",
  "Wet Food": "Canned",
  "Wet CatFood": "Canned",
  "Wet Cat Food": "Canned",
};

// Keyword-based food type detection for messy concatenated strings
const FOOD_TYPE_KEYWORDS = [
  [/\bpate\b/i, "Pate"],
  [/\bshred/i, "Shredded"],
  [/\bflaked?\b/i, "Flaked"],
  [/\bminced\b/i, "Minced"],
  [/\bgrilled\b/i, "Grilled"],
  [/\bloaf\b/i, "Loaf"],
  [/\bmousse\b/i, "Mousse"],
  [/\bstew\b/i, "Stew"],
  [/\bbroth\b/i, "Broth"],
  [/\bchunks?\s*(in|and)\s*gravy\b/i, "Chunks in Gravy"],
  [/\b(thin\s*)?slices?\s*(in\s*)?gravy\b/i, "Sliced"],
  [/\bmorsels?\b/i, "Morsels"],
  [/\bgravy\b/i, "Gravy"],
];

// ═══════════════════════════════════════════════════════════════════════════════
// HTML entity cleanup
// ═══════════════════════════════════════════════════════════════════════════════

function cleanHtmlEntities(text) {
  if (!text) return text;
  return text
    .replace(/&#39;/g, "'")
    .replace(/&#38;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&eacute;/g, "é")
    .replace(/&frasl;/g, "/")
    .replace(/&reg;/g, "®")
    .replace(/&trade;/g, "™")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// Benefits splitting (same issue as dry food — concatenated into one string)
// ═══════════════════════════════════════════════════════════════════════════════

function splitBenefits(benefits) {
  if (!benefits || benefits.length === 0) return [];
  if (benefits.length > 3 && benefits.every((b) => b.length < 300)) {
    return benefits.map((b) => cleanHtmlEntities(b)).filter((b) => b.length > 5);
  }

  const raw = benefits.join(" ").trim();
  if (!raw) return [];

  // Remove trailing junk
  let cleaned = raw
    .replace(/\s*Spoil your pet with.*$/i, "")
    .replace(/\s*Download the.*$/i, "")
    .replace(/\s*Species:\s*Cat.*$/i, "");

  // Split on sentence boundaries followed by capitals
  let items = cleaned.split(/(?<=[.!])\s+(?=[A-Z])/);

  if (items.length <= 2 && cleaned.length > 100) {
    // Try splitting on comma followed by capital (common in Fancy Feast)
    items = cleaned.split(/(?<=\S),\s*(?=[A-Z][a-z])/);
  }

  if (items.length <= 2 && cleaned.length > 200) {
    // Try camelCase boundary splitting
    items = cleaned.split(/(?<=[a-z,])(?=[A-Z][a-z])/);
  }

  return items
    .map((s) => cleanHtmlEntities(s).replace(/,\s*$/, "").trim())
    .filter((s) => s.length > 5 && !/^Species:/i.test(s) && !/^Download/i.test(s));
}

// ═══════════════════════════════════════════════════════════════════════════════
// Flavor extraction from product name
// ═══════════════════════════════════════════════════════════════════════════════

function cleanFlavor(rawFlavor) {
  if (!rawFlavor) return null;
  let f = rawFlavor;

  // Strip junk suffixes that bleed in from concatenated attribute strings
  f = f.replace(/\s*Weight:.*$/i, "");
  f = f.replace(/\s*Primary Ingredient:.*$/i, "");
  f = f.replace(/\s*Nutrition(?:al)? Option:.*$/i, "");
  f = f.replace(/\s*Package Weight:.*$/i, "");
  f = f.replace(/\s*Calories per Serving:.*$/i, "");
  f = f.replace(/\s*Health Consideration:.*$/i, "");
  f = f.replace(/\s*Warranty.*$/i, "");
  f = f.replace(/\s*Directions:.*$/i, "");
  f = f.replace(/\s*Individual can weight:.*$/i, "");

  // Fix run-together words
  f = f.replace(/Recipe(?=[A-Z])/g, "Recipe, ");
  f = f.replace(/.*Flavors Include:\s*/i, "");
  f = f.replace(/.*includes?\s+\d+\s+cans?\s+of\s+the\s+following\s+flavors?:\s*/i, "");

  // Strip product attributes that don't belong in flavor
  f = f.replace(/,?\s*No Artificial (?:Flavors|Preservatives|Colors)[^,]*/gi, "");
  f = f.replace(/,?\s*Limited Ingredient/gi, "");
  f = f.replace(/,?\s*Freeze Dried/gi, "");
  f = f.replace(/,?\s*High[- ]Protein/gi, "");
  f = f.replace(/,?\s*With[- ]Grain/gi, "");
  f = f.replace(/,?\s*Grain Free/gi, "");
  f = f.replace(/,?\s*Indoor/gi, "");
  f = f.replace(/,?\s*Grain & Potato Free/gi, "");
  f = f.replace(/,?\s*Gluten Free/gi, "");
  f = f.replace(/,?\s*Non-GMO/gi, "");
  f = f.replace(/,?\s*Natural/gi, "");
  f = f.replace(/,?\s*Probiotics/gi, "");
  f = f.replace(/,?\s*Omegas/gi, "");
  f = f.replace(/,?\s*\d+\.?\d*\s*(?:Lb|Lbs|oz|g|kg)\b/gi, "");

  // Strip wet food texture/format words (belong in foodType, not flavor)
  f = f.replace(/\s+in Gravy/gi, "");
  f = f.replace(/\s+in Broth/gi, "");
  f = f.replace(/\s+in Sauce/gi, "");
  f = f.replace(/\s+in [A-Z][a-z]+ (?:Broth|Consomm[eé]|Gravy|Sauce)/gi, "");
  f = f.replace(/\s+Au Jus/gi, "");
  f = f.replace(/\s+Infused with Broth/gi, "");
  f = f.replace(/\bPate!\s*/gi, "");
  f = f.replace(/\bPate\b/gi, "");
  f = f.replace(/\bPates\b/gi, "");
  f = f.replace(/\bMousse\b/gi, "");
  f = f.replace(/^Shredded\s+/i, "");
  f = f.replace(/^Flaked\s+/i, "");
  f = f.replace(/^Minced\s+/i, "");
  f = f.replace(/^Grilled\s+/i, "");
  f = f.replace(/\bCuts\s+in\s+Sauce/gi, "");
  f = f.replace(/\bEntree\b/gi, "");
  f = f.replace(/\bEntrée\b/gi, "");
  f = f.replace(/\bDinner\b/gi, "");
  f = f.replace(/\bRecipe\b/gi, "");
  f = f.replace(/\bFormula\b/gi, "");
  f = f.replace(/\bFavorites\b/gi, "");
  f = f.replace(/\bMorsels\b/gi, "");
  f = f.replace(/\bCuts\b/gi, "");
  f = f.replace(/\bBits\b/gi, "");
  f = f.replace(/\bFeast\b/gi, "");
  f = f.replace(/Hip Hip Hooray for\s*!\s*/gi, "");
  f = f.replace(/Variety Pack includes:\s*/gi, "");
  f = f.replace(/\bStew\b/gi, "");
  f = f.replace(/\bCubed\s+/gi, "");

  // Strip "Recipes:" and "recipes are:" prefix from variety pack descriptions (Tiki Cat etc.)
  f = f.replace(/.*recipes?\s*(?:are)?:\s*/i, "");
  // Strip "Included After Dark" and similar prefixes
  f = f.replace(/^Included\s+/i, "");

  // If flavor is just a texture word, null it out
  if (/^(?:in gravy|in broth|in sauce|pate|shredded|flaked|minced|grilled)$/i.test(f.trim())) {
    return null;
  }

  // Clean up artifacts
  f = f.replace(/\s+/g, " ");
  f = f.replace(/^[,;&\s]+/, "");
  f = f.replace(/[,;&:\s]+$/, "");
  f = f.replace(/,\s*,/g, ",");
  f = f.replace(/\s*,\s*/g, ", ");
  f = f.trim();

  // Truncate long variety lists to first 3 items
  if (f.length > 60) {
    const parts = f.split(/,\s*/);
    if (parts.length > 3) {
      f = parts.slice(0, 3).join(", ") + " + more";
    } else {
      f = f.substring(0, 55) + "...";
    }
  }

  return f || null;
}

function extractFlavor(product) {
  if (product.flavor) return cleanFlavor(cleanHtmlEntities(product.flavor));

  const name = product.name || "";
  // Try "Product - Flavor, ..." pattern
  const dashMatch = name.match(/[-–—]\s*(.+?)(?:,\s*(?:Variety|Pack|\d))/i);
  if (dashMatch) {
    const flavor = dashMatch[1].trim();
    if (flavor.length > 2 && flavor.length < 60) return flavor;
  }

  // Try known flavors in name
  const lower = name.toLowerCase();
  const flavors = [
    "chicken", "turkey", "salmon", "tuna", "beef", "seafood", "fish",
    "duck", "lamb", "ocean whitefish", "whitefish", "shrimp",
    "poultry & beef", "poultry and beef",
  ];
  for (const f of flavors) {
    if (lower.includes(f)) {
      return f.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Life stage normalization
// ═══════════════════════════════════════════════════════════════════════════════

function normalizeLifeStage(lifeStage, name) {
  if (!lifeStage && name) {
    const lower = name.toLowerCase();
    if (/\bkitten\b/.test(lower)) return "Kitten";
    if (/\bsenior\b/.test(lower)) return "Senior";
    if (/\badult\b/.test(lower)) return "Adult";
    if (/\ball\s*(?:life\s*)?stage/i.test(lower)) return "All Life Stages";
    return "Adult"; // default for wet food
  }

  const ls = (lifeStage || "").trim();
  // "All ..." with anything after it (messy concatenated strings) → All Life Stages
  if (/^all\b/i.test(ls)) return "All Life Stages";
  if (/all\s*(?:life\s*)?stage/i.test(ls)) return "All Life Stages";
  if (/\bkitten\b/i.test(ls) || /\bbabycat\b/i.test(ls) || /\bpuppy\b/i.test(ls)) return "Kitten";
  if (/\bsenior\b/i.test(ls) || /\bsenoir\b/i.test(ls)) return "Senior (7+)";
  if (/\bmature\b/i.test(ls)) return "Senior (7+)";
  if (/\bage(?:s)?\s*(?:1\+|1-7|1 to 7)/i.test(ls)) return "Adult";
  if (/\badult\b/i.test(ls)) return "Adult";
  if (/\bindoor\b/i.test(ls)) return "Adult";
  if (/\bneutered|sterilized\b/i.test(ls)) return "Adult";
  // Long messy strings that start with a description → try to extract
  if (ls.length > 50) return "All Life Stages";
  return ls || "Adult";
}

// ═══════════════════════════════════════════════════════════════════════════════
// AAFCO extraction
// ═══════════════════════════════════════════════════════════════════════════════

function extractAafco(product) {
  if (product.aafco && product.aafco.length > 20) return product.aafco;

  const allText = [
    product.guaranteedAnalysis,
    product.directions,
    product.calorieContent,
    product.description,
  ]
    .filter(Boolean)
    .join(" ");

  const patterns = [
    /[^.]*formulated to meet the nutritional levels established by the AAFCO[^.]*/i,
    /[^.]*meets the nutritional levels established by the AAFCO[^.]*/i,
    /[^.]*formulated to meet AAFCO[^.]*/i,
  ];

  for (const pattern of patterns) {
    const match = allText.match(pattern);
    if (match && match[0].length > 30 && match[0].length < 500) {
      return match[0].trim();
    }
  }

  return "";
}

// ═══════════════════════════════════════════════════════════════════════════════
// Deduplicate — some variety packs show up twice
// ═══════════════════════════════════════════════════════════════════════════════

function deduplicateBySku(products) {
  const seen = new Map();
  const deduped = [];
  for (const p of products) {
    if (seen.has(p.sku)) {
      stats.duplicatesRemoved++;
      continue;
    }
    seen.set(p.sku, true);
    deduped.push(p);
  }
  return deduped;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Fix brand for "Purina" generic label — detect actual brand from name/URL
// ═══════════════════════════════════════════════════════════════════════════════

function fixGenericPurinaBrand(product) {
  const brand = product.brand;
  if (brand !== "Purina") return brand;

  const name = (product.name || "").toLowerCase();
  const url = (product.productURL || "").toLowerCase();

  if (name.includes("friskies") || url.includes("friskies")) return "Friskies";
  if (name.includes("fancy feast") || url.includes("fancy-feast")) return "Fancy Feast";
  if (name.includes("pro plan") || url.includes("pro-plan")) return "Purina Pro Plan";
  return "Purina";
}

// ═══════════════════════════════════════════════════════════════════════════════
// APPLY ALL FIXES
// ═══════════════════════════════════════════════════════════════════════════════

for (const p of products) {
  // Fix generic Purina brand first
  p.brand = fixGenericPurinaBrand(p);

  // Brand normalization
  if (BRAND_MAP[p.brand]) {
    p.brand = BRAND_MAP[p.brand];
    stats.brandFixed++;
  }

  // Clean HTML entities from all text fields
  p.name = cleanHtmlEntities(p.name);
  p.brand = cleanHtmlEntities(p.brand);
  p.description = cleanHtmlEntities(p.description);
  p.fullIngredients = cleanHtmlEntities(p.fullIngredients);
  p.guaranteedAnalysis = cleanHtmlEntities(p.guaranteedAnalysis);
  p.calorieContent = cleanHtmlEntities(p.calorieContent);
  p.directions = cleanHtmlEntities(p.directions);
  stats.htmlCleaned++;

  // Extract extra attributes from messy concatenated foodType strings
  // (e.g. "Wet Breed Size: All Life Stage: Adult Health Consideration: ...")
  if (p.foodType && p.foodType.length > 40) {
    const ft = p.foodType;
    // Extract life stage if not already set
    const lsMatch = ft.match(/Life Stage:\s*([^A-Z\n]+?)(?=\s+[A-Z]|$)/i);
    if (lsMatch && !p.lifeStage) p.lifeStage = lsMatch[1].trim();
    // Extract health considerations if not already set
    const hcMatch = ft.match(/Health Consideration:\s*([^A-Z\n]+?)(?=\s+(?:Flavor|Weight|$))/i);
    if (hcMatch && (!p.healthConsiderations || p.healthConsiderations.length === 0)) {
      p.healthConsiderations = hcMatch[1].split(/,\s*/).map(s => s.trim()).filter(Boolean);
    }
    // Extract flavor if not already set
    const flMatch = ft.match(/Flavor:\s*([^A-Z\n]+?)(?=\s+Weight|$)/i);
    if (flMatch && !p.flavor) p.flavor = flMatch[1].trim();
  }

  // Food type normalization
  const originalType = p.foodType;
  if (FOOD_TYPE_EXACT[p.foodType]) {
    p.foodType = FOOD_TYPE_EXACT[p.foodType];
  } else {
    // Messy concatenated string — try keyword detection
    let matched = false;
    // First try the foodType field
    for (const [pattern, value] of FOOD_TYPE_KEYWORDS) {
      if (pattern.test(p.foodType)) {
        p.foodType = value;
        matched = true;
        break;
      }
    }
    // If still not matched, try the product name
    if (!matched) {
      for (const [pattern, value] of FOOD_TYPE_KEYWORDS) {
        if (pattern.test(p.name || "")) {
          p.foodType = value;
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      p.foodType = "Canned"; // default fallback
    }
  }

  // Cross-check: product name may override a wrong foodType
  // e.g. "Simply Nourish Stew" labeled as "Flaked" → should be "Stew"
  const nameLower = (p.name || "").toLowerCase();
  if (/\bstew\b/.test(nameLower) && p.foodType !== "Stew") {
    p.foodType = "Stew";
  }
  if (/\bgrilled\b/.test(nameLower) && p.foodType !== "Grilled") {
    p.foodType = "Grilled";
  }
  if (/\bmousse\b/.test(nameLower) && p.foodType !== "Mousse") {
    p.foodType = "Mousse";
  }
  // For "Canned" fallback, try harder with name + description
  if (p.foodType === "Canned") {
    const searchText = `${p.name || ""} ${p.description || ""}`.toLowerCase();
    if (/\bpate\b/.test(searchText)) p.foodType = "Pate";
    else if (/\bshred/i.test(searchText)) p.foodType = "Shredded";
    else if (/\bflaked?\b/.test(searchText)) p.foodType = "Flaked";
    else if (/\bminced\b/.test(searchText)) p.foodType = "Minced";
    else if (/\bsliced\b/.test(searchText)) p.foodType = "Sliced";
    else if (/\bchunks?\b/.test(searchText)) p.foodType = "Chunks in Gravy";
    else if (/\bmorsels?\b/.test(searchText)) p.foodType = "Morsels";
    else if (/\bloaf\b/.test(searchText)) p.foodType = "Loaf";
    else if (/\bbroth\b/.test(searchText)) p.foodType = "Broth";
    else if (/\bgravy\b/.test(searchText)) p.foodType = "Gravy";
  }

  if (p.foodType !== originalType) stats.foodTypeFixed++;

  // Benefits splitting
  const origBenefits = JSON.stringify(p.benefits);
  p.benefits = splitBenefits(p.benefits);
  if (JSON.stringify(p.benefits) !== origBenefits) stats.benefitsSplit++;

  // Flavor extraction
  const origFlavor = p.flavor;
  p.flavor = extractFlavor(p);
  if (!origFlavor && p.flavor) stats.flavorExtracted++;

  // Life stage normalization
  const origLS = p.lifeStage;
  p.lifeStage = normalizeLifeStage(p.lifeStage, p.name);
  if (p.lifeStage !== origLS) stats.lifeStageFixed++;

  // Breed cleanup — wet food breeds are mostly junk ("All", "All Breeds", or concatenated strings)
  if (p.breed && (/^all\b/i.test(p.breed) || p.breed.length > 20)) {
    p.breed = null;
  }

  // AAFCO extraction
  p.aafco = extractAafco(p);
}

// Deduplicate
const deduped = deduplicateBySku(products);

// Write fixed data
writeFileSync(dataPath, JSON.stringify(deduped, null, 2));

console.log(`\n=== Wet Food Data Quality Fix Results ===`);
console.log(`Brands normalized:     ${stats.brandFixed}`);
console.log(`Food types normalized: ${stats.foodTypeFixed}`);
console.log(`Benefits re-split:     ${stats.benefitsSplit}`);
console.log(`Flavors extracted:     ${stats.flavorExtracted}`);
console.log(`Life stages fixed:     ${stats.lifeStageFixed}`);
console.log(`HTML entities cleaned: ${stats.htmlCleaned}`);
console.log(`Duplicates removed:    ${stats.duplicatesRemoved}`);
console.log(`Final product count:   ${deduped.length}`);

// Verification
const brands = {};
const types = {};
const stages = {};
for (const p of deduped) {
  brands[p.brand] = (brands[p.brand] || 0) + 1;
  types[p.foodType] = (types[p.foodType] || 0) + 1;
  stages[p.lifeStage] = (stages[p.lifeStage] || 0) + 1;
}

console.log("\nBrand breakdown:");
for (const [b, c] of Object.entries(brands).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${b}: ${c}`);
}

console.log("\nFood type breakdown:");
for (const [t, c] of Object.entries(types).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${t}: ${c}`);
}

console.log("\nLife stage breakdown:");
for (const [l, c] of Object.entries(stages).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${l}: ${c}`);
}

console.log("\nDone! Fixed data written to petsmart-wet-products.json");
