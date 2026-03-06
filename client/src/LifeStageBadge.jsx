import colors from "./colors.js";

const LIFE_STAGE_STYLES = {
  "Kitten":          { color: "#9333EA", bg: "#F3E8FF", label: "Kitten" },
  "Adult":           { color: colors.primary, bg: colors.primaryLight, label: "Adult" },
  "All Life Stages": { color: colors.neutral, bg: colors.neutralBg, label: "All Stages" },
  "Senior (7+)":     { color: colors.accent, bg: colors.accentLight, label: "Senior 7+" },
  "Senior (11+)":    { color: colors.poor, bg: colors.poorBg, label: "Senior 11+" },
};

export default function LifeStageBadge({ lifeStage, size = "small" }) {
  if (!lifeStage) return null;
  const style = LIFE_STAGE_STYLES[lifeStage] || { color: colors.textMed, bg: colors.bg, label: lifeStage };
  const fontSize = size === "small" ? 10 : 11;
  const padding = size === "small" ? "2px 6px" : "3px 8px";
  return (
    <span style={{
      display: "inline-block",
      padding,
      borderRadius: 6,
      fontSize,
      fontWeight: 700,
      color: style.color,
      background: style.bg,
      whiteSpace: "nowrap",
      letterSpacing: 0.3,
    }}>
      {style.label}
    </span>
  );
}
