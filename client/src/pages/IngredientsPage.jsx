import { useState, useEffect } from "react";
import colors from "../colors.js";
import { Check, Minus, AlertTriangle, X, Tag, Heart } from "lucide-react";

function RatingBadge({ rating }) {
  const config = {
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

export default function IngredientsPage({ selectedIngredient, setSelectedIngredient, setSelectedProduct, setPage }) {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    fetch("/api/ingredients")
      .then(r => r.json())
      .then(data => { setIngredients(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // When an ingredient is selected, find products that contain it
  useEffect(() => {
    if (!selectedIngredient?.id) { setRelatedProducts([]); return; }
    fetch("/api/products")
      .then(r => r.json())
      .then(products => {
        const keyword = selectedIngredient.name.split(" ")[0].toLowerCase();
        setRelatedProducts(products.filter(p =>
          p.firstIngredients?.some(fi => fi.toLowerCase().includes(keyword))
        ));
      });
  }, [selectedIngredient]);

  // If an ingredient was selected by name (from product detail), find its full record
  useEffect(() => {
    if (selectedIngredient && !selectedIngredient.explanation && ingredients.length > 0) {
      const keyword = selectedIngredient.name.split(" ")[0].toLowerCase();
      const match = ingredients.find(i => i.name.toLowerCase().includes(keyword));
      if (match) setSelectedIngredient(match);
    }
  }, [selectedIngredient, ingredients]);

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

          {relatedProducts.length > 0 && (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Found In These Products</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {relatedProducts.map(p => (
                  <span key={p.id} onClick={() => { setSelectedProduct(p); setPage("browse"); }}
                    style={{ padding: "5px 10px", background: colors.bg, borderRadius: 8, fontSize: 12, cursor: "pointer", color: colors.primary, fontWeight: 500 }}>
                    {p.brand} {p.name.split(" ").slice(0, 3).join(" ")}...
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const filtered = ingredients.filter(i =>
    !searchTerm || i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
      <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 28, fontWeight: 700, color: colors.primary, marginBottom: 8 }}>
        Ingredient Decoder
      </h2>
      <p style={{ color: colors.textMed, fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
        Plain-language explanations of common cat food ingredients. Learn what's really in the bag and what the labels don't want you to know.
      </p>
      <input
        type="text" placeholder="Search ingredients..."
        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
        style={{ width: "100%", padding: "10px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, fontFamily: "'Nunito', sans-serif", marginBottom: 24, boxSizing: "border-box" }}
      />

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: colors.textMed }}>Loading ingredients...</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((ing) => (
            <div key={ing.id} onClick={() => setSelectedIngredient(ing)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 14, padding: "16px 20px", cursor: "pointer", transition: "box-shadow 0.2s", boxShadow: "0 2px 12px rgba(44,62,58,0.06)" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(44,62,58,0.1)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(44,62,58,0.06)"}
            >
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: 0 }}>{ing.name}</h3>
                <p style={{ fontSize: 12, color: colors.textLight, margin: "4px 0 0" }}>{ing.category}</p>
              </div>
              <RatingBadge rating={ing.rating} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
