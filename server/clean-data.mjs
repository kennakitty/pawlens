// clean-data.mjs — One-time script to normalize all product data fields
// Usage: node server/clean-data.mjs
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, "data/petsmart-products.json");

const products = JSON.parse(readFileSync(dataPath, "utf-8"));
console.log(`Loaded ${products.length} products`);

// ─── LIFE STAGE NORMALIZATION ────────────────────────────────────────────────
const VALID_LIFE_STAGES = ["Kitten", "Adult", "Senior (7+)", "Senior (11+)", "All Life Stages"];

function normalizeLifeStage(raw) {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();

  // Corrupted — contains ingredient text or long descriptions
  if (s.length > 60) return null;
  if (s.includes("formulated to meet")) return null;

  if (/kitten/i.test(s)) return "Kitten";
  if (/11\+|senior.*11/i.test(s)) return "Senior (11+)";
  if (/7\+|8\+|senior|mature|aging/i.test(s)) return "Senior (7+)";
  if (/adult.*senior|senior.*adult/i.test(s)) return "Senior (7+)";
  if (/all\s*(life)?\s*stage|all\s*stages|all\s*lifes/i.test(s)) return "All Life Stages";
  if (/all$/i.test(s)) return "All Life Stages";
  if (/adult|1-7|1–7|1-10|over 12 months|neutered|sterilised|spayed|pregnant|nursing/i.test(s)) return "Adult";
  if (/hairball/i.test(s)) return "Adult"; // "Hairball" as life stage is a data error

  return null;
}

// ─── FOOD TYPE NORMALIZATION ─────────────────────────────────────────────────
function normalizeFoodType(raw) {
  if (!raw) return "Kibble"; // All are dry food, default to Kibble
  const s = raw.trim().toLowerCase();

  if (/freeze.?dried/i.test(s)) return "Freeze-Dried";
  if (/baked/i.test(s)) return "Baked";
  if (/semi.?moist/i.test(s)) return "Semi-Moist";
  if (/pate/i.test(s)) return "Kibble"; // Pate in dry food data is an error
  // Everything else (Kibble, Crunchy, Dry, Hard, etc.) → Kibble
  return "Kibble";
}

// ─── HEALTH CONSIDERATIONS NORMALIZATION ─────────────────────────────────────
const VALID_HEALTH = new Set([
  "Allergies", "Bladder Health", "Dental Care", "Digestion",
  "Grain-Free", "Hairball", "Healthy Weight", "Heart Health",
  "Hip & Joint", "Indoor", "Kidney Care", "Sensitive Stomach",
  "Spayed/Neutered", "Urinary Health", "Weight Management",
  "Immune Support", "Skin & Coat", "Diabetes", "Eye Health",
  "Muscle Support", "Odor Control", "Thyroid Care"
]);

const HC_MAP = {
  "allergies": "Allergies", "allergy": "Allergies", "food sensitivities": "Allergies",
  "bladder health": "Bladder Health", "flutd": "Bladder Health",
  "dental": "Dental Care", "dental care": "Dental Care", "dental health": "Dental Care", "teeth": "Dental Care",
  "digestion care": "Digestion", "digestive care": "Digestion", "digestive health": "Digestion",
  "gastrointestinal": "Digestion", "indoor digestive health": "Digestion",
  "grain-free": "Grain-Free", "corn free": "Grain-Free", "wheat-free": "Grain-Free", "soy free": "Grain-Free",
  "hairball": "Hairball", "hairball control": "Hairball",
  "healthy weight": "Healthy Weight", "weight": "Healthy Weight", "weight control": "Healthy Weight",
  "weight management": "Weight Management",
  "weight management & urinary": "Weight Management",
  "glucose/weight management": "Weight Management",
  "digestive/weight/glucose management": "Weight Management",
  "heart": "Heart Health", "heart health": "Heart Health", "healthy heart": "Heart Health",
  "hip & joint support": "Hip & Joint", "joints": "Hip & Joint",
  "indoor": "Indoor", "indoor diet": "Indoor",
  "kidney": "Kidney Care", "kidney care": "Kidney Care", "kidney health": "Kidney Care",
  "sensitive stomach": "Sensitive Stomach",
  "spayed/neutered": "Spayed/Neutered", "neutered–sterilised": "Spayed/Neutered",
  "urinary care": "Urinary Health", "urinary tract": "Urinary Health",
  "urinary tract care": "Urinary Health", "urinary tract health": "Urinary Health",
  "mineral balance support": "Urinary Health",
  "immune support": "Immune Support", "immune system": "Immune Support", "healthy immune system": "Immune Support",
  "skin & coat": "Skin & Coat", "skin & coat care": "Skin & Coat",
  "skin & coat health": "Skin & Coat", "skin care": "Skin & Coat",
  "coat": "Skin & Coat", "shiny coat": "Skin & Coat",
  "diabetes": "Diabetes", "persistent hyperglycemia": "Diabetes",
  "eye health": "Eye Health", "eyes": "Eye Health",
  "muscle support": "Muscle Support", "muscle tone": "Muscle Support",
  "odor control": "Odor Control",
  "thyroid care": "Thyroid Care",
};

