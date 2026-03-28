// fix-data-quality.js — Fix data quality issues in petsmart-products.json
// Run: node server/scripts/fix-data-quality.js
//
// Fixes:
// 1. Benefits: split concatenated strings into proper arrays
// 2. AAFCO: remove wrong content, extract from GA where buried
// 3. Attributes: extract missing flavor/lifeStage/foodType/breedSize/healthConsiderations
// 4. Calorie content: strip appended GA/feeding data
// 5. Guaranteed analysis: strip appended feeding/description/features text
// 6. Directions: strip appended description/features text

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, "../data/petsmart-products.json");
const backupPath = join(__dirname, "../data/petsmart-products.backup.json");

const products = JSON.parse(readFileSync(dataPath, "utf-8"));

// Back up original
writeFileSync(backupPath, JSON.stringify(products, null, 2));
console.log(`Backed up ${products.length} products to petsmart-products.backup.json`);

// ═══════════════════════════════════════════════════════════════════════════════
// Counters for reporting
// ═══════════════════════════════════════════════════════════════════════════════
const stats = {
  benefitsSplit: 0,
  benefitsCleaned: 0,
  aafcoCleared: 0,
  aafcoExtractedFromGA: 0,
  caloriesCleaned: 0,
  gaCleaned: 0,
  directionsCleaned: 0,
  flavorExtracted: 0,
  lifeStageExtracted: 0,
  foodTypeExtracted: 0,
  breedSizeExtracted: 0,
  healthExtracted: 0,
  nutritionalExtracted: 0,
};

// ═══════════════════════════════════════════════════════════════════════════════
// Known attribute keys found in RSC payloads (used to parse embedded attributes)
// ═══════════════════════════════════════════════════════════════════════════════
const ATTR_KEYS = [
  "Species", "Brand", "Food Type", "Breed Size", "Life Stage",
  "Nutritional Benefits", "Health Consideration", "Flavor",
  "Weight", "Ingredients", "Caloric Content", "Guaranteed Analysis",
  "Feeding Instructions", "Description", "Features & Benefits",
  "Key Benefits", "Nutritional Options",
];

// Build a regex that matches any known key followed by ": "
// This lets us split embedded attribute strings properly
const attrKeyPattern = new RegExp(
  `(${ATTR_KEYS.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|")}):\\s*`,
  "gi"
);

/**
 * Parse embedded key-value attributes from a text blob.
 * Returns { "Food Type": "Kibble", "Flavor": "Chicken", ... }
 */
function parseEmbeddedAttributes(text) {
  if (!text) return {};
  const attrs = {};
  const keys = [];
  let match;

  // Find all key positions
  const regex = new RegExp(attrKeyPattern.source, "gi");
  while ((match = regex.exec(text)) !== null) {
    keys.push({ key: match[1], start: match.index, valueStart: match.index + match[0].length });
  }

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i].key;
    const valueStart = keys[i].valueStart;
    const valueEnd = i + 1 < keys.length ? keys[i + 1].start : text.length;
    let value = text.substring(valueStart, valueEnd).trim();

    // Only keep short values (long ones are likely content bleed)
    if (value.length < 200) {
      // Normalize the key
      const normKey = key.trim();
      if (!attrs[normKey] || value.length < attrs[normKey].length) {
        attrs[normKey] = value;
      }
    }
  }
  return attrs;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIX 1: Benefits — split concatenated strings into proper bullet points
// ═══════════════════════════════════════════════════════════════════════════════

