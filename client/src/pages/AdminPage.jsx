import { useState, useEffect } from "react";
import colors from "../colors.js";

const EMPTY_PRODUCT = {
  name: "", brand: "", type: "Dry", lifeStage: "", retailer: "PetSmart",
  foodType: "", breed: "", flavor: "",
  fullIngredients: "", guaranteedAnalysis: "", calorieContent: "", aafco: "",
  nutritionalOptions: "", healthConsiderations: "",
  benefits: "", description: "", directions: "",
  keyFeatures: "", concerns: "", bestFor: "", avoid: "",
  recallHistory: "", country: "USA"
};

const EMPTY_INGREDIENT = {
  name: "", rating: "neutral", category: "", explanation: "", misleading: "", healthNotes: ""
};

function inputStyle(extra = {}) {
  return {
    width: "100%", padding: "8px 10px", border: `1px solid ${colors.border}`,
    borderRadius: 6, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", ...extra
  };
}

function label(text, note) {
  return (
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: colors.textMed, marginBottom: 4 }}>
      {text} {note && <span style={{ fontWeight: 400, color: colors.textLight }}>{note}</span>}
    </label>
  );
}

function Field({ name, note, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label(name, note)}
      {children}
    </div>
  );
}

// Convert array fields to/from comma-separated strings for the form
function toForm(product) {
  const arrFields = ["nutritionalOptions", "healthConsiderations", "benefits", "keyFeatures", "concerns", "bestFor", "avoid"];
  const out = { ...product };
  for (const f of arrFields) {
    if (Array.isArray(out[f])) out[f] = out[f].join(", ");
  }
  return out;
}

