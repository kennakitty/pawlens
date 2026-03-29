import { useState, useEffect, useMemo, useRef } from "react";
import colors from "../colors.js";
import LifeStageBadge from "../LifeStageBadge.jsx";
import FoodCategoryToggle from "../FoodCategoryToggle.jsx";
import ProductDetail from "./ProductDetail.jsx";

export default function BrowsePage({ selectedProduct, setSelectedProduct, setPage, setSelectedIngredient, foodCategory, setFoodCategory }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterBrand, setFilterBrand] = useState("All");
  const [filterLifeStage, setFilterLifeStage] = useState("All");
  const [filterFoodType, setFilterFoodType] = useState("All");
  const [filterHealth, setFilterHealth] = useState("All");
  const [filterSort, setFilterSort] = useState("score-high");
  const [searchTerm, setSearchTerm] = useState("");
  const scrollPosRef = useRef(0);
  const selectedIdRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products?type=${foodCategory}`)
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false); window.scrollTo(0, 0); })
      .catch(() => { setError("Failed to load products."); setLoading(false); });
  }, [foodCategory]);

  // Restore scroll position when returning from product detail
  useEffect(() => {
    if (!selectedProduct && selectedIdRef.current) {
      requestAnimationFrame(() => {
        const el = document.getElementById(`product-${selectedIdRef.current}`);
        if (el) {
          el.scrollIntoView({ block: "center" });
        } else {
          window.scrollTo(0, scrollPosRef.current);
        }
        selectedIdRef.current = null;
      });
    }
  }, [selectedProduct]);

  // Build filter options dynamically from actual data
  // All hooks must be called before any conditional return (Rules of Hooks)
  const brands = useMemo(() => ["All", ...Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort()], [products]);
  const lifeStageOrder = ["Kitten", "All Life Stages", "Adult", "Senior (7+)", "Senior (11+)"];
  const lifeStages = useMemo(() => {
    const available = new Set(products.map(p => p.lifeStage).filter(Boolean));
    return ["All", ...lifeStageOrder.filter(s => available.has(s))];
  }, [products]);
  const foodTypes = useMemo(() => {
    const all = new Set();
    products.forEach(p => { if (p.foodType) p.foodType.split(", ").forEach(ft => all.add(ft)); });
    return ["All", ...[...all].sort()];
  }, [products]);
  const healthOptions = useMemo(() => {
    const all = new Set();
    products.forEach(p => (Array.isArray(p.healthConsiderations) ? p.healthConsiderations : []).forEach(h => all.add(h)));
    return ["All", ...[...all].sort()];
  }, [products]);

  // Scroll to top when entering product detail
  useEffect(() => {
    if (selectedProduct) window.scrollTo(0, 0);
  }, [selectedProduct]);

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

  // Parse kcal/cup for calorie sorting
  function getCaloriesPerCup(p) {
    if (!p.calorieContent) return null;
    const match = p.calorieContent.match(/(\d+)\s*kcal\/cup/i);
    return match ? parseInt(match[1]) : null;
  }

  const filtered = products
    .filter(p => {
      if (filterBrand !== "All" && p.brand !== filterBrand) return false;
      if (filterLifeStage !== "All" && p.lifeStage !== filterLifeStage) return false;
      if (filterFoodType !== "All" && !(p.foodType || "").split(", ").includes(filterFoodType)) return false;
      if (filterHealth !== "All" && !(Array.isArray(p.healthConsiderations) ? p.healthConsiderations : []).includes(filterHealth)) return false;
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
  const activeFilterCount = [filterBrand, filterLifeStage, filterFoodType, filterHealth]
    .filter(f => f !== "All").length + (searchTerm ? 1 : 0);

  const selectStyle = { padding: "8px 12px", border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, fontFamily: "'Nunito', sans-serif", background: "#fff" };

  function clearFilters() {
    setFilterBrand("All");
    setFilterLifeStage("All");
    setFilterFoodType("All");
    setFilterHealth("All");
    setSearchTerm("");
    setFilterSort("score-high");
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ position: "sticky", top: 57, zIndex: 10, background: colors.bg, paddingTop: 8, paddingBottom: 8, marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 28, fontWeight: 700, color: colors.primary, margin: 0 }}>
            Browse All Cat Foods
          </h2>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: colors.textLight, textTransform: "uppercase", letterSpacing: 1 }}>Cat</span>
            <FoodCategoryToggle value={foodCategory} onChange={(v) => { setFoodCategory(v); clearFilters(); }} />
          </div>
        </div>
      </div>
      <p style={{ color: colors.textMed, fontSize: 14, marginBottom: 24 }}>
        {loading ? "Loading..." : `${filtered.length} of ${products.length} ${foodCategory.toLowerCase()} cat food products from PetSmart. Click any product for full details.`}
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
        <select value={filterLifeStage} onChange={e => setFilterLifeStage(e.target.value)} style={selectStyle}>
          {lifeStages.map(l => <option key={l} value={l}>{l === "All" ? "Choose Life Stage" : l}</option>)}
        </select>
        <select value={filterFoodType} onChange={e => setFilterFoodType(e.target.value)} style={selectStyle}>
          {foodTypes.map(f => <option key={f} value={f}>{f === "All" ? "All Food Types" : f}</option>)}
        </select>
        <select value={filterHealth} onChange={e => setFilterHealth(e.target.value)} style={selectStyle}>
          {healthOptions.map(h => <option key={h} value={h}>{h === "All" ? "All Health Focus" : h}</option>)}
        </select>
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
              <div key={p.id} id={`product-${p.id}`} onClick={() => { scrollPosRef.current = window.scrollY; selectedIdRef.current = p.id; setSelectedProduct(p); }}
                style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 22, cursor: "pointer", transition: "box-shadow 0.2s, transform 0.2s", boxShadow: "0 2px 12px rgba(44,62,58,0.06)" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(44,62,58,0.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(44,62,58,0.06)"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: colors.accent, textTransform: "uppercase", letterSpacing: 0.5 }}>{p.brand}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {p.lifeStage && <LifeStageBadge lifeStage={p.lifeStage} />}
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
                {p.flavor && <p style={{ fontSize: 12, color: colors.textMed, margin: "0 0 8px" }}>{p.flavor.replace(/, /g, " • ").replace(/ \+ more/, " + more")}</p>}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                  {p.foodType && p.foodType.split(", ").map((ft, j) => (
                    <span key={j} style={{ padding: "2px 8px", background: colors.bg, borderRadius: 6, fontSize: 11, color: colors.textMed }}>{ft}</span>
                  ))}
                  {(Array.isArray(p.healthConsiderations) ? p.healthConsiderations : []).slice(0, 2).map((hc, i) => (
                    <span key={i} style={{ padding: "2px 8px", background: colors.primaryLight, borderRadius: 6, fontSize: 11, color: colors.primary }}>{hc}</span>
                  ))}
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