function fixBenefits(benefits) {
  if (!benefits || benefits.length === 0) return [];

  // If already properly split (multiple short items), clean and return
  if (benefits.length > 3 && benefits.every(b => b.length < 300)) {
    // Still clean up: rejoin broken mid-sentence items and filter junk
    return cleanBenefitArray(benefits);
  }

  // Join everything into one string first
  const raw = benefits.join(" ").trim();
  if (!raw) return [];

  // Remove trailing junk (Species: Cat, Weight: ..., etc)
  let cleaned = raw.replace(/\s*Species:\s*(?:Cat|Feline).*$/i, "");

  // Split on patterns that indicate new benefit items:
  // - Pattern: sentence-ending punctuation followed by capital letter start of new sentence
  // - Pattern: specific PetSmart benefit header formats like "ALL CAPS: description"
  const splitPatterns = [
    // "...sentence end. NEW SENTENCE or Capitalized sentence"
    /(?<=[.!])\s+(?=[A-Z][A-Z\s]{3,}:|\d+\s*percent|[A-Z][a-z])/,
    // Numbered items
    /(?<=\S)\s+(?=\d+[.)]\s)/,
  ];

  // Try splitting on ". " followed by capital letter (most common pattern)
  let items = cleaned.split(/(?<=[.!])\s+(?=[A-Z])/);

  // If that didn't work well (still one big chunk), try harder
  if (items.length <= 2 && cleaned.length > 100) {
    // Many PetSmart benefits have ALL CAPS headers or Title Case starts
    // Split on capital-letter word boundaries that look like new items
    items = splitOnBenefitBoundaries(cleaned);
  }

  return cleanBenefitArray(items);
}

function splitOnBenefitBoundaries(text) {
  // Many PetSmart benefits are concatenated without periods, like:
  // "Seafood flavors for taste100 percent completeContains protein..."
  // or with title-case boundaries like:
  // "Chicken ingredient #1With added FOS...Highly digestible..."

  // Split on capital letter that follows a lowercase letter directly (no space)
  // e.g. "taste cats loveOne hundred" → split before "One"
  // e.g. "for qualityVitamin E" → split before "Vitamin"
  let items = text.split(/(?<=[a-z,])(?=[A-Z][a-z])/);

  if (items.length <= 2) {
    // Also try splitting on action verbs after any word boundary
    items = text.split(/(?<=\S\s)(?=(?:[A-Z][A-Z]+\s|Contains |Includes |Provides |Supports |Promotes |Formulated |Made with |Features |Helps |Packed |Real |Premium |Quality|Designed |Crafted |Developed |Fortified |Enhanced |Balanced |Complete |Clinically |Veterinarian |With added |Highly |US |USA ))/);
  }

  // If still just one chunk, try more aggressive
  if (items.length <= 2 && text.length > 200) {
    items = text.split(/(?<=\s)(?=(?:\d+\s*percent |High[\s-]|No\s|Low[\s-]|Rich\s|Free\s|Natural\s|Grain[\s-]free|Gluten[\s-]free))/i);
  }

  return items;
}

