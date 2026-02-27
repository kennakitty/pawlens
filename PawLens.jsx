import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// PAWLENS - Cat Food Transparency & Comparison Platform
// ============================================================

// ---------- PRODUCT DATABASE (PetSmart Dry Cat Food) ----------
const PRODUCTS = [
  {
    id: 1, name: "Pro Plan Vital Systems Senior 7+ Salmon & Rice", brand: "Purina", line: "Pro Plan",
    type: "Dry", lifeStage: "Senior (7+)", retailer: "PetSmart",
    priceRange: "$24.98 - $49.98", sizes: ["3.2 lb", "5.5 lb", "13 lb"],
    proteinPct: 36, fatPct: 14, fiberPct: 5, moisturePct: 12, calPerCup: 438,
    firstIngredients: ["Salmon", "Rice", "Corn Gluten Meal", "Poultry By-Product Meal", "Soybean Meal"],
    keyFeatures: ["Glucosamine & Omega-3s for joint support", "Probiotics for digestive health", "EPA for brain function in seniors", "Antioxidants for immune support"],
    concerns: ["Contains corn gluten meal", "Contains by-product meal"],
    transparencyScore: 7.2,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Senior cats with joint/mobility issues", "Cats needing brain health support", "Multi-system senior support"],
    avoid: ["Cats with corn sensitivity", "Cats needing low-phosphorus diet"],
    recallHistory: "No recent recalls for this specific product",
    country: "USA"
  },
  {
    id: 2, name: "MedalSeries Weight Management Salmon & Sweet Potato", brand: "Nulo", line: "MedalSeries",
    type: "Dry", lifeStage: "Adult", retailer: "PetSmart",
    priceRange: "$22.99 - $44.99", sizes: ["4 lb", "12 lb"],
    proteinPct: 36, fatPct: 10, fiberPct: 8, moisturePct: 10, calPerCup: 350,
    firstIngredients: ["Deboned Salmon", "Turkey Meal", "Menhaden Fish Meal", "Sweet Potato", "Whole Peas"],
    keyFeatures: ["High fiber (8%) for hunger control", "Low fat (10%) for weight management", "L-Carnitine for metabolism", "Grain-free formula", "Patented BC30 Probiotic"],
    concerns: ["Grain-free (monitor for DCM research)", "Legume-heavy formula"],
    transparencyScore: 8.1,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Overweight cats", "Cats that beg or feel hungry constantly", "Weight loss programs"],
    avoid: ["Underweight cats", "Kittens", "Cats needing high calorie intake"],
    recallHistory: "No recalls on record",
    country: "USA"
  },
  {
    id: 3, name: "Baked & Coated Salmon & Chicken", brand: "Nulo", line: "MedalSeries",
    type: "Dry", lifeStage: "Adult", retailer: "PetSmart",
    priceRange: "$14.99 - $34.99", sizes: ["2.75 lb", "8 lb"],
    proteinPct: 38, fatPct: 16, fiberPct: 4, moisturePct: 9, calPerCup: 420,
    firstIngredients: ["Deboned Salmon", "Chicken Meal", "Chickpeas", "Sweet Potato", "Chicken Fat"],
    keyFeatures: ["Oven-baked for denser crunch", "Bone broth coated for flavor", "High protein for muscle maintenance", "Grain-free formula"],
    concerns: ["Higher fat content (16%)", "Grain-free (monitor for DCM research)", "Chickpea-heavy"],
    transparencyScore: 8.0,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Picky eaters who need texture variety", "Cats needing muscle maintenance", "Cats transitioning from high-fat foods like Crave"],
    avoid: ["Overweight cats if fed alone", "Cats on calorie-restricted diets"],
    recallHistory: "No recalls on record",
    country: "USA"
  },
  {
    id: 4, name: "Indoor Advantage Senior 11+ Chicken & Rice", brand: "Hill's Science Diet", line: "Science Diet",
    type: "Dry", lifeStage: "Senior (11+)", retailer: "PetSmart",
    priceRange: "$29.99 - $54.99", sizes: ["3.5 lb", "7 lb", "15.5 lb"],
    proteinPct: 31, fatPct: 14, fiberPct: 8.5, moisturePct: 8, calPerCup: 371,
    firstIngredients: ["Chicken", "Brown Rice", "Corn Gluten Meal", "Whole Grain Wheat", "Chicken Meal"],
    keyFeatures: ["High fiber for indoor/low-activity cats", "Natural fiber for hairball control", "Balanced minerals for kidney health", "Antioxidants for immune support"],
    concerns: ["Contains corn gluten meal", "Contains whole grain wheat", "Multiple grain sources"],
    transparencyScore: 6.8,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Indoor senior cats 11+", "Cats prone to hairballs", "Cats needing gentle kidney support"],
    avoid: ["Cats with grain sensitivity", "Active outdoor cats"],
    recallHistory: "Hill's had voluntary recalls in 2019 for elevated Vitamin D in select canned foods (not this product)",
    country: "USA"
  },
  {
    id: 5, name: "Healthy Aging 12+ Dry Cat Food", brand: "Royal Canin", line: "Feline Health Nutrition",
    type: "Dry", lifeStage: "Senior (12+)", retailer: "PetSmart",
    priceRange: "$33.99 - $55.99", sizes: ["3 lb", "6 lb"],
    proteinPct: 34, fatPct: 18, fiberPct: 4.9, moisturePct: 8, calPerCup: 389,
    firstIngredients: ["Chicken By-Product Meal", "Corn", "Brown Rice", "Wheat Gluten", "Corn Gluten Meal"],
    keyFeatures: ["Tailored nutrients for 12+ cats", "Highly digestible proteins", "Specific kibble shape for aging jaws", "EPA/DHA for cognitive health"],
    concerns: ["By-product meal as first ingredient", "Multiple corn/wheat sources", "Higher price point", "Less transparent sourcing"],
    transparencyScore: 5.5,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Very senior cats 12+", "Cats with reduced appetite", "Cats needing easily digestible food"],
    avoid: ["Budget-conscious buyers", "Those wanting named whole protein first", "Cats with corn/wheat sensitivity"],
    recallHistory: "No recent recalls",
    country: "Manufactured in USA and Canada"
  },
  {
    id: 6, name: "Wilderness Indoor Chicken Recipe", brand: "Blue Buffalo", line: "Wilderness",
    type: "Dry", lifeStage: "Adult", retailer: "PetSmart",
    priceRange: "$23.98 - $44.98", sizes: ["4 lb", "9.5 lb"],
    proteinPct: 36, fatPct: 14, fiberPct: 7, moisturePct: 9, calPerCup: 389,
    firstIngredients: ["Deboned Chicken", "Chicken Meal", "Pea Protein", "Tapioca Starch", "Peas"],
    keyFeatures: ["High protein grain-free", "LifeSource Bits (antioxidant blend)", "No corn, wheat, or soy", "No artificial preservatives"],
    concerns: ["Contains pea protein (plant-based protein filler)", "Tapioca starch (limited nutritional value)", "Blue Buffalo has had multiple lawsuit settlements over ingredient accuracy"],
    transparencyScore: 6.0,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Indoor cats needing high protein", "Cats sensitive to grains"],
    avoid: ["Cats with legume sensitivity", "Buyers wanting fully transparent sourcing"],
    recallHistory: "Blue Buffalo has faced multiple recalls and lawsuits regarding ingredient accuracy and contamination across various product lines",
    country: "USA"
  },
  {
    id: 7, name: "Complete Health Adult Deboned Chicken & Chicken Meal", brand: "Wellness", line: "Complete Health",
    type: "Dry", lifeStage: "Adult", retailer: "PetSmart",
    priceRange: "$20.99 - $49.99", sizes: ["2.5 lb", "5.5 lb", "12 lb"],
    proteinPct: 38, fatPct: 14, fiberPct: 4, moisturePct: 10, calPerCup: 408,
    firstIngredients: ["Deboned Chicken", "Chicken Meal", "Rice", "Barley", "Ground Flaxseed"],
    keyFeatures: ["Named whole protein first", "No meat by-products", "No artificial preservatives", "Omega fatty acids from flaxseed", "Cranberries for urinary health"],
    concerns: ["Some cats find kibble too small", "Not grain-free (good or bad depending on preference)"],
    transparencyScore: 8.5,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["General adult maintenance", "Cats needing urinary support", "Owners wanting transparent ingredients"],
    avoid: ["Cats with chicken allergy", "Cats needing specialized senior formula"],
    recallHistory: "Limited recall history, generally clean record",
    country: "USA"
  },
  {
    id: 8, name: "Instinct Original Grain-Free Chicken", brand: "Instinct", line: "Original",
    type: "Dry", lifeStage: "All Life Stages", retailer: "PetSmart",
    priceRange: "$24.99 - $54.99", sizes: ["4.5 lb", "11 lb"],
    proteinPct: 41, fatPct: 20.5, fiberPct: 3, moisturePct: 9, calPerCup: 485,
    firstIngredients: ["Chicken", "Turkey Meal", "Chicken Meal", "Menhaden Fish Meal", "Peas"],
    keyFeatures: ["Very high protein (41%)", "Raw coated kibble", "Freeze-dried raw toppers", "No corn, wheat, soy, or by-products", "Probiotics"],
    concerns: ["Very high fat (20.5%)", "High calorie density", "Premium price point", "Grain-free with legumes"],
    transparencyScore: 7.8,
    aafco: "Formulated to meet AAFCO nutrient profiles for all life stages",
    bestFor: ["Active cats needing high protein", "Cats transitioning toward raw diet", "Picky eaters who like texture variety"],
    avoid: ["Overweight or sedentary cats", "Senior cats on calorie restriction", "Budget-conscious buyers"],
    recallHistory: "Instinct had a voluntary recall in 2023 for potential salmonella in raw frozen products (not kibble)",
    country: "USA"
  },
  {
    id: 9, name: "Simply Nourish Source Adult Chicken & Turkey", brand: "Simply Nourish", line: "Source",
    type: "Dry", lifeStage: "Adult", retailer: "PetSmart",
    priceRange: "$17.99 - $36.99", sizes: ["3 lb", "6 lb", "11 lb"],
    proteinPct: 38, fatPct: 16, fiberPct: 5, moisturePct: 10, calPerCup: 395,
    firstIngredients: ["Chicken", "Chicken Meal", "Peas", "Lentils", "Chickpeas"],
    keyFeatures: ["PetSmart exclusive brand", "High protein", "No corn, wheat, soy, or by-products", "No artificial colors or flavors", "More affordable than premium brands"],
    concerns: ["Legume-heavy formula", "Store brand with less research transparency", "Grain-free with DCM concerns"],
    transparencyScore: 6.5,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Budget-friendly high-protein option", "Cats sensitive to corn/wheat/soy"],
    avoid: ["Cats with legume sensitivity", "Owners wanting extensively researched brands"],
    recallHistory: "Limited recall information available — store brands have less public tracking",
    country: "USA"
  },
  {
    id: 10, name: "Indoor Adult Chicken Recipe", brand: "IAMS", line: "ProActive Health",
    type: "Dry", lifeStage: "Adult", retailer: "PetSmart",
    priceRange: "$14.99 - $32.99", sizes: ["3.5 lb", "7 lb", "16 lb", "22 lb"],
    proteinPct: 30, fatPct: 11, fiberPct: 6.5, moisturePct: 10, calPerCup: 357,
    firstIngredients: ["Chicken", "Corn Grits", "Chicken By-Product Meal", "Dried Beet Pulp", "Corn Meal"],
    keyFeatures: ["Affordable large bag options", "L-Carnitine for weight management", "Tailored fiber blend", "Beet pulp for digestive health"],
    concerns: ["By-product meal in top 3", "Heavy corn content", "Lower protein than premium brands"],
    transparencyScore: 5.8,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Budget-conscious cat owners", "Indoor cats needing moderate calories", "Households with multiple cats"],
    avoid: ["Cats with corn allergy", "Owners wanting premium ingredients", "Cats needing high protein"],
    recallHistory: "IAMS has had occasional recalls over the years, most recently for potential salmonella contamination",
    country: "USA"
  },
  {
    id: 11, name: "ONE Indoor Advantage Adult Salmon & Tuna", brand: "Purina", line: "ONE",
    type: "Dry", lifeStage: "Adult", retailer: "PetSmart",
    priceRange: "$12.98 - $29.98", sizes: ["3.5 lb", "7 lb", "16 lb"],
    proteinPct: 34, fatPct: 13, fiberPct: 4.5, moisturePct: 12, calPerCup: 388,
    firstIngredients: ["Salmon", "Chicken By-Product Meal", "Corn Gluten Meal", "Whole Grain Corn", "Rice"],
    keyFeatures: ["Real salmon first ingredient", "Omega-6 for skin and coat", "Natural fiber for hairball control", "Good value for quality"],
    concerns: ["By-product meal as second ingredient", "Corn gluten meal", "Multiple grain/corn sources"],
    transparencyScore: 6.2,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Mid-budget indoor cats", "Cats who prefer fish flavors", "General maintenance"],
    avoid: ["Cats with corn sensitivity", "Owners wanting grain-free", "Cats needing specialized nutrition"],
    recallHistory: "Purina ONE has had limited recalls; parent company Purina has had recalls across other product lines",
    country: "USA"
  },
  {
    id: 12, name: "Senior Vitality 7+ Chicken & Rice", brand: "Hill's Science Diet", line: "Science Diet",
    type: "Dry", lifeStage: "Senior (7+)", retailer: "PetSmart",
    priceRange: "$28.99 - $52.99", sizes: ["3.5 lb", "6 lb", "15 lb"],
    proteinPct: 32, fatPct: 16, fiberPct: 4.2, moisturePct: 8, calPerCup: 408,
    firstIngredients: ["Chicken", "Brown Rice", "Corn Gluten Meal", "Chicken Meal", "Pork Fat"],
    keyFeatures: ["Clinically proven antioxidant blend", "Supports brain health in 7+ cats", "Easy-to-digest ingredients", "Veterinarian recommended"],
    concerns: ["Corn gluten meal", "Pork fat in top 5", "Lower protein than some competitors"],
    transparencyScore: 6.5,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Senior cats 7+ needing general support", "Cats transitioning to senior diet", "Vet-recommended starter senior food"],
    avoid: ["Cats with corn sensitivity", "Cats needing high protein", "Cats with kidney concerns (moderate phosphorus)"],
    recallHistory: "Hill's had voluntary recalls in 2019 for elevated Vitamin D in select canned foods (not this product)",
    country: "USA"
  },
  {
    id: 13, name: "Crave Indoor Adult Chicken Recipe", brand: "Crave", line: "Crave",
    type: "Dry", lifeStage: "Adult", retailer: "PetSmart",
    priceRange: "$14.99 - $27.98", sizes: ["4 lb", "10 lb"],
    proteinPct: 38, fatPct: 18, fiberPct: 4, moisturePct: 10, calPerCup: 440,
    firstIngredients: ["Chicken", "Chicken Meal", "Split Peas", "Lentils", "Chicken Fat"],
    keyFeatures: ["High protein", "No corn, wheat, soy", "No artificial preservatives", "Affordable grain-free option"],
    concerns: ["HIGH FAT (18%) — can cause selective eating/mining behavior", "High calorie density", "Tapioca starch in some formulas", "Blood sugar spikes from starch content", "All Life Stages formula not optimized for seniors"],
    transparencyScore: 5.0,
    aafco: "Formulated to meet AAFCO nutrient profiles for all life stages",
    bestFor: ["Young active cats", "Budget grain-free option"],
    avoid: ["Overweight cats", "Senior cats", "Cats that selectively eat (mining behavior)", "Multi-cat households where one cat overeats"],
    recallHistory: "No major recalls on record",
    country: "USA"
  },
  {
    id: 14, name: "Sensitive Stomach & Skin Chicken & Rice", brand: "Hill's Science Diet", line: "Science Diet",
    type: "Dry", lifeStage: "Adult", retailer: "PetSmart",
    priceRange: "$29.99 - $54.99", sizes: ["3.5 lb", "7 lb", "15.5 lb"],
    proteinPct: 31, fatPct: 17, fiberPct: 2.5, moisturePct: 8, calPerCup: 429,
    firstIngredients: ["Chicken", "Whole Grain Wheat", "Yellow Peas", "Corn Gluten Meal", "Brewers Rice"],
    keyFeatures: ["Prebiotic fiber for gentle digestion", "Omega-6 and vitamin E for skin health", "Single animal protein source", "Clinically proven antioxidants"],
    concerns: ["Whole grain wheat as second ingredient", "Corn gluten meal", "Lower fiber", "Higher fat"],
    transparencyScore: 6.5,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Cats with sensitive stomachs", "Cats with skin/coat issues", "Cats prone to vomiting from food"],
    avoid: ["Cats with wheat allergy", "Overweight cats (higher fat)", "Cats needing high fiber"],
    recallHistory: "Hill's had voluntary recalls in 2019 for elevated Vitamin D in select canned foods (not this product)",
    country: "USA"
  },
  {
    id: 15, name: "Senior 11+ Indoor Cat Food", brand: "Purina", line: "Pro Plan",
    type: "Dry", lifeStage: "Senior (11+)", retailer: "PetSmart",
    priceRange: "$26.98 - $49.98", sizes: ["3.2 lb", "5.5 lb", "13 lb"],
    proteinPct: 36, fatPct: 14, fiberPct: 4.5, moisturePct: 12, calPerCup: 424,
    firstIngredients: ["Turkey", "Corn Gluten Meal", "Soy Protein Isolate", "Rice", "Animal Fat"],
    keyFeatures: ["Formulated for 11+ year old cats", "Indoor formula with calorie control", "Antioxidants for aging immune system", "Prebiotic fiber"],
    concerns: ["Corn gluten meal and soy protein", "'Animal fat' not species-specific", "Multiple processed protein sources"],
    transparencyScore: 6.0,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Indoor senior cats 11+", "Cats needing moderate calorie control", "Budget-friendly senior option"],
    avoid: ["Cats with soy sensitivity", "Those wanting named fat sources", "Cats with kidney disease (check phosphorus)"],
    recallHistory: "No recent recalls for this specific product",
    country: "USA"
  },
  {
    id: 16, name: "MedalSeries Senior Cat Food Turkey & Sweet Potato", brand: "Nulo", line: "MedalSeries",
    type: "Dry", lifeStage: "Senior", retailer: "PetSmart",
    priceRange: "$22.99 - $44.99", sizes: ["4 lb", "12 lb"],
    proteinPct: 36, fatPct: 14, fiberPct: 5, moisturePct: 10, calPerCup: 390,
    firstIngredients: ["Deboned Turkey", "Turkey Meal", "Menhaden Fish Meal", "Sweet Potato", "Whole Peas"],
    keyFeatures: ["Named protein sources only", "L-Carnitine for metabolism", "BC30 Probiotic", "Grain-free senior formula", "Glucosamine & Chondroitin for joints"],
    concerns: ["Grain-free with legumes", "Premium price point"],
    transparencyScore: 8.3,
    aafco: "Formulated to meet AAFCO nutrient profiles for maintenance of adult cats",
    bestFor: ["Senior cats needing joint support", "Cats needing quality named proteins", "Owners wanting transparent ingredients"],
    avoid: ["Budget-conscious buyers", "Cats with turkey allergy"],
    recallHistory: "No recalls on record",
    country: "USA"
  }
];

