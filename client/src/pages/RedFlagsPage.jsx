import { useState, useEffect } from "react";
import colors from "../colors.js";
import { AlertTriangle, Eye } from "lucide-react";

function SeverityBadge({ severity }) {
  const config = {
    high: { bg: colors.poorBg, color: colors.poor, label: "High Risk" },
    medium: { bg: colors.cautionBg, color: colors.caution, label: "Watch For" }
  };
  const c = config[severity] || config.medium;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 12, background: c.bg, color: c.color, fontSize: 12, fontWeight: 600 }}>
      <AlertTriangle size={12} /> {c.label}
    </span>
  );
}

export default function RedFlagsPage() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/red-flags")
      .then(r => r.json())
      .then(data => { setFlags(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 28, fontWeight: 700, color: colors.primary, marginBottom: 8 }}>
        Red Flags & Label Tricks
      </h2>
      <p style={{ color: colors.textMed, fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
        The tactics pet food companies use to make their products look better than they are. Learn to spot these so you can make informed choices.
      </p>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: colors.textMed }}>Loading...</div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {flags.map((flag) => (
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
      )}
    </div>
  );
}
