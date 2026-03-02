// seed.js — Populate the database with PetSmart product data + reference data
// Usage: npm run seed
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import db, { serializeProduct } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log("Seeding database...");

// ─── DROP AND RECREATE PRODUCTS TABLE (to handle schema changes) ────────────
db.exec("DROP TABLE IF EXISTS products");
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    brand TEXT,
    sku TEXT,
    petsmartUrl TEXT,
    imageUrl TEXT,
    gtin13 TEXT,
    type TEXT DEFAULT 'Dry',
    retailer TEXT DEFAULT 'PetSmart',
    lifeStage TEXT,
    foodType TEXT,
    breedSize TEXT,
    flavor TEXT,
    fullIngredients TEXT,
    guaranteedAnalysis TEXT,
    calorieContent TEXT,
    aafco TEXT,
    nutritionalOptions TEXT,
    healthConsiderations TEXT,
    benefits TEXT,
    description TEXT,
    directions TEXT,
    extraAttributes TEXT,
    transparencyScore REAL,
    concerns TEXT,
    bestFor TEXT,
    avoid TEXT,
    keyFeatures TEXT,
    recallHistory TEXT,
    country TEXT,
    lastUpdated TEXT
  )
`);

// ─── IMPORT REAL PETSMART PRODUCTS ──────────────────────────────────────────
const dataPath = join(__dirname, "data/petsmart-products.json");
const products = JSON.parse(readFileSync(dataPath, "utf-8"));

const insertProduct = db.prepare(`
  INSERT INTO products (
    name, brand, sku, petsmartUrl, imageUrl, gtin13,
    type, retailer, lifeStage, foodType, breedSize, flavor,
    fullIngredients, guaranteedAnalysis, calorieContent, aafco,
    nutritionalOptions, healthConsiderations,
    benefits, description, directions,
    extraAttributes, lastUpdated
  ) VALUES (
    @name, @brand, @sku, @petsmartUrl, @imageUrl, @gtin13,
    @type, @retailer, @lifeStage, @foodType, @breedSize, @flavor,
    @fullIngredients, @guaranteedAnalysis, @calorieContent, @aafco,
    @nutritionalOptions, @healthConsiderations,
    @benefits, @description, @directions,
    @extraAttributes, @lastUpdated
  )