function cleanBenefitArray(items) {
  const cleaned = [];
  let current = "";

  for (const item of items) {
    const trimmed = item.trim()
      .replace(/,\s*$/, "")  // Remove trailing comma
      .replace(/\s+/g, " "); // Normalize whitespace

    if (!trimmed) continue;

    // Skip junk items
    if (/^Species:\s/i.test(trimmed)) continue;
    if (/^Weight:\s/i.test(trimmed)) continue;
    if (/^Brand:\s/i.test(trimmed)) continue;
    if (/^Spoil your pet with/i.test(trimmed)) continue;
    if (/^app today\.?$/i.test(trimmed)) continue;
    if (/^Download the/i.test(trimmed)) continue;

    // If this starts with lowercase, it's a continuation of the previous item
    if (/^[a-z]/.test(trimmed) && current) {
      current += " " + trimmed;
    } else {
      if (current) cleaned.push(current);
      current = trimmed;
    }
  }
  if (current) cleaned.push(current);

  // Final cleanup: remove trailing periods if inconsistent, trim
  return cleaned
    .map(b => b.trim())
    .filter(b => b.length > 5); // Remove tiny fragments
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIX 2: AAFCO — remove wrong content, extract from other fields
// ═══════════════════════════════════════════════════════════════════════════════

function isRealAafco(text) {
  if (!text || text.trim().length === 0) return false;
  const lower = text.toLowerCase().trim();

  // Reject known wrong-content patterns
  if (lower.startsWith("key benefits") ||
      lower.startsWith("description") ||
      lower.startsWith("features") ||
      lower.startsWith("guaranteed analysis") ||
      lower.startsWith("contains one") ||
      lower.startsWith("ingredients:") ||
      lower.startsWith("brand:") ||
      lower.startsWith("*not recognized") ||
      lower.startsWith("**not recognized")) {
    return false;
  }

  // The "Not recognized as an essential nutrient by AAFCO" is a GA disclaimer, not an adequacy statement
  if (lower.includes("not recognized as an essential nutrient")) return false;

  return (
    lower.includes("formulated to meet") ||
    // "complete and balanced nutrition for maintenance/all life stages" is AAFCO language
    (/complete and balanced nutrition for (?:the )?(?:maintenance|all|adult|kitten|growth)/i.test(text) && text.length < 300)
  );
}

function extractAafcoFromText(text) {
  if (!text) return null;

  // Look for the actual AAFCO nutritional adequacy statement
  // Pattern: "X is formulated to meet the nutritional levels established by the AAFCO ..."
  const patterns = [
    /[^.]*formulated to meet the nutritional levels established by the AAFCO[^.]*\./i,
    /[^.]*meets the nutritional levels established by the AAFCO[^.]*\./i,
    /[^.]*formulated to meet AAFCO[^.]*\./i,
    /[^.]*provides complete and balanced nutrition for (?:the )?(?:maintenance|all|adult|kitten|growth)[^.]*\./i,
  ];
  // NOTE: Do NOT match "*Not recognized as an essential nutrient by the AAFCO..."
  // That's a GA disclaimer, not an AAFCO nutritional adequacy statement

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const stmt = match[0].trim();
      // Make sure it's a real statement, not just a passing mention
      if (stmt.length > 30 && stmt.length < 500) return stmt;
    }
  }
  return null;
}

