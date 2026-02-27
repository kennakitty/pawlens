import { useState } from "react";
import colors from "../colors.js";

export default function RecommendPage() {
  const [catInput, setCatInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!catInput.trim()) return;
    setIsLoading(true);
    setAiResponse("");
    setError("");

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catInput })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setAiResponse(data.response);
      }
    } catch {
      setError("Connection error. Please check your internet and try again.");
    }
    setIsLoading(false);
  }

  function renderResponse(text) {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("##")) return <h3 key={i} style={{ fontSize: 16, fontWeight: 700, color: colors.primary, margin: "20px 0 8px" }}>{line.replace(/^#+\s*/, "")}</h3>;
      if (line.startsWith("**") && line.endsWith("**")) return <p key={i} style={{ fontWeight: 700, color: colors.text, margin: "12px 0 4px" }}>{line.replace(/\*\*/g, "")}</p>;
      if (line.startsWith("- ") || line.startsWith("* ")) return (
        <p key={i} style={{ paddingLeft: 16, margin: "4px 0", position: "relative" }}>
          <span style={{ position: "absolute", left: 0, color: colors.accent }}>•</span>
          {line.replace(/^[-*]\s*/, "").replace(/\*\*/g, "")}
        </p>
      );
      if (line.trim() === "") return <div key={i} style={{ height: 8 }} />;
      return <p key={i} style={{ margin: "4px 0" }}>{line.replace(/\*\*/g, "")}</p>;
    });
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, color: colors.primary, marginBottom: 8 }}>
        Tell us about your cat
      </h2>
      <p style={{ color: colors.textMed, fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
        Describe anything relevant: breed, age, weight, health conditions, current food, feeding setup, behavior quirks, what your vet has said — the more detail, the better the recommendations. We'll think creatively and give you multiple options.
      </p>

      <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <textarea
          value={catInput}
          onChange={e => setCatInput(e.target.value)}
          placeholder="Example: I have two senior cats that share food. Cat A is a 12-year-old large breed at healthy weight, Cat B is an 11-year-old mixed breed about 2 lbs overweight with mobility issues — she struggles to jump and walks slowly. They both live in a temperature-controlled shed and prefer crunchy kibble. I've been feeding them Crave dry food but noticed one cat digs through the bowl picking out fatty pieces while the other seems always hungry. What should I feed them?"
          style={{
            width: "100%", minHeight: 160, padding: 16, border: `1px solid ${colors.border}`,
            borderRadius: 8, fontSize: 14, fontFamily: "inherit", resize: "vertical",
            lineHeight: 1.6, color: colors.text, background: colors.bg, boxSizing: "border-box"
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 12, color: colors.textLight }}>
            💡 Tip: Mention any vet recommendations, allergies, texture preferences, or budget constraints
          </span>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !catInput.trim()}
            style={{
              padding: "12px 28px", background: isLoading ? colors.textLight : colors.primary,
              color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
              cursor: isLoading || !catInput.trim() ? "not-allowed" : "pointer",
              opacity: !catInput.trim() ? 0.5 : 1, fontFamily: "inherit"
            }}
          >
            {isLoading ? "Analyzing..." : "Get Recommendations"}
          </button>
        </div>
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: 40, color: colors.textMed }}>
          <div style={{ fontSize: 32, marginBottom: 12, animation: "pulse 1.5s infinite" }}>🔍</div>
          <p>Analyzing your cat's needs and searching our database for the best matches...</p>
        </div>
      )}

      {error && (
        <div style={{ padding: 20, background: colors.poorBg, borderRadius: 10, color: colors.poor, fontSize: 14 }}>
          {error}
        </div>
      )}

      {aiResponse && !isLoading && (
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 28, lineHeight: 1.75, color: colors.text }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${colors.border}` }}>
            <span style={{ fontSize: 20 }}>🔎</span>
            <span style={{ fontWeight: 700, color: colors.primary }}>PawLens Recommendations</span>
          </div>
          <div style={{ fontSize: 14 }}>{renderResponse(aiResponse)}</div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${colors.border}`, fontSize: 12, color: colors.textLight }}>
            ⚕️ PawLens provides nutritional information, not veterinary advice. Always consult your vet before making significant diet changes, especially for cats with health conditions.
          </div>
        </div>
      )}
    </div>
  );
}
