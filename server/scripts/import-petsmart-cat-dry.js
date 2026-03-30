import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import db, { serializeProduct } from "../db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "../data/products-petsmart-cat-dry.json");

console.log("Reading product data...");
const products = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
console.log(`Found ${products.length} products to import.`);

// Clear existing products
db.prepare("DELETE FROM products_petsmart_cat_dry").run();
console.log("Cleared existing products.");

// Prepare insert statement
const insert = db.prepare(`
  INSERT INTO products_petsmart_cat_dry (
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

// Import all products in a transaction
const importAll = db.transaction((products) => {
  let imported = 0;
  for (const p of products) {
    const row = serializeProduct({
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
    });
    insert.run(row);
    imported++;
  }
  return imported;
});

const count = importAll(products);
console.log(`Successfully imported ${count} products.`);

// Verify
const total = db.prepare("SELECT COUNT(*) as count FROM products_petsmart_cat_dry").get();
console.log(`Database now has ${total.count} products.`);

// Show brand breakdown
const brands = db.prepare("SELECT brand, COUNT(*) as count FROM products_petsmart_cat_dry GROUP BY brand ORDER BY count DESC").all();
console.log("\nBrand breakdown:");
for (const b of brands) {
  console.log(`  ${b.brand}: ${b.count}`);
}