function fixAafco(product) {
  const current = (product.aafco || "").trim();

  // Check if current AAFCO field has wrong content
  if (current) {
    if (isRealAafco(current)) {
      // It's real — but trim it if it's too long (might have extra content appended)
      if (current.length > 500) {
        const extracted = extractAafcoFromText(current);
        if (extracted) return extracted;
      }
      return current;
    }

    // Wrong content — clear it
    stats.aafcoCleared++;
  }

  // Try to extract from guaranteedAnalysis field
  const ga = product.guaranteedAnalysis || "";
  const fromGA = extractAafcoFromText(ga);
  if (fromGA) {
    stats.aafcoExtractedFromGA++;
    return fromGA;
  }

  // Try to extract from directions field
  const dir = product.directions || "";
  const fromDir = extractAafcoFromText(dir);
  if (fromDir) {
    stats.aafcoExtractedFromGA++;
    return fromDir;
  }

  // Try to extract from calorieContent field (sometimes has it)
  const cal = product.calorieContent || "";
  const fromCal = extractAafcoFromText(cal);
  if (fromCal) {
    stats.aafcoExtractedFromGA++;
    return fromCal;
  }

  return ""; // Genuinely not found
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIX 3: Calorie content — extract just the calorie info
// ═══════════════════════════════════════════════════════════════════════════════

function fixCalorieContent(text) {
  if (!text) return "";
  const trimmed = text.trim();

  // If it's already clean (short), keep it
  if (trimmed.length < 80) return trimmed;

  // Extract calorie pattern: "X kcal/kg, Y kcal/cup" or "(ME calculated) X kcal/kg, Y kcal/cup"
  const patterns = [
    /\(ME\s*(?:calculated)?\)\s*[\d,]+\s*kcal[⁄/]kg\s*,?\s*[\d,]+\s*kcal[⁄/]cup/i,
    /[\d,]+\s*kcal[⁄/]kg\s*,?\s*[\d,]+\s*kcal[⁄/]cup/i,
    /[\d,]+\s*kcal\s*(?:ME\s*)?(?:per|[⁄/])\s*cup/i,
    /[\d,]+\s*kcal[⁄/]kg/i,
    /\(ME\s*(?:calculated)?\)\s*[\d,]+\s*kcal[^G]*/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      stats.caloriesCleaned++;
      return match[0].trim();
    }
  }

  // Fallback: take everything before "Guaranteed Analysis" or "Feeding"
  const cutoff = trimmed.search(/Guaranteed Analysis|Feeding Instruction|Description|Features/i);
  if (cutoff > 10) {
    stats.caloriesCleaned++;
    return trimmed.substring(0, cutoff).trim();
  }

  return trimmed;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIX 4: Guaranteed Analysis — strip appended junk
// ═══════════════════════════════════════════════════════════════════════════════

function fixGuaranteedAnalysis(text) {
  if (!text) return "";
  const trimmed = text.trim();

  // If clean (no feeding instructions or description appended), keep it
  if (trimmed.length < 500 && !/Feeding|Description|Features|Species:/i.test(trimmed)) {
    return trimmed;
  }

  // Find where the actual GA data ends
  // GA data looks like: "Crude Protein (Min) 30.0%, Crude Fat (Min) 11.0%, ..."
  // It ends when we hit a non-GA section like "Feeding Instructions" or "Description"
  const cutPatterns = [
    /\nFeeding Instructions:/i,
    /\nFeeding /i,
    /\nDescription:/i,
    /\nFeatures & Benefits/i,
    /\nKey Benefits/i,
    /\nTransition/i,
    /(?<=\S)\s*Feeding Instructions:/i,
    /(?<=\S)\s*Description:/i,
    /(?<=\S)\s*Features & Benefits/i,
  ];

  let result = trimmed;
  for (const pattern of cutPatterns) {
    const match = result.search(pattern);
    if (match > 20) {
      result = result.substring(0, match).trim();
      break;
    }
  }

  // Also check for AAFCO disclaimer that often trails the GA
  // Keep that part — it's relevant to GA
  // But strip anything after attribute keys like "Species: Cat"
  const attrCut = result.search(/Species:\s*(?:Cat|Feline|Dog)/i);
  if (attrCut > 20) {
    result = result.substring(0, attrCut).trim();
  }

  if (result !== trimmed) stats.gaCleaned++;
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIX 5: Directions — strip appended description/features/attributes
// ═══════════════════════════════════════════════════════════════════════════════

function fixDirections(text) {
  if (!text) return "";
  const trimmed = text.trim();

  // Cut at "Description:" or "Features & Benefits:" since those aren't directions
  const cutPatterns = [
    /\nDESCRIPTION\s/i,
    /\nDescription:/i,
    /\nFeatures & Benefits/i,
    /\nKey Benefits:/i,
    /(?<=\S)\s*DESCRIPTION\s+/,
    /(?<=\.)\s*Description:\s/i,
  ];

  let result = trimmed;
  for (const pattern of cutPatterns) {
    const match = result.search(pattern);
    if (match > 20) {
      result = result.substring(0, match).trim();
      break;
    }
  }

  if (result !== trimmed) stats.directionsCleaned++;
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIX 6: Extract missing attributes from embedded text
// ═══════════════════════════════════════════════════════════════════════════════

// Flavor extraction from product name
const FLAVOR_PATTERNS = [
  // "Product Name - Flavor" pattern (most common)
  /[-–—]\s*(?:Natural,?\s*)?([A-Z][a-z]+(?:\s*(?:&|,|and)\s*[A-Z][a-z]+)*)\s*$/,
  // "Product Name, Flavor" at end
  /,\s*([A-Z][a-z]+(?:\s*(?:&|,|and)\s*[A-Z][a-z]+)*)\s*$/,
];

const KNOWN_FLAVORS = [
  "chicken", "salmon", "turkey", "fish", "seafood", "tuna", "duck", "lamb",
  "beef", "ocean fish", "whitefish", "white fish", "venison", "rabbit",
  "sardine", "herring", "mackerel", "trout", "anchovy", "shrimp",
  "chicken & turkey", "chicken and turkey", "chicken & salmon",
];

function extractFlavorFromName(name) {
  if (!name) return null;

  // Try the dash pattern first: "Product - Flavor"
  const dashMatch = name.match(/[-–—]\s*(?:Natural,?\s*)?(.+)$/);
  if (dashMatch) {
    let flavor = dashMatch[1].trim();
    // Clean up common suffixes
    flavor = flavor.replace(/\s*\d+\s*$/, ""); // Remove trailing numbers
    if (flavor.length > 2 && flavor.length < 60) return flavor;
  }

  // Check if any known flavor appears in the name
  const lower = name.toLowerCase();
  for (const f of KNOWN_FLAVORS) {
    if (lower.includes(f)) {
      return f.split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Clean dry food flavor — strip marketing descriptors, weight info, junk
// ═══════════════════════════════════════════════════════════════════════════════

function cleanDryFlavor(rawFlavor) {
  if (!rawFlavor) return null;
  let f = rawFlavor;

  // Strip weight/package info appended to flavor
  f = f.replace(/\s*Weight:.*$/i, "");
  f = f.replace(/\s*Ingredients:.*$/i, "");
  f = f.replace(/,?\s*\d+\.?\d*\s*(?:Lb|Lbs|LB|oz|OZ|g|kg)\b/gi, "");
  f = f.replace(/,?\s*Dry (?:Cat )?Food/gi, "");

  // Strip marketing/attribute terms
  f = f.replace(/,?\s*Grain Free/gi, "");
  f = f.replace(/,?\s*Grain & Potato Free/gi, "");
  f = f.replace(/,?\s*Gluten Free/gi, "");
  f = f.replace(/,?\s*Non-GMO/gi, "");
  f = f.replace(/,?\s*Natural/gi, "");
  f = f.replace(/,?\s*High[- ]Protein/gi, "");
  f = f.replace(/,?\s*High Fiber/gi, "");
  f = f.replace(/,?\s*With[- ]Grain/gi, "");
  f = f.replace(/,?\s*With Vitamins/gi, "");
  f = f.replace(/,?\s*Limited Ingredient/gi, "");
  f = f.replace(/,?\s*No Artificial (?:Flavors|Preservatives|Colors)[^,]*/gi, "");
  f = f.replace(/,?\s*Freeze Dried/gi, "");
  f = f.replace(/,?\s*Probiotics/gi, "");
  f = f.replace(/,?\s*Prebiotics(?:\s*&\s*Probiotics)?/gi, "");
  f = f.replace(/,?\s*Omegas/gi, "");
  f = f.replace(/,?\s*4-in-1 Health Support\s*/gi, "");
  f = f.replace(/,?\s*Gut Health/gi, "");

  // Strip health condition terms
  f = f.replace(/,?\s*Hairball/gi, "");
  f = f.replace(/,?\s*Sensitive (?:Stomach|Skin|Digestion)(?:\s*(?:and|&)\s*(?:Stomach|Skin|Digestion))*/gi, "");
  f = f.replace(/,?\s*Urinary (?:Tract Health|St\/Ox)/gi, "");
  f = f.replace(/,?\s*UR/gi, "");
  f = f.replace(/,?\s*Mobility/gi, "");
  f = f.replace(/,?\s*Indoor/gi, "");

  // Strip wet food texture words that ended up in dry food
  f = f.replace(/\s+in (?:Gravy|Broth|Sauce)/gi, "");
  f = f.replace(/^Shredded\s+/i, "");
  f = f.replace(/\bShredded Blend\s*/gi, "");

  // Strip processing/format words
  f = f.replace(/\s*&?\s*\w*\s*Meal$/i, (match) => {
    // Only strip if "Meal" follows an ingredient word like "Chicken Meal"
    if (/chicken meal|turkey meal|salmon meal|herring meal|lamb meal|fish meal/i.test(match)) return "";
    return match;
  });
  f = f.replace(/\bDeboned\s+/gi, "");
  f = f.replace(/\bFormula\b/gi, "");
  f = f.replace(/\bRecipe\b/gi, "");
  f = f.replace(/\bBlend\b/gi, "");
  f = f.replace(/\bKibble\+Raw\b/gi, "");

  // Clean up artifacts
  f = f.replace(/\s+/g, " ");
  f = f.replace(/^[,;&\s]+/, "");
  f = f.replace(/[,;&:\s]+$/, "");
  f = f.replace(/,\s*,/g, ",");
  f = f.replace(/\s*,\s*/g, ", ");
  f = f.replace(/\s*&\s*$/, "");
  f = f.trim();

  // Fix truncated words
  f = f.replace(/\bTkey\b/g, "Turkey");

  // Strip trailing ", With" (truncated "With Probiotics" etc.)
  f = f.replace(/,\s*With\s*$/i, "");

  // If nothing left, return null
  if (!f || f.length < 2) return null;

  return f;
}

function extractLifeStageFromName(name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  if (/\bkitten\b/.test(lower)) return "Kitten";
  if (/\bsenior\b/.test(lower)) return "Senior";
  if (/\badult\b/.test(lower)) return "Adult";
  if (/\ball\s*(?:life\s*)?stage/i.test(lower)) return "All Stages";
  return null;
}

function extractAttributesFromText(product) {
  // Combine all text fields that might contain embedded attributes
  const allText = [
    product.guaranteedAnalysis,
    product.directions,
    product.aafco,
    product.calorieContent,
  ].filter(Boolean).join(" ");

  const extracted = {};

  // Use targeted regexes that handle concatenated format (no space between value and next key)
  // e.g. "Food Type: KibbleBreed Size: AllLife Stage: Adult"
  // The next key name acts as a terminator for the current value

  const nextKeyPattern = "(?=(?:Species|Brand|Food Type|Breed Size|Life Stage|Nutritional (?:Benefits|Options)|Health Consideration|Flavor|Weight|Ingredients|Caloric Content|Guaranteed Analysis|Feeding Instructions|Description|Features):)";

  // Food Type
  const ftMatch = allText.match(new RegExp(`Food Type:\\s*(.+?)${nextKeyPattern}`, "i"));
  if (ftMatch) {
    const ft = ftMatch[1].trim().replace(/[,.\s]+$/, "");
    if (ft && ft.length < 50) extracted.foodType = ft;
  }

  // Breed Size
  const bsMatch = allText.match(new RegExp(`Breed Size:\\s*(.+?)${nextKeyPattern}`, "i"));
  if (bsMatch) {
    const bs = bsMatch[1].trim().replace(/[,.\s]+$/, "");
    if (bs && bs.length < 80) extracted.breedSize = bs;
  }

  // Life Stage
  const lsMatch = allText.match(new RegExp(`Life Stage:\\s*(.+?)${nextKeyPattern}`, "i"));
  if (lsMatch) {
    const ls = lsMatch[1].trim().replace(/[,.\s]+$/, "");
    if (ls && ls.length < 50) extracted.lifeStage = ls;
  }

  // Flavor
  const flMatch = allText.match(new RegExp(`Flavor:\\s*(.+?)${nextKeyPattern}`, "i"));
  if (flMatch) {
    const fl = flMatch[1].trim().replace(/[,.\s]+$/, "");
    if (fl && fl.length < 80) extracted.flavor = fl;
  }

  // Health Consideration
  const hcMatch = allText.match(new RegExp(`Health Consideration:\\s*(.+?)${nextKeyPattern}`, "i"));
  if (hcMatch) {
    const hc = hcMatch[1].trim().replace(/[,.\s]+$/, "");
    if (hc && hc.length < 200) {
      extracted.healthConsiderations = hc.split(/,\s*/).map(h => h.trim()).filter(Boolean);
    }
  }

  // Nutritional Benefits
  const nbMatch = allText.match(new RegExp(`Nutritional Benefits:\\s*(.+?)${nextKeyPattern}`, "i"));
  if (nbMatch) {
    const nb = nbMatch[1].trim().replace(/[,.\s]+$/, "");
    if (nb && nb.length < 200) {
      extracted.nutritionalOptions = nb.split(/,\s*/).map(n => n.trim()).filter(Boolean);
    }
  }

  return extracted;
}


// ═══════════════════════════════════════════════════════════════════════════════
// APPLY ALL FIXES
// ═══════════════════════════════════════════════════════════════════════════════

for (const p of products) {
  // IMPORTANT: Extract attributes BEFORE cleaning fields (embedded attrs get stripped by cleanup)
  const extracted = extractAttributesFromText(p);

  // Fix 1: Benefits
  const originalBenefits = JSON.stringify(p.benefits);
  p.benefits = fixBenefits(p.benefits);
  if (JSON.stringify(p.benefits) !== originalBenefits) stats.benefitsSplit++;

  // Fix 2: AAFCO
  p.aafco = fixAafco(p);

  // Fix 3: Calorie content
  p.calorieContent = fixCalorieContent(p.calorieContent);

  // Fix 4: Guaranteed Analysis
  p.guaranteedAnalysis = fixGuaranteedAnalysis(p.guaranteedAnalysis);

  // Fix 5: Directions
  p.directions = fixDirections(p.directions);

  // Fix 6: Apply extracted attributes

  if (!p.flavor && extracted.flavor) {
    p.flavor = extracted.flavor;
    stats.flavorExtracted++;
  }
  if (!p.lifeStage && extracted.lifeStage) {
    p.lifeStage = extracted.lifeStage;
    stats.lifeStageExtracted++;
  }
  if (!p.foodType && extracted.foodType) {
    p.foodType = extracted.foodType;
    stats.foodTypeExtracted++;
  }
  if (!p.breedSize && extracted.breedSize) {
    p.breedSize = extracted.breedSize;
    stats.breedSizeExtracted++;
  }
  if ((!p.healthConsiderations || p.healthConsiderations.length === 0) && extracted.healthConsiderations) {
    p.healthConsiderations = extracted.healthConsiderations;
    stats.healthExtracted++;
  }
  if ((!p.nutritionalOptions || p.nutritionalOptions.length === 0) && extracted.nutritionalOptions) {
    p.nutritionalOptions = extracted.nutritionalOptions;
    stats.nutritionalExtracted++;
  }

  // Fallback: parse flavor from product name
  if (!p.flavor) {
    const fromName = extractFlavorFromName(p.name);
    if (fromName) {
      p.flavor = fromName;
      stats.flavorExtracted++;
    }
  }

  // Fallback: parse life stage from product name
  if (!p.lifeStage) {
    const fromName = extractLifeStageFromName(p.name);
    if (fromName) {
      p.lifeStage = fromName;
      stats.lifeStageExtracted++;
    }
  }

  // Fallback: all products in this dataset are dry cat food
  if (!p.foodType) {
    p.foodType = "Dry";
    stats.foodTypeExtracted++;
  }

  // Fix 8: Correct dry food type labels based on product name/description
  const nameLower = (p.name || "").toLowerCase();
  const descLower = (p.description || "").toLowerCase();
  const isBaked = /\bbaked\b/.test(nameLower) || /\bbaked kibble\b/.test(descLower);
  const isFreezeDried = /freeze.?dried|raw boost|raw medley/.test(nameLower);
  const isTopper = /topper|mixer/i.test(nameLower);

  if (["Kibble", "Dry", "Baked", "Semi-Moist", "Kibble, Semi-Moist", "Kibble, Shredded"].includes(p.foodType)) {
    if (isTopper && isFreezeDried) {
      // Freeze-dried toppers/mixers — not kibble at all
      p.foodType = "Freeze-Dried";
    } else if (isBaked && isFreezeDried) {
      // Baked kibble + freeze-dried raw (e.g. Nulo Raw Medley)
      p.foodType = "Baked, Freeze-Dried";
    } else if (isFreezeDried && !isTopper) {
      // Kibble + freeze-dried raw (e.g. Instinct Raw Boost)
      p.foodType = "Kibble, Freeze-Dried";
    } else if (isBaked) {
      // Baked kibble (e.g. Tiki Cat Born Carnivore, Nulo Baked and Coated)
      p.foodType = "Baked";
    } else if (/tender\s*(center|select|and\s*crunch)|shredded\s*blend/i.test(p.name || "")) {
      // Kibble with softer chewy pieces (tender morsels, shredded blend, etc.)
      p.foodType = "Kibble, Tender Blend";
    } else if (p.foodType === "Semi-Moist") {
      // PetSmart "semi-moist" cat foods are all kibble + soft chewy pieces
      p.foodType = "Kibble, Tender Blend";
    }
  }

  // Fix 7: Clean flavor — strip marketing descriptors, weight info, texture words
  if (p.flavor) {
    p.flavor = cleanDryFlavor(p.flavor);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WRITE FIXED DATA
// ═══════════════════════════════════════════════════════════════════════════════

writeFileSync(dataPath, JSON.stringify(products, null, 2));

console.log("\n=== Data Quality Fix Results ===");
console.log(`Benefits re-split:           ${stats.benefitsSplit}`);
console.log(`AAFCO cleared (wrong):       ${stats.aafcoCleared}`);
console.log(`AAFCO extracted from GA:     ${stats.aafcoExtractedFromGA}`);
console.log(`Calorie content cleaned:     ${stats.caloriesCleaned}`);
console.log(`GA cleaned:                  ${stats.gaCleaned}`);
console.log(`Directions cleaned:          ${stats.directionsCleaned}`);
console.log(`Flavor extracted:            ${stats.flavorExtracted}`);
console.log(`Life stage extracted:        ${stats.lifeStageExtracted}`);
console.log(`Food type extracted:         ${stats.foodTypeExtracted}`);
console.log(`Breed size extracted:        ${stats.breedSizeExtracted}`);
console.log(`Health considerations:       ${stats.healthExtracted}`);
console.log(`Nutritional options:         ${stats.nutritionalExtracted}`);

// Verification counts
let noFlavor = 0, noLifeStage = 0, noFoodType = 0, noBreedSize = 0;
let benefitsEmpty = 0, benefitsSingle = 0;
let aafcoReal = 0, aafcoEmpty = 0;
for (const p of products) {
  if (!p.flavor) noFlavor++;
  if (!p.lifeStage) noLifeStage++;
  if (!p.foodType) noFoodType++;
  if (!p.breedSize) noBreedSize++;
  if (!p.benefits || p.benefits.length === 0) benefitsEmpty++;
  else if (p.benefits.length === 1 && p.benefits[0].length > 200) benefitsSingle++;
  if (p.aafco && p.aafco.length > 10) aafcoReal++;
  else aafcoEmpty++;
}

console.log("\n=== After Fix Verification ===");
console.log(`Missing flavor:    ${noFlavor} / ${products.length}`);
console.log(`Missing lifeStage: ${noLifeStage} / ${products.length}`);
console.log(`Missing foodType:  ${noFoodType} / ${products.length}`);
console.log(`Missing breedSize: ${noBreedSize} / ${products.length}`);
console.log(`Benefits empty:    ${benefitsEmpty} / ${products.length}`);
console.log(`Benefits still 1:  ${benefitsSingle} / ${products.length}`);
console.log(`AAFCO populated:   ${aafcoReal} / ${products.length}`);
console.log(`AAFCO empty:       ${aafcoEmpty} / ${products.length}`);

console.log("\nDone! Fixed data written to petsmart-products.json");
