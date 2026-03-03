import { useState, useEffect, useMemo } from "react";
import colors from "../colors.js";
import ProductDetail from "./ProductDetail.jsx";

export default function BrowsePage({ selectedProduct, setSelectedProduct, setPage, setSelectedIngredient }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterBrand, setFilterBrand] = useState("All");
  const [filterLifeStages, setFilterLifeStages] = useState([]);
  const [filterFoodType, setFilterFoodType] = useState("All");
  const [filterHealth, setFilterHealth] = useState("All");
  const [filterBreed, setFilterBreed] = useState("All");
  const [filterSort, setFilterSort] = useState("name");
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

  // Build filter options dynamically from actual data
  const brands = useMemo(() => ["All", ...Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort()], [products]);
  const lifeStages = useMemo(() => Array.from(new Set(products.map(p => p.lifeStage).filter(Boolean))).sort(), [products]);
  const foodTypes = useMemo(() => ["All", ...Array.from(new Set(products.map(p => p.foodType).filter(Boolean))).sort()], [products]);
  const healthOptions = useMemo(() => {
    const all = new Set();
    products.forEach(p => (p.healthConsiderations || []).forEach(h => all.add(h)));
    return ["All", ...[...all].sort()];
  }, [products]);
  const breedOptions = useMemo(() => {
    const all = new Set();
    products.forEach(p => { if (p.breed) all.add(p.breed); });
    return all.size > 0 ? ["All", ...[...all].sort()] : [];
  }, [products]);

  // Parse kcal/cup for calorie sorting
  function getCaloriesPerCup(p) {
    if (!p.calorieContent) return null;
    const match = p.calorieContent.match(/(\d+)\s*kcal\/cup/i);
    return match ? parseInt(match[1]) : null;
  }

  const filtered = products
    .filter(p => {
      if (filterBrand !== "All" && p.brand !== filterBrand) return false;
      if (filterLifeStages.length > 0 && !filterLifeStages.includes(p.lifeStage)) return false;
      if (filterFoodType !== "All" && p.foodType !== filterFoodType) return false;
      if (filterHealth !== "All" && !(p.healthConsiderations || []).includes(filterHealth)) return false;
      if (filterBreed !== "All" && p.breed !== filterBreed) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!p.name?.toLowerCase().includes(term) && !p.brand?.toLowerCase().includes(term) && !p.flavor?.toLowerCase().includes(term)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (filterSort === "name") return (a.name || "").localeCompare(b.name || "");
      if (filterSort === "brand") return (a.brand || "").localeCompare(b.brand || "");
      if (filterSort === "cal-low") {
        const ca = getCaloriesPerCup(a) ?? 9999;
        const cb = getCaloriesPerCup(b) ?? 9999;
        return ca - cb;
      }
      if (filterSort === "cal-high") {
        const ca = getCaloriesPerCup(a) ?? 0;
        const cb = getCaloriesPerCup(b) ?? 0;
        return cb - ca;
      }
      if (filterSort === "score-high") {
        return (b.transparencyScore ?? 0) - (a.transparencyScore ?? 0);
      }
      if (filterSort === "score-low") {
        return (a.transparencyScore ?? 0) - (b.transparencyScore ?? 0);
      }
      return 0;
    });

  // Count active filters
  const activeFilterCount = [filterBrand, filterFoodType, filterHealth, filterBreed]
    .filter(f => f !== "All").length + (filterLifeStages.length > 0 ? 1 : 0) + (searchTerm ? 1 : 0);

  const selectStyle = { padding: "8px 12px", border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, fontFamily: "'Nunito', sans-serif", background: "#fff" };

  function clearFilters() {
    setFilterBrand("All");
    setFilterLifeStages([]);
    setFilterFoodType("All");
    setFilterHealth("All");
    setFilterBreed("All");
    setSearchTerm("");
    setFilterSort("name");
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
      <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 28, fontWeight: 700, color: colors.primary, marginBottom: 8 }}>
        Browse All Cat Foods
      </h2>
      <p style={{ color: colors.textMed, fontSize: 14, marginBottom: 24 }}>
        {loading ? "Loading..." : `${filtered.length} of ${products.length} dry cat food products from PetSmart. Click any product for full details.`}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24, padding: 16, background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 14, boxShadow: "0 2px 12px rgba(44,62,58,0.06)" }}>
        <input
          type="text" placeholder="Search by name, brand, or flavor..."
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: "1 1 200px", padding: "8px 12px", border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, fontFamily: "'Nunito', sans-serif" }}
        />
        <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} style={selectStyle}>
          {brands.map(b => <option key={b} value={b}>{b === "All" ? "All Brands" : b}</option>)}
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: colors.textMed, fontFamily: "'Nunito', sans-serif" }}>Life Stage:</span>
          {lifeStages.map(l => {
            const active = filterLifeStages.includes(l);
            return (
              <button key={l} onClick={() => setFilterLifeStages(prev => active ? prev.filter(s => s !== l) : [...prev, l])}
                style={{
                  padding: "4px 10px", borderRadius: 14, fontSize: 12, fontFamily: "'Nunito', sans-serif", fontWeight: active ? 600 : 400, cursor: "pointer", border: "none",
                  background: active ? colors.primaryLight : colors.bg, color: active ? colors.primary : colors.textMed,
                  outline: active ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`, outlineOffset: -1,
                }}>
                {l}
              </button>
            );
          })}
        </div>
        <select value={filterFoodType} onChange={e => setFilterFoodType(e.target.value)} style={selectStyle}>
          {foodTypes.map(f => <option key={f} value={f}>{f === "All" ? "All Food Types" : f}</option>)}
        </select>
        <select value={filterHealth} onChange={e => setFilterHealth(e.target.value)} style={selectStyle}>
          {healthOptions.map(h => <option key={h} value={h}>{h === "All" ? "All Health Focus" : h}</option>)}
        </select>
        {breedOptions.length > 0 && (
          <select value={filterBreed} onChange={e => setFilterBreed(e.target.value)} style={selectStyle}>
            {breedOptions.map(b => <option key={b} value={b}>{b === "All" ? "All Breeds" : b}</option>)}
          </select>
        )}
        <select value={filterSort} onChange={e => setFilterSort(e.target.value)} style={selectStyle}>
          <option value="name">Sort: Name A-Z</option>
          <option value="brand">Sort: Brand A-Z</option>
          <option value="cal-low">Sort: Calories Low→High</option>
          <option value="cal-high">Sort: Calories High→Low</option>
          <option value="score-high">Sort: Score High→Low</option>
          <option value="score-low">Sort: Score Low→High</option>
        </select>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} style={{
            padding: "8px 14px", border: "none", borderRadius: 8, fontSize: 13,
            fontFamily: "'Nunito', sans-serif", fontWeight: 600,
            background: colors.accentLight, color: colors.accent, cursor: "pointer"
          }}>
            Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
          </button>
        )}
      </div>

      {error && <p style={{ color: colors.poor, textAlign: "center", padding: 20 }}>{error}</p>}

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: colors.textMed }}>
          <p>Loading cat foods...</p>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {filtered.map(p => (
              <div key={p.id} onClick={() => setSelectedProduct(p)}
                style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 22, cursor: "pointer", transition: "box-shadow 0.2s, transform 0.2s", boxShadow: "0 2px 12px rgba(44,62,58,0.06)" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(44,62,58,0.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(44,62,58,0.06)"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: colors.accent, textTransform: "uppercase", letterSpacing: 0.5 }}>{p.brand}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {p.lifeStage && <span style={{ fontSize: 11, color: colors.textMed }}>{p.lifeStage}</span>}
                    {p.transparencyScore != null && (() => {
                      const s = p.transparencyScore;
                      const scoreColor = s >= 75 ? colors.good : s >= 50 ? colors.caution : colors.poor;
                      const scoreBg = s >= 75 ? colors.goodBg : s >= 50 ? colors.cautionBg : colors.poorBg;
                      return (
                        <span style={{ padding: "2px 8px", borderRadius: 8, fontSize: 12, fontWeight: 700, color: scoreColor, background: scoreBg }}>{s}<span style={{ fontWeight: 400, fontSize: 10 }}>/100</span></span>
                      );
                    })()}
                  </div>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: "0 0 8px", lineHeight: 1.3 }}>{p.name}</h3>
                {p.flavor && <p style={{ fontSize: 12, color: colors.textMed, margin: "0 0 8px" }}>Flavor: {p.flavor}</p>}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                  {p.foodType && <span style={{ padding: "2px 8px", background: colors.bg, borderRadius: 6, fontSize: 11, color: colors.textMed }}>{p.foodType}</span>}
                  {p.breed && <span style={{ padding: "2px 8px", background: colors.neutralBg, borderRadius: 6, fontSize: 11, color: colors.neutral }}>{p.breed}</span>}
                  {(p.healthConsiderations || []).slice(0, 2).map((hc, i) => (
                    <span key={i} style={{ padding: "2px 8px", background: colors.primaryLight, borderRadius: 6, fontSize: 11, color: colors.primary }}>{hc}</span>
                  ))}
                </div>
                {p.calorieContent && <p style={{ fontSize: 11, color: colors.textMed, marginTop: 8 }}>{p.calorieContent}</p>}
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
