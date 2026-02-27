import colors from "../colors.js";

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

export default function ProductDetail({ product, onBack, onIngredientClick }) {
  const p = product;
  if (!p) return null;

  const stats = [
    { label: "Protein", value: `${p.proteinPct}%`, color: p.proteinPct >= 35 ? colors.good : colors.caution },
    { label: "Fat", value: `${p.fatPct}%`, color: p.fatPct <= 14 ? colors.good : p.fatPct <= 17 ? colors.caution : colors.poor },
    { label: "Fiber", value: `${p.fiberPct}%`, color: colors.neutral },
    { label: "Moisture", value: `${p.moisturePct}%`, color: colors.neutral },
    { label: "Cal/Cup", value: p.calPerCup, color: colors.neutral },
  ];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <button onClick={onBack} style={{
        background: "none", border: "none", color: colors.primary, cursor: "pointer",
        fontSize: 14, fontWeight: 500, marginBottom: 20, padding: 0, fontFamily: "inherit"
      }}>
        ← Back to all foods
      </button>

      <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 28 }}>
        <div style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: colors.accent, textTransform: "uppercase", letterSpacing: 1 }}>
            {p.brand} · {p.line}
          </span>
          <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, color: colors.text, margin: "4px 0 12px" }}>{p.name}</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {[p.type, p.lifeStage, p.retailer].map((tag, i) => (
              <span key={i} style={{ padding: "4px 10px", background: colors.primaryLight, borderRadius: 6, fontSize: 12, color: colors.primary, fontWeight: 500 }}>{tag}</span>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginBottom: 8 }}>Transparency Score</h3>
          <ScoreBar score={p.transparencyScore} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 12, marginBottom: 24 }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ textAlign: "center", padding: 12, background: colors.bg, borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: colors.textMed, marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Price at {p.retailer}</h3>
          <p style={{ fontSize: 18, fontWeight: 700, color: colors.accent, margin: 0 }}>{p.priceRange}</p>
          <p style={{ fontSize: 12, color: colors.textMed }}>Available sizes: {p.sizes?.join(", ")}</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>First 5 Ingredients</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {p.firstIngredients?.map((ing, i) => (
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.good, marginBottom: 8 }}>✓ Best For</h3>
            {p.bestFor?.map((b, i) => <p key={i} style={{ fontSize: 13, color: colors.textMed, margin: "4px 0", paddingLeft: 12 }}>• {b}</p>)}
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.poor, marginBottom: 8 }}>✗ Avoid If</h3>
            {p.avoid?.map((a, i) => <p key={i} style={{ fontSize: 13, color: colors.textMed, margin: "4px 0", paddingLeft: 12 }}>• {a}</p>)}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Key Features</h3>
          {p.keyFeatures?.map((f, i) => <p key={i} style={{ fontSize: 13, color: colors.textMed, margin: "4px 0", paddingLeft: 12 }}>✦ {f}</p>)}
        </div>

        {p.concerns?.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.caution, marginBottom: 8 }}>⚠ Concerns</h3>
            {p.concerns.map((c, i) => <p key={i} style={{ fontSize: 13, color: colors.textMed, margin: "4px 0", paddingLeft: 12 }}>• {c}</p>)}
          </div>
        )}

        <div style={{ padding: 16, background: colors.bg, borderRadius: 8, marginBottom: 12 }}>
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
