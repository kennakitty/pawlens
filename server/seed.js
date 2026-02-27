// seed.js — Run once to populate the database with starter data
// Usage: npm run seed
import db, { serializeProduct } from "./db.js";

console.log("Seeding database...");

// ─── PRODUCTS ────────────────────────────────────────────────────────────────
const products = [
  {
    name: "Pro Plan Vital Systems Senior 7+ Salmon & Rice",
    brand: "Purina", line: "Pro Plan", type: "Dry", lifeStage: "Senior (7+)", retailer: "PetSmart",
    priceRange: "$24.98 - $49.98", sizes: ["3.2 lb", "5.5 lb", "13 lb"],
    proteinPct: 36, fatPct: 14, fiberPct: 5, moisturePct: 12, calPerCup: 438,
    firstIngredients: ["Salmon", "Rice", "Corn Gluten Meal", "Poultry By-Product Meal", "Soybean Meal"],
    keyFeatures: ["Glucosamine & Omega-3s for joint support", "Probiotics for digestive health", "EPA for brain function in seniors", "Antioxidants for immune support"],
    concerns: ["Contains corn gluten meal", "Contains by-product meal"],
    transparencyScore: 7.2,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Senior cats with joint/mobility issues", "Cats needing brain health support", "Multi-system senior support"],
    avoid: ["Cats with corn sensitivity", "Cats needing low-phosphorus diet"],
    recallHistory: "No recent recalls for this specific product", country: "USA"
  },
  {
    name: "MedalSeries Weight Management Salmon & Sweet Potato",
    brand: "Nulo", line: "MedalSeries", type: "Dry", lifeStage: "Adult", retailer: "PetSmart",
    priceRange: "$22.99 - $44.99", sizes: ["4 lb", "12 lb"],
    proteinPct: 36, fatPct: 10, fiberPct: 8, moisturePct: 10, calPerCup: 350,
    firstIngredients: ["Deboned Salmon", "Turkey Meal", "Sweet Potato", "Peas", "Chicken Fat"],
    keyFeatures: ["BC30 probiotic for digestive health", "High fiber for satiety", "Low glycemic index", "No corn, wheat, or soy"],
    concerns: ["Contains peas (legumes)", "Higher fiber may cause loose stools in some cats"],
    transparencyScore: 8.1,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Overweight cats", "Indoor cats with low activity", "Cats needing weight management"],
    avoid: ["Underweight cats", "Kittens", "Cats with legume sensitivity"],
    recallHistory: "No recalls on record", country: "USA"
  },
  {
    name: "Baked & Coated Salmon & Chicken Recipe",
    brand: "Nulo", line: "MedalSeries", type: "Dry", lifeStage: "Adult", retailer: "PetSmart",
    priceRange: "$19.99 - $39.99", sizes: ["5 lb", "14 lb"],
    proteinPct: 38, fatPct: 16, fiberPct: 3, moisturePct: 10, calPerCup: 420,
    firstIngredients: ["Deboned Salmon", "Chicken Meal", "Whole Oats", "Chicken Fat", "Dried Egg Product"],
    keyFeatures: ["Baked kibble for better palatability", "BC30 probiotic", "No corn, wheat, or soy", "High animal protein"],
    concerns: ["Contains whole oats (grain)", "Higher fat content"],
    transparencyScore: 8.3,
    aafco: "Formulated to meet AAFCO nutrient profiles for all life stages",
    bestFor: ["Active adult cats", "Picky eaters who prefer crunchy texture", "Cats needing high protein"],
    avoid: ["Overweight cats (higher fat)", "Cats with grain sensitivity"],
    recallHistory: "No recalls on record", country: "USA"
  },
  {
    name: "Indoor Advantage Senior Cat Food",
    brand: "Hill's Science Diet", line: "Science Diet", type: "Dry", lifeStage: "Senior (7+)", retailer: "PetSmart",
    priceRange: "$21.99 - $46.99", sizes: ["3.5 lb", "7 lb", "15.5 lb"],
    proteinPct: 30, fatPct: 13.5, fiberPct: 6.5, moisturePct: 10, calPerCup: 356,
    firstIngredients: ["Chicken", "Whole Grain Corn", "Corn Gluten Meal", "Pork Fat", "Soybean Meal"],
    keyFeatures: ["Clinically proven antioxidants", "L-Carnitine for healthy weight", "Easy digestibility", "Veterinarian recommended"],
    concerns: ["Whole grain corn as second ingredient", "Contains corn gluten meal", "Contains soybean meal", "Lower protein than many competitors"],
    transparencyScore: 5.8,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Indoor senior cats", "Cats with sensitive stomachs", "Weight maintenance"],
    avoid: ["Cats with corn or soy sensitivity", "Cats needing high protein diet"],
    recallHistory: "Hill's had a major recall in 2019 (elevated Vitamin D) — this specific product was not affected", country: "USA"
  },
  {
    name: "Healthy Aging 12+ Dry Cat Food",
    brand: "Royal Canin", line: "Feline Health Nutrition", type: "Dry", lifeStage: "Senior (12+)", retailer: "PetSmart",
    priceRange: "$26.99 - $54.99", sizes: ["3.5 lb", "7 lb"],
    proteinPct: 31, fatPct: 16, fiberPct: 7.7, moisturePct: 8, calPerCup: 389,
    firstIngredients: ["Chicken By-Product Meal", "Brown Rice", "Chicken Fat", "Oat Groats", "Corn Gluten Meal"],
    keyFeatures: ["Designed for cats 12+", "Kidney support formula", "High palatability for senior appetites", "Antioxidant complex"],
    concerns: ["Chicken by-product meal as first ingredient", "Contains corn gluten meal", "Premium price for ingredient quality"],
    transparencyScore: 6.1,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Very senior cats (12+)", "Cats with reduced appetite", "Kidney function support"],
    avoid: ["Cats with corn sensitivity", "Budget-conscious shoppers (lower value for price)"],
    recallHistory: "No recent recalls for this product", country: "USA"
  },
  {
    name: "Wilderness Indoor Chicken Recipe",
    brand: "Blue Buffalo", line: "Wilderness", type: "Dry", lifeStage: "Adult", retailer: "PetSmart",
    priceRange: "$18.99 - $38.99", sizes: ["5 lb", "11 lb"],
    proteinPct: 37, fatPct: 15, fiberPct: 6.5, moisturePct: 10, calPerCup: 396,
    firstIngredients: ["Deboned Chicken", "Chicken Meal", "Peas", "Tapioca Starch", "Pea Protein"],
    keyFeatures: ["Grain-free formula", "LifeSource Bits (antioxidant blend)", "No poultry by-products", "DHA and ARA"],
    concerns: ["Contains tapioca starch (high glycemic)", "Contains pea protein (ingredient splitting concern)", "Grain-free linked to heart issues in some studies"],
    transparencyScore: 6.8,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Grain-sensitive cats", "Active indoor cats", "Cats who do well on grain-free"],
    avoid: ["Cats with heart conditions (grain-free concern)", "Overweight cats (tapioca starch)"],
    recallHistory: "Blue Buffalo had recalls in 2017; no recent recalls for Wilderness line", country: "USA"
  },
  {
    name: "Complete Health Adult Indoor Deboned Chicken",
    brand: "Wellness", line: "Complete Health", type: "Dry", lifeStage: "Adult", retailer: "PetSmart",
    priceRange: "$20.99 - $42.99", sizes: ["5.5 lb", "11.5 lb"],
    proteinPct: 35, fatPct: 12, fiberPct: 7, moisturePct: 10, calPerCup: 360,
    firstIngredients: ["Deboned Chicken", "Chicken Meal", "Brown Rice", "Oatmeal", "Peas"],
    keyFeatures: ["No artificial colors or preservatives", "Balanced omega-3 and omega-6", "Prebiotics and probiotics", "No meat by-products"],
    concerns: ["Contains peas", "Moderate protein level"],
    transparencyScore: 7.5,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Indoor cats", "Weight management", "Cats needing digestive support"],
    avoid: ["Cats with legume sensitivity", "Very active cats needing higher protein"],
    recallHistory: "No recent recalls", country: "USA"
  },
  {
    name: "Instinct Original Grain-Free Real Chicken",
    brand: "Instinct", line: "Original", type: "Dry", lifeStage: "Adult", retailer: "PetSmart",
    priceRange: "$24.99 - $49.99", sizes: ["4.5 lb", "10 lb"],
    proteinPct: 41, fatPct: 20, fiberPct: 4, moisturePct: 8, calPerCup: 475,
    firstIngredients: ["Chicken", "Chicken Meal", "Tapioca", "Chicken Fat", "Peas"],
    keyFeatures: ["High protein (41%)", "Freeze-dried raw coated kibble", "Grain-free", "Omega-3 and omega-6 fatty acids"],
    concerns: ["Very high fat (20%) — not suitable for overweight cats", "Tapioca as third ingredient", "Higher calorie density", "Grain-free concerns"],
    transparencyScore: 7.0,
    aafco: "Formulated to meet AAFCO nutrient profiles for all life stages",
    bestFor: ["Underweight cats needing to gain", "Active cats with high energy needs", "Cats who prefer raw-adjacent food"],
    avoid: ["Overweight cats", "Cats with weight issues", "Seniors with reduced activity"],
    recallHistory: "No recent recalls", country: "USA"
  },
  {
    name: "Simply Nourish Source Adult Cat Food Chicken",
    brand: "Simply Nourish", line: "Source", type: "Dry", lifeStage: "Adult", retailer: "PetSmart",
    priceRange: "$16.99 - $32.99", sizes: ["5 lb", "14 lb"],
    proteinPct: 36, fatPct: 16, fiberPct: 2.5, moisturePct: 10, calPerCup: 390,
    firstIngredients: ["Deboned Chicken", "Chicken Meal", "Peas", "Tapioca Starch", "Chicken Fat"],
    keyFeatures: ["PetSmart store brand (better value)", "No corn, wheat, or soy", "No artificial preservatives", "Added taurine"],
    concerns: ["Contains peas and tapioca starch", "Lower fiber content", "Private label — less brand transparency"],
    transparencyScore: 6.5,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Budget-conscious shoppers wanting grain-free", "Cats without specific health concerns"],
    avoid: ["Cats needing high fiber", "Cats sensitive to legumes"],
    recallHistory: "No recalls on record — newer brand", country: "USA"
  },
  {
    name: "Indoor Weight & Hairball Control Adult",
    brand: "IAMS", line: "Proactive Health", type: "Dry", lifeStage: "Adult", retailer: "PetSmart",
    priceRange: "$12.99 - $26.99", sizes: ["3.5 lb", "7 lb", "16 lb"],
    proteinPct: 30, fatPct: 10, fiberPct: 5.5, moisturePct: 10, calPerCup: 324,
    firstIngredients: ["Chicken", "Corn Grits", "Chicken By-Product Meal", "Powdered Cellulose", "Natural Flavor"],
    keyFeatures: ["Budget-friendly price point", "Hairball control fiber", "Weight management formula", "Widely available"],
    concerns: ["Corn grits as second ingredient", "Chicken by-product meal", "Lower quality ingredients overall", "Lower protein than ideal"],
    transparencyScore: 5.2,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Very budget-constrained households", "Cats with no specific health issues", "Hairball management on a budget"],
    avoid: ["Cats with corn sensitivity", "Cats needing high-quality protein", "Senior cats with increased protein needs"],
    recallHistory: "No recent recalls for this product", country: "USA"
  },
  {
    name: "ONE Indoor Advantage Adult Cat Food",
    brand: "Purina", line: "ONE", type: "Dry", lifeStage: "Adult", retailer: "PetSmart",
    priceRange: "$14.99 - $30.99", sizes: ["3.5 lb", "7 lb", "16 lb"],
    proteinPct: 34, fatPct: 13, fiberPct: 3, moisturePct: 12, calPerCup: 388,
    firstIngredients: ["Chicken", "Corn Gluten Meal", "Soybean Meal", "Whole Grain Corn", "Chicken By-Product Meal"],
    keyFeatures: ["Dual defense antioxidants", "Affordable mid-range option", "Highly palatable", "Crunchy texture"],
    concerns: ["Corn gluten meal as second ingredient", "Soybean meal as third", "Multiple grain fillers in top 5", "By-product meal"],
    transparencyScore: 5.5,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Budget-conscious households", "Picky eaters who like this flavor", "Cats without grain sensitivities"],
    avoid: ["Cats with corn or soy sensitivity", "Cats needing high-quality protein sources"],
    recallHistory: "No recent recalls for this product", country: "USA"
  },
  {
    name: "Science Diet Senior Vitality 7+ Chicken & Vegetables",
    brand: "Hill's Science Diet", line: "Science Diet", type: "Dry", lifeStage: "Senior (7+)", retailer: "PetSmart",
    priceRange: "$23.99 - $48.99", sizes: ["3.5 lb", "7 lb", "15.5 lb"],
    proteinPct: 31.5, fatPct: 14.8, fiberPct: 4.5, moisturePct: 10, calPerCup: 378,
    firstIngredients: ["Chicken", "Brewers Rice", "Corn Gluten Meal", "Whole Grain Corn", "Pork Fat"],
    keyFeatures: ["Clinically proven antioxidants for aging", "Omega-3s for mobility", "Veterinarian recommended brand", "Cognitive support"],
    concerns: ["Brewers rice as second ingredient", "Corn gluten meal", "Whole grain corn", "Lower protein relative to price"],
    transparencyScore: 6.0,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Senior cats 7+", "Cats whose vets recommend Hill's", "Cognitive support in aging cats"],
    avoid: ["Cats with grain sensitivity", "Budget shoppers (lower quality for premium price)"],
    recallHistory: "Hill's 2019 recall (Vitamin D) did not include this product", country: "USA"
  },
  {
    name: "Crave Indoor Adult Chicken & Salmon",
    brand: "Crave", line: "Crave", type: "Dry", lifeStage: "Adult", retailer: "PetSmart",
    priceRange: "$13.99 - $27.99", sizes: ["4 lb", "10 lb"],
    proteinPct: 40, fatPct: 18, fiberPct: 3, moisturePct: 10, calPerCup: 445,
    firstIngredients: ["Chicken", "Chicken Meal", "Tapioca Starch", "Pea Protein", "Chicken Fat"],
    keyFeatures: ["High protein (40%)", "Grain-free", "Animal protein focus", "Affordable high-protein option"],
    concerns: ["Tapioca starch as third ingredient (high glycemic)", "Pea protein (ingredient splitting)", "High fat — 18%", "Caused issue in Kenna's cats (tapioca starch/fat combo)"],
    transparencyScore: 6.3,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Active adult cats needing high protein", "Cats without weight issues"],
    avoid: ["Overweight cats", "Cats sensitive to tapioca starch", "Senior cats with low activity"],
    recallHistory: "No recalls on record", country: "USA"
  },
  {
    name: "Science Diet Sensitive Stomach & Skin Adult",
    brand: "Hill's Science Diet", line: "Science Diet", type: "Dry", lifeStage: "Adult", retailer: "PetSmart",
    priceRange: "$22.99 - $46.99", sizes: ["3.5 lb", "7 lb", "15.5 lb"],
    proteinPct: 30.6, fatPct: 20.5, fiberPct: 3.5, moisturePct: 10, calPerCup: 406,
    firstIngredients: ["Chicken", "Whole Grain Sorghum", "Whole Grain Corn", "Corn Gluten Meal", "Pork Fat"],
    keyFeatures: ["Designed for sensitive digestion", "Prebiotic fiber", "Omega-6 for skin health", "Clinically proven digestibility"],
    concerns: ["Very high fat (20.5%) — not suitable for overweight cats", "Corn gluten meal", "Whole grain corn", "Lower protein for a sensitive stomach formula"],
    transparencyScore: 5.9,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Cats with sensitive stomachs", "Cats with skin/coat issues", "Easy digestion needs"],
    avoid: ["Overweight cats (very high fat)", "Cats with corn sensitivity", "Senior cats with low activity"],
    recallHistory: "Not included in 2019 Hill's recall", country: "USA"
  },
  {
    name: "Purina ONE Senior 11+ Dry Cat Food",
    brand: "Purina", line: "ONE", type: "Dry", lifeStage: "Senior (11+)", retailer: "PetSmart",
    priceRange: "$14.99 - $29.99", sizes: ["3.2 lb", "7 lb"],
    proteinPct: 32, fatPct: 11, fiberPct: 3.5, moisturePct: 12, calPerCup: 344,
    firstIngredients: ["Salmon", "Corn Gluten Meal", "Soybean Meal", "Whole Grain Corn", "Poultry By-Product Meal"],
    keyFeatures: ["Formulated for cats 11+", "Lower calorie for senior metabolism", "Antioxidants for immune health", "Affordable senior option"],
    concerns: ["Corn gluten meal as second ingredient", "Soybean meal as third", "Poultry by-product meal", "Multiple fillers"],
    transparencyScore: 5.7,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Senior cats 11+", "Budget-conscious senior cat owners", "Low-activity senior cats"],
    avoid: ["Cats with corn or soy sensitivity", "Cats needing high-quality protein"],
    recallHistory: "No recent recalls for this product", country: "USA"
  },
  {
    name: "MedalSeries Senior Salmon & Sweet Potato",
    brand: "Nulo", line: "MedalSeries", type: "Dry", lifeStage: "Senior (7+)", retailer: "PetSmart",
    priceRange: "$21.99 - $43.99", sizes: ["5 lb", "12 lb"],
    proteinPct: 30, fatPct: 11, fiberPct: 6, moisturePct: 10, calPerCup: 340,
    firstIngredients: ["Deboned Salmon", "Turkey Meal", "Sweet Potato", "Peas", "Chicken Fat"],
    keyFeatures: ["BC30 probiotic", "Senior-appropriate protein and fat levels", "No corn, wheat, or soy", "Joint support nutrients"],
    concerns: ["Contains peas (legumes)", "Lower protein than some senior cats need"],
    transparencyScore: 7.8,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Senior cats 7+ who need weight management", "Cats with joint issues", "Multi-cat senior households"],
    avoid: ["Very active senior cats needing more protein", "Cats with legume sensitivity"],
    recallHistory: "No recalls on record", country: "USA"
  }
];

