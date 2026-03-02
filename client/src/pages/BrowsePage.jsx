import { useState, useEffect } from "react";
import colors from "../colors.js";
import ProductDetail from "./ProductDetail.jsx";

export default function BrowsePage({ selectedProduct, setSelectedProduct, setPage, setSelectedIngredient }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterBrand, setFilterBrand] = useState("All");
  const [filterLifeStage, setFilterLifeStage] = useState("All");
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

  const brands = ["All", ...Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort()];
  const lifeStages = ["All", ...Array.from(new Set(products.map(p => p.lifeStage).filter(Boolean))).sort()];

  const filtered = products
    .filter(p => {
      if (filterBrand !== "All" && p.brand !== filterBrand) return false;
      if (filterLifeStage !== "All" && p.lifeStage !== filterLifeStage) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!p.name?.toLowerCase().includes(term) && !p.brand?.toLowerCase().includes(term) && !p.flavor?.toLowerCase().includes(term)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (filterSort === "name") return (a.name || "").localeCompare(b.name || "");
      if (filterSort === "brand") return (a.brand || "").localeCompare(b.brand || "");
      return 0;
    });

  const selectStyle = { padding: "8px 12px", border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 13, fontFamily: "inherit", background: "#fff" };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
      <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, color: colors.primary, marginBottom: 8 }}>
        Browse All Cat Foods
      </h2>
      <p style={{ color: colors.textMed, fontSize: 14, marginBottom: 24 }}>
        {loading ? "Loading..." : `${filtered.length} of ${products.length} dry cat food products from PetSmart. Click any product for full details.`}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24, padding: 16, background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10 }}>
        <input
          type="text" placeholder="Search by name, brand, or flavor..."
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
          <option value="name">Sort: Name A-Z</option>
          <option value="brand">Sort: Brand A-Z</option>
        </select>
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
                style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, cursor: "pointer", transition: "box-shadow 0.2s, transform 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: colors.accent, textTransform: "uppercase", letterSpacing: 0.5 }}>{p.brand}</span>
                  {p.lifeStage && <span style={{ fontSize: 11, color: colors.textMed }}>{p.lifeStage}</span>}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: "0 0 8px", lineHeight: 1.3 }}>{p.name}</h3>
                {p.flavor && <p style={{ fontSize: 12, color: colors.textMed, margin: "0 0 8px" }}>Flavor: {p.flavor}</p>}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                  {p.foodType && <span style={{ padding: "2px 8px", background: colors.bg, borderRadius: 4, fontSize: 11, color: colors.textMed }}>{p.foodType}</span>}
                  {p.healthConsiderations?.slice(0, 2).map((hc, i) => (
                    <span key={i} style={{ padding: "2px 8px", background: colors.primaryLight, borderRadius: 4, fontSize: 11, color: colors.primary }}>{hc}</span>
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
