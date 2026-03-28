import colors from "./colors.js";

export default function FoodCategoryToggle({ value, onChange }) {
  const options = [
    { key: "Dry", label: "Dry Food" },
    { key: "Wet", label: "Wet Food" },
  ];

  return (
    <div style={{
      display: "inline-flex",
      borderRadius: 10,
      overflow: "hidden",
      border: `2px solid ${colors.primary}`,
      fontFamily: "'Nunito', sans-serif",
    }}>
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            style={{
              padding: "8px 20px",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "'Nunito', sans-serif",
              border: "none",
              cursor: "pointer",
              color: active ? "#fff" : colors.primary,
              background: active ? colors.primary : "#fff",
              transition: "all 0.2s ease",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
