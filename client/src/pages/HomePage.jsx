import colors from "../colors.js";
import { Search, FlaskConical, BarChart3, AlertTriangle } from "lucide-react";

export default function HomePage({ navigate }) {
  const features = [
    { icon: <Search size={24} color={colors.primary} />, title: "Tell Us About Your Cat", desc: "Describe your cat's breed, age, health needs, and preferences. Our AI thinks outside the box to find creative solutions.", page: "recommend" },
    { icon: <FlaskConical size={24} color={colors.primary} />, title: "Decode Any Ingredient", desc: "Plain-language explanations of what's actually in cat food and what the labels don't tell you.", page: "ingredients" },
    { icon: <BarChart3 size={24} color={colors.primary} />, title: "Real Nutritional Data", desc: "Every product backed by actual guaranteed analysis numbers — not marketing claims or pretty packaging.", page: "browse" },
    { icon: <AlertTriangle size={24} color={colors.primary} />, title: "What Labels Hide", desc: "The tricks brands use to make their food look better than it is — and how to spot them.", page: "redflags" }
  ];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
      <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 42, fontWeight: 700, color: colors.primary, marginBottom: 12, lineHeight: 1.2 }}>
        PawLens
      </h1>
      <p style={{ fontSize: 19, color: colors.accent, fontWeight: 600, marginBottom: 32 }}>
        See what's really in the bowl.
      </p>
      <p style={{ fontSize: 16, color: colors.textMed, maxWidth: 560, margin: "0 auto 48px", lineHeight: 1.7 }}>
        I built PawLens after discovering I'd been making the wrong food choices for my cats — fooled by fancy packaging and misleading labels. You deserve honest answers about what you're feeding your pet. Think of this as a chat with a friend who happens to know their stuff.
      </p>

      <div style={{ textAlign: "left", marginBottom: 48 }}>
        {/* Hero cards — Cat & Dog */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div
            onClick={() => navigate("recommend")}
            style={{
              background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 28,
              boxShadow: "0 2px 12px rgba(44,62,58,0.06)", cursor: "pointer",
              transition: "box-shadow 0.2s, transform 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 30px rgba(91,138,114,0.25)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(44,62,58,0.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>🐱</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 8 }}>Tell Us About Your Cat</h3>
            <p style={{ fontSize: 14, color: colors.textMed, lineHeight: 1.6, margin: 0 }}>Describe your cat's breed, age, health needs, and preferences. Our AI thinks outside the box to find creative solutions.</p>
          </div>
          <div
            style={{
              background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 28,
              boxShadow: "0 2px 12px rgba(44,62,58,0.06)", opacity: 0.5,
              transition: "box-shadow 0.2s, transform 0.2s", position: "relative",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>🐶</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 8 }}>Tell Us About Your Dog</h3>
            <p style={{ fontSize: 14, color: colors.textMed, lineHeight: 1.6, margin: 0 }}>Personalized dog food recommendations based on breed, size, age, and health needs. Coming soon!</p>
            <span style={{ position: "absolute", top: 12, right: 12, padding: "3px 10px", borderRadius: 8, background: colors.accentLight, color: colors.accent, fontSize: 11, fontWeight: 700 }}>Coming Soon</span>
          </div>
        </div>
        {/* Supporting cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {features.slice(1).map((card, i) => (
            <div key={i}
              onClick={() => navigate(card.page)}
              style={{
                background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 24,
                boxShadow: "0 2px 12px rgba(44,62,58,0.06)", cursor: "pointer", transition: "box-shadow 0.2s, transform 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 30px rgba(91,138,114,0.25)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(44,62,58,0.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ marginBottom: 12 }}>{card.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 8 }}>{card.title}</h3>
              <p style={{ fontSize: 13, color: colors.textMed, lineHeight: 1.6, margin: 0 }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => navigate("recommend")} style={{
        padding: "16px 40px", background: colors.primary, color: "#fff", border: "none",
        borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer",
        boxShadow: "0 4px 14px rgba(91,138,114,0.25)", fontFamily: "'Nunito', sans-serif"
      }}>
        Get Personalized Recommendations
      </button>
      <p style={{ fontSize: 12, color: colors.textLight, marginTop: 32 }}>
        Currently covering 332 dry + 891 wet cat food products from PetSmart. Petco and Chewy coming soon.
      </p>
    </div>
  );
}