// ─── INGREDIENTS ─────────────────────────────────────────────────────────────
const ingredients = [
  {
    name: "Chicken By-Product Meal",
    rating: "caution",
    category: "Protein",
    explanation: "Rendered parts of chicken excluding feathers, heads, feet, and entrails. Includes organs, which are actually nutrient-dense.",
    misleading: "Sounds terrible, but organ meat is nutritious. The issue is inconsistency — quality varies significantly by manufacturer.",
    healthNotes: "Higher in protein than whole chicken by weight due to moisture removal. Phosphorus content can be concerning for cats with kidney issues."
  },
  {
    name: "Corn Gluten Meal",
    rating: "caution",
    category: "Protein/Filler",
    explanation: "A byproduct of corn processing. Used to boost protein percentage cheaply.",
    misleading: "Often makes protein % look higher than it is with quality animal protein. Corn is not a natural part of a cat's diet.",
    healthNotes: "Cats are obligate carnivores — plant proteins are less bioavailable. May cause digestive issues in sensitive cats."
  },
  {
    name: "Deboned Chicken",
    rating: "good",
    category: "Protein",
    explanation: "Whole chicken muscle meat with bones removed. High-quality, species-appropriate protein source.",
    misleading: "High moisture content means it may rank lower after cooking (dry weight). Check if a meal is also listed — that's more protein per pound.",
    healthNotes: "Excellent protein source for cats. Provides essential amino acids including taurine. Best when listed as first ingredient."
  },
  {
    name: "Tapioca Starch",
    rating: "caution",
    category: "Carbohydrate",
    explanation: "Derived from cassava root. Used as a grain-free binder and carbohydrate source.",
    misleading: "Often found in 'grain-free' foods marketed as healthier. High glycemic index — spikes blood sugar like grains do.",
    healthNotes: "Can contribute to weight gain and blood sugar issues. Particularly problematic for overweight or diabetic cats. Kenna's cats had mining behavior on foods containing tapioca."
  },
  {
    name: "Pea Protein",
    rating: "caution",
    category: "Protein/Filler",
    explanation: "Isolated protein from peas, separate from whole peas in the ingredient list.",
    misleading: "When listed separately from peas, this is 'ingredient splitting' — it makes grain-free foods appear to have less pea content than they do.",
    healthNotes: "Plant-based protein less bioavailable than animal protein for cats. Some concern about connection to heart disease (DCM) in grain-free diets."
  },
  {
    name: "Salmon",
    rating: "good",
    category: "Protein",
    explanation: "Whole salmon muscle meat. Excellent source of animal protein and omega-3 fatty acids.",
    misleading: "High water content means it shrinks significantly during cooking. A product with 'salmon' listed first may have very little salmon after processing.",
    healthNotes: "Rich in EPA and DHA omega-3s — great for joint health, skin/coat, and brain function. Especially beneficial for senior cats."
  },
  {
    name: "Chicken Meal",
    rating: "good",
    category: "Protein",
    explanation: "Dried and rendered chicken — most of the moisture removed. Concentrated protein source.",
    misleading: "The word 'meal' sounds unappetizing but it's actually a more concentrated protein source than whole chicken per pound of food.",
    healthNotes: "High-quality protein source. Provides more protein per pound than whole chicken. Look for named meals (chicken vs. generic 'poultry')."
  },
  {
    name: "Brown Rice",
    rating: "neutral",
    category: "Carbohydrate",
    explanation: "Whole grain rice. Less processed than white rice, retains some fiber and nutrients.",
    misleading: "Often marketed as a 'healthy' grain, but cats don't actually need grains. It's not harmful but adds carbs cats wouldn't eat naturally.",
    healthNotes: "Digestible carbohydrate source. Better than corn or wheat for most cats. Not ideal for diabetic or overweight cats."
  },
  {
    name: "Sweet Potato",
    rating: "neutral",
    category: "Carbohydrate",
    explanation: "Whole food carbohydrate source. Used as a grain-free alternative.",
    misleading: "Often seen as 'healthy' in grain-free foods, but it's still a carbohydrate cats don't need. Better than corn, but still adds unnecessary carbs.",
    healthNotes: "Good source of fiber and vitamins. Lower glycemic than white potato. Better choice than tapioca starch for grain-free formulas."
  },
  {
    name: "Whole Peas / Split Peas / Lentils",
    rating: "caution",
    category: "Carbohydrate",
    explanation: "Legumes used as carbohydrate sources and protein boosters in grain-free foods.",
    misleading: "Manufacturers often list peas, pea protein, split peas, and pea flour separately — hiding how much total legume is in the food.",
    healthNotes: "Some studies link high legume content in grain-free diets to dilated cardiomyopathy (DCM) in dogs. Evidence in cats is less clear but worth monitoring."
  },
  {
    name: "Ground Flaxseed",
    rating: "good",
    category: "Fat",
    explanation: "Plant-based source of omega-3 fatty acids (ALA) and fiber.",
    misleading: "Cats cannot efficiently convert ALA to DHA/EPA like humans can. Less beneficial than fish-derived omega-3s for cats.",
    healthNotes: "Adds fiber and some omega-3s, though not as effective for cats as marine sources. Better than no omega-3s."
  },
  {
    name: "Glucosamine / Chondroitin",
    rating: "good",
    category: "Supplement",
    explanation: "Joint support compounds found naturally in cartilage. Added to senior and mobility-focused foods.",
    misleading: "Amounts added to food are often lower than therapeutic doses. May not provide full joint benefit without additional supplementation.",
    healthNotes: "Beneficial for cats with arthritis or mobility issues. Look for foods that list specific mg amounts. Especially important for overweight or senior cats."
  },
  {
    name: "Green-Lipped Mussel",
    rating: "good",
    category: "Supplement",
    explanation: "New Zealand shellfish rich in omega-3s, glucosamine, and chondroitin. Premium joint and anti-inflammatory supplement.",
    misleading: "Rare in cat food but very effective. Often found in premium senior formulas.",
    healthNotes: "Excellent natural source of joint support compounds. Contains unique ETA fatty acids not found in fish oil. Great for mobility issues."
  },
  {
    name: "L-Carnitine",
    rating: "good",
    category: "Supplement",
    explanation: "An amino acid that helps the body convert fat into energy. Added to weight management and senior formulas.",
    misleading: "Some foods add it as a marketing point even in amounts too small to be effective.",
    healthNotes: "Beneficial for weight management and muscle maintenance. Particularly useful for overweight cats on a calorie-restricted diet."
  },
  {
    name: "Animal Fat (Generic)",
    rating: "poor",
    category: "Fat",
    explanation: "Fat from unspecified animal sources. Could be from any animal, quality and source unknown.",
    misleading: "Deliberately vague. Named fats (chicken fat, salmon oil) are preferable — you know what you're getting.",
    healthNotes: "Not harmful per se, but ingredient quality is unknown and can vary between batches. Look for named fat sources instead."
  },
  {
    name: "BHA / BHT / Ethoxyquin",
    rating: "poor",
    category: "Preservative",
    explanation: "Synthetic preservatives used to prevent fat from going rancid. BHA and BHT are approved by FDA; Ethoxyquin is more controversial.",
    misleading: "Often hidden or listed without context. Some manufacturers use them in ingredients (like fish meal) without disclosing on the label.",
    healthNotes: "BHA is classified as a possible human carcinogen. Ethoxyquin is banned in human food in the EU. Safer alternatives: mixed tocopherols, ascorbic acid."
  }
];

