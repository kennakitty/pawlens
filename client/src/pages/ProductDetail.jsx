import colors from "../colors.js";

export default function ProductDetail({ product, onBack, onIngredientClick }) {
  const p = product;
  if (!p) return null;

  // Extract first 5 ingredients from the full ingredient list for the clickable chips
  const firstIngredients = p.fullIngredients
    ? p.fullIngredients.split(",").slice(0, 5).map(i => i.trim())
    : [];

  const sectionStyle = { marginBottom: 24 };
  const headingStyle = { fontSize: 14, fontWeight: 700, marginBottom: 8 };
  const tagStyle = { padding: "4px 10px", background: colors.primaryLight, borderRadius: 6, fontSize: 12, color: colors.primary, fontWeight: 500 };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <button onClick={onBack} style={{
        background: "none", border: "none", color: colors.primary, cursor: "pointer",
        fontSize: 14, fontWeight: 500, marginBottom: 20, padding: 0, fontFamily: "inherit"
      }}>
        ← Back to all foods
      </button>

      <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 28 }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: colors.accent, textTransform: "uppercase", letterSpacing: 1 }}>
            {p.brand}
          </span>
          <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, color: colors.text, margin: "4px 0 12px" }}>{p.name}</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            {[p.type, p.lifeStage, p.foodType, p.flavor].filter(Boolean).map((tag, i) => (
              <span key={i} style={tagStyle}>{tag}</span>
            ))}
          </div>
          {p.healthConsiderations?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {p.healthConsiderations.map((hc, i) => (
                <span key={i} style={{ padding: "3px 8px", background: colors.bg, borderRadius: 4, fontSize: 11, color: colors.textMed }}>{hc}</span>
              ))}
            </div>
          )}
        </div>

        {/* Product Image */}
        {p.imageUrl && (
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <img src={p.imageUrl} alt={p.name} style={{ maxHeight: 200, objectFit: "contain", borderRadius: 8 }} />
          </div>
        )}

        {/* Description */}
        {p.description && (
          <div style={sectionStyle}>
            <h3 style={headingStyle}>Description</h3>
            <p style={{ fontSize: 13, color: colors.textMed, lineHeight: 1.6, margin: 0 }}>{p.description}</p>
          </div>
        )}

        {/* Benefits */}
        {p.benefits?.length > 0 && (
          <div style={sectionStyle}>
            <h3 style={headingStyle}>Key Benefits</h3>
            {p.benefits.map((b, i) => <p key={i} style={{ fontSize: 13, color: colors.textMed, margin: "4px 0", paddingLeft: 12 }}>• {b}</p>)}
          </div>
        )}

        {/* First 5 Ingredients (clickable) */}
        {firstIngredients.length > 0 && (
          <div style={sectionStyle}>
            <h3 style={headingStyle}>Top Ingredients</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {firstIngredients.map((ing, i) => (
                <span key={i} style={{
                  padding: "5px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                  background: colors.bg, color: colors.text, cursor: "pointer"
                }}
                  onClick={() => onIngredientClick && onIngredientClick(ing)}>
                  {i + 1}. {ing}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Full Ingredients */}
        {p.fullIngredients && (
          <div style={sectionStyle}>
            <h3 style={headingStyle}>Full Ingredient List</h3>
            <p style={{ fontSize: 12, color: colors.textMed, lineHeight: 1.6, margin: 0, padding: 12, background: colors.bg, borderRadius: 8 }}>
              {p.fullIngredients}
            </p>
          </div>
        )}

        {/* Guaranteed Analysis */}
        {p.guaranteedAnalysis && (
          <div style={sectionStyle}>
            <h3 style={headingStyle}>Guaranteed Analysis</h3>
            <div style={{ padding: 12, background: colors.bg, borderRadius: 8 }}>
              {p.guaranteedAnalysis.split(/\n|(?=Crude |Moisture|Ash)/).filter(Boolean).map((line, i) => (
                <p key={i} style={{ fontSize: 13, color: colors.text, margin: "3px 0", fontFamily: "monospace" }}>{line.trim()}</p>
              ))}
            </div>
          </div>
        )}

        {/* Calorie Content */}
        {p.calorieContent && (
          <div style={sectionStyle}>
            <h3 style={headingStyle}>Calorie Content</h3>
            <p style={{ fontSize: 14, fontWeight: 600, color: colors.accent, margin: 0 }}>{p.calorieContent}</p>
          </div>
        )}

        {/* AAFCO */}
        {p.aafco && (
          <div style={{ padding: 16, background: colors.bg, borderRadius: 8, marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>AAFCO Statement</h3>
            <p style={{ fontSize: 12, color: colors.textMed, margin: 0 }}>{p.aafco}</p>
          </div>
        )}

        {/* Directions */}
        {p.directions && (
          <div style={sectionStyle}>
            <details>
              <summary style={{ fontSize: 14, fontWeight: 700, cursor: "pointer", color: colors.text }}>Feeding Directions</summary>
              <p style={{ fontSize: 12, color: colors.textMed, lineHeight: 1.6, marginTop: 8, padding: 12, background: colors.bg, borderRadius: 8, whiteSpace: "pre-wrap" }}>
                {p.directions}
              </p>
            </details>
          </div>
        )}

        {/* PetSmart Link */}
        {p.petsmartUrl && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <a href={p.petsmartUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 13, color: colors.primary, textDecoration: "none", fontWeight: 500 }}>
              View on PetSmart →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