function fromForm(form) {
  const arrFields = ["nutritionalOptions", "healthConsiderations", "benefits", "keyFeatures", "concerns", "bestFor", "avoid"];
  const out = { ...form };
  for (const f of arrFields) {
    if (typeof out[f] === "string") out[f] = out[f].split(",").map(s => s.trim()).filter(Boolean);
  }
  return out;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(!!sessionStorage.getItem("adminPassword"));
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = list, {} = new, {...} = edit
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [formProduct, setFormProduct] = useState(EMPTY_PRODUCT);
  const [formIngredient, setFormIngredient] = useState(EMPTY_INGREDIENT);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const adminPassword = sessionStorage.getItem("adminPassword") || "";

  function adminHeaders() {
    return { "Content-Type": "application/json", "x-admin-password": adminPassword };
  }

  async function login() {
    setAuthError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    if (res.ok) {
      sessionStorage.setItem("adminPassword", password);
      setAuthed(true);
    } else {
      setAuthError("Incorrect password.");
    }
  }

  function logout() {
    sessionStorage.removeItem("adminPassword");
    setAuthed(false);
  }

  useEffect(() => {
    if (!authed) return;
    if (tab === "products") {
      setLoading(true);
      fetch("/api/products").then(r => r.json()).then(d => { setProducts(d); setLoading(false); });
    } else {
      setLoading(true);
      fetch("/api/ingredients").then(r => r.json()).then(d => { setIngredients(d); setLoading(false); });
    }
  }, [authed, tab]);

  function flash(msg) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  }

  // ── Products ──────────────────────────────────────────────────────────────
  function startNewProduct() {
    setFormProduct(EMPTY_PRODUCT);
    setEditingProduct("new");
  }

  function startEditProduct(p) {
    setFormProduct(toForm(p));
    setEditingProduct(p.id);
  }

  async function saveProduct() {
    setSaving(true);
    const data = fromForm(formProduct);
    const isNew = editingProduct === "new";
    const url = isNew ? "/api/products" : `/api/products/${editingProduct}`;
    const method = isNew ? "POST" : "PUT";
    const res = await fetch(url, { method, headers: adminHeaders(), body: JSON.stringify(data) });
    if (res.ok) {
      const saved = await res.json();
      setProducts(prev => isNew ? [...prev, saved] : prev.map(p => p.id === saved.id ? saved : p));
      setEditingProduct(null);
      flash(isNew ? "Product added!" : "Product updated!");
    }
    setSaving(false);
  }

  async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE", headers: adminHeaders() });
    setProducts(prev => prev.filter(p => p.id !== id));
    flash("Product deleted.");
  }

  // ── Ingredients ───────────────────────────────────────────────────────────
  function startNewIngredient() {
    setFormIngredient(EMPTY_INGREDIENT);
    setEditingIngredient("new");
  }

  function startEditIngredient(i) {
    setFormIngredient({ ...i });
    setEditingIngredient(i.id);
  }

  async function saveIngredient() {
    setSaving(true);
    const isNew = editingIngredient === "new";
    const url = isNew ? "/api/ingredients" : `/api/ingredients/${editingIngredient}`;
    const method = isNew ? "POST" : "PUT";
    const res = await fetch(url, { method, headers: adminHeaders(), body: JSON.stringify(formIngredient) });
    if (res.ok) {
      const saved = await res.json();
      setIngredients(prev => isNew ? [...prev, saved] : prev.map(i => i.id === saved.id ? saved : i));
      setEditingIngredient(null);
      flash(isNew ? "Ingredient added!" : "Ingredient updated!");
    }
    setSaving(false);
  }

  async function deleteIngredient(id) {
    if (!confirm("Delete this ingredient?")) return;
    await fetch(`/api/ingredients/${id}`, { method: "DELETE", headers: adminHeaders() });
    setIngredients(prev => prev.filter(i => i.id !== id));
    flash("Ingredient deleted.");
  }

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ maxWidth: 400, margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 28, color: colors.primary, marginBottom: 8 }}>Admin Panel</h2>
        <p style={{ color: colors.textMed, fontSize: 14, marginBottom: 24 }}>Enter your admin password to continue.</p>
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
          <input
            type="password" placeholder="Admin password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()}
            style={{ ...inputStyle(), marginBottom: 12 }}
          />
          {authError && <p style={{ color: colors.poor, fontSize: 13, marginBottom: 12 }}>{authError}</p>}
          <button onClick={login} style={{
            width: "100%", padding: "10px", background: colors.primary, color: "#fff",
            border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
          }}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const sectionHeader = (title, onAdd) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 24, color: colors.primary, margin: 0 }}>{title}</h2>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onAdd} style={{ padding: "8px 16px", background: colors.primary, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          + Add New
        </button>
        <button onClick={logout} style={{ padding: "8px 16px", background: "none", color: colors.textMed, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          Sign Out
        </button>
      </div>
    </div>
  );

  // ── Product form ──────────────────────────────────────────────────────────
  if (editingProduct !== null) {
    const f = formProduct;
    const set = (k, v) => setFormProduct(prev => ({ ...prev, [k]: v }));
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
        <button onClick={() => setEditingProduct(null)} style={{ background: "none", border: "none", color: colors.primary, cursor: "pointer", fontSize: 14, fontWeight: 500, marginBottom: 20, padding: 0, fontFamily: "inherit" }}>
          ← Back to products
        </button>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 24, color: colors.primary, marginBottom: 24 }}>
          {editingProduct === "new" ? "Add New Product" : "Edit Product"}
        </h2>
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 28 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field name="Product Name *"><input value={f.name} onChange={e => set("name", e.target.value)} style={inputStyle()} /></Field>
            </div>
            <Field name="Brand *"><input value={f.brand} onChange={e => set("brand", e.target.value)} style={inputStyle()} /></Field>
            <Field name="Flavor"><input value={f.flavor} onChange={e => set("flavor", e.target.value)} style={inputStyle()} /></Field>
            <Field name="Life Stage">
              <select value={f.lifeStage} onChange={e => set("lifeStage", e.target.value)} style={inputStyle()}>
                <option value="">Select...</option>
                {["Kitten", "Adult", "Senior (7+)", "Senior (11+)", "Senior (12+)", "All Life Stages"].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field name="Food Type">
              <input value={f.foodType} onChange={e => set("foodType", e.target.value)} placeholder="e.g. Grain-Free, Natural" style={inputStyle()} />
            </Field>
            <Field name="Type">
              <select value={f.type} onChange={e => set("type", e.target.value)} style={inputStyle()}>
                {["Dry", "Wet", "Freeze-Dried", "Raw"].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field name="Breed Size">
              <input value={f.breed} onChange={e => set("breed", e.target.value)} placeholder="e.g. Maine Coon, Persian, Siamese" style={inputStyle()} />
            </Field>
            <Field name="Retailer"><input value={f.retailer} onChange={e => set("retailer", e.target.value)} style={inputStyle()} /></Field>
            <Field name="Calorie Content" note="e.g. 387 kcal/cup"><input value={f.calorieContent} onChange={e => set("calorieContent", e.target.value)} style={inputStyle()} /></Field>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field name="Full Ingredients">
                <textarea value={f.fullIngredients} onChange={e => set("fullIngredients", e.target.value)} placeholder="Chicken, Chicken Meal, Brown Rice, ..." style={inputStyle({ minHeight: 100, resize: "vertical" })} />
              </Field>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field name="Guaranteed Analysis">
                <textarea value={f.guaranteedAnalysis} onChange={e => set("guaranteedAnalysis", e.target.value)} placeholder="Crude Protein (Min) 38.0%, Crude Fat (Min) 14.0%, ..." style={inputStyle({ minHeight: 80, resize: "vertical" })} />
              </Field>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field name="Description">
                <textarea value={f.description} onChange={e => set("description", e.target.value)} style={inputStyle({ minHeight: 80, resize: "vertical" })} />
              </Field>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field name="Benefits" note="comma-separated">
                <textarea value={f.benefits} onChange={e => set("benefits", e.target.value)} placeholder="Supports immune health, High protein for lean muscles, ..." style={inputStyle({ minHeight: 70, resize: "vertical" })} />
              </Field>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field name="Health Considerations" note="comma-separated">
                <textarea value={f.healthConsiderations} onChange={e => set("healthConsiderations", e.target.value)} placeholder="Digestive Health, Immune Support, ..." style={inputStyle({ minHeight: 50, resize: "vertical" })} />
              </Field>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field name="Nutritional Options" note="comma-separated">
                <textarea value={f.nutritionalOptions} onChange={e => set("nutritionalOptions", e.target.value)} placeholder="High-Protein, Real Meat, ..." style={inputStyle({ minHeight: 50, resize: "vertical" })} />
              </Field>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field name="Directions">
                <textarea value={f.directions} onChange={e => set("directions", e.target.value)} style={inputStyle({ minHeight: 60, resize: "vertical" })} />
              </Field>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field name="AAFCO Statement">
                <input value={f.aafco} onChange={e => set("aafco", e.target.value)} style={inputStyle()} />
              </Field>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field name="Key Features" note="comma-separated">
                <textarea value={f.keyFeatures} onChange={e => set("keyFeatures", e.target.value)} style={inputStyle({ minHeight: 70, resize: "vertical" })} />
              </Field>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field name="Concerns" note="comma-separated">
                <textarea value={f.concerns} onChange={e => set("concerns", e.target.value)} style={inputStyle({ minHeight: 70, resize: "vertical" })} />
              </Field>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field name="Best For" note="comma-separated">
                <textarea value={f.bestFor} onChange={e => set("bestFor", e.target.value)} style={inputStyle({ minHeight: 70, resize: "vertical" })} />
              </Field>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field name="Avoid If" note="comma-separated">
                <textarea value={f.avoid} onChange={e => set("avoid", e.target.value)} style={inputStyle({ minHeight: 70, resize: "vertical" })} />
              </Field>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field name="Recall History">
                <textarea value={f.recallHistory} onChange={e => set("recallHistory", e.target.value)} style={inputStyle({ minHeight: 60, resize: "vertical" })} />
              </Field>
            </div>
            <Field name="Country of Origin"><input value={f.country} onChange={e => set("country", e.target.value)} style={inputStyle()} /></Field>
          </div>
          <button onClick={saveProduct} disabled={saving || !f.name} style={{
            marginTop: 24, padding: "12px 32px", background: colors.primary, color: "#fff",
            border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            opacity: !f.name ? 0.5 : 1
          }}>
            {saving ? "Saving..." : editingProduct === "new" ? "Add Product" : "Save Changes"}
          </button>
        </div>
      </div>
    );
  }

  // ── Ingredient form ───────────────────────────────────────────────────────
  if (editingIngredient !== null) {
    const f = formIngredient;
    const set = (k, v) => setFormIngredient(prev => ({ ...prev, [k]: v }));
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px" }}>
        <button onClick={() => setEditingIngredient(null)} style={{ background: "none", border: "none", color: colors.primary, cursor: "pointer", fontSize: 14, fontWeight: 500, marginBottom: 20, padding: 0, fontFamily: "inherit" }}>
          ← Back to ingredients
        </button>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 24, color: colors.primary, marginBottom: 24 }}>
          {editingIngredient === "new" ? "Add New Ingredient" : "Edit Ingredient"}
        </h2>
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 28 }}>
          <Field name="Ingredient Name *"><input value={f.name} onChange={e => set("name", e.target.value)} style={inputStyle()} /></Field>
          <Field name="Rating">
            <select value={f.rating} onChange={e => set("rating", e.target.value)} style={inputStyle()}>
              {["great", "good", "neutral", "caution", "poor"].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </Field>
          <Field name="Category" note="e.g. Protein, Carbohydrate, Supplement"><input value={f.category} onChange={e => set("category", e.target.value)} style={inputStyle()} /></Field>
          <Field name="What Is It?">
            <textarea value={f.explanation} onChange={e => set("explanation", e.target.value)} style={inputStyle({ minHeight: 100, resize: "vertical" })} />
          </Field>
          <Field name="What Labels Don't Tell You">
            <textarea value={f.misleading} onChange={e => set("misleading", e.target.value)} style={inputStyle({ minHeight: 100, resize: "vertical" })} />
          </Field>
          <Field name="Health Notes">
            <textarea value={f.healthNotes} onChange={e => set("healthNotes", e.target.value)} style={inputStyle({ minHeight: 100, resize: "vertical" })} />
          </Field>
          <button onClick={saveIngredient} disabled={saving || !f.name} style={{
            marginTop: 8, padding: "12px 32px", background: colors.primary, color: "#fff",
            border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            opacity: !f.name ? 0.5 : 1
          }}>
            {saving ? "Saving..." : editingIngredient === "new" ? "Add Ingredient" : "Save Changes"}
          </button>
        </div>
      </div>
    );
  }

  // ── Main admin list ───────────────────────────────────────────────────────
  const tabBtn = (id, lbl) => (
    <button onClick={() => setTab(id)} style={{
      padding: "8px 20px", border: "none", cursor: "pointer", borderRadius: 8, fontSize: 13, fontWeight: 500,
      background: tab === id ? colors.primaryLight : "transparent",
      color: tab === id ? colors.primary : colors.textMed, fontFamily: "inherit"
    }}>
      {lbl}
    </button>
  );

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 4, background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 4 }}>
          {tabBtn("products", `Products (${products.length})`)}
          {tabBtn("ingredients", `Ingredients (${ingredients.length})`)}
        </div>
      </div>

      {message && (
        <div style={{ padding: "10px 16px", background: colors.goodBg, borderRadius: 8, color: colors.good, fontSize: 13, marginBottom: 16 }}>{message}</div>
      )}

      {tab === "products" && (
        <>
          {sectionHeader("Products", startNewProduct)}
          {loading ? <p style={{ color: colors.textMed }}>Loading...</p> : (
            <div style={{ display: "grid", gap: 8 }}>
              {products.map(p => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "14px 16px" }}>
                  <div>
                    <span style={{ fontSize: 11, color: colors.accent, fontWeight: 600, textTransform: "uppercase" }}>{p.brand}</span>
                    <p style={{ fontSize: 14, fontWeight: 600, color: colors.text, margin: "2px 0 0" }}>{p.name}</p>
                    <p style={{ fontSize: 12, color: colors.textLight, margin: "2px 0 0" }}>
                      {[p.lifeStage, p.flavor, p.foodType].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => startEditProduct(p)} style={{ padding: "6px 14px", background: colors.primaryLight, color: colors.primary, border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
                    <button onClick={() => deleteProduct(p.id)} style={{ padding: "6px 14px", background: colors.poorBg, color: colors.poor, border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "ingredients" && (
        <>
          {sectionHeader("Ingredients", startNewIngredient)}
          {loading ? <p style={{ color: colors.textMed }}>Loading...</p> : (
            <div style={{ display: "grid", gap: 8 }}>
              {ingredients.map(ing => (
                <div key={ing.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "14px 16px" }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: colors.text, margin: 0 }}>{ing.name}</p>
                    <p style={{ fontSize: 12, color: colors.textLight, margin: "2px 0 0" }}>{ing.category} · {ing.rating}</p>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => startEditIngredient(ing)} style={{ padding: "6px 14px", background: colors.primaryLight, color: colors.primary, border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
                    <button onClick={() => deleteIngredient(ing.id)} style={{ padding: "6px 14px", background: colors.poorBg, color: colors.poor, border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
