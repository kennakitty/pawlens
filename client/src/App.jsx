import { useState } from "react";
import colors from "./colors.js";
import { Home, Search, LayoutGrid, FlaskConical, AlertTriangle } from "lucide-react";
import HomePage from "./pages/HomePage.jsx";
import RecommendPage from "./pages/RecommendPage.jsx";
import BrowsePage from "./pages/BrowsePage.jsx";
import IngredientsPage from "./pages/IngredientsPage.jsx";
import RedFlagsPage from "./pages/RedFlagsPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";

function PawLensLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Magnifying glass */}
      <circle cx="14" cy="14" r="9" stroke={colors.primary} strokeWidth="2.5" fill="none" />
      <line x1="20.5" y1="20.5" x2="28" y2="28" stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round" />
      {/* Paw inside */}
      <circle cx="11.5" cy="11" r="1.5" fill={colors.accent} />
      <circle cx="16.5" cy="11" r="1.5" fill={colors.accent} />
      <circle cx="10" cy="14.5" r="1.3" fill={colors.accent} />
      <circle cx="18" cy="14.5" r="1.3" fill={colors.accent} />
      <ellipse cx="14" cy="17.5" rx="2.5" ry="2" fill={colors.accent} />
    </svg>
  );
}

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
    { id: "home", label: "Home", icon: <Home size={15} /> },
    { id: "recommend", label: "Get Recommendations", icon: <Search size={15} /> },
    { id: "browse", label: "Browse Foods", icon: <LayoutGrid size={15} /> },
    { id: "ingredients", label: "Ingredient Decoder", icon: <FlaskConical size={15} /> },
    { id: "redflags", label: "Red Flags", icon: <AlertTriangle size={15} /> },
  ];

  return (
    <div style={{ background: colors.bg, minHeight: "100vh", color: colors.text, fontFamily: "'Nunito', sans-serif" }}>
      {/* ── Navigation ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(251,248,244,0.92)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${colors.border}`, padding: "0 20px"
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 8, overflowX: "auto" }}>
          <div onClick={() => navigate("home")} style={{ cursor: "pointer", padding: "14px 12px 14px 0", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <PawLensLogo size={28} />
            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 700, color: colors.primary }}>PawLens</span>
          </div>
          <div style={{ display: "flex", gap: 2, marginLeft: "auto" }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => navigate(item.id)}
                style={{
                  padding: "10px 14px", border: "none", cursor: "pointer", borderRadius: 10, fontSize: 13, fontWeight: 500,
                  background: page === item.id ? colors.primaryLight : "transparent",
                  color: page === item.id ? colors.primary : colors.textMed,
                  transition: "all 0.2s", whiteSpace: "nowrap", fontFamily: "'Nunito', sans-serif",
                  display: "flex", alignItems: "center", gap: 5
                }}>
                {item.icon}{item.label}
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
