import { useState, useEffect } from "react";
import colors from "../colors.js";
import { AlertTriangle, Eye, ShieldAlert, Tags, FlaskConical, Scale } from "lucide-react";

function SeverityBadge({ severity }) {
  const config = {
    high: { bg: colors.poorBg, color: colors.poor, label: "High Risk" },
    medium: { bg: colors.cautionBg, color: colors.caution, label: "Watch For" },
    low: { bg: colors.neutralBg, color: colors.neutral, label: "Good to Know" }
  };
  const c = config[severity] || config.medium;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 12, background: c.bg, color: c.color, fontSize: 12, fontWeight: 600 }}>
      <AlertTriangle size={12} /> {c.label}
    </span>
  );
}

const CATEGORY_ORDER = [
  "Label Tricks",
  "Ingredient Deception",
  "Hidden Health Concerns",
  "Misleading Standards",
];

const CATEGORY_DESCRIPTIONS = {
  "Label Tricks": "Marketing language designed to make you think the food is better than it is",
  "Ingredient Deception": "Ways manufacturers hide what's really in the formula",
  "Hidden Health Concerns": "Ingredients and gaps that could affect your cat's health",
  "Misleading Standards": "Industry rules and claims that don't mean what you'd expect",
};

const CATEGORY_ICONS = {
  "Label Tricks": <Tags size={18} />,
  "Ingredient Deception": <ShieldAlert size={18} />,
  "Hidden Health Concerns": <FlaskConical size={18} />,
  "Misleading Standards": <Scale size={18} />,
};

export default function RedFlagsPage() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/red-flags")
      .then(r => r.json())
      .then(data => { setFlags(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = flags.filter(f =>
    !searchTerm || f.title.toLowerCase().includes(searchTerm.toLowerCase()) || f.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by category
  const grouped = {};
  for (const flag of filtered) {
    const cat = flag.category || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(flag);
  }

  // Sort categories by defined order
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 28, fontWeight: 700, color: colors.primary, marginBottom: 8 }}>
        Red Flags & Label Tricks
      </h2>
      <p style={{ color: colors.textMed, fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
        The tactics pet food companies use to make their products look better than they are. Learn to spot these so you can make informed choices.
      </p>
      <input
        type="text" placeholder="Search red flags..."
        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
        style={{ width: "100%", padding: "10px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, fontFamily: "'Nunito', sans-serif", marginBottom: 28, boxSizing: "border-box" }}
      />

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: colors.textMed }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: colors.textMed }}>No red flags match your search.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {sortedCategories.map(cat => (
            <div key={cat}>
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 700, color: colors.text, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
                  {CATEGORY_ICONS[cat] || <AlertTriangle size={18} />} {cat}
                </h3>
                {CATEGORY_DESCRIPTIONS[cat] && (
                  <p style={{ fontSize: 13, color: colors.textLight, margin: 0, lineHeight: 1.5 }}>
                    {CATEGORY_DESCRIPTIONS[cat]}
                  </p>
                )}
              </div>
              <div style={{ display: "grid", gap: 16 }}>
                {grouped[cat].map((flag) => (
                  <div key={flag.id} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(44,62,58,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: colors.text, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                        <AlertTriangle size={18} color={colors.poor} /> {flag.title}
                      </h3>
                      <SeverityBadge severity={flag.severity} />
                    </div>
                    <p style={{ fontSize: 14, color: colors.textMed, lineHeight: 1.7, marginBottom: 16 }}>{flag.description}</p>
                    <div style={{ padding: 14, background: colors.primaryLight, borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <Eye size={16} color={colors.primary} style={{ marginTop: 2, flexShrink: 0 }} />
                      <p style={{ fontSize: 13, color: colors.primary, margin: 0, lineHeight: 1.6 }}>
                        <strong>What to look for:</strong> {flag.whatToLookFor}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
