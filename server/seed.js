// seed.js — Populate the database with PetSmart product data + reference data
// Safe for redeploys: only seeds tables that are empty, never wipes existing data
// Usage: npm run seed
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import db, { serializeProduct } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── SCORING FUNCTION (declared early so fixups can use it) ──────────────────
const GOOD_FIRST = ["chicken","turkey","salmon","tuna","duck","lamb","venison","rabbit","trout","whitefish","herring","pollock","deboned","fish","beef","pork"];
const SCORE_RED_FLAGS = ["by-product","by product","corn gluten meal","soybean meal","animal fat","meat and bone meal","animal digest","artificial","bha","bht","ethoxyquin","propylene glycol","food coloring","red 40","yellow 5","yellow 6","blue 2","caramel color","menadione","sodium bisulfite"];
const FILLERS = ["ground yellow corn","corn","wheat","soy flour","brewers rice","wheat flour","corn starch","tapioca starch","powdered cellulose"];
const WET_FILLERS = ["water sufficient for processing","modified corn starch","modified tapioca starch"];
const PREMIUM = ["deboned","fresh","raw","freeze-dried","whole","organic","wild-caught","free-range","cage-free","probiotics","prebiotics","l-carnitine","glucosamine","chondroitin","taurine","omega"];

function scoreProduct(p) {
  let s = 50;
  const ing = (p.fullIngredients || "").toLowerCase();
  const ga = (p.guaranteedAnalysis || "").toLowerCase();
  const aafco = (p.aafco || "").toLowerCase();
  const nutrOpts = JSON.parse(p.nutritionalOptions || "[]");
  const isWet = (p.type || "").toLowerCase() === "wet";
  const fillers = isWet ? [...FILLERS, ...WET_FILLERS] : FILLERS;

  const first = ing.split(",")[0] || "";
  if (GOOD_FIRST.some(g => first.includes(g))) s += 15;
  else if (fillers.some(f => first.includes(f))) s -= 10;
  let rf = 0; for (const f of SCORE_RED_FLAGS) { if (ing.includes(f)) rf++; } s -= Math.min(rf * 5, 20);
  let fc = 0; for (const f of fillers) { if (ing.includes(f)) fc++; } s -= Math.min(fc * 3, 10);
  let pc = 0; for (const sig of PREMIUM) { if (ing.includes(sig)) pc++; } s += Math.min(pc * 3, 15);
  if (ing.length > 50) s += 2; if (ga.length > 30) s += 2; if (aafco.length > 10) s += 2;
  if (p.calorieContent) s += 2; if (p.description) s += 2;
  const noFiller = ["No Corn","No Wheat","No Soy","Grain Free","Gluten Free"];
  let nc = 0; for (const c of noFiller) { if (nutrOpts.includes(c)) nc++; } s += Math.min(nc * 2, 10);

  // Protein thresholds differ for wet vs dry
  const pm = ga.match(/protein.*?(\d+\.?\d*)%/);
  if (pm) {
    const pv = parseFloat(pm[1]);
    if (isWet) {
      if (pv >= 12) s += 5; else if (pv >= 10) s += 3; else if (pv >= 8) s += 1;
    } else {
      if (pv >= 40) s += 5; else if (pv >= 35) s += 3; else if (pv >= 30) s += 1;
    }
  }
  return Math.max(0, Math.min(100, Math.round(s)));
}

function scoreUnscoredProducts() {
  const allProducts = db.prepare("SELECT * FROM products WHERE transparencyScore IS NULL").all();
  if (allProducts.length === 0) return;
  const updateScore = db.prepare("UPDATE products SET transparencyScore = ? WHERE id = ?");
  db.exec("BEGIN");
  for (const p of allProducts) updateScore.run(scoreProduct(p), p.id);
  db.exec("COMMIT");
  console.log(`Scored ${allProducts.length} products`);
}

console.log("Checking database...");

// ─── CHECK IF TABLES ALREADY HAVE DATA ──────────────────────────────────────
const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get().count;
const ingredientCount = db.prepare("SELECT COUNT(*) as count FROM ingredients").get().count;
const redFlagCount = db.prepare("SELECT COUNT(*) as count FROM red_flags").get().count;