function normalizeHealthConsiderations(arr, breedSize) {
  const result = new Set();

  // Try to recover from corrupted breedSize (e.g. "Feline|Hairball|Adult")
  if (breedSize && typeof breedSize === "string") {
    breedSize.split("|").forEach(part => {
      const key = part.trim().toLowerCase();
      if (HC_MAP[key]) result.add(HC_MAP[key]);
    });
  }

  if (!Array.isArray(arr)) return [...result];

  for (const raw of arr) {
    if (typeof raw !== "string") continue;
    const s = raw.trim();

    // Skip ingredient names that leaked in
    if (/^(Brewers Rice|Brown Rice|Chicken|Chicken Fat|Chicken Liver|Chicken Meal|Corn Protein|Cracked|Dicalcium|Dried|Egg|Flaxseed|Fructo|Iodized|L-Lysine|Lactic|Oat Fiber|Pea Protein|Potassium|Soybean|Choline)/i.test(s)) continue;
    // Skip corrupted entries with mixed data
    if (s.includes("Flavor:") || s.includes("Weight:") || s.includes("Ingredients:")) continue;
    // Skip multi-category strings that are clearly corrupted
    if (s.length > 80) continue;
    // Skip marketing terms that aren't health categories
    if (/^(Active|Aging|Aging Care|Bone|Brain|Critical|Development|Energy|General Health|Growth|Healthy Energy|Hepatic|Made in|Maintenance|Multi-Protein|Natural|Protein Rich|Real Meat|Tasty|Urgent|Veterinarian)/i.test(s)) continue;

    const key = s.toLowerCase();
    if (HC_MAP[key]) {
      result.add(HC_MAP[key]);
    }
  }

  return [...result].sort();
}

// ─── BREED EXTRACTION ────────────────────────────────────────────────────────
const BREED_PATTERNS = [
  { pattern: /maine coon/i, breed: "Maine Coon" },
  { pattern: /ragdoll/i, breed: "Ragdoll" },
  { pattern: /persian/i, breed: "Persian" },
  { pattern: /bengal/i, breed: "Bengal" },
  { pattern: /siamese/i, breed: "Siamese" },
];

function extractBreed(name) {
  if (!name) return null;
  for (const { pattern, breed } of BREED_PATTERNS) {
    if (pattern.test(name)) return breed;
  }
  return null;
}

// ─── CALORIE CONTENT NORMALIZATION ───────────────────────────────────────────
function normalizeCalorieContent(raw) {
  if (!raw) return null;
  // Extract kcal/kg and kcal/cup patterns
  const kgMatch = raw.match(/([\d,]+)\s*kcal\s*(?:ME\s*)?\/?\s*kg/i);
  const cupMatch = raw.match(/([\d,]+)\s*kcal\s*(?:ME\s*)?\/?\s*cup/i);

  const parts = [];
  if (kgMatch) parts.push(`${kgMatch[1].replace(",", "")} kcal/kg`);
  if (cupMatch) parts.push(`${cupMatch[1].replace(",", "")} kcal/cup`);

  if (parts.length > 0) return parts.join(", ");
  // If no standard pattern, return trimmed original
  return raw.trim();
}

// ─── CLEAN ALL PRODUCTS ──────────────────────────────────────────────────────
let stats = { lifeStageFixed: 0, foodTypeFixed: 0, hcFixed: 0, breedFound: 0, calorieFixed: 0 };

const cleaned = products.map(p => {
  const newLS = normalizeLifeStage(p.lifeStage);
  const newFT = normalizeFoodType(p.foodType);
  const newHC = normalizeHealthConsiderations(p.healthConsiderations, p.breedSize);
  const breed = extractBreed(p.name);
  const newCal = normalizeCalorieContent(p.calorieContent);

  if (newLS !== p.lifeStage) stats.lifeStageFixed++;
  if (newFT !== p.foodType) stats.foodTypeFixed++;
  if (JSON.stringify(newHC) !== JSON.stringify(p.healthConsiderations || [])) stats.hcFixed++;
  if (breed) stats.breedFound++;
  if (newCal !== p.calorieContent) stats.calorieFixed++;

  // Remove breedSize, add breed
  const { breedSize, ...rest } = p;
  return {
    ...rest,
    lifeStage: newLS,
    foodType: newFT,
    healthConsiderations: newHC,
    breed: breed,
    calorieContent: newCal,
  };
});

// ─── WRITE OUTPUT ────────────────────────────────────────────────────────────
writeFileSync(dataPath, JSON.stringify(cleaned, null, 2));

console.log(`\nCleaned ${cleaned.length} products:`);
console.log(`  lifeStage normalized: ${stats.lifeStageFixed}`);
console.log(`  foodType normalized: ${stats.foodTypeFixed}`);
console.log(`  healthConsiderations cleaned: ${stats.hcFixed}`);
console.log(`  breed extracted: ${stats.breedFound}`);
console.log(`  calorieContent normalized: ${stats.calorieFixed}`);

// ─── VERIFY ──────────────────────────────────────────────────────────────────
console.log("\n=== Verification ===");

const lsValues = new Set(cleaned.map(p => p.lifeStage).filter(Boolean));
console.log("lifeStage values:", [...lsValues].sort());
console.log("lifeStage null:", cleaned.filter(p => p.lifeStage === null).length);

const ftValues = new Set(cleaned.map(p => p.foodType));
console.log("foodType values:", [...ftValues].sort());

const allHC = new Set();
cleaned.forEach(p => (p.healthConsiderations || []).forEach(h => allHC.add(h)));
console.log("healthConsiderations values:", [...allHC].sort());
console.log("Products with HC:", cleaned.filter(p => p.healthConsiderations.length > 0).length);

const breeds = new Set(cleaned.map(p => p.breed).filter(Boolean));
console.log("breed values:", [...breeds].sort());
console.log("Breed products:", cleaned.filter(p => p.breed).length);