`);

// ─── INGREDIENTS ─────────────────────────────────────────────────────────────
const ingredients = [
  { name: "Chicken By-Product Meal", rating: "caution", category: "Protein", explanation: "Rendered parts of chicken excluding feathers, heads, feet, and entrails. Includes organs, which are actually nutrient-dense.", misleading: "Sounds terrible, but organ meat is nutritious. The issue is inconsistency — quality varies significantly by manufacturer.", healthNotes: "Higher in protein than whole chicken by weight due to moisture removal. Phosphorus content can be concerning for cats with kidney issues." },
  { name: "Corn Gluten Meal", rating: "caution", category: "Protein/Filler", explanation: "A byproduct of corn processing. Used to boost protein percentage cheaply.", misleading: "Often makes protein % look higher than it is with quality animal protein. Corn is not a natural part of a cat's diet.", healthNotes: "Cats are obligate carnivores — plant proteins are less bioavailable. May cause digestive issues in sensitive cats." },
  { name: "Deboned Chicken", rating: "good", category: "Protein", explanation: "Whole chicken muscle meat with bones removed. High-quality, species-appropriate protein source.", misleading: "High moisture content means it may rank lower after cooking (dry weight). Check if a meal is also listed — that's more protein per pound.", healthNotes: "Excellent protein source for cats. Provides essential amino acids including taurine. Best when listed as first ingredient." },
  { name: "Tapioca Starch", rating: "caution", category: "Carbohydrate", explanation: "Derived from cassava root. Used as a grain-free binder and carbohydrate source.", misleading: "Often found in 'grain-free' foods marketed as healthier. High glycemic index — spikes blood sugar like grains do.", healthNotes: "Can contribute to weight gain and blood sugar issues. Particularly problematic for overweight or diabetic cats." },
  { name: "Pea Protein", rating: "caution", category: "Protein/Filler", explanation: "Isolated protein from peas, separate from whole peas in the ingredient list.", misleading: "When listed separately from peas, this is 'ingredient splitting' — it makes grain-free foods appear to have less pea content than they do.", healthNotes: "Plant-based protein less bioavailable than animal protein for cats. Some concern about connection to heart disease (DCM) in grain-free diets." },
  { name: "Salmon", rating: "good", category: "Protein", explanation: "Whole salmon muscle meat. Excellent source of animal protein and omega-3 fatty acids.", misleading: "High water content means it shrinks significantly during cooking. A product with 'salmon' listed first may have very little salmon after processing.", healthNotes: "Rich in EPA and DHA omega-3s — great for joint health, skin/coat, and brain function. Especially beneficial for senior cats." },
  { name: "Chicken Meal", rating: "good", category: "Protein", explanation: "Dried and rendered chicken — most of the moisture removed. Concentrated protein source.", misleading: "The word 'meal' sounds unappetizing but it's actually a more concentrated protein source than whole chicken per pound of food.", healthNotes: "High-quality protein source. Provides more protein per pound than whole chicken. Look for named meals (chicken vs. generic 'poultry')." },
  { name: "Brown Rice", rating: "neutral", category: "Carbohydrate", explanation: "Whole grain rice. Less processed than white rice, retains some fiber and nutrients.", misleading: "Often marketed as a 'healthy' grain, but cats don't actually need grains. It's not harmful but adds carbs cats wouldn't eat naturally.", healthNotes: "Digestible carbohydrate source. Better than corn or wheat for most cats. Not ideal for diabetic or overweight cats." },
  { name: "Sweet Potato", rating: "neutral", category: "Carbohydrate", explanation: "Whole food carbohydrate source. Used as a grain-free alternative.", misleading: "Often seen as 'healthy' in grain-free foods, but it's still a carbohydrate cats don't need. Better than corn, but still adds unnecessary carbs.", healthNotes: "Good source of fiber and vitamins. Lower glycemic than white potato. Better choice than tapioca starch for grain-free formulas." },
  { name: "Whole Peas / Split Peas / Lentils", rating: "caution", category: "Carbohydrate", explanation: "Legumes used as carbohydrate sources and protein boosters in grain-free foods.", misleading: "Manufacturers often list peas, pea protein, split peas, and pea flour separately — hiding how much total legume is in the food.", healthNotes: "Some studies link high legume content in grain-free diets to dilated cardiomyopathy (DCM) in dogs. Evidence in cats is less clear but worth monitoring." },
  { name: "Ground Flaxseed", rating: "good", category: "Fat", explanation: "Plant-based source of omega-3 fatty acids (ALA) and fiber.", misleading: "Cats cannot efficiently convert ALA to DHA/EPA like humans can. Less beneficial than fish-derived omega-3s for cats.", healthNotes: "Adds fiber and some omega-3s, though not as effective for cats as marine sources. Better than no omega-3s." },
  { name: "Glucosamine / Chondroitin", rating: "good", category: "Supplement", explanation: "Joint support compounds found naturally in cartilage. Added to senior and mobility-focused foods.", misleading: "Amounts added to food are often lower than therapeutic doses. May not provide full joint benefit without additional supplementation.", healthNotes: "Beneficial for cats with arthritis or mobility issues. Look for foods that list specific mg amounts. Especially important for overweight or senior cats." },
  { name: "Green-Lipped Mussel", rating: "good", category: "Supplement", explanation: "New Zealand shellfish rich in omega-3s, glucosamine, and chondroitin. Premium joint and anti-inflammatory supplement.", misleading: "Rare in cat food but very effective. Often found in premium senior formulas.", healthNotes: "Excellent natural source of joint support compounds. Contains unique ETA fatty acids not found in fish oil. Great for mobility issues." },
  { name: "L-Carnitine", rating: "good", category: "Supplement", explanation: "An amino acid that helps the body convert fat into energy. Added to weight management and senior formulas.", misleading: "Some foods add it as a marketing point even in amounts too small to be effective.", healthNotes: "Beneficial for weight management and muscle maintenance. Particularly useful for overweight cats on a calorie-restricted diet." },
  { name: "Animal Fat (Generic)", rating: "poor", category: "Fat", explanation: "Fat from unspecified animal sources. Could be from any animal, quality and source unknown.", misleading: "Deliberately vague. Named fats (chicken fat, salmon oil) are preferable — you know what you're getting.", healthNotes: "Not harmful per se, but ingredient quality is unknown and can vary between batches. Look for named fat sources instead." },
  { name: "BHA / BHT / Ethoxyquin", rating: "poor", category: "Preservative", explanation: "Synthetic preservatives used to prevent fat from going rancid. BHA and BHT are approved by FDA; Ethoxyquin is more controversial.", misleading: "Often hidden or listed without context. Some manufacturers use them in ingredients (like fish meal) without disclosing on the label.", healthNotes: "BHA is classified as a possible human carcinogen. Ethoxyquin is banned in human food in the EU. Safer alternatives: mixed tocopherols, ascorbic acid." }
];

// ─── RED FLAGS ────────────────────────────────────────────────────────────────
const redFlags = [
  { title: "Unnamed Protein Sources", severity: "high", description: "Generic terms like 'meat meal,' 'poultry by-product meal,' or 'animal fat' hide what animal the ingredient came from. Quality and consistency are unknown.", whatToLookFor: "Always choose foods with named protein sources: 'chicken meal,' 'salmon,' 'turkey.' If it doesn't say the animal, the manufacturer is hiding something." },
  { title: "Ingredient Splitting", severity: "high", description: "Manufacturers list the same ingredient multiple ways to make it appear lower on the ingredient list. Example: listing 'peas,' 'pea protein,' 'pea flour,' and 'pea fiber' separately — combined, peas might be the #1 ingredient.", whatToLookFor: "Count up all forms of corn (corn, corn gluten meal, whole grain corn), all pea products, and all grain variants. Combined totals reveal the real picture." },
  { title: "'Natural' Label Claim", severity: "medium", description: "The word 'natural' on pet food is largely unregulated. AAFCO allows 'natural' claims even when synthetic vitamins and minerals are added.", whatToLookFor: "Ignore 'natural' on packaging. Read the actual ingredient list instead. Look for whole food ingredients you can recognize." },
  { title: "All Life Stages for Senior Cats", severity: "medium", description: "'All life stages' formulas must meet the minimum requirements for kittens — which means higher phosphorus levels. Senior cats with kidney disease need lower phosphorus.", whatToLookFor: "Senior cats (especially 10+) benefit from food specifically formulated for adults or seniors. Ask your vet about phosphorus levels if kidney health is a concern." },
  { title: "Misleading Front-of-Package Claims", severity: "high", description: "Phrases like 'real chicken recipe,' 'salmon flavor,' or 'with beef' have specific legal meanings that may surprise you. 'With beef' only requires 3% beef content.", whatToLookFor: "Rules: 95% rule (just 'Chicken Cat Food'), 25% rule ('Chicken Dinner/Entree'), 3% rule ('with Chicken'), Flavor rule ('Chicken Flavor' — any detectable amount). Check the actual ingredient list." },
  { title: "Artificial Colors", severity: "medium", description: "Artificial colors like Red 40, Yellow 5, and Blue 2 serve no nutritional purpose — they're added to appeal to owners, not cats. Cats are partially color-blind.", whatToLookFor: "Cats don't care what color their food is. Artificial colors are a red flag that the manufacturer is more focused on visual appeal than nutrition quality." },
  { title: "Grain-Free Does Not Equal Healthier", severity: "medium", description: "Grain-free foods often replace grains with high-glycemic starches (tapioca, potato) or legumes (peas, lentils). These can spike blood sugar and may be linked to heart issues.", whatToLookFor: "Compare the carbohydrate sources, not just whether it's grain-free. Tapioca starch is just as problematic as corn for overweight or diabetic cats. Focus on protein quality instead." },
  { title: "Vague Recall History", severity: "high", description: "Some brands have had significant recalls for contamination, excess vitamins, or foreign materials — issues that indicate quality control problems at the manufacturer.", whatToLookFor: "Search '[brand name] recall' before buying. Check FDA's pet food recall database. A single recall isn't necessarily disqualifying, but patterns of recalls are a serious red flag." }
];

// ─── INSERT DATA ──────────────────────────────────────────────────────────────
const insertIngredient = db.prepare(`
  INSERT OR IGNORE INTO ingredients (name, rating, category, explanation, misleading, healthNotes)
  VALUES (@name, @rating, @category, @explanation, @misleading, @healthNotes)
