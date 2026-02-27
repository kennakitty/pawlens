import { useState } from "react";
import colors from "./colors.js";
import HomePage from "./pages/HomePage.jsx";
import RecommendPage from "./pages/RecommendPage.jsx";
import BrowsePage from "./pages/BrowsePage.jsx";
import IngredientsPage from "./pages/IngredientsPage.jsx";
import RedFlagsPage from "./pages/RedFlagsPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";

export default function App() {
  const [page, setPage] = useState("home");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  function navigate(newPage) {
    setPage(newPage);
    setSelectedProduct(null);
    setSelectedIngredient(null);
  }

  const navItems = [
    { id: "home", label: "Home", icon: "🐱" },
    { id: "recommend", label: "Get Recommendations", icon: "🔍" },
    { id: "browse", label: "Browse Foods", icon: "🗂" },
    { id: "ingredients", label: "Ingredient Decoder", icon: "🧪" },
    { id: "redflags", label: "Red Flags", icon: "🚩" },
  ];

  return (
    <div style={{ background: colors.bg, minHeight: "100vh", color: colors.text }}>
      {/* ── Navigation ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(250,248,245,0.92)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${colors.border}`, padding: "0 20px"
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 8, overflowX: "auto" }}>
          <div onClick={() => navigate("home")} style={{ cursor: "pointer", padding: "14px 12px 14px 0", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 22 }}>🔎</span>
            <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: colors.primary }}>PawLens</span>
          </div>
          <div style={{ display: "flex", gap: 2, marginLeft: "auto" }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => navigate(item.id)}
                style={{
                  padding: "10px 14px", border: "none", cursor: "pointer", borderRadius: 8, fontSize: 13, fontWeight: 500,
                  background: page === item.id ? colors.primaryLight : "transparent",
                  color: page === item.id ? colors.primary : colors.textMed,
                  transition: "all 0.2s", whiteSpace: "nowrap", fontFamily: "inherit"
                }}>
                <span style={{ marginRight: 4 }}>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Pages ── */}
      {page === "home" && <HomePage navigate={navigate} />}
      {page === "recommend" && <RecommendPage />}
      {page === "browse" && (
        <BrowsePage
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          setPage={setPage}
          setSelectedIngredient={setSelectedIngredient}
        />
      )}
      {page === "ingredients" && (
        <IngredientsPage
          selectedIngredient={selectedIngredient}
          setSelectedIngredient={setSelectedIngredient}
          setSelectedProduct={setSelectedProduct}
          setPage={setPage}
        />
      )}
      {page === "redflags" && <RedFlagsPage />}
      {page === "admin" && <AdminPage />}

      {/* ── Footer ── */}
      <footer style={{ textAlign: "center", padding: "40px 20px", borderTop: `1px solid ${colors.border}`, marginTop: 40 }}>
        <p style={{ fontSize: 12, color: colors.textLight, maxWidth: 600, margin: "0 auto 12px", lineHeight: 1.6 }}>
          PawLens provides nutritional information for educational purposes. This is not veterinary advice. Always consult your veterinarian before making diet changes, especially for cats with health conditions.
        </p>
        <button onClick={() => setPage("admin")} style={{
          background: "none", border: "none", color: colors.border, fontSize: 11, cursor: "pointer"
        }}>Admin</button>
      </footer>
    </div>
  );
}