// ---------- INGREDIENT GLOSSARY ----------
const INGREDIENTS = [
  { name: "Chicken By-Product Meal", rating: "caution", category: "Protein",
    explanation: "Ground, rendered parts of chicken other than meat — includes organs, feet, bones, and undeveloped eggs. While nutritious, it's less desirable than whole chicken or chicken meal because the quality and parts used can vary between batches.",
    misleading: "Companies sometimes list this far down the ingredient list after water-heavy whole meats to make it seem less prominent, even though it may contribute more actual protein by weight.",
    healthNotes: "Digestible protein source but inconsistent quality. Named by-products (chicken by-product) are better than unnamed (poultry by-product)." },
  { name: "Corn Gluten Meal", rating: "caution", category: "Protein/Filler",
    explanation: "A dried residue from corn after removing the starch, germ, and bran. It's a plant-based protein that inflates the total protein percentage on the label without providing the amino acid profile cats actually need.",
    misleading: "Allows manufacturers to claim high protein content on the label when much of that protein comes from plants, not the animal sources cats require as obligate carnivores.",
    healthNotes: "Cats are obligate carnivores and need animal-based proteins. Corn gluten meal is less biologically appropriate but not harmful. Watch for foods where this is in the top 3 ingredients." },
  { name: "Deboned Chicken", rating: "good", category: "Protein",
    explanation: "Whole chicken meat with bones removed. High quality, highly digestible protein source. When listed first, it means there's more chicken by weight than any other single ingredient before cooking.",
    misleading: "Because whole chicken contains about 70% water, after cooking/processing, the actual protein contribution shrinks significantly. A food listing 'deboned chicken' first may actually have more corn or meal by dry weight.",
    healthNotes: "Excellent protein source for cats. Look for named proteins (chicken, turkey, salmon) rather than generic terms (meat, poultry)." },
  { name: "Tapioca Starch", rating: "caution", category: "Carbohydrate/Binder",
    explanation: "A starchy extract from cassava root. Provides almost zero nutritional value for cats — it's used as a binding agent to hold kibble together and as a cheap carbohydrate filler.",
    misleading: "Often found in 'grain-free' foods as a substitute for grains. Marketing implies grain-free is healthier, but tapioca starch is nutritionally worse than most grains for cats.",
    healthNotes: "Can contribute to blood sugar spikes and weight gain, especially in sedentary or senior cats. High glycemic index." },
  { name: "Pea Protein", rating: "caution", category: "Protein/Filler",
    explanation: "Concentrated protein extracted from peas. Like corn gluten meal, it's a plant-based protein used to boost the protein percentage on the label without providing the complete amino acid profile cats need.",
    misleading: "Peas may appear multiple times in different forms (peas, pea protein, pea fiber, pea starch) — this is called 'ingredient splitting' and can disguise how much of the food is actually peas.",
    healthNotes: "Not harmful in small amounts but shouldn't be a primary protein source for cats. Part of the ongoing DCM (heart disease) research in relation to legume-heavy diets." },
  { name: "Salmon", rating: "good", category: "Protein",
    explanation: "Whole salmon meat, an excellent source of protein and naturally rich in omega-3 fatty acids (EPA and DHA) which support brain function, skin health, and joint inflammation.",
    misleading: "Like all whole meats listed first, the water content means the actual protein contribution after processing is less than it appears. Still a quality ingredient.",
    healthNotes: "Great for senior cats needing anti-inflammatory support. Omega-3s support cognitive health, skin, and joints." },
  { name: "Chicken Meal", rating: "good", category: "Protein",
    explanation: "Chicken that has been cooked and dried to remove water, then ground into powder. Because the water is already removed, it's actually a more concentrated source of protein than whole 'deboned chicken.'",
    misleading: "Sounds less appetizing than 'deboned chicken' but is often a better indicator of actual protein content in the final product.",
    healthNotes: "Highly concentrated animal protein. Named meal (chicken meal) is always better than unnamed (meat meal or poultry meal)." },
  { name: "Brown Rice", rating: "neutral", category: "Carbohydrate",
    explanation: "A whole grain that provides digestible carbohydrates, some fiber, and B vitamins. Considered one of the better grain options for cat food because it's gentle on digestion.",
    misleading: "Sometimes marketing pushes 'grain-free' as superior, but brown rice is actually well-tolerated by most cats and provides useful nutrients. Grain-free alternatives (tapioca, peas) aren't necessarily better.",
    healthNotes: "Well-tolerated by most cats. Provides sustained energy without dramatic blood sugar spikes. Good option for cats with sensitive stomachs." },
  { name: "Sweet Potato", rating: "neutral", category: "Carbohydrate",
    explanation: "A root vegetable providing complex carbohydrates, fiber, and beta-carotene. Common in grain-free formulas as a carb source.",
    misleading: "Often highlighted on the front of 'grain-free' packaging to suggest a more natural diet, but cats have no nutritional requirement for sweet potatoes.",
    healthNotes: "Better than tapioca or corn as a carb source. Provides fiber and nutrients. Lower glycemic index than some alternatives." },
  { name: "Whole Peas / Split Peas / Lentils", rating: "caution", category: "Carbohydrate/Protein",
    explanation: "Legumes used as carbohydrate and protein sources in grain-free foods. They provide fiber and some protein but are part of ongoing FDA investigation into a potential link to dilated cardiomyopathy (DCM) in pets.",
    misleading: "Often split across multiple entries (peas, pea protein, pea fiber) to prevent any single pea ingredient from appearing too high on the list. This is called ingredient splitting.",
    healthNotes: "The FDA is investigating a potential link between legume-heavy pet diets and heart disease (DCM). Research is ongoing and not conclusive, but worth monitoring." },
  { name: "Ground Flaxseed", rating: "good", category: "Supplement/Fiber",
    explanation: "Provides omega-3 fatty acids (ALA form), fiber, and lignans. A natural anti-inflammatory that supports skin, coat, and digestive health.",
    misleading: "The omega-3s in flaxseed (ALA) are plant-based and cats cannot efficiently convert them to the EPA/DHA forms they actually need. Fish oil is a more effective omega-3 source for cats.",
    healthNotes: "Good supplemental ingredient but shouldn't be the sole source of omega-3s. The fiber content supports digestion." },
  { name: "Glucosamine / Chondroitin", rating: "good", category: "Supplement",
    explanation: "Joint support supplements often added to senior formulas. Glucosamine helps rebuild cartilage, chondroitin helps retain water in joints for cushioning.",
    misleading: "The amounts in cat food are often too low to have therapeutic effect. Check the guaranteed analysis — meaningful doses are 400+ ppm glucosamine.",
    healthNotes: "Essential for senior cats with joint stiffness or mobility issues. More effective when combined with omega-3 fatty acids." },
  { name: "Green-Lipped Mussel", rating: "good", category: "Supplement",
    explanation: "A shellfish from New Zealand that's a natural source of glucosamine, chondroitin, AND omega-3 fatty acids all in one ingredient. Considered one of the most effective natural joint support ingredients available.",
    misleading: "Rarely misleading — when present, it's genuinely beneficial. However, it's sometimes listed very low on ingredient lists, meaning the amount included may be minimal.",
    healthNotes: "Excellent for senior cats with joint and mobility issues. Combines multiple joint-support compounds naturally. Look for this in senior formulas." },
  { name: "L-Carnitine", rating: "good", category: "Supplement",
    explanation: "An amino acid that helps the body convert fat into energy. Particularly useful in weight management formulas because it helps cats burn fat rather than store it.",
    misleading: "Sometimes featured prominently in marketing even when present in very small amounts. Check if the product actually targets weight management or just includes trace amounts.",
    healthNotes: "Genuinely helpful for overweight cats. Supports metabolism and helps maintain lean muscle mass during weight loss." },
  { name: "Animal Fat (Generic)", rating: "poor", category: "Fat",
    explanation: "Fat from an unspecified animal source. Because the species isn't named, it could come from any rendered animal — this lack of specificity is a quality and transparency concern.",
    misleading: "Named fats (chicken fat, salmon oil) are always preferable because you know exactly what you're getting. 'Animal fat' allows manufacturers to use the cheapest available source, which can change between batches.",
    healthNotes: "Not inherently dangerous but indicates lower quality control and transparency. Cats with food sensitivities may react unpredictably since the source can vary." },
  { name: "BHA / BHT / Ethoxyquin", rating: "poor", category: "Preservative",
    explanation: "Chemical preservatives used to prevent fats from going rancid. BHA and BHT are synthetic antioxidants that have raised health concerns in research studies.",
    misleading: "Sometimes these don't appear on the label because they were added to an ingredient (like fish meal) by the supplier before the cat food manufacturer received it.",
    healthNotes: "Look for natural preservatives instead: mixed tocopherols (vitamin E), rosemary extract, or citric acid. Most premium brands have moved away from chemical preservatives." }
];