// ─── RED FLAGS ────────────────────────────────────────────────────────────────
const redFlags = [
  {
    title: "Unnamed Protein Sources",
    severity: "high",
    description: "Generic terms like 'meat meal,' 'poultry by-product meal,' or 'animal fat' hide what animal the ingredient came from. Quality and consistency are unknown.",
    whatToLookFor: "Always choose foods with named protein sources: 'chicken meal,' 'salmon,' 'turkey.' If it doesn't say the animal, the manufacturer is hiding something."
  },
  {
    title: "Ingredient Splitting",
    severity: "high",
    description: "Manufacturers list the same ingredient multiple ways to make it appear lower on the ingredient list. Example: listing 'peas,' 'pea protein,' 'pea flour,' and 'pea fiber' separately — combined, peas might be the #1 ingredient.",
    whatToLookFor: "Count up all forms of corn (corn, corn gluten meal, whole grain corn), all pea products, and all grain variants. Combined totals reveal the real picture."
  },
  {
    title: "'Natural' Label Claim",
    severity: "medium",
    description: "The word 'natural' on pet food is largely unregulated. AAFCO allows 'natural' claims even when synthetic vitamins and minerals are added.",
    whatToLookFor: "Ignore 'natural' on packaging. Read the actual ingredient list instead. Look for whole food ingredients you can recognize."
  },
  {
    title: "All Life Stages for Senior Cats",
    severity: "medium",
    description: "'All life stages' formulas must meet the minimum requirements for kittens — which means higher phosphorus levels. Senior cats with kidney disease need lower phosphorus.",
    whatToLookFor: "Senior cats (especially 10+) benefit from food specifically formulated for adults or seniors. Ask your vet about phosphorus levels if kidney health is a concern."
  },
  {
    title: "Misleading Front-of-Package Claims",
    severity: "high",
    description: "Phrases like 'real chicken recipe,' 'salmon flavor,' or 'with beef' have specific legal meanings that may surprise you. 'With beef' only requires 3% beef content.",
    whatToLookFor: "Rules: 95% rule (just 'Chicken Cat Food'), 25% rule ('Chicken Dinner/Entrée'), 3% rule ('with Chicken'), Flavor rule ('Chicken Flavor' — any detectable amount). Check the actual ingredient list."
  },
  {
    title: "Artificial Colors",
    severity: "medium",
    description: "Artificial colors like Red 40, Yellow 5, and Blue 2 serve no nutritional purpose — they're added to appeal to owners, not cats. Cats are partially color-blind.",
    whatToLookFor: "Cats don't care what color their food is. Artificial colors are a red flag that the manufacturer is more focused on visual appeal than nutrition quality."
  },
  {
    title: "Grain-Free ≠ Healthier",
    severity: "medium",
    description: "Grain-free foods often replace grains with high-glycemic starches (tapioca, potato) or legumes (peas, lentils). These can spike blood sugar and may be linked to heart issues.",
    whatToLookFor: "Compare the carbohydrate sources, not just whether it's grain-free. Tapioca starch is just as problematic as corn for overweight or diabetic cats. Focus on protein quality instead."
  },
  {
    title: "Vague Recall History",
    severity: "high",
    description: "Some brands have had significant recalls for contamination, excess vitamins, or foreign materials — issues that indicate quality control problems at the manufacturer.",
    whatToLookFor: "Search '[brand name] recall' before buying. Check FDA's pet food recall database. A single recall isn't necessarily disqualifying, but patterns of recalls are a serious red flag."
  }
];