`);

const insertRedFlag = db.prepare(`
  INSERT OR IGNORE INTO red_flags (title, severity, description, whatToLookFor)
  VALUES (@title, @severity, @description, @whatToLookFor)
`);

db.exec("BEGIN");

// Import real PetSmart products
for (const p of products) {
  insertProduct.run(serializeProduct({
    name: p.name || "Unknown",
    brand: p.brand || null,
    sku: p.sku || null,
    petsmartUrl: p.productURL || null,
    imageUrl: p.imageUrl || null,
    gtin13: p.gtin13 || null,
    type: "Dry",
    retailer: "PetSmart",
    lifeStage: p.lifeStage || null,
    foodType: p.foodType || null,
    breedSize: p.breedSize || null,
    flavor: p.flavor || null,
    fullIngredients: p.fullIngredients || null,
    guaranteedAnalysis: p.guaranteedAnalysis || null,
    calorieContent: p.calorieContent || null,
    aafco: p.aafco || null,
    nutritionalOptions: p.nutritionalOptions || [],
    healthConsiderations: p.healthConsiderations || [],
    benefits: p.benefits || [],
    description: p.description || null,
    directions: p.directions || null,
    extraAttributes: p.extraAttributes || {},
    lastUpdated: p.lastUpdated || new Date().toISOString(),
  }));
}

// Seed reference data
db.exec("DELETE FROM ingredients");
db.exec("DELETE FROM red_flags");
for (const i of ingredients) insertIngredient.run(i);
for (const f of redFlags) insertRedFlag.run(f);

db.exec("COMMIT");

console.log(`Seeded ${products.length} products (real PetSmart data)`);
console.log(`Seeded ${ingredients.length} ingredients`);
console.log(`Seeded ${redFlags.length} red flags`);
console.log("Database ready!");
