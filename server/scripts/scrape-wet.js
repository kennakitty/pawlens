// scrape-wet.js — Scrape ALL PetSmart wet cat food product data via Algolia API
// Run: node server/scripts/scrape-wet.js
//
// Uses PetSmart's Algolia search index to get all products (no pagination limit),
// then parses the long_description HTML for nutrition/ingredient details.
// Output: server/data/petsmart-wet-products.json

import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "../data/petsmart-wet-products.json");

const ALGOLIA_APP_ID = "97P6EWKR25";
const ALGOLIA_API_KEY = "89538b14986f30460d07967cc3717153";
const ALGOLIA_INDEX = "r-US_products_best-sellers";
const ALGOLIA_URL = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/*/queries`;
const HITS_PER_PAGE = 100;

// ═══════════════════════════════════════════════════════════════════════════════
// Step 1: Fetch all products from Algolia
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchAllProducts() {
  const allHits = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const body = {
      requests: [
        {
          indexName: ALGOLIA_INDEX,
          params: new URLSearchParams({
            query: "",
            hitsPerPage: HITS_PER_PAGE,
            page,
            filters:
              'isSKUAvailable: true AND (custom_category_names:"cat > food and treats > wet food")',
            attributesToRetrieve: [
              "id",
              "masterProductID",
              "name",
              "brand",
              "sku",
              "images",
              "long_description",
              "flavor",
              "catLifestages",
              "foodTextures",
              "customHealthConsideration",
              "packagingTypes",
              "size",
              "upc",
            ].join(","),
          }).toString(),
        },
      ],
    };

    const res = await fetch(ALGOLIA_URL, {
      method: "POST",
      headers: {
        "X-Algolia-Application-Id": ALGOLIA_APP_ID,
        "X-Algolia-API-Key": ALGOLIA_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error(`Algolia error on page ${page}: ${res.status}`);
      break;
    }

    const data = await res.json();
    const result = data.results[0];
    totalPages = result.nbPages;
    allHits.push(...result.hits);
    console.log(
      `Page ${page + 1}/${totalPages} — ${result.hits.length} hits (total: ${allHits.length})`
    );
    page++;
  }

  return allHits;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Step 2: Parse product data from Algolia hit
// ═══════════════════════════════════════════════════════════════════════════════

function decodeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&amp;/g, "&")
    .replace(/&#38;/g, "&")
    .replace(/&eacute;/g, "é")
    .replace(/&frasl;/g, "/")
    .replace(/&frac14;/g, "¼")
    .replace(/&frac12;/g, "½")
    .replace(/&frac34;/g, "¾")
    .replace(/&reg;/g, "®")
    .replace(/&trade;/g, "™")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, "\u201D")
    .replace(/&ldquo;/g, "\u201C")
    .replace(/&hellip;/g, "…")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSection(html, key) {
  if (!html) return "";
  // Match <b>Key:</b> or <b>Key </b> followed by content until next <p> or <b>
  const patterns = [
    new RegExp(
      `<b>${key}:?\\s*</b>\\s*([\\s\\S]*?)(?=<p>\\s*<b>|<p><b>|$)`,
      "i"
    ),
    new RegExp(
      `<b>${key}:?\\s*</b>\\s*([\\s\\S]*?)(?=<b>|$)`,
      "i"
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1].trim()) {
      return match[1].trim();
    }
  }
  return "";
}

function parseBenefits(html) {
  if (!html) return [];
  return html
    .split(/<li>/i)
    .map((s) => decodeHtml(s).trim())
    .filter((s) => s.length > 5);
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/®|™/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseProduct(hit) {
  const desc = hit.long_description || "";

  // Extract sections from long_description HTML
  const description = extractSection(desc, "Description");
  const featuresRaw =
    extractSection(desc, "Features & Benefits") ||
    extractSection(desc, "Features &amp; Benefits") ||
    extractSection(desc, "Key Benefits");
  const ingredientsRaw = extractSection(desc, "Ingredients");
  const gaRaw = extractSection(desc, "Guaranteed Analysis");
  const calorieRaw =
    extractSection(desc, "Caloric Content") ||
    extractSection(desc, "Calorie Content");
  const feedingRaw =
    extractSection(desc, "Feeding Instructions") ||
    extractSection(desc, "Feeding Directions") ||
    extractSection(desc, "Directions");
  const foodTypeRaw =
    extractSection(desc, "Food Type") ||
    (hit.foodTextures?.[0] || "");
  const lifeStageRaw =
    extractSection(desc, "Life Stage") ||
    (hit.catLifestages?.[0] || "");
  const flavorRaw =
    extractSection(desc, "Flavor") ||
    (hit.flavor?.value || "");
  const breedRaw = extractSection(desc, "Breed Size");
  const nutritionalRaw =
    extractSection(desc, "Nutritional Benefits") ||
    extractSection(desc, "Nutritional Option");
  const healthRaw = extractSection(desc, "Health Consideration");

  // Build product URL
  const slug = slugify(hit.name || "");
  const masterID = hit.masterProductID || hit.id;
  const productURL = `https://www.petsmart.com/cat/food-and-treats/wet-food/${slug}-${masterID}.html`;

  const product = {
    productURL,
    name: hit.name || "",
    brand: hit.brand || "",
    sku: String(hit.sku || hit.id || ""),
    gtin13: hit.upc || "",
    imageUrl: hit.images?.large || "",
    description: decodeHtml(description),
    benefits: parseBenefits(featuresRaw),
    foodType: decodeHtml(foodTypeRaw) || "Wet",
    lifeStage: decodeHtml(lifeStageRaw) || null,
    nutritionalOptions: [],
    healthConsiderations: [],
    fullIngredients: decodeHtml(ingredientsRaw),
    guaranteedAnalysis: decodeHtml(gaRaw),
    calorieContent: decodeHtml(calorieRaw),
    aafco: "",
    directions: decodeHtml(feedingRaw),
    extraAttributes: {},
    lastUpdated: new Date().toISOString(),
    flavor: decodeHtml(flavorRaw) || null,
    breed: decodeHtml(breedRaw) || null,
  };

  // Parse nutritional options
  if (nutritionalRaw) {
    product.nutritionalOptions = decodeHtml(nutritionalRaw)
      .split(/,\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Parse health considerations (prefer Algolia structured data)
  if (hit.customHealthConsideration?.length) {
    product.healthConsiderations = hit.customHealthConsideration;
  } else if (healthRaw) {
    product.healthConsiderations = decodeHtml(healthRaw)
      .split(/,\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Extract AAFCO statement
  const allText = [
    product.guaranteedAnalysis,
    product.directions,
    product.calorieContent,
    product.description,
  ].join(" ");
  const aafcoMatch = allText.match(
    /[^.]*formulated to meet the nutritional levels established by the AAFCO[^.]*/i
  );
  if (aafcoMatch) {
    product.aafco = aafcoMatch[0].trim();
  }

  // Capture size/weight info
  if (hit.size?.solidSize) {
    product.extraAttributes.weight = hit.size.solidSize;
  }
  if (hit.packagingTypes?.length) {
    product.extraAttributes.packagingType = hit.packagingTypes[0];
  }

  return product;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("Fetching all wet cat food products from PetSmart via Algolia...\n");
  const hits = await fetchAllProducts();
  console.log(`\nTotal hits from Algolia: ${hits.length}\n`);

  const products = [];
  let noIngredients = 0;

  for (const hit of hits) {
    const product = parseProduct(hit);
    if (!product.fullIngredients && !product.guaranteedAnalysis) {
      noIngredients++;
    }
    products.push(product);
  }

  // Write output
  writeFileSync(OUTPUT_PATH, JSON.stringify(products, null, 2));

  console.log(`=== Scrape Complete ===`);
  console.log(`Total products: ${products.length}`);
  console.log(`With ingredients: ${products.length - noIngredients}`);
  console.log(`Missing ingredients/GA: ${noIngredients}`);
  console.log(`Output: ${OUTPUT_PATH}`);

  // Brand breakdown
  const brands = {};
  for (const p of products) {
    brands[p.brand || "unknown"] = (brands[p.brand || "unknown"] || 0) + 1;
  }
  console.log("\nBrand breakdown:");
  for (const [brand, count] of Object.entries(brands).sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`  ${brand}: ${count}`);
  }

  // Food type breakdown
  const types = {};
  for (const p of products) {
    types[p.foodType || "unknown"] = (types[p.foodType || "unknown"] || 0) + 1;
  }
  console.log("\nFood type breakdown:");
  for (const [type, count] of Object.entries(types).sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`  ${type}: ${count}`);
  }

  // Life stage breakdown
  const stages = {};
  for (const p of products) {
    stages[p.lifeStage || "unknown"] = (stages[p.lifeStage || "unknown"] || 0) + 1;
  }
  console.log("\nLife stage breakdown:");
  for (const [stage, count] of Object.entries(stages).sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`  ${stage}: ${count}`);
  }

  // Data quality check
  const withIngredients = products.filter((p) => p.fullIngredients).length;
  const withGA = products.filter((p) => p.guaranteedAnalysis).length;
  const withCalories = products.filter((p) => p.calorieContent).length;
  console.log("\nData quality:");
  console.log(`  Has ingredients: ${withIngredients}/${products.length}`);
  console.log(`  Has guaranteed analysis: ${withGA}/${products.length}`);
  console.log(`  Has calorie content: ${withCalories}/${products.length}`);
}

main().catch(console.error);
