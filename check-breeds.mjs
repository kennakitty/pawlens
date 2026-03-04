import { execSync } from "child_process";

const orig = JSON.parse(execSync("git show e6ddb58:server/data/petsmart-products.json", { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }));

// Find breed-specific products by name
const breedKeywords = ["Maine Coon", "Persian", "Siamese", "British Shorthair", "Ragdoll", "Bengal", "Sphynx", "Abyssinian", "Norwegian", "Breed"];
const breedProducts = orig.filter(p => breedKeywords.some(k => p.name && p.name.includes(k)));

console.log("=== Breed-specific products by NAME ===");
console.log("Count:", breedProducts.length);
for (const p of breedProducts) {
  console.log(`  - ${p.brand} | ${p.name}`);
  console.log(`    breedSize: "${p.breedSize || "EMPTY"}" | lifeStage: "${p.lifeStage || "EMPTY"}"`);
}

// Show all unique breedSize values
console.log("\n=== All unique breedSize values ===");
const sizes = {};
for (const p of orig) {
  const val = p.breedSize || "(empty)";
  sizes[val] = (sizes[val] || 0) + 1;
}
for (const [val, count] of Object.entries(sizes).sort((a, b) => b[1] - a[1])) {
  console.log(`  [${count}x] ${val.substring(0, 100)}`);
}
