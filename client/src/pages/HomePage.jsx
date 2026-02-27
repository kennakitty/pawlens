import colors from "../colors.js";

export default function HomePage({ navigate }) {
  const features = [
    { icon: "🔍", title: "Tell Us About Your Cat", desc: "Describe your cat's breed, age, health needs, and preferences. Our AI thinks outside the box to find creative solutions." },
    { icon: "🧪", title: "Decode Any Ingredient", desc: "Plain-language explanations of what's actually in cat food and what the labels don't tell you." },
    { icon: "📊", title: "Transparency Scores", desc: "Every product rated on ingredient honesty, not marketing claims. See through the pretty packaging." },
    { icon: "🚩", title: "Red Flag Alerts", desc: "Recalls, misleading claims, and ingredients to watch — the stuff brands hope you don't notice." }
  ];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🔎</div>
      <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 42, color: colors.primary, marginBottom: 12, lineHeight: 1.2 }}>
        PawLens
      </h1>
      <p style={{ fontSize: 19, color: colors.accent, fontWeight: 500, marginBottom: 32 }}>
        See what's really in the bowl.
      </p>
      <p style={{ fontSize: 16, color: colors.textMed, maxWidth: 560, margin: "0 auto 48px", lineHeight: 1.7 }}>
        I built PawLens after discovering I'd been making the wrong food choices for my cats — fooled by fancy packaging and misleading labels. Every pet owner deserves the truth about what they're feeding their pets. No marketing spin, no generic advice — just honest, personalized recommendations backed by real nutritional data.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, textAlign: "left", marginBottom: 48 }}>
        {features.map((card, i) => (
          <div key={i} style={{
            background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24
          }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{card.icon}</div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 8 }}>{card.title}</h3>
            <p style={{ fontSize: 13, color: colors.textMed, lineHeight: 1.6, margin: 0 }}>{card.desc}</p>
          </div>
        ))}
      </div>

      <button onClick={() => navigate("recommend")} style={{
        padding: "16px 40px", background: colors.primary, color: "#fff", border: "none",
        borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: "pointer",
        boxShadow: "0 4px 14px rgba(45,90,61,0.25)", fontFamily: "inherit"
      }}>
        Get Personalized Recommendations →
      </button>
      <p style={{ fontSize: 12, color: colors.textLight, marginTop: 32 }}>
        Currently covering PetSmart dry cat food. Wet food, Petco, and Chewy coming soon.
      </p>
    </div>
  );
}
