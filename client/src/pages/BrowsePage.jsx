import { useState, useEffect } from "react";
import colors from "../colors.js";
import ProductDetail from "./ProductDetail.jsx";

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

export default function BrowsePage({ selectedProduct, setSelectedProduct, setPage, setSelectedIngredient }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterBrand, setFilterBrand] = useState("All");
  const [filterLifeStage, setFilterLifeStage] = useState("All");
  const [filterSort, setFilterSort] = useState("transparencyScore");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false); })
      .catch(() => { setError("Failed to load products."); setLoading(false); });
  }, []);

  if (selectedProduct) {
    return (
      <ProductDetail
        product={selectedProduct}
        onBack={() => setSelectedProduct(null)}
        onIngredientClick={(ingName) => {
          setSelectedIngredient({ name: ingName });
          setPage("ingredients");
        }}
      />
    );
  }

  const brands = ["All", ...Array.from(new Set(products.map(p => p.brand))).sort()];
  const lifeStages = ["All", ...Array.from(new Set(products.map(p => p.lifeStage)))];

  const filtered = products
    .filter(p => {
      if (filterBrand !== "All" && p.brand !== filterBrand) return false;
      if (filterLifeStage !== "All" && p.lifeStage !== filterLifeStage) return false;
      if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase()) && !p.brand.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (filterSort === "transparencyScore") return b.transparencyScore - a.transparencyScore;
      if (filterSort === "proteinPct") return b.proteinPct - a.proteinPct;
      if (filterSort === "fatPct") return a.fatPct - b.fatPct;
      if (filterSort === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  const selectStyle = { padding: "8px 12px", border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 13, fontFamily: "inherit", background: "#fff" };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
      <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, color: colors.primary, marginBottom: 8 }}>
        Browse All Cat Foods
      </h2>
      <p style={{ color: colors.textMed, fontSize: 14, marginBottom: 24 }}>
        {loading ? "Loading..." : `${products.length} dry cat food products from PetSmart. Click any product for full details.`}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24, padding: 16, background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10 }}>
        <input
          type="text" placeholder="Search by name or brand..."
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: "1 1 200px", padding: "8px 12px", border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 13, fontFamily: "inherit" }}
        />
        <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} style={selectStyle}>
          {brands.map(b => <option key={b} value={b}>{b === "All" ? "All Brands" : b}</option>)}
        </select>
        <select value={filterLifeStage} onChange={e => setFilterLifeStage(e.target.value)} style={selectStyle}>
          {lifeStages.map(l => <option key={l} value={l}>{l === "All" ? "All Life Stages" : l}</option>)}
        </select>
        <select value={filterSort} onChange={e => setFilterSort(e.target.value)} style={selectStyle}>
          <option value="transparencyScore">Sort: Transparency Score</option>
          <option value="proteinPct">Sort: Highest Protein</option>
          <option value="fatPct">Sort: Lowest Fat</option>
          <option value="name">Sort: Name A–Z</option>
        </select>
      </div>

      {error && <p style={{ color: colors.poor, textAlign: "center", padding: 20 }}>{error}</p>}

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: colors.textMed }}>
          <div style={{ fontSize: 32, marginBottom: 12, animation: "pulse 1.5s infinite" }}>🐱</div>
          <p>Loading cat foods...</p>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {filtered.map(p => (
              <div key={p.id} onClick={() => setSelectedProduct(p)}
                style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, cursor: "pointer", transition: "box-shadow 0.2s, transform 0.2s" }}
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
          {filtered.length === 0 && (
            <p style={{ textAlign: "center", color: colors.textMed, padding: 40 }}>No products match your filters. Try adjusting your search.</p>
          )}
        </>
      )}
    </div>
  );
}
