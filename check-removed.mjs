import { execSync } from "child_process";

const original = JSON.parse(execSync("git show e6ddb58:server/data/petsmart-products.json", { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }));
const current = JSON.parse(execSync("git show HEAD:server/data/petsmart-products.json", { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }));

console.log("Original count:", original.length);
console.log("Current count:", current.length);
console.log("Removed:", original.length - current.length);

// Find which products were removed
const currentNames = new Set(current.map(p => p.name));
const currentSKUs = new Set(current.map(p => p.sku));

// Find duplicated names in original
const nameCount = {};
for (const p of original) {
  nameCount[p.name] = (nameCount[p.name] || 0) + 1;
}

const dupeNames = Object.entries(nameCount).filter(([_, c]) => c > 1);
console.log("\n=== Names that appeared multiple times in original ===");

for (const [name] of dupeNames) {
  const matches = original.filter(p => p.name === name);
  console.log("\nName:", name);
  console.log("Occurrences:", matches.length);
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    console.log(`  [${i}] SKU: ${m.sku} | Brand: ${m.brand} | Flavor: ${m.flavor || "none"}`);
    console.log(`      URL: ${m.productURL || "none"}`);
    console.log(`      Has ingredients: ${m.fullIngredients ? "yes (" + m.fullIngredients.substring(0, 60) + "...)" : "NO"}`);
    console.log(`      Calorie: ${m.calorieContent || "none"}`);
    console.log(`      Life stage: ${m.lifeStage || "none"}`);
  }

  // Check if the copies are truly identical or have different data
  const first = JSON.stringify(matches[0]);
  const allSame = matches.every(m => JSON.stringify(m) === first);
  console.log(`  ALL IDENTICAL? ${allSame ? "YES — true duplicate, safe to remove" : "NO — these may be different products!"}`);

  if (!allSame) {
    // Find what differs
    for (let i = 1; i < matches.length; i++) {
      const diffs = [];
      for (const key of Object.keys(matches[0])) {
        if (JSON.stringify(matches[0][key]) !== JSON.stringify(matches[i][key])) {
          diffs.push(key);
        }
      }
      console.log(`  Differences between [0] and [${i}]:`, diffs.join(", "));
    }
  }
}