// ─── INSERT DATA ──────────────────────────────────────────────────────────────
const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products (
    name, brand, line, type, lifeStage, retailer, priceRange,
    sizes, proteinPct, fatPct, fiberPct, moisturePct, calPerCup,
    firstIngredients, keyFeatures, concerns, transparencyScore,
    aafco, bestFor, avoid, recallHistory, country
  ) VALUES (
    @name, @brand, @line, @type, @lifeStage, @retailer, @priceRange,
    @sizes, @proteinPct, @fatPct, @fiberPct, @moisturePct, @calPerCup,
    @firstIngredients, @keyFeatures, @concerns, @transparencyScore,
    @aafco, @bestFor, @avoid, @recallHistory, @country
  )
`);

const insertIngredient = db.prepare(`
  INSERT OR IGNORE INTO ingredients (name, rating, category, explanation, misleading, healthNotes)
  VALUES (@name, @rating, @category, @explanation, @misleading, @healthNotes)
`);

const insertRedFlag = db.prepare(`
  INSERT OR IGNORE INTO red_flags (title, severity, description, whatToLookFor)
  VALUES (@title, @severity, @description, @whatToLookFor)
`);

// Run all inserts in a transaction (faster + atomic)
db.exec("BEGIN");
for (const p of products) insertProduct.run(serializeProduct(p));
for (const i of ingredients) insertIngredient.run(i);
for (const f of redFlags) insertRedFlag.run(f);
db.exec("COMMIT");

console.log(`✓ Seeded ${products.length} products`);
console.log(`✓ Seeded ${ingredients.length} ingredients`);
console.log(`✓ Seeded ${redFlags.length} red flags`);
console.log("Database ready!");