// ---------- RED FLAGS DATA ----------
const RED_FLAGS = [
  { title: "Unnamed Protein Sources", severity: "high",
    description: "Ingredients listed as 'meat meal,' 'poultry by-product,' or 'animal fat' without naming the specific species. This means the source can change between batches and may include rendered materials from various animals.",
    whatToLookFor: "Look for named proteins: 'chicken meal' not 'meat meal,' 'chicken fat' not 'animal fat,' 'turkey by-product meal' not 'poultry by-product meal.'" },
  { title: "Ingredient Splitting", severity: "high",
    description: "When a manufacturer breaks one ingredient into multiple entries to push it lower on the list. For example: peas, pea protein, pea fiber, and pea starch are all peas — if combined, peas might be the #1 ingredient.",
    whatToLookFor: "Watch for the same ingredient appearing in different forms. Common splits: corn/corn gluten meal/corn starch, peas/pea protein/pea fiber, rice/rice flour/rice bran." },
  { title: "'Natural' Label Claim", severity: "medium",
    description: "The word 'natural' on pet food has almost no regulatory meaning. AAFCO defines it loosely as 'derived from plant, animal, or mined sources' — which covers almost everything. It does NOT mean organic, non-GMO, or free from processing.",
    whatToLookFor: "Ignore 'natural' claims on packaging. Focus on the actual ingredient list and guaranteed analysis instead." },
  { title: "All Life Stages for Senior Cats", severity: "medium",
    description: "Foods labeled 'All Life Stages' meet the nutritional minimums for kittens, which means they're often higher in calories, fat, and minerals than what a senior cat needs. Feeding these to senior cats can contribute to obesity and kidney strain.",
    whatToLookFor: "Senior cats (7+) should ideally eat food formulated specifically for their life stage, with controlled phosphorus, appropriate calories, and joint support ingredients." },
  { title: "Misleading Front-of-Package Claims", severity: "high",
    description: "The front of the bag is marketing, not nutrition. Claims like 'Real Chicken First Ingredient,' 'Grain-Free,' 'Vet Recommended,' and 'Premium' are designed to sell, not to inform. The truth is in the ingredient list and guaranteed analysis on the back.",
    whatToLookFor: "Always flip the bag. Read the ingredient list (ingredients are listed by weight in descending order) and the guaranteed analysis. That's where the real information lives." },
  { title: "Artificial Colors", severity: "medium",
    description: "Some cat foods contain artificial colors (Red 40, Yellow 5, Blue 2) purely for the owner's benefit — cats don't care what color their food is. These additives have been linked to health concerns in some studies.",
    whatToLookFor: "Check for numbered color additives in the ingredient list. Premium foods never include artificial colors." },
  { title: "Grain-Free ≠ Healthier", severity: "medium",
    description: "The grain-free trend was driven by marketing, not science. The FDA has been investigating a potential link between grain-free diets (specifically those high in legumes like peas and lentils) and dilated cardiomyopathy (DCM) in pets.",
    whatToLookFor: "Don't choose grain-free by default. Unless your cat has a diagnosed grain allergy, grain-inclusive foods with named grains (brown rice, barley, oats) are generally safe and well-tolerated." },
  { title: "Recall History", severity: "high",
    description: "Some brands have repeated patterns of recalls for contamination, elevated vitamins, or mislabeled ingredients. A single recall isn't necessarily damning, but a pattern suggests systemic quality control issues.",
    whatToLookFor: "Check the FDA's pet food recall database. Look for patterns, not just isolated incidents. Brands with manufacturing transparency tend to have fewer issues." }
];

