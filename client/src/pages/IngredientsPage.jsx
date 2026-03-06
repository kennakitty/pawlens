import { useState, useEffect } from "react";
import colors from "../colors.js";
import { Check, Star, Minus, AlertTriangle, X, Tag, Heart, ChevronRight, Package } from "lucide-react";
import LifeStageBadge from "../LifeStageBadge.jsx";

function RatingBadge({ rating }) {
  const config = {
    great: { bg: colors.greatBg, color: colors.great, label: "Great", icon: <Star size={12} /> },
    good: { bg: colors.goodBg, color: colors.good, label: "Good", icon: <Check size={12} /> },
    neutral: { bg: colors.neutralBg, color: colors.neutral, label: "Neutral", icon: <Minus size={12} /> },
    caution: { bg: colors.cautionBg, color: colors.caution, label: "Caution", icon: <AlertTriangle size={12} /> },
    poor: { bg: colors.poorBg, color: colors.poor, label: "Avoid", icon: <X size={12} /> }
  };
  const c = config[rating] || config.neutral;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 12, background: c.bg, color: c.color, fontSize: 12, fontWeight: 600 }}>
      {c.icon} {c.label}
    </span>
  );
}

// Category display order and icons
const CATEGORY_ORDER = [
  "Protein",
  "Protein/Filler",
  "Fat",
  "Carbohydrate",
  "Fiber",
  "Supplement",
  "Preservative",
  "Additive",
];

const CATEGORY_LABELS = {
  "Protein": "Proteins",
  "Protein/Filler": "Protein Fillers",
  "Fat": "Fats & Oils",
  "Carbohydrate": "Carbohydrates",
  "Fiber": "Fiber Sources",
  "Supplement": "Supplements & Nutrients",
  "Preservative": "Preservatives",
  "Additive": "Additives",
};

const CATEGORY_DESCRIPTIONS = {
  "Protein": "The building blocks — what your cat actually needs most",
  "Protein/Filler": "Plant proteins that inflate protein % on the label but aren't ideal for cats",
  "Fat": "Energy sources and essential fatty acids for skin, coat, and brain health",
  "Carbohydrate": "Energy fillers — cats don't need much of these",
  "Fiber": "Digestive aids for hairballs, weight management, and gut health",
  "Supplement": "Added vitamins, minerals, and functional nutrients",
  "Preservative": "What keeps the food from going bad — some better than others",
  "Additive": "Flavors, thickeners, and other extras",
};

