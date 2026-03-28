import { useState, useEffect } from "react";
import colors from "../colors.js";
import { AlertTriangle, Eye, ShieldAlert, Tags, FlaskConical, Scale, Info } from "lucide-react";


function AppliesToBadge({ appliesTo }) {
  const config = {
    dry: { label: "Dry Food", bg: colors.cautionBg, color: colors.caution },
    wet: { label: "Wet Food", bg: "#D4F1F9", color: "#1A7A8A" },
    both: { label: "Dry & Wet Food", bg: colors.primaryLight, color: colors.primary },
  };
  const c = config[appliesTo] || config.both;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 7px", borderRadius: 8, background: c.bg, color: c.color, fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" }}>
      {c.label}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const config = {
    high: { bg: colors.poorBg, color: colors.poor, label: "Don't Fall For This", icon: <AlertTriangle size={9} /> },
    medium: { bg: colors.cautionBg, color: colors.caution, label: "Watch For", icon: <Eye size={9} /> },
    low: { bg: colors.neutralBg, color: colors.neutral, label: "Worth Knowing", icon: <Info size={9} /> }
  };
  const c = config[severity] || config.medium;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 8, background: c.bg, color: c.color, fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" }}>
      {c.icon} {c.label}
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
  "Label Tricks": <Tags size={16} />,
  "Ingredient Deception": <ShieldAlert size={16} />,
  "Hidden Health Concerns": <FlaskConical size={16} />,
  "Misleading Standards": <Scale size={16} />,
};

export default function RedFlagsPage({ foodCategory, setFoodCategory }) {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/red-flags")
      .then(r => r.json())
      .then(data => { setFlags(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = flags.filter(f =>
    !searchTerm || f.title.toLowerCase().includes(searchTerm.toLowerCase()) || f.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const grouped = {};
  for (const flag of filtered) {
    const cat = flag.category || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(flag);
  }

  // Sort flags within each category by severity: high → medium → low
  const severityOrder = { high: 0, medium: 1, low: 2 };
  for (const cat in grouped) {
    grouped[cat].sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));
  }

  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px" }}>
      <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 28, fontWeight: 700, color: colors.primary, marginBottom: 8 }}>
        What Labels Hide
      </h2>
      <p style={{ color: colors.textMed, fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
        The tactics pet food companies use to make their food products look better than they are.
      </p>
      <input
        type="text" placeholder="Search labeling tricks..."
        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
        style={{ width: "100%", padding: "10px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, fontFamily: "'Nunito', sans-serif", marginBottom: 28, boxSizing: "border-box" }}
      />

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: colors.textMed }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: colors.textMed }}>No label tricks match your search.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {sortedCategories.map(cat => (
            <div key={cat}>
              <div style={{ marginBottom: 10 }}>
                <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 700, color: colors.text, margin: "0 0 2px", display: "flex", alignItems: "center", gap: 6 }}>
                  {CATEGORY_ICONS[cat] || <AlertTriangle size={16} />} {cat}
                </h3>
                {CATEGORY_DESCRIPTIONS[cat] && (
                  <p style={{ fontSize: 12, color: colors.textLight, margin: 0, lineHeight: 1.4 }}>
                    {CATEGORY_DESCRIPTIONS[cat]}
                  </p>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {grouped[cat].map((flag) => (
                  <div key={flag.id} style={{
                    background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12,
                    padding: 16, boxShadow: "0 1px 6px rgba(44,62,58,0.04)",
                    display: "flex", flexDirection: "column", gap: 8,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.text, margin: 0, lineHeight: 1.3 }}>
                        {flag.title}
                      </h4>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                        <AppliesToBadge appliesTo={flag.appliesTo} />
                        <SeverityBadge severity={flag.severity} />
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: colors.textMed, lineHeight: 1.5, margin: 0 }}>{flag.description}</p>
                    <div style={{ padding: "8px 10px", background: colors.primaryLight, borderRadius: 8, marginTop: "auto" }}>
                      <p style={{ fontSize: 11, color: colors.primary, margin: 0, lineHeight: 1.4 }}>
                        {flag.whatToLookFor}
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
