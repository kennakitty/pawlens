import { Router } from "express";
import db, { parseProduct } from "../db.js";

const router = Router();

// POST /api/recommend — send cat description to OpenRouter AI
router.post("/", async (req, res) => {
  const { catInput, foodCategory = "Dry" } = req.body;
  if (!catInput?.trim()) {
    return res.status(400).json({ error: "Please describe your cat(s)." });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === "your_openrouter_key_here") {
    return res.status(503).json({
      error: "AI recommendations are not configured yet. Add your OpenRouter API key to get started."
    });
  }

  // Fetch products of the selected food category
  const products = db.prepare("SELECT * FROM products WHERE type = ? ORDER BY brand, name").all(foodCategory).map(parseProduct);

  // Build compact product catalog (name, brand, key stats only — no full ingredients)
  const productCatalog = products
    .map((p, i) => {
      const parts = [`[${i}] ${p.name} (${p.brand})`];
      if (p.lifeStage) parts.push(p.lifeStage);
      if (p.foodType) parts.push(p.foodType);
      if (p.calorieContent) parts.push(p.calorieContent);
      if (p.healthConsiderations?.length) parts.push(p.healthConsiderations.join(", "));
      if (p.nutritionalOptions?.length) parts.push(p.nutritionalOptions.join(", "));
      return parts.join(" | ");
    })
    .join("\n");

  // Step 1: Ask AI to pick top candidates from compact catalog
  const selectionPrompt = `You are PawLens, a cat nutrition advisor. A user described their cat(s) below. Pick the 8-12 BEST product numbers from this catalog for their needs. Return ONLY a JSON array of numbers, nothing else.

USER: ${catInput}

CATALOG (${products.length} PetSmart ${foodCategory.toLowerCase()} cat foods):
${productCatalog}`;

  try {
    const pickResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pawlens.app",
        "X-Title": "PawLens"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-haiku",
        max_tokens: 200,
        messages: [
          { role: "user", content: selectionPrompt }
        ]
      })
    });

    if (!pickResponse.ok) {
      const err = await pickResponse.text();
      console.error("OpenRouter selection error:", err);
      return res.status(502).json({ error: "AI service returned an error. Please try again." });
    }

    const pickData = await pickResponse.json();
    const pickText = pickData.choices?.[0]?.message?.content || "[]";

    // Parse the selected product indices
    const match = pickText.match(/\[[\d,\s]+\]/);
    const indices = match ? JSON.parse(match[0]) : [];
    const selected = indices
      .filter(i => i >= 0 && i < products.length)
      .map(i => products[i]);

    if (selected.length === 0) {
      return res.status(502).json({ error: "AI couldn't find matching products. Please try again with more detail." });
    }

    // Step 2: Send full details for selected products only
    const detailedList = selected
      .map(p => {
        const parts = [`**${p.name}** (${p.brand})`];
        if (p.lifeStage) parts.push(`Life Stage: ${p.lifeStage}`);
        if (p.flavor) parts.push(`Flavor: ${p.flavor}`);
        if (p.foodType) parts.push(`Type: ${p.foodType}`);
        if (p.guaranteedAnalysis) parts.push(`Guaranteed Analysis: ${p.guaranteedAnalysis}`);
        if (p.fullIngredients) parts.push(`Ingredients: ${p.fullIngredients}`);
        if (p.calorieContent) parts.push(`Calories: ${p.calorieContent}`);
        if (p.healthConsiderations?.length) parts.push(`Health: ${p.healthConsiderations.join(", ")}`);
        if (p.nutritionalOptions?.length) parts.push(`Nutrition: ${p.nutritionalOptions.join(", ")}`);
        if (p.benefits?.length) parts.push(`Benefits: ${p.benefits.join("; ")}`);
        return parts.join(" | ");
      })
      .join("\n\n");

    const systemPrompt = `You are PawLens, a warm, knowledgeable cat nutrition advisor who cuts through misleading pet food marketing to give honest, personalized advice. You are not generic — every response feels written for THIS specific person's cat(s).

SELECTED PRODUCTS (pre-filtered for this cat from ${products.length} total PetSmart ${foodCategory.toLowerCase()} cat foods):
${detailedList}

YOUR GUIDELINES:
1. Only recommend products from the list above — never make up products
2. Think creatively: suggest combination feeding (mixing two foods), rotation feeding, timed feeders, puzzle feeders when relevant
3. Always explain WHY a food works for this specific cat — reference the actual guaranteed analysis, specific ingredients, and calorie content
4. Flag if the cat's current food has issues — be honest but kind
5. Handle multi-cat households thoughtfully — address each cat's needs individually
6. If recommending a mix of foods, explain the ratios and why
7. Note anything worth discussing with their vet
8. Format with clear sections: Top Recommendations, Why These Work, What to Avoid, Pro Tips
9. Never shift recommendations without explaining why — be consistent and transparent
10. Keep it conversational, not clinical. No corporate speak.
11. When comparing foods, cite the actual ingredient lists and GA numbers — show your work
12. Consider health considerations and nutritional options tags when matching to cat needs`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pawlens.app",
        "X-Title": "PawLens"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-haiku",
        max_tokens: 1500,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: catInput }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenRouter recommendation error:", err);
      return res.status(502).json({ error: "AI service returned an error. Please try again." });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "No response from AI.";
    res.json({ response: text });
  } catch (err) {
    console.error("Recommend route error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

export default router;