export default function IngredientsPage({ selectedIngredient, setSelectedIngredient, setSelectedProduct, setPage }) {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    fetch("/api/ingredients")
      .then(r => r.json())
      .then(data => { setIngredients(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // When an ingredient is selected, fetch products that contain it
  useEffect(() => {
    if (!selectedIngredient?.id) { setRelatedProducts([]); return; }
    setLoadingProducts(true);
    fetch(`/api/ingredients/${selectedIngredient.id}/products`)
      .then(r => r.json())
      .then(products => { setRelatedProducts(products); setLoadingProducts(false); })
      .catch(() => setLoadingProducts(false));
  }, [selectedIngredient]);

  // If an ingredient was selected by name (from product detail), find its full record
  useEffect(() => {
    if (selectedIngredient && !selectedIngredient.explanation && ingredients.length > 0) {
      const keyword = selectedIngredient.name.split(" ")[0].toLowerCase();
      const match = ingredients.find(i => i.name.toLowerCase().includes(keyword));
      if (match) setSelectedIngredient(match);
    }
  }, [selectedIngredient, ingredients]);

  // ─── DETAIL VIEW ──────────────────────────────────────────────────────────────
  if (selectedIngredient?.explanation) {
    const ing = selectedIngredient;
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
        <button onClick={() => setSelectedIngredient(null)} style={{
          background: "none", border: "none", color: colors.primary, cursor: "pointer",
          fontSize: 14, fontWeight: 500, marginBottom: 20, padding: 0, fontFamily: "'Nunito', sans-serif"
        }}>
          ← Back to all ingredients
        </button>
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(44,62,58,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: colors.textLight, textTransform: "uppercase", letterSpacing: 1 }}>{ing.category}</span>
              <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 700, color: colors.text, margin: "4px 0 0" }}>{ing.name}</h2>
            </div>
            <RatingBadge rating={ing.rating} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>What Is It?</h3>
            <p style={{ fontSize: 14, color: colors.textMed, lineHeight: 1.7, margin: 0 }}>{ing.explanation}</p>
          </div>

          <div style={{ padding: 16, background: colors.accentLight, borderRadius: 12, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.accent, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Tag size={15} /> What Labels Don't Tell You
            </h3>
            <p style={{ fontSize: 14, color: colors.textMed, lineHeight: 1.7, margin: 0 }}>{ing.misleading}</p>
          </div>

          <div style={{ padding: 16, background: colors.primaryLight, borderRadius: 12, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.primary, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Heart size={15} /> Health Notes
            </h3>
            <p style={{ fontSize: 14, color: colors.textMed, lineHeight: 1.7, margin: 0 }}>{ing.healthNotes}</p>
          </div>

          {/* Products containing this ingredient */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Package size={15} /> Found in These Products
            </h3>
            {loadingProducts ? (
              <p style={{ fontSize: 13, color: colors.textLight }}>Searching products...</p>
            ) : relatedProducts.length > 0 ? (
              <>
                <p style={{ fontSize: 12, color: colors.textLight, margin: "0 0 12px" }}>
                  {relatedProducts.length} product{relatedProducts.length !== 1 ? "s" : ""} contain {ing.name}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {Object.entries(
                    relatedProducts.reduce((acc, p) => {
                      const brand = p.brand || "Other";
                      if (!acc[brand]) acc[brand] = [];
                      acc[brand].push(p);
                      return acc;
                    }, {})
                  )
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([brand, products]) => (
                      <div key={brand} style={{
                        background: colors.card, border: `1px solid ${colors.border}`,
                        borderRadius: 12,
                      }}>
                        <div style={{
                          padding: "10px 14px", background: colors.primaryLight,
                          borderBottom: `1px solid ${colors.border}`,
                          borderRadius: "12px 12px 0 0",
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: colors.primary }}>{brand}</span>
                          <span style={{ fontSize: 11, color: colors.textLight, marginLeft: 8 }}>
                            ({products.length})
                          </span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          {products.map((p, i) => (
                            <div key={p.id}
                              onClick={() => { setSelectedProduct(p); setPage("browse"); }}
                              style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "8px 14px", cursor: "pointer", transition: "background 0.15s",
                                borderTop: i > 0 ? `1px solid ${colors.border}` : "none",
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = colors.primaryLight}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                              <div style={{ fontSize: 13, color: colors.text, fontWeight: 500, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {p.name}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 12 }}>
                                <LifeStageBadge lifeStage={p.lifeStage} />
                                {p.transparencyScore != null && (
                                  <span style={{ fontSize: 11, fontWeight: 600, color: colors.primary }}>{p.transparencyScore}/100</span>
                                )}
                                <ChevronRight size={14} color={colors.textLight} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <p style={{ fontSize: 13, color: colors.textLight }}>No products in our database currently list this ingredient.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW (grouped by category) ──────────────────────────────────────────
  const filtered = ingredients.filter(i =>
    !searchTerm || i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by category
  const grouped = {};
  for (const ing of filtered) {
    const cat = ing.category || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(ing);
  }

  // Sort categories by defined order, unknowns at the end
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
      <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 28, fontWeight: 700, color: colors.primary, marginBottom: 8 }}>
        Ingredient Decoder
      </h2>
      <p style={{ color: colors.textMed, fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
        What's actually in your cat's food — explained in plain language, rated by how good it really is.
      </p>
      <input
        type="text" placeholder="Search ingredients..."
        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
        style={{ width: "100%", padding: "10px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, fontFamily: "'Nunito', sans-serif", marginBottom: 28, boxSizing: "border-box" }}
      />

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: colors.textMed }}>Loading ingredients...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: colors.textMed }}>No ingredients match your search.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {sortedCategories.map(cat => (
            <div key={cat}>
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 700, color: colors.text, margin: "0 0 4px" }}>
                  {CATEGORY_LABELS[cat] || cat}
                </h3>
                {CATEGORY_DESCRIPTIONS[cat] && (
                  <p style={{ fontSize: 13, color: colors.textLight, margin: 0, lineHeight: 1.5 }}>
                    {CATEGORY_DESCRIPTIONS[cat]}
                  </p>
                )}
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {grouped[cat].map((ing) => (
                  <div key={ing.id} onClick={() => setSelectedIngredient(ing)}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 14,
                      padding: "14px 20px", cursor: "pointer", transition: "box-shadow 0.2s",
                      boxShadow: "0 2px 12px rgba(44,62,58,0.06)"
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(44,62,58,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(44,62,58,0.06)"}
                  >
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: 0 }}>{ing.name}</h3>
                    </div>
                    <RatingBadge rating={ing.rating} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