// ---------- COLOR PALETTE ----------
const colors = {
  bg: "#FAF8F5",
  card: "#FFFFFF",
  primary: "#2D5A3D",
  primaryLight: "#E8F0EB",
  accent: "#D4763A",
  accentLight: "#FDF0E8",
  text: "#1A1A1A",
  textMed: "#555555",
  textLight: "#888888",
  border: "#E8E4DF",
  good: "#2D7A4F",
  goodBg: "#E8F5ED",
  caution: "#B8860B",
  cautionBg: "#FFF8E7",
  poor: "#C0392B",
  poorBg: "#FDE8E5",
  neutral: "#5B7B9A",
  neutralBg: "#EDF2F7",
};

// ---------- MAIN APP ----------
export default function PawLens() {
  const [page, setPage] = useState("home");
  const [catInput, setCatInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [filterBrand, setFilterBrand] = useState("All");
  const [filterLifeStage, setFilterLifeStage] = useState("All");
  const [filterSort, setFilterSort] = useState("transparencyScore");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const chatEndRef = useRef(null);

  const brands = ["All", ...new Set(PRODUCTS.map(p => p.brand))].sort();
  const lifeStages = ["All", ...new Set(PRODUCTS.map(p => p.lifeStage))];

  const filteredProducts = PRODUCTS.filter(p => {
    if (filterBrand !== "All" && p.brand !== filterBrand) return false;
    if (filterLifeStage !== "All" && p.lifeStage !== filterLifeStage) return false;
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase()) && !p.brand.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (filterSort === "transparencyScore") return b.transparencyScore - a.transparencyScore;
    if (filterSort === "proteinPct") return b.proteinPct - a.proteinPct;
    if (filterSort === "fatPct") return a.fatPct - b.fatPct;
    return 0;
  });

  const filteredIngredients = INGREDIENTS.filter(i =>
    !searchTerm || i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function handleAIRecommendation() {
    if (!catInput.trim()) return;
    setIsLoading(true);
    setAiResponse("");

    const productSummaries = PRODUCTS.map(p =>
      `${p.name} (${p.brand}) - ${p.type}, ${p.lifeStage}, Protein:${p.proteinPct}%, Fat:${p.fatPct}%, Fiber:${p.fiberPct}%, Score:${p.transparencyScore}/10, Price:${p.priceRange}, Best for: ${p.bestFor.join(", ")}, Avoid for: ${p.avoid.join(", ")}, Key: ${p.keyFeatures.join(", ")}, Concerns: ${p.concerns.join(", ")}`
    ).join("\n");

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are PawLens, a warm, knowledgeable cat nutrition advisor. You genuinely care about each cat and their owner. 

CRITICAL RULES:
1. ONLY recommend products from this database — never make up products:
${productSummaries}

2. Think CREATIVELY. Don't just recommend one food — consider combination feeding strategies (mixing foods for different purposes), rotation feeding, and unconventional approaches that most pet owners wouldn't think of on their own. Present multiple options with clear reasoning.

3. For each recommendation, explain WHY in plain language — what specific ingredients or nutritional profile makes it right for THIS cat's specific situation. Reference actual percentages and ingredients.

4. Flag any current foods mentioned that may be problematic and explain specifically why.

5. Be honest about trade-offs. No food is perfect — tell them the pros AND cons.

6. If the situation involves multiple cats sharing food, address that complexity directly with practical solutions.

7. NEVER be generic. Every response should feel like it was written specifically for this person's cat(s).

8. At the end, note any ingredients they should discuss with their vet based on what they've shared.

Format with clear sections. Use plain language, not jargon. Be warm but direct — no fluff.`,
          messages: [{ role: "user", content: catInput }]
        })
      });
      const data = await response.json();
      const text = data.content?.map(i => i.text || "").join("\n") || "Sorry, I had trouble generating recommendations. Please try again.";
      setAiResponse(text);
    } catch (err) {
      setAiResponse("Something went wrong connecting to the AI. Please try again in a moment.");
    }
    setIsLoading(false);
  }

  function ScoreBar({ score, max = 10 }) {
    const pct = (score / max) * 100;
    const color = score >= 7.5 ? colors.good : score >= 6 ? colors.caution : colors.poor;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, height: 8, background: colors.border, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.5s ease" }} />
        </div>
        <span style={{ fontWeight: 700, color, fontSize: 14, minWidth: 36 }}>{score}/10</span>
      </div>
    );
  }

  function RatingBadge({ rating }) {
    const config = {
      good: { bg: colors.goodBg, color: colors.good, label: "✓ Good" },
      neutral: { bg: colors.neutralBg, color: colors.neutral, label: "— Neutral" },
      caution: { bg: colors.cautionBg, color: colors.caution, label: "⚠ Caution" },
      poor: { bg: colors.poorBg, color: colors.poor, label: "✗ Avoid" }
    };
    const c = config[rating] || config.neutral;
    return (
      <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 12, background: c.bg, color: c.color, fontSize: 12, fontWeight: 600 }}>
        {c.label}
      </span>
    );
  }

  function SeverityBadge({ severity }) {
    const config = {
      high: { bg: colors.poorBg, color: colors.poor, label: "High Risk" },
      medium: { bg: colors.cautionBg, color: colors.caution, label: "Watch For" }
    };
    const c = config[severity] || config.medium;
    return (
      <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 12, background: c.bg, color: c.color, fontSize: 12, fontWeight: 600 }}>
        {c.label}
      </span>
    );
  }

  // ---------- NAV ----------
  function Nav() {
    const navItems = [
      { id: "home", label: "Home", icon: "🐱" },
      { id: "recommend", label: "Get Recommendations", icon: "🔍" },
      { id: "browse", label: "Browse Foods", icon: "🗂" },
      { id: "ingredients", label: "Ingredient Decoder", icon: "🧪" },
      { id: "redflags", label: "Red Flags", icon: "🚩" },
    ];
    return (
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(250,248,245,0.92)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${colors.border}`, padding: "0 20px"
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 8, overflowX: "auto" }}>
          <div onClick={() => setPage("home")} style={{ cursor: "pointer", padding: "14px 12px 14px 0", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 22 }}>🔎</span>
            <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: colors.primary }}>PawLens</span>
          </div>
          <div style={{ display: "flex", gap: 2, marginLeft: "auto" }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => { setPage(item.id); setSelectedProduct(null); setSelectedIngredient(null); setSearchTerm(""); }}
                style={{
                  padding: "10px 14px", border: "none", cursor: "pointer", borderRadius: 8, fontSize: 13, fontWeight: 500,
                  background: page === item.id ? colors.primaryLight : "transparent",
                  color: page === item.id ? colors.primary : colors.textMed,
                  transition: "all 0.2s", whiteSpace: "nowrap"
                }}>
                <span style={{ marginRight: 4 }}>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
    );
  }

  // ---------- HOME PAGE ----------
  function HomePage() {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔎</div>
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 42, color: colors.primary, marginBottom: 12, lineHeight: 1.2 }}>
          PawLens
        </h1>
        <p style={{ fontSize: 19, color: colors.accent, fontWeight: 500, marginBottom: 32 }}>
          See what's really in the bowl.
        </p>
        <p style={{ fontSize: 16, color: colors.textMed, maxWidth: 560, margin: "0 auto 48px", lineHeight: 1.7 }}>
          I built PawLens after discovering I'd been making the wrong food choices for my cats — fooled by fancy packaging and misleading labels. Every pet owner deserves the truth about what they're feeding their pets. No marketing spin, no generic advice — just honest, personalized recommendations backed by real nutritional data.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, textAlign: "left", marginBottom: 48 }}>
          {[
            { icon: "🔍", title: "Tell Us About Your Cat", desc: "Describe your cat's breed, age, health needs, and preferences. Our AI thinks outside the box to find creative solutions." },
            { icon: "🧪", title: "Decode Any Ingredient", desc: "Plain-language explanations of what's actually in cat food and what the labels don't tell you." },
            { icon: "📊", title: "Transparency Scores", desc: "Every product rated on ingredient honesty, not marketing claims. See through the pretty packaging." },
            { icon: "🚩", title: "Red Flag Alerts", desc: "Recalls, misleading claims, and ingredients to watch — the stuff brands hope you don't notice." }
          ].map((card, i) => (
            <div key={i} style={{
              background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12,
              padding: 24, transition: "box-shadow 0.2s",
            }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{card.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 8 }}>{card.title}</h3>
              <p style={{ fontSize: 13, color: colors.textMed, lineHeight: 1.6, margin: 0 }}>{card.desc}</p>
            </div>
          ))}
        </div>
        <button onClick={() => setPage("recommend")} style={{
          padding: "16px 40px", background: colors.primary, color: "#fff", border: "none",
          borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: "pointer",
          boxShadow: "0 4px 14px rgba(45,90,61,0.25)", transition: "transform 0.2s"
        }}>
          Get Personalized Recommendations →
        </button>
        <p style={{ fontSize: 12, color: colors.textLight, marginTop: 32 }}>
          Currently covering PetSmart dry cat food. Wet food, Petco, and Chewy coming soon.
        </p>
      </div>
    );
  }

  // ---------- RECOMMENDATION PAGE ----------
  function RecommendPage() {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
        <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, color: colors.primary, marginBottom: 8 }}>
          Tell us about your cat
        </h2>
        <p style={{ color: colors.textMed, fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          Describe anything relevant: breed, age, weight, health conditions, current food, feeding setup, behavior quirks, what your vet has said — the more detail, the better the recommendations. We'll think creatively and give you multiple options.
        </p>
        <div style={{
          background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24, marginBottom: 24
        }}>
          <textarea
            value={catInput}
            onChange={(e) => setCatInput(e.target.value)}
            placeholder={"Example: I have two senior cats that share food. Cat A is a 12-year-old large breed at healthy weight, Cat B is an 11-year-old mixed breed about 2 lbs overweight with mobility issues — she struggles to jump and walks slowly. They both live in a temperature-controlled shed and prefer crunchy kibble. I've been feeding them Crave dry food but noticed one cat digs through the bowl picking out fatty pieces while the other seems always hungry. What should I feed them?"}
            style={{
              width: "100%", minHeight: 160, padding: 16, border: `1px solid ${colors.border}`,
              borderRadius: 8, fontSize: 14, fontFamily: "inherit", resize: "vertical",
              lineHeight: 1.6, color: colors.text, background: colors.bg,
              boxSizing: "border-box"
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <span style={{ fontSize: 12, color: colors.textLight }}>
              💡 Tip: Mention any vet recommendations, allergies, texture preferences, or budget constraints
            </span>
            <button
              onClick={handleAIRecommendation}
              disabled={isLoading || !catInput.trim()}
              style={{
                padding: "12px 28px", background: isLoading ? colors.textLight : colors.primary,
                color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
                cursor: isLoading ? "wait" : "pointer", opacity: !catInput.trim() ? 0.5 : 1
              }}
            >
              {isLoading ? "Analyzing..." : "Get Recommendations"}
            </button>
          </div>
        </div>

        {isLoading && (
          <div style={{ textAlign: "center", padding: 40, color: colors.textMed }}>
            <div style={{ fontSize: 32, marginBottom: 12, animation: "pulse 1.5s infinite" }}>🔍</div>
            <p>Analyzing your cat's needs and searching our database for the best matches...</p>
            <style>{`@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }`}</style>
          </div>
        )}

        {aiResponse && !isLoading && (
          <div style={{
            background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12,
            padding: 28, lineHeight: 1.75, color: colors.text
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${colors.border}` }}>
              <span style={{ fontSize: 20 }}>🔎</span>
              <span style={{ fontWeight: 700, color: colors.primary }}>PawLens Recommendations</span>
            </div>
            <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>
              {aiResponse.split("\n").map((line, i) => {
                if (line.startsWith("##")) return <h3 key={i} style={{ fontSize: 16, fontWeight: 700, color: colors.primary, margin: "20px 0 8px" }}>{line.replace(/^#+\s*/, "")}</h3>;
                if (line.startsWith("**") && line.endsWith("**")) return <p key={i} style={{ fontWeight: 700, color: colors.text, margin: "12px 0 4px" }}>{line.replace(/\*\*/g, "")}</p>;
                if (line.startsWith("- ") || line.startsWith("* ")) return <p key={i} style={{ paddingLeft: 16, margin: "4px 0", position: "relative" }}><span style={{ position: "absolute", left: 0, color: colors.accent }}>•</span>{line.replace(/^[-*]\s*/, "").replace(/\*\*/g, "")}</p>;
                if (line.trim() === "") return <div key={i} style={{ height: 8 }} />;
                return <p key={i} style={{ margin: "4px 0" }}>{line.replace(/\*\*/g, "")}</p>;
              })}
            </div>
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${colors.border}`, fontSize: 12, color: colors.textLight }}>
              ⚕️ PawLens provides nutritional information, not veterinary advice. Always consult your vet before making significant diet changes, especially for cats with health conditions.
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------- PRODUCT DETAIL ----------
  function ProductDetail({ product }) {
    const p = product;
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
        <button onClick={() => setSelectedProduct(null)} style={{
          background: "none", border: "none", color: colors.primary, cursor: "pointer",
          fontSize: 14, fontWeight: 500, marginBottom: 20, padding: 0
        }}>
          ← Back to all foods
        </button>
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 28 }}>
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: colors.accent, textTransform: "uppercase", letterSpacing: 1 }}>{p.brand} · {p.line}</span>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, color: colors.text, margin: "4px 0 12px" }}>{p.name}</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              <span style={{ padding: "4px 10px", background: colors.primaryLight, borderRadius: 6, fontSize: 12, color: colors.primary, fontWeight: 500 }}>{p.type}</span>
              <span style={{ padding: "4px 10px", background: colors.primaryLight, borderRadius: 6, fontSize: 12, color: colors.primary, fontWeight: 500 }}>{p.lifeStage}</span>
              <span style={{ padding: "4px 10px", background: colors.primaryLight, borderRadius: 6, fontSize: 12, color: colors.primary, fontWeight: 500 }}>{p.retailer}</span>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginBottom: 8 }}>Transparency Score</h3>
            <ScoreBar score={p.transparencyScore} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Protein", value: `${p.proteinPct}%`, color: p.proteinPct >= 35 ? colors.good : colors.caution },
              { label: "Fat", value: `${p.fatPct}%`, color: p.fatPct <= 14 ? colors.good : p.fatPct <= 17 ? colors.caution : colors.poor },
              { label: "Fiber", value: `${p.fiberPct}%`, color: colors.neutral },
              { label: "Moisture", value: `${p.moisturePct}%`, color: colors.neutral },
              { label: "Cal/Cup", value: p.calPerCup, color: colors.neutral },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: "center", padding: 12, background: colors.bg, borderRadius: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: colors.textMed, marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Price at {p.retailer}</h3>
            <p style={{ fontSize: 18, fontWeight: 700, color: colors.accent, margin: 0 }}>{p.priceRange}</p>
            <p style={{ fontSize: 12, color: colors.textMed }}>Available sizes: {p.sizes.join(", ")}</p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>First 5 Ingredients</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {p.firstIngredients.map((ing, i) => {
                const known = INGREDIENTS.find(gi => ing.toLowerCase().includes(gi.name.toLowerCase().split(" ")[0].toLowerCase()));
                const bgColor = known ? (known.rating === "good" ? colors.goodBg : known.rating === "caution" ? colors.cautionBg : known.rating === "poor" ? colors.poorBg : colors.neutralBg) : colors.bg;
                return (
                  <span key={i} style={{
                    padding: "5px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                    background: bgColor, color: colors.text, cursor: known ? "pointer" : "default"
                  }}
                  onClick={() => { if (known) { setSelectedIngredient(known); setPage("ingredients"); } }}>
                    {i + 1}. {ing}
                  </span>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.good, marginBottom: 8 }}>✓ Best For</h3>
              {p.bestFor.map((b, i) => <p key={i} style={{ fontSize: 13, color: colors.textMed, margin: "4px 0", paddingLeft: 12 }}>• {b}</p>)}
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.poor, marginBottom: 8 }}>✗ Avoid If</h3>
              {p.avoid.map((a, i) => <p key={i} style={{ fontSize: 13, color: colors.textMed, margin: "4px 0", paddingLeft: 12 }}>• {a}</p>)}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Key Features</h3>
            {p.keyFeatures.map((f, i) => <p key={i} style={{ fontSize: 13, color: colors.textMed, margin: "4px 0", paddingLeft: 12 }}>✦ {f}</p>)}
          </div>

          {p.concerns.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.caution, marginBottom: 8 }}>⚠ Concerns</h3>
              {p.concerns.map((c, i) => <p key={i} style={{ fontSize: 13, color: colors.textMed, margin: "4px 0", paddingLeft: 12 }}>• {c}</p>)}
            </div>
          )}

          <div style={{ padding: 16, background: colors.bg, borderRadius: 8, marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>AAFCO Statement</h3>
            <p style={{ fontSize: 12, color: colors.textMed, margin: 0 }}>{p.aafco}</p>
          </div>

          <div style={{ padding: 16, background: colors.bg, borderRadius: 8 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Recall History</h3>
            <p style={{ fontSize: 12, color: colors.textMed, margin: 0 }}>{p.recallHistory}</p>
          </div>
        </div>
      </div>
    );
  }

  // ---------- BROWSE PAGE ----------
  function BrowsePage() {
    if (selectedProduct) return <ProductDetail product={selectedProduct} />;
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
        <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, color: colors.primary, marginBottom: 8 }}>
          Browse All Cat Foods
        </h2>
        <p style={{ color: colors.textMed, fontSize: 14, marginBottom: 24 }}>
          {PRODUCTS.length} dry cat food products from PetSmart. Click any product for full details.
        </p>
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24, padding: 16,
          background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10
        }}>
          <input
            type="text" placeholder="Search by name or brand..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ flex: "1 1 200px", padding: "8px 12px", border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 13, fontFamily: "inherit" }}
          />
          <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)}
            style={{ padding: "8px 12px", border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 13, fontFamily: "inherit", background: "#fff" }}>
            {brands.map(b => <option key={b} value={b}>{b === "All" ? "All Brands" : b}</option>)}
          </select>
          <select value={filterLifeStage} onChange={e => setFilterLifeStage(e.target.value)}
            style={{ padding: "8px 12px", border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 13, fontFamily: "inherit", background: "#fff" }}>
            {lifeStages.map(l => <option key={l} value={l}>{l === "All" ? "All Life Stages" : l}</option>)}
          </select>
          <select value={filterSort} onChange={e => setFilterSort(e.target.value)}
            style={{ padding: "8px 12px", border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 13, fontFamily: "inherit", background: "#fff" }}>
            <option value="transparencyScore">Sort: Transparency Score</option>
            <option value="proteinPct">Sort: Highest Protein</option>
            <option value="fatPct">Sort: Lowest Fat</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {filteredProducts.map(p => (
            <div key={p.id} onClick={() => setSelectedProduct(p)}
              style={{
                background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12,
                padding: 20, cursor: "pointer", transition: "box-shadow 0.2s, transform 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: colors.accent, textTransform: "uppercase", letterSpacing: 0.5 }}>{p.brand}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: colors.primary }}>{p.priceRange}</span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: "0 0 12px", lineHeight: 1.3 }}>{p.name}</h3>
              <ScoreBar score={p.transparencyScore} />
              <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: colors.textMed }}>
                <span>Protein: <strong>{p.proteinPct}%</strong></span>
                <span>Fat: <strong>{p.fatPct}%</strong></span>
                <span>Fiber: <strong>{p.fiberPct}%</strong></span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
                <span style={{ padding: "2px 8px", background: colors.bg, borderRadius: 4, fontSize: 11, color: colors.textMed }}>{p.lifeStage}</span>
                <span style={{ padding: "2px 8px", background: colors.bg, borderRadius: 4, fontSize: 11, color: colors.textMed }}>{p.type}</span>
              </div>
            </div>
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <p style={{ textAlign: "center", color: colors.textMed, padding: 40 }}>No products match your filters. Try adjusting your search.</p>
        )}
      </div>
    );
  }

  // ---------- INGREDIENT DECODER PAGE ----------
  function IngredientsPage() {
    if (selectedIngredient) {
      const ing = selectedIngredient;
      return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
          <button onClick={() => setSelectedIngredient(null)} style={{
            background: "none", border: "none", color: colors.primary, cursor: "pointer",
            fontSize: 14, fontWeight: 500, marginBottom: 20, padding: 0
          }}>
            ← Back to all ingredients
          </button>
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: colors.textLight, textTransform: "uppercase", letterSpacing: 1 }}>{ing.category}</span>
                <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, color: colors.text, margin: "4px 0 0" }}>{ing.name}</h2>
              </div>
              <RatingBadge rating={ing.rating} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>What Is It?</h3>
              <p style={{ fontSize: 14, color: colors.textMed, lineHeight: 1.7, margin: 0 }}>{ing.explanation}</p>
            </div>

            <div style={{ padding: 16, background: colors.accentLight, borderRadius: 8, marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.accent, marginBottom: 8 }}>🏷 What Labels Don't Tell You</h3>
              <p style={{ fontSize: 14, color: colors.textMed, lineHeight: 1.7, margin: 0 }}>{ing.misleading}</p>
            </div>

            <div style={{ padding: 16, background: colors.primaryLight, borderRadius: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.primary, marginBottom: 8 }}>⚕️ Health Notes</h3>
              <p style={{ fontSize: 14, color: colors.textMed, lineHeight: 1.7, margin: 0 }}>{ing.healthNotes}</p>
            </div>

            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Found In These Products</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {PRODUCTS.filter(p => p.firstIngredients.some(fi => fi.toLowerCase().includes(ing.name.toLowerCase().split(" ")[0].toLowerCase()))).map(p => (
                  <span key={p.id} onClick={() => { setSelectedProduct(p); setPage("browse"); }}
                    style={{ padding: "5px 10px", background: colors.bg, borderRadius: 6, fontSize: 12, cursor: "pointer", color: colors.primary, fontWeight: 500 }}>
                    {p.brand} {p.name.split(" ").slice(0, 3).join(" ")}...
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
        <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, color: colors.primary, marginBottom: 8 }}>
          Ingredient Decoder
        </h2>
        <p style={{ color: colors.textMed, fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          Plain-language explanations of common cat food ingredients. Learn what's really in the bag and what the labels don't want you to know. Click any ingredient for the full breakdown.
        </p>
        <input
          type="text" placeholder="Search ingredients..."
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          style={{ width: "100%", padding: "10px 14px", border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 14, fontFamily: "inherit", marginBottom: 24, boxSizing: "border-box" }}
        />
        <div style={{ display: "grid", gap: 12 }}>
          {filteredIngredients.map((ing, i) => (
            <div key={i} onClick={() => setSelectedIngredient(ing)}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10,
                padding: "16px 20px", cursor: "pointer", transition: "box-shadow 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
            >
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: 0 }}>{ing.name}</h3>
                <p style={{ fontSize: 12, color: colors.textLight, margin: "4px 0 0" }}>{ing.category}</p>
              </div>
              <RatingBadge rating={ing.rating} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------- RED FLAGS PAGE ----------
  function RedFlagsPage() {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
        <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, color: colors.primary, marginBottom: 8 }}>
          Red Flags & Label Tricks
        </h2>
        <p style={{ color: colors.textMed, fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
          The tactics pet food companies use to make their products look better than they are. Learn to spot these so you never get fooled by packaging again.
        </p>
        <div style={{ display: "grid", gap: 16 }}>
          {RED_FLAGS.map((flag, i) => (
            <div key={i} style={{
              background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: colors.text, margin: 0 }}>🚩 {flag.title}</h3>
                <SeverityBadge severity={flag.severity} />
              </div>
              <p style={{ fontSize: 14, color: colors.textMed, lineHeight: 1.7, marginBottom: 16 }}>{flag.description}</p>
              <div style={{ padding: 14, background: colors.primaryLight, borderRadius: 8 }}>
                <p style={{ fontSize: 13, color: colors.primary, margin: 0, lineHeight: 1.6 }}>
                  <strong>What to look for:</strong> {flag.whatToLookFor}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------- RENDER ----------
  return (
    <div style={{ background: colors.bg, minHeight: "100vh", fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", color: colors.text }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet" />
      <Nav />
      {page === "home" && <HomePage />}
      {page === "recommend" && <RecommendPage />}
      {page === "browse" && <BrowsePage />}
      {page === "ingredients" && <IngredientsPage />}
      {page === "redflags" && <RedFlagsPage />}
      <footer style={{ textAlign: "center", padding: "40px 20px", borderTop: `1px solid ${colors.border}`, marginTop: 40 }}>
        <p style={{ fontSize: 12, color: colors.textLight, maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
          PawLens provides nutritional information for educational purposes. This is not veterinary advice. Always consult your veterinarian before making diet changes, especially for cats with health conditions. Product data should be verified with retailers for current pricing and availability.
        </p>
      </footer>
    </div>
  );
}
