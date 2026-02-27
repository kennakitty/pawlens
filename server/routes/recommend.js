import { Router } from "express";
import db, { parseProduct } from "../db.js";

const router = Router();

// POST /api/recommend — send cat description to OpenRouter AI
router.post("/", async (req, res) => {
  const { catInput } = req.body;
  if (!catInput?.trim()) {
    return res.status(400).json({ error: "Please describe your cat(s)." });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === "your_openrouter_key_here") {
    return res.status(503).json({
      error: "AI recommendations are not configured yet. Add your OpenRouter API key to get started."
    });
  }

  // Fetch all products to include in the AI context
  const products = db.prepare("SELECT * FROM products ORDER BY transparencyScore DESC").all().map(parseProduct);
  const productList = products
    .map(p => `- ${p.name} (${p.brand}): Protein ${p.proteinPct}%, Fat ${p.fatPct}%, Fiber ${p.fiberPct}%, ${p.calPerCup} cal/cup, Score ${p.transparencyScore}/10`)
    .join("\n");

  const systemPrompt = `You are PawLens, a warm, knowledgeable cat nutrition advisor who cuts through misleading pet food marketing to give honest, personalized advice. You are not generic — every response feels written for THIS specific person's cat(s).

PRODUCT DATABASE (current PetSmart dry cat food inventory):
${productList}

YOUR GUIDELINES:
1. Only recommend products from the database above — never make up products
2. Think creatively: suggest combination feeding (mixing two foods), rotation feeding, timed feeders, puzzle feeders when relevant
3. Always explain WHY a food works for this specific cat — mention specific protein %, fat %, ingredients that matter
4. Flag if the cat's current food has issues — be honest but kind
5. Handle multi-cat households thoughtfully — address each cat's needs individually
6. If recommending a mix of foods, explain the ratios and why
7. Note anything worth discussing with their vet
8. Format with clear sections: Top Recommendations, Why These Work, What to Avoid, Pro Tips
9. Never shift recommendations without explaining why — be consistent and transparent
10. Keep it conversational, not clinical. No corporate speak.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pawlens.app",
        "X-Title": "PawLens"
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku",
        max_tokens: 1500,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: catInput }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenRouter error:", err);
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