if (productCount > 0 && ingredientCount > 0 && redFlagCount > 0) {
  console.log(`Database already seeded (${productCount} products, ${ingredientCount} ingredients, ${redFlagCount} red flags). Running fixups only...`);

  // ─── Always-run fixups ──────────────────────────────────────────────────────
  // Senior life stage corrections
  const seniorFixNames = ["11+", "12+"];
  for (const tag of seniorFixNames) {
    db.prepare("UPDATE products SET lifeStage = 'Senior (11+)' WHERE name LIKE ? AND lifeStage = 'Senior (7+)'")
      .run(`%${tag}%`);
  }
  db.prepare("UPDATE products SET lifeStage = 'Senior (7+)' WHERE lifeStage = 'Adult' AND name LIKE '%Senior%' AND name NOT LIKE '%11+%'").run();
  db.prepare("UPDATE products SET lifeStage = 'Senior (11+)' WHERE lifeStage = 'Adult' AND name LIKE '%Senior%' AND name LIKE '%11+%'").run();

  // Ingredient rating upgrades (great tier)
  const greatIngredients = [
    "Deboned Chicken", "Turkey", "Chicken Fat", "Fish Oil", "Taurine", "Green-Lipped Mussel"
  ];
  for (const name of greatIngredients) {
    db.prepare("UPDATE ingredients SET rating = 'great' WHERE name = ? AND rating = 'good'").run(name);
  }
  // Downgrade back to good (in case previously set to great)
  const goodIngredients = ["Chicken Meal", "Turkey Meal", "Salmon", "Rabbit", "Venison"];
  for (const name of goodIngredients) {
    db.prepare("UPDATE ingredients SET rating = 'good' WHERE name = ? AND rating = 'great'").run(name);
  }

  // ─── Wet product seeding (check separately from dry) ─────────────────────
  const wetCount = db.prepare("SELECT COUNT(*) as count FROM products WHERE type = 'Wet'").get().count;
  if (wetCount === 0) {
    const wetPath = join(__dirname, "data/petsmart-wet-products.json");
    try {
      const wetProducts = JSON.parse(readFileSync(wetPath, "utf-8"));
      const insertProduct = db.prepare(`
        INSERT INTO products (
          name, brand, sku, petsmartUrl, imageUrl, gtin13,
          type, retailer, lifeStage, foodType, breed, flavor,
          fullIngredients, guaranteedAnalysis, calorieContent, aafco,
          nutritionalOptions, healthConsiderations,
          benefits, description, directions,
          extraAttributes, lastUpdated
        ) VALUES (
          @name, @brand, @sku, @petsmartUrl, @imageUrl, @gtin13,
          @type, @retailer, @lifeStage, @foodType, @breed, @flavor,
          @fullIngredients, @guaranteedAnalysis, @calorieContent, @aafco,
          @nutritionalOptions, @healthConsiderations,
          @benefits, @description, @directions,
          @extraAttributes, @lastUpdated
        )
      `);
      db.exec("BEGIN");
      for (const p of wetProducts) {
        insertProduct.run(serializeProduct({
          name: p.name || "Unknown",
          brand: p.brand || null,
          sku: p.sku || null,
          petsmartUrl: p.productURL || null,
          imageUrl: p.imageUrl || null,
          gtin13: p.gtin13 || null,
          type: "Wet",
          retailer: "PetSmart",
          lifeStage: p.lifeStage || null,
          foodType: p.foodType || null,
          breed: p.breed || null,
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
      db.exec("COMMIT");
      console.log(`Seeded ${wetProducts.length} wet food products`);

      // Score wet products
      scoreUnscoredProducts();
    } catch (e) {
      if (e.code === "ENOENT") {
        console.log("No wet food data file found (petsmart-wet-products.json). Skipping wet products.");
      } else throw e;
    }
  }

  // ─── Wet-specific ingredients (add if missing) ──────────────────────────────
  const wetIngredients = [
    { name: "Chicken Broth", rating: "good", category: "Additive", explanation: "Liquid made by simmering chicken. Adds moisture and flavor to wet food. A quality moisture source.", misleading: "Sounds wholesome, but can be used to dilute meat content. Check that actual meat is still listed first.", healthNotes: "Good hydration source. Provides some protein and minerals. Better than plain water as a moisture source in wet food.", appliesTo: "wet" },
    { name: "Meat Broth", rating: "neutral", category: "Additive", explanation: "Generic broth from unspecified meat sources. Adds moisture and flavor.", misleading: "The lack of specificity is the issue — 'meat broth' doesn't tell you what animal it came from.", healthNotes: "Safe but vague. Named broths (chicken broth, beef broth) are preferable for transparency.", appliesTo: "wet" },
    { name: "Fish Broth", rating: "good", category: "Additive", explanation: "Broth made from fish. Provides moisture, omega-3 fatty acids, and flavor cats love.", misleading: "Like 'fish meal,' the species is unspecified. Named fish broths are better.", healthNotes: "Good source of hydration and flavor. May provide some omega-3 benefits. Cats generally love fish-flavored moisture.", appliesTo: "wet" },
    { name: "Xanthan Gum", rating: "neutral", category: "Additive", explanation: "A polysaccharide used as a thickener and stabilizer. Produced by bacterial fermentation.", misleading: "Sounds chemical but it's a common food additive used in human food too. Helps maintain texture in wet food.", healthNotes: "Generally safe in small amounts. Provides no nutritional value. Used purely for texture.", appliesTo: "wet" },
    { name: "Cassia Gum", rating: "neutral", category: "Additive", explanation: "A thickener derived from cassia plant seeds. Used to create gel-like texture in wet food.", misleading: "Less common than guar gum but serves the same purpose. Not harmful in typical amounts.", healthNotes: "Safe food additive. No significant nutritional value. Purely functional for texture.", appliesTo: "wet" },
    { name: "Agar-Agar", rating: "neutral", category: "Additive", explanation: "A gelatin substitute derived from seaweed. Used as a gelling agent in wet cat food.", misleading: "Natural seaweed product, generally considered safe. Better alternative to carrageenan.", healthNotes: "Safe and well-tolerated. Unlike carrageenan (also from seaweed), agar-agar has no inflammation concerns.", appliesTo: "wet" },
    { name: "Modified Corn Starch", rating: "caution", category: "Carbohydrate", explanation: "Chemically or physically altered corn starch used as a thickener in wet food.", misleading: "The 'modified' part sounds scary but it just means the starch structure was changed for better thickening. Still unnecessary carbs for cats.", healthNotes: "Adds carbohydrate load without nutritional benefit. Used to create gravy texture cheaply.", appliesTo: "wet" },
    { name: "Sodium Tripolyphosphate", rating: "neutral", category: "Additive", explanation: "A phosphate compound used as an emulsifier and to help retain moisture in wet food.", misleading: "Sounds like an industrial chemical, but it's commonly used in food processing. Small amounts are not harmful.", healthNotes: "Generally safe at typical levels. High phosphorus content may be a concern for cats with kidney issues.", appliesTo: "wet" },
    { name: "Titanium Dioxide", rating: "poor", category: "Additive", explanation: "A white pigment used solely for color. Makes wet food appear whiter or more uniform in appearance.", misleading: "Has zero nutritional value — purely cosmetic. Your cat doesn't care what color their food is.", healthNotes: "Banned as a food additive in the EU since 2022 due to potential genotoxicity concerns. Still allowed in US pet food. Avoid if possible.", appliesTo: "wet" },
  ];
  const insertWetIng = db.prepare(`
    INSERT OR IGNORE INTO ingredients (name, rating, category, explanation, misleading, healthNotes, appliesTo)
    VALUES (@name, @rating, @category, @explanation, @misleading, @healthNotes, @appliesTo)
  `);
  for (const i of wetIngredients) insertWetIng.run(i);

  // Update carrageenan to wet-specific
  db.prepare("UPDATE ingredients SET appliesTo = 'wet' WHERE name = 'Carrageenan' AND appliesTo = 'both'").run();

  // ─── Wet-specific red flags (add if missing) ────────────────────────────────
  const wetRedFlags = [
    { title: "BPA / Epoxy Can Linings", severity: "medium", category: "Hidden Health Concerns", description: "Many canned cat foods use BPA-based epoxy linings inside the can. BPA is an endocrine disruptor linked to health issues in humans and animals.", whatToLookFor: "Look for brands that specifically state 'BPA-free cans' or 'BPA-NI (non-intent)' linings. Most manufacturers don't disclose this — you may need to contact them directly.", appliesTo: "wet" },
    { title: "Gravy Masking Low Meat Content", severity: "high", category: "Ingredient Deception", description: "Heavy gravy, broth, or sauce can dilute the actual meat content significantly. A food that looks meaty may be mostly water and thickeners with a small amount of protein.", whatToLookFor: "Check if water or broth is the first ingredient — that means the food is mostly liquid. Look for foods where a named meat is #1. Compare protein percentages on a dry-matter basis.", appliesTo: "wet" },
    { title: "Misleading Protein % Due to Moisture", severity: "medium", category: "Hidden Health Concerns", description: "Wet food typically shows 8-12% protein on the label because it's 75-82% water. This makes it impossible to compare directly with dry food (which shows 30-40% protein). You need to calculate dry-matter basis.", whatToLookFor: "To compare: divide protein% by (100 - moisture%). Example: 10% protein with 78% moisture = 10/(100-78) = 45% protein on dry-matter basis. Many wet foods are actually higher protein than dry when compared fairly.", appliesTo: "wet" },
    { title: "Thickener-Heavy Formulas", severity: "medium", category: "Hidden Health Concerns", description: "Some wet foods rely heavily on gums, starches, and thickeners (carrageenan, xanthan gum, guar gum, modified starch) to create appealing texture while using less actual meat.", whatToLookFor: "Count the number of thickeners in the ingredient list. One is normal. Three or more thickeners suggest the manufacturer is compensating for low meat content with texture engineering.", appliesTo: "wet" },
  ];
  const insertWetRF = db.prepare(`
    INSERT OR IGNORE INTO red_flags (title, severity, category, description, whatToLookFor, appliesTo)
    VALUES (@title, @severity, @category, @description, @whatToLookFor, @appliesTo)
  `);
  for (const f of wetRedFlags) insertWetRF.run(f);

  console.log("Fixups applied. Database ready!");
  process.exit(0);
}

console.log("Seeding database...");

// ─── PRODUCTS ────────────────────────────────────────────────────────────────
if (productCount === 0) {
  const dataPath = join(__dirname, "data/petsmart-products.json");
  const products = JSON.parse(readFileSync(dataPath, "utf-8"));

  const insertProduct = db.prepare(`
    INSERT INTO products (
      name, brand, sku, petsmartUrl, imageUrl, gtin13,
      type, retailer, lifeStage, foodType, breed, flavor,
      fullIngredients, guaranteedAnalysis, calorieContent, aafco,
      nutritionalOptions, healthConsiderations,
      benefits, description, directions,
      extraAttributes, lastUpdated
    ) VALUES (
      @name, @brand, @sku, @petsmartUrl, @imageUrl, @gtin13,
      @type, @retailer, @lifeStage, @foodType, @breed, @flavor,
      @fullIngredients, @guaranteedAnalysis, @calorieContent, @aafco,
      @nutritionalOptions, @healthConsiderations,
      @benefits, @description, @directions,
      @extraAttributes, @lastUpdated
    )
  `);

  db.exec("BEGIN");
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
      breed: p.breed || null,
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
  db.exec("COMMIT");
  console.log(`Seeded ${products.length} products`);
} else {
  console.log(`Products already exist (${productCount}). Skipping.`);
}

// ─── INGREDIENTS ─────────────────────────────────────────────────────────────
if (ingredientCount === 0) {
  const ingredients = [
    // ─── PROTEINS ──────────────────────────────────────────────────────────────
    { name: "Deboned Chicken", rating: "great", category: "Protein", explanation: "Whole chicken muscle meat with bones removed. High-quality, species-appropriate protein source.", misleading: "High moisture content means it may rank lower after cooking (dry weight). Check if a meal is also listed — that's more protein per pound.", healthNotes: "Excellent protein source for cats. Provides essential amino acids including taurine. Best when listed as first ingredient." },
    { name: "Chicken Meal", rating: "good", category: "Protein", explanation: "Dried and rendered chicken — most of the moisture removed. Concentrated protein source.", misleading: "The word 'meal' sounds unappetizing but it's actually a more concentrated protein source than whole chicken per pound of food.", healthNotes: "High-quality protein source. Provides more protein per pound than whole chicken. Look for named meals (chicken vs. generic 'poultry')." },
    { name: "Chicken By-Product Meal", rating: "caution", category: "Protein", explanation: "Rendered parts of chicken excluding feathers, heads, feet, and entrails. Includes organs, which are actually nutrient-dense.", misleading: "Sounds terrible, but organ meat is nutritious. The issue is inconsistency — quality varies significantly by manufacturer.", healthNotes: "Higher in protein than whole chicken by weight due to moisture removal. Phosphorus content can be concerning for cats with kidney issues." },
    { name: "Salmon", rating: "good", category: "Protein", explanation: "Whole salmon muscle meat. Excellent source of animal protein and omega-3 fatty acids.", misleading: "High water content means it shrinks significantly during cooking. A product with 'salmon' listed first may have very little salmon after processing.", healthNotes: "Rich in EPA and DHA omega-3s — great for joint health, skin/coat, and brain function. Especially beneficial for senior cats." },
    { name: "Turkey", rating: "great", category: "Protein", explanation: "Whole turkey muscle meat. Lean, high-quality protein that many cats tolerate well.", misleading: "Like chicken, the high water content means it shrinks after cooking. Look for turkey meal nearby in the list for more concentrated protein.", healthNotes: "Slightly leaner than chicken. Good alternative protein for cats with chicken sensitivities. Rich in B vitamins and selenium." },
    { name: "Turkey Meal", rating: "good", category: "Protein", explanation: "Dried and rendered turkey with moisture removed. Concentrated protein source similar to chicken meal.", misleading: "Same 'meal' stigma as chicken meal, but it's actually a quality concentrated protein. Better than whole turkey by dry weight.", healthNotes: "Excellent concentrated protein. Good rotation option for variety. Named meals are always better than generic 'poultry meal.'" },
    { name: "Duck", rating: "good", category: "Protein", explanation: "Whole duck meat. Novel protein that works well for cats with common protein allergies.", misleading: "Premium-sounding but losing its 'novel' status as more foods include it. High moisture means less protein by dry weight.", healthNotes: "Good for cats with chicken or fish sensitivities. Higher in fat than chicken or turkey. Rich in iron and B vitamins." },
    { name: "Lamb Meal", rating: "good", category: "Protein", explanation: "Dried and rendered lamb. Less common in cat food but a solid named protein source.", misleading: "Sometimes marketed as exotic or premium when it's a standard livestock protein. Quality varies — look for 'lamb meal' not 'lamb by-product meal.'", healthNotes: "Good alternative protein source. Higher in fat than poultry meals. Can be useful for cats needing protein rotation." },
    { name: "Whitefish", rating: "good", category: "Protein", explanation: "A general term for white-fleshed ocean fish like cod, haddock, or pollock. Lean protein with omega-3s.", misleading: "The term 'whitefish' is vague — it could be different species in each batch. Not as precise as 'cod' or 'pollock' but still a named category.", healthNotes: "Good source of protein and omega-3 fatty acids. Lean protein option. Some cats with fish allergies may still react to whitefish." },
    { name: "Fish Meal", rating: "neutral", category: "Protein", explanation: "Dried and ground whole fish or fish parts. Concentrated protein and omega-3 source.", misleading: "Generic 'fish meal' doesn't tell you which fish species. Could contain varying species between batches. Named fish meals (salmon meal, herring meal) are preferable.", healthNotes: "Good protein and omega-3 source, but the vagueness is a concern. May contain higher levels of heavy metals depending on fish species used." },
    { name: "Rabbit", rating: "good", category: "Protein", explanation: "A truly novel protein for most cats. Rarely used in commercial cat food, making it ideal for elimination diets.", misleading: "Premium pricing is partly justified — rabbit is genuinely less common and good for allergy testing. But it's not inherently 'better' than chicken.", healthNotes: "Excellent for food sensitivity testing because most cats have never eaten it. Lean, highly digestible protein. Good for cats that react to poultry and fish." },
    { name: "Venison", rating: "good", category: "Protein", explanation: "Deer meat. Another novel protein source rarely found in standard cat foods.", misleading: "Very premium positioning but genuine value for cats needing protein rotation or allergy elimination diets.", healthNotes: "Lean and highly digestible. Truly novel for most cats. Good option for elimination diets. Higher in iron than poultry." },
    { name: "Dried Egg Product", rating: "good", category: "Protein", explanation: "Dehydrated whole eggs or egg components. Highly digestible protein source with a complete amino acid profile.", misleading: "Found in ~80 products in our database. 'Product' sounds processed but eggs are one of the most bioavailable proteins for cats.", healthNotes: "One of the most digestible protein sources available. Complete amino acid profile. Good supplementary protein alongside meat sources." },
    { name: "Soybean Meal", rating: "caution", category: "Protein/Filler", explanation: "Ground soybeans after oil extraction. Used as a cheap plant protein to boost overall protein percentage.", misleading: "Inflates protein numbers on the label, but plant protein is far less useful to cats than animal protein. Often found in budget foods.", healthNotes: "Cats cannot utilize soy protein as efficiently as animal protein. May cause gas or digestive upset. Some cats are allergic to soy." },
    { name: "Wheat Gluten", rating: "caution", category: "Protein/Filler", explanation: "The protein portion of wheat. Used as a binder and to boost protein percentages cheaply.", misleading: "Can make a food's protein percentage look impressive while contributing mostly plant-based protein cats can't use as well.", healthNotes: "Not species-appropriate for obligate carnivores. Some cats develop wheat sensitivities. Adds carbohydrate load alongside the protein." },
    // ─── CARBOHYDRATES ─────────────────────────────────────────────────────────
    { name: "Corn Gluten Meal", rating: "caution", category: "Protein/Filler", explanation: "A byproduct of corn processing. Used to boost protein percentage cheaply.", misleading: "Often makes protein % look higher than it is with quality animal protein. Corn is not a natural part of a cat's diet.", healthNotes: "Cats are obligate carnivores — plant proteins are less bioavailable. May cause digestive issues in sensitive cats." },
    { name: "Brewers Rice", rating: "neutral", category: "Carbohydrate", explanation: "Small fragments of rice left over from milling. A processed grain by-product used as a cheap filler.", misleading: "It's literally broken rice pieces — the scraps. Still digestible, but it's the lowest quality form of rice in pet food.", healthNotes: "Highly digestible carbohydrate but low in nutrients. Found in about 89 products in our database. Not harmful, just not adding much value." },
    { name: "Brown Rice", rating: "neutral", category: "Carbohydrate", explanation: "Whole grain rice. Less processed than white rice, retains some fiber and nutrients.", misleading: "Often marketed as a 'healthy' grain, but cats don't actually need grains. It's not harmful but adds carbs cats wouldn't eat naturally.", healthNotes: "Digestible carbohydrate source. Better than corn or wheat for most cats. Not ideal for diabetic or overweight cats." },
    { name: "Tapioca Starch", rating: "caution", category: "Carbohydrate", explanation: "Derived from cassava root. Used as a grain-free binder and carbohydrate source.", misleading: "Often found in 'grain-free' foods marketed as healthier. High glycemic index — spikes blood sugar like grains do.", healthNotes: "Can contribute to weight gain and blood sugar issues. Particularly problematic for overweight or diabetic cats." },
    { name: "Sweet Potato", rating: "neutral", category: "Carbohydrate", explanation: "Whole food carbohydrate source. Used as a grain-free alternative.", misleading: "Often seen as 'healthy' in grain-free foods, but it's still a carbohydrate cats don't need. Better than corn, but still adds unnecessary carbs.", healthNotes: "Good source of fiber and vitamins. Lower glycemic than white potato. Better choice than tapioca starch for grain-free formulas." },
    { name: "Whole Peas / Split Peas / Lentils", rating: "caution", category: "Carbohydrate", explanation: "Legumes used as carbohydrate sources and protein boosters in grain-free foods.", misleading: "Manufacturers often list peas, pea protein, split peas, and pea flour separately — hiding how much total legume is in the food.", healthNotes: "Some studies link high legume content in grain-free diets to dilated cardiomyopathy (DCM) in dogs. Evidence in cats is less clear but worth monitoring." },
    { name: "Pea Protein", rating: "caution", category: "Protein/Filler", explanation: "Isolated protein from peas, separate from whole peas in the ingredient list.", misleading: "When listed separately from peas, this is 'ingredient splitting' — it makes grain-free foods appear to have less pea content than they do.", healthNotes: "Plant-based protein less bioavailable than animal protein for cats. Some concern about connection to heart disease (DCM) in grain-free diets." },
    { name: "Powdered Cellulose", rating: "caution", category: "Fiber", explanation: "Essentially wood pulp fiber. Added to increase fiber content, particularly in weight management and hairball formulas.", misleading: "Sounds alarming — it's literally processed plant cell walls. It does work as fiber, but it has zero nutritional value beyond that.", healthNotes: "Adds bulk to make cats feel full on fewer calories. Found in about 59 products. Useful for weight management but shouldn't be a primary fiber source." },
    { name: "Dried Plain Beet Pulp", rating: "neutral", category: "Fiber", explanation: "The fibrous material left after sugar is extracted from beets. A moderate, well-tolerated fiber source.", misleading: "Not a sugar source despite coming from sugar beets — the sugar has been removed. Good prebiotic fiber source.", healthNotes: "Provides both soluble and insoluble fiber. Feeds beneficial gut bacteria. Found in about 61 products. Generally well-tolerated by cats." },
    { name: "Oat Fiber", rating: "neutral", category: "Fiber", explanation: "Fiber derived from oat hulls. A gentle, natural source of insoluble fiber.", misleading: "Sounds wholesome, which it mostly is. But 'oat fiber' is different from 'oatmeal' — it's the hull, not the nutrient-rich grain.", healthNotes: "Good source of insoluble fiber for digestive regularity. Gentler than cellulose. Helps with hairball management." },
    { name: "Dried Chicory Root", rating: "good", category: "Fiber", explanation: "A natural source of inulin, a prebiotic fiber that feeds beneficial gut bacteria.", misleading: "Genuinely beneficial prebiotic. Sometimes listed as 'chicory root extract' or 'inulin.' Used in about 60 products in our database.", healthNotes: "Supports healthy gut microbiome. Prebiotic fiber helps with digestion and nutrient absorption. One of the better fiber additives in cat food." },
    // ─── FATS ──────────────────────────────────────────────────────────────────
    { name: "Chicken Fat", rating: "great", category: "Fat", explanation: "Rendered fat from chicken. A named, species-appropriate fat source rich in linoleic acid (omega-6).", misleading: "Sounds unappetizing but it's one of the best fat sources in cat food. Preserved with mixed tocopherols (vitamin E) in quality foods.", healthNotes: "Found in ~175 products — the most common fat source. Provides essential fatty acids. Highly palatable to cats. Look for how it's preserved." },
    { name: "Fish Oil", rating: "great", category: "Fat", explanation: "Oil extracted from fish, rich in EPA and DHA omega-3 fatty acids.", misleading: "Quality varies widely. Generic 'fish oil' doesn't specify the source fish. Look for named sources like 'salmon oil' or 'menhaden fish oil.'", healthNotes: "Excellent source of omega-3s for skin/coat, joint, brain, and heart health. Found in ~111 products. Especially beneficial for senior cats." },
    { name: "Animal Fat (Generic)", rating: "poor", category: "Fat", explanation: "Fat from unspecified animal sources. Could be from any animal, quality and source unknown.", misleading: "Deliberately vague. Named fats (chicken fat, salmon oil) are preferable — you know what you're getting.", healthNotes: "Not harmful per se, but ingredient quality is unknown and can vary between batches. Look for named fat sources instead." },
    { name: "Ground Flaxseed", rating: "good", category: "Fat", explanation: "Plant-based source of omega-3 fatty acids (ALA) and fiber.", misleading: "Cats cannot efficiently convert ALA to DHA/EPA like humans can. Less beneficial than fish-derived omega-3s for cats.", healthNotes: "Adds fiber and some omega-3s, though not as effective for cats as marine sources. Better than no omega-3s." },
    { name: "Sunflower Oil", rating: "neutral", category: "Fat", explanation: "Plant oil rich in omega-6 fatty acids (linoleic acid). Used as a fat source in some formulas.", misleading: "Sounds healthy because it's a 'natural oil,' but cats need omega-3s more than extra omega-6s. Most cat foods already have plenty of omega-6.", healthNotes: "Provides linoleic acid which cats need, but most foods already supply enough through chicken fat. Doesn't provide omega-3 benefits." },
    { name: "Coconut Oil", rating: "neutral", category: "Fat", explanation: "Plant-based oil high in medium-chain triglycerides (MCTs). Sometimes added for energy and coat health.", misleading: "Heavily marketed as a superfood for pets, but evidence for cat-specific benefits is limited compared to fish oil or chicken fat.", healthNotes: "MCTs may provide quick energy. Some anecdotal coat benefits. Not a replacement for omega-3 rich oils like fish oil." },
    // ─── SUPPLEMENTS ───────────────────────────────────────────────────────────
    { name: "Taurine", rating: "great", category: "Supplement", explanation: "An essential amino acid that cats cannot produce on their own. Critical for heart function, vision, and reproduction.", misleading: "Nothing misleading here — taurine is genuinely essential. Found in virtually every cat food (289 of 332 products). Its absence would be a major red flag.", healthNotes: "Deficiency causes dilated cardiomyopathy (heart disease) and retinal degeneration (blindness). Always verify it's listed. Naturally found in meat but often supplemented to ensure adequate levels." },
    { name: "DL-Methionine", rating: "neutral", category: "Supplement", explanation: "An amino acid supplement that helps acidify urine. Added to support urinary tract health.", misleading: "Sounds like a chemical additive but it's a standard amino acid supplement. Found in about 108 products, especially urinary health formulas.", healthNotes: "Helps maintain proper urinary pH to prevent crystal formation. Important for cats prone to urinary issues. Works by keeping urine acidic." },
    { name: "L-Carnitine", rating: "good", category: "Supplement", explanation: "An amino acid that helps the body convert fat into energy. Added to weight management and senior formulas.", misleading: "Some foods add it as a marketing point even in amounts too small to be effective.", healthNotes: "Beneficial for weight management and muscle maintenance. Particularly useful for overweight cats on a calorie-restricted diet." },
    { name: "Glucosamine / Chondroitin", rating: "good", category: "Supplement", explanation: "Joint support compounds found naturally in cartilage. Added to senior and mobility-focused foods.", misleading: "Amounts added to food are often lower than therapeutic doses. May not provide full joint benefit without additional supplementation.", healthNotes: "Beneficial for cats with arthritis or mobility issues. Look for foods that list specific mg amounts. Especially important for overweight or senior cats." },
    { name: "Green-Lipped Mussel", rating: "great", category: "Supplement", explanation: "New Zealand shellfish rich in omega-3s, glucosamine, and chondroitin. Premium joint and anti-inflammatory supplement.", misleading: "Rare in cat food but very effective. Often found in premium senior formulas.", healthNotes: "Excellent natural source of joint support compounds. Contains unique ETA fatty acids not found in fish oil. Great for mobility issues." },
    { name: "Probiotics (Dried Fermentation Products)", rating: "good", category: "Supplement", explanation: "Beneficial bacteria cultures added to support digestive health. Listed as various 'fermentation product' ingredients.", misleading: "Viability can be an issue — many probiotics don't survive the kibble manufacturing process. Heat-stable strains are more effective.", healthNotes: "Support healthy gut flora and digestion. Look for named strains. Most effective in foods that specifically guarantee live cultures at time of feeding." },
    { name: "Rosemary Extract", rating: "good", category: "Preservative", explanation: "A natural antioxidant used to preserve fats in cat food. Much safer alternative to BHA/BHT.", misleading: "Sometimes listed as a 'natural flavor' when it's really there as a preservative. Found in about 133 products — a good sign of quality.", healthNotes: "Safe, natural preservation method. Preferred over synthetic preservatives. Its presence usually indicates a manufacturer that avoids artificial additives." },
    { name: "Mixed Tocopherols (Vitamin E)", rating: "good", category: "Preservative", explanation: "Natural forms of vitamin E used as a preservative to keep fats from going rancid.", misleading: "Sometimes just listed as 'preserved with mixed tocopherols' after a fat ingredient. This is a good thing, not a chemical additive.", healthNotes: "Safe and effective natural preservation. Also provides some vitamin E benefit. A positive indicator of food quality." },
    { name: "Natural Flavor / Natural Flavors", rating: "neutral", category: "Additive", explanation: "Flavor enhancers derived from animal or plant sources. 'Natural' means not synthetic, but the exact source is unspecified.", misleading: "Extremely vague. Could be almost anything. Found in ~140 products. Not necessarily bad, but the lack of specificity is frustrating.", healthNotes: "Generally safe, but the vagueness means you can't assess quality. Cats shouldn't need heavy flavoring if the base ingredients are good." },
    { name: "Salt", rating: "neutral", category: "Additive", explanation: "Added as a flavor enhancer and electrolyte source. Found in about 184 products.", misleading: "Sounds alarming but small amounts are necessary for electrolyte balance. It's when salt is high on the ingredient list that it's concerning.", healthNotes: "Essential in small amounts. Excessive salt can be problematic for cats with heart or kidney issues. Should be listed well below the main ingredients." },
    { name: "Carrageenan", rating: "caution", category: "Additive", explanation: "A thickener and stabilizer extracted from red seaweed. More common in wet food but occasionally in dry.", misleading: "Marketed as a 'natural' ingredient since it comes from seaweed. But 'natural' doesn't mean harmless.", healthNotes: "Some research links food-grade carrageenan to GI inflammation in animals. Banned in infant formula in the EU as a precaution. Controversial but not definitively proven harmful." },
    { name: "Guar Gum", rating: "neutral", category: "Additive", explanation: "A natural thickener from guar beans. Used as a binder in some dry food formulations.", misleading: "Sounds like a chemical but it's just ground guar beans. A common food additive in human food too.", healthNotes: "Generally safe. Provides some soluble fiber. Very rarely causes digestive issues. Not a nutritional concern in typical amounts." },
    { name: "Menadione (Vitamin K3)", rating: "poor", category: "Supplement", explanation: "A synthetic form of vitamin K. Listed as 'menadione sodium bisulfite complex' or similar on labels.", misleading: "Buried in the vitamin/mineral premix where most people don't look. Banned in human supplements in several countries.", healthNotes: "Has been linked to liver toxicity and allergic reactions in some studies. Natural vitamin K (K1 from plants, K2 from fermentation) is available but costs more." },
    // ─── PRESERVATIVES ─────────────────────────────────────────────────────────
    { name: "BHA / BHT / Ethoxyquin", rating: "poor", category: "Preservative", explanation: "Synthetic preservatives used to prevent fat from going rancid. BHA and BHT are approved by FDA; Ethoxyquin is more controversial.", misleading: "Often hidden or listed without context. Some manufacturers use them in ingredients (like fish meal) without disclosing on the label.", healthNotes: "BHA is classified as a possible human carcinogen. Ethoxyquin is banned in human food in the EU. Safer alternatives: mixed tocopherols, ascorbic acid." },
    { name: "Phosphoric Acid", rating: "neutral", category: "Additive", explanation: "Used as an acidifier and flavor enhancer. Helps maintain proper urinary pH in some formulas.", misleading: "Sounds scarier than it is — it's the same acid in many soft drinks. Found in about 85 products, often in urinary health formulas.", healthNotes: "In small amounts, helps acidify urine which can prevent struvite crystals. Not a concern at typical pet food levels." },
    { name: "Calcium Carbonate", rating: "neutral", category: "Supplement", explanation: "A calcium supplement. Also used as a buffering agent. Found in about 176 products.", misleading: "Nothing misleading — it's a straightforward mineral supplement. The same compound used in human calcium supplements.", healthNotes: "Provides essential calcium for bone health. Important that calcium-to-phosphorus ratio stays balanced. Too much can be as problematic as too little." },
    { name: "Potassium Chloride", rating: "neutral", category: "Supplement", explanation: "A potassium supplement and electrolyte. Essential mineral for heart and muscle function.", misleading: "Sounds chemical but it's a basic mineral salt. Found in about 244 products — nearly universal in cat food.", healthNotes: "Essential electrolyte. Supports heart, nerve, and muscle function. Deficiency is rare in commercial cat food. Not a concern at normal supplementation levels." },
  ];

  const insertIngredient = db.prepare(`
    INSERT OR IGNORE INTO ingredients (name, rating, category, explanation, misleading, healthNotes)
    VALUES (@name, @rating, @category, @explanation, @misleading, @healthNotes)
  `);

  db.exec("BEGIN");
  for (const i of ingredients) insertIngredient.run(i);
  db.exec("COMMIT");
  console.log(`Seeded ${ingredients.length} ingredients`);
} else {
  console.log(`Ingredients already exist (${ingredientCount}). Skipping.`);
}

// ─── RED FLAGS ────────────────────────────────────────────────────────────────
if (redFlagCount === 0) {
  const redFlags = [
    { title: "Unnamed Protein Sources", severity: "high", category: "Ingredient Deception", description: "Generic terms like 'meat meal,' 'poultry by-product meal,' or 'animal fat' hide what animal the ingredient came from. Quality and consistency are unknown.", whatToLookFor: "Always choose foods with named protein sources: 'chicken meal,' 'salmon,' 'turkey.' If it doesn't say the animal, the manufacturer is hiding something." },
    { title: "Ingredient Splitting", severity: "high", category: "Ingredient Deception", description: "Manufacturers list the same ingredient multiple ways to make it appear lower on the ingredient list. Example: listing 'peas,' 'pea protein,' 'pea flour,' and 'pea fiber' separately — combined, peas might be the #1 ingredient.", whatToLookFor: "Count up all forms of corn (corn, corn gluten meal, whole grain corn), all pea products, and all grain variants. Combined totals reveal the real picture." },
    { title: "'Natural' Label Claim", severity: "medium", category: "Label Tricks", description: "The word 'natural' on pet food is largely unregulated. AAFCO allows 'natural' claims even when synthetic vitamins and minerals are added.", whatToLookFor: "Ignore 'natural' on packaging. Read the actual ingredient list instead. Look for whole food ingredients you can recognize." },
    { title: "All Life Stages for Senior Cats", severity: "medium", category: "Misleading Standards", description: "'All life stages' formulas must meet the minimum requirements for kittens — which means higher phosphorus levels. Senior cats with kidney disease need lower phosphorus.", whatToLookFor: "Senior cats (especially 10+) benefit from food specifically formulated for adults or seniors. Ask your vet about phosphorus levels if kidney health is a concern." },
    { title: "Misleading Front-of-Package Claims", severity: "high", category: "Label Tricks", description: "Phrases like 'real chicken recipe,' 'salmon flavor,' or 'with beef' have specific legal meanings that may surprise you. 'With beef' only requires 3% beef content.", whatToLookFor: "Rules: 95% rule (just 'Chicken Cat Food'), 25% rule ('Chicken Dinner/Entree'), 3% rule ('with Chicken'), Flavor rule ('Chicken Flavor' — any detectable amount). Check the actual ingredient list." },
    { title: "Artificial Colors", severity: "medium", category: "Hidden Health Concerns", description: "Artificial colors like Red 40, Yellow 5, and Blue 2 serve no nutritional purpose — they're added to appeal to owners, not cats. Cats are partially color-blind.", whatToLookFor: "Cats don't care what color their food is. Artificial colors are a red flag that the manufacturer is more focused on visual appeal than nutrition quality." },
    { title: "Grain-Free Does Not Equal Healthier", severity: "medium", category: "Misleading Standards", description: "Grain-free foods often replace grains with high-glycemic starches (tapioca, potato) or legumes (peas, lentils). These can spike blood sugar and may be linked to heart issues.", whatToLookFor: "Compare the carbohydrate sources, not just whether it's grain-free. Tapioca starch is just as problematic as corn for overweight or diabetic cats. Focus on protein quality instead." },
    { title: "Vague Recall History", severity: "high", category: "Misleading Standards", description: "Some brands have had significant recalls for contamination, excess vitamins, or foreign materials — issues that indicate quality control problems at the manufacturer.", whatToLookFor: "Search '[brand name] recall' before buying. Check FDA's pet food recall database. A single recall isn't necessarily disqualifying, but patterns of recalls are a serious red flag." },
    { title: "Carrageenan in the Formula", severity: "medium", category: "Hidden Health Concerns", description: "Carrageenan is a seaweed-derived thickener linked to GI inflammation in animal studies. The EU banned it from infant formula as a precaution. More common in wet food, but some dry foods include it too.", whatToLookFor: "Check the ingredient list for 'carrageenan.' If your cat has chronic digestive issues, switching away from carrageenan-containing foods is an easy first step to try." },
    { title: "Menadione (Synthetic Vitamin K3)", severity: "medium", category: "Hidden Health Concerns", description: "Menadione sodium bisulfite complex is a synthetic vitamin K source that's been banned in human supplements in several countries. It's cheap to produce, which is why pet food manufacturers still use it.", whatToLookFor: "Look for 'menadione sodium bisulfite complex' in the vitamin/mineral section of the ingredient list. Natural vitamin K alternatives exist — manufacturers that use menadione are cutting costs." },
    { title: "'Premium' and 'Gourmet' Mean Nothing", severity: "medium", category: "Label Tricks", description: "Terms like 'premium,' 'gourmet,' 'holistic,' and 'human-grade' have no legal definition in pet food regulation. Any manufacturer can use them regardless of actual ingredient quality.", whatToLookFor: "Ignore marketing terms on the front of the bag entirely. The only regulated claims are the ingredient list, guaranteed analysis, and AAFCO statement. Everything else is marketing." },
    { title: "Formulated vs. Feeding Trial Tested", severity: "high", category: "Misleading Standards", description: "AAFCO allows two methods: 'formulated to meet' (calculated on paper) vs. 'animal feeding tests' (actually fed to animals and measured). Paper formulations can miss bioavailability issues.", whatToLookFor: "Check the AAFCO statement on the label. 'Animal feeding tests' means real cats ate the food and thrived. 'Formulated to meet' means it looks right on paper but hasn't been proven in practice." },
    { title: "Ash Content Not Listed", severity: "low", category: "Hidden Health Concerns", description: "Ash content indicates total mineral load in the food. High ash can mean excess magnesium, phosphorus, and calcium — concerning for cats prone to urinary crystals or kidney issues.", whatToLookFor: "Ash isn't required on labels, but quality brands often list it voluntarily. For urinary-prone cats, look for ash under 7%. If it's not listed, contact the manufacturer directly." },
    { title: "By-Product vs. By-Product Meal Confusion", severity: "medium", category: "Ingredient Deception", description: "By-products are organ meats and parts (actually nutritious). By-product meal is the dried, rendered version. Both get a bad reputation, but the real issue is whether they're named or generic.", whatToLookFor: "'Chicken by-product meal' (named) is better than 'poultry by-product meal' (generic). The word 'by-product' isn't automatically bad — unnamed sources are the real problem." },
    { title: "Multiple Tiny Protein Sources", severity: "medium", category: "Ingredient Deception", description: "Some foods list 5-6 different proteins, each contributing small amounts. This can mask the fact that no single quality protein dominates the formula — the food is mostly filler with protein sprinkled in.", whatToLookFor: "Look at where proteins fall in the ingredient list. If the first ingredient is a grain or starch, and multiple proteins appear later, the food is carb-heavy with protein window dressing." },
    { title: "Hidden Carb Content", severity: "medium", category: "Hidden Health Concerns", description: "Guaranteed analysis lists protein, fat, fiber, and moisture — but not carbohydrates. You have to calculate it yourself: 100% minus protein, fat, fiber, moisture, and ash equals approximate carb content.", whatToLookFor: "Do the math: 100 - protein% - fat% - fiber% - moisture% - ash% (estimate 7% if not listed) = carbs. Many cat foods are 30-40% carbs. Cats naturally eat less than 5% carbs." },
    { title: "'Veterinary Diet' Branding", severity: "low", category: "Label Tricks", description: "Many 'veterinary' or 'prescription' diet foods are not meaningfully different from premium regular foods in their ingredient quality. The 'prescription' label often just means it's sold through vets.", whatToLookFor: "Compare the actual ingredient list of a 'veterinary diet' to regular premium foods. Some are genuinely therapeutic (kidney diets with restricted phosphorus), but others are marketing. Always discuss with your vet." },
    { title: "'Complete and Balanced' Loopholes", severity: "medium", category: "Misleading Standards", description: "AAFCO's 'complete and balanced' standard sets minimums, not optimums. A food can meet every minimum requirement and still be made primarily from cheap fillers with synthetic vitamin fortification.", whatToLookFor: "Don't treat 'complete and balanced' as a quality seal — it's a minimum bar. Two foods can both be 'complete and balanced' with wildly different ingredient quality. Always read the actual ingredients." },
  ];

  const insertRedFlag = db.prepare(`
    INSERT OR IGNORE INTO red_flags (title, severity, category, description, whatToLookFor)
    VALUES (@title, @severity, @category, @description, @whatToLookFor)
  `);

  db.exec("BEGIN");
  for (const f of redFlags) insertRedFlag.run(f);
  db.exec("COMMIT");
  console.log(`Seeded ${redFlags.length} red flags`);
} else {
  console.log(`Red flags already exist (${redFlagCount}). Skipping.`);
}

// ─── TRANSPARENCY SCORES ─────────────────────────────────────────────────────
scoreUnscoredProducts();

// ─── FIX SENIOR LIFE STAGES ──────────────────────────────────────────────────
// Products with 11+ or 12+ in their name should be Senior (11+), not Senior (7+)
const seniorFixes = [
  { lifeStage: "Senior (11+)", match: "%Senior 11+%" },
  { lifeStage: "Senior (11+)", match: "%Adults 11+%" },
  { lifeStage: "Senior (11+)", match: "%Mature 12+%" },
];
for (const fix of seniorFixes) {
  db.prepare("UPDATE products SET lifeStage = ? WHERE name LIKE ? AND lifeStage != ?")
    .run(fix.lifeStage, fix.match, fix.lifeStage);
}
// Senior products incorrectly tagged as Adult
db.prepare("UPDATE products SET lifeStage = 'Senior (7+)' WHERE lifeStage = 'Adult' AND name LIKE '%Senior%' AND name NOT LIKE '%11+%'").run();
db.prepare("UPDATE products SET lifeStage = 'Senior (11+)' WHERE lifeStage = 'Adult' AND name LIKE '%Senior%' AND name LIKE '%11+%'").run();

// ─── Ingredient rating upgrades (great tier) ─────────────────────────────────
const greatIngredients = [
  "Deboned Chicken", "Chicken Meal", "Salmon", "Turkey", "Turkey Meal",
  "Rabbit", "Venison", "Chicken Fat", "Fish Oil", "Taurine", "Green-Lipped Mussel"
];
for (const name of greatIngredients) {
  db.prepare("UPDATE ingredients SET rating = 'great' WHERE name = ? AND rating = 'good'").run(name);
}

console.log("Database ready!");
