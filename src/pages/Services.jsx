import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Zap, Plus, Minus, ShoppingBag, User, Home, Layers } from "lucide-react";
import { Shell, PageHero } from "../components/ui";
import { LiquidMetalButton } from "../components/ui/liquid-metal-button";
import { prices, money } from "../lib/data";

const CATS = {
  "Homme":            { label: "Homme",           color: "#3b82f6", light: "rgba(59,130,246,0.08)" },
  "Femme":            { label: "Femme",            color: "#ec4899", light: "rgba(236,72,153,0.08)"  },
  "Linges de maison": { label: "Linges de maison", color: "#10b981", light: "rgba(16,185,129,0.08)" },
};

function ServiceCard({ p, onAdd }) {
  const [mode, setMode] = useState("standard");
  const [qty,  setQty]  = useState(1);
  const cat   = CATS[p.category] || { color: "#c9a84c", light: "rgba(201,168,76,0.08)", label: p.category };
  const price = mode === "express" ? p.express : p.standard;

  return (
    <div style={{
      background: "var(--white)",
      border: "1.5px solid var(--line)",
      borderRadius: "20px",
      overflow: "hidden",
      boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
      transition: "transform 0.25s, box-shadow 0.25s",
      display: "flex",
      flexDirection: "column",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.05)"; }}
    >
      {/* Colored top band */}
      <div style={{ height: "4px", background: `linear-gradient(90deg, ${cat.color}, ${cat.color}88)` }} />

      <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "18px", flex: 1 }}>
        {/* Article name + category badge */}
        <div>
          <span style={{
            display: "inline-block", fontSize: "11px", fontWeight: "700",
            textTransform: "uppercase", letterSpacing: "0.1em",
            color: cat.color, background: cat.light,
            padding: "3px 10px", borderRadius: "100px", marginBottom: "8px"
          }}>{cat.label}</span>
          <h3 style={{
            fontSize: "17px", fontWeight: "600", margin: 0,
            fontFamily: "var(--sans)", color: "var(--ink)", lineHeight: 1.3
          }}>{p.name}</h3>
        </div>

        {/* Pill toggle Standard / Express */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          background: "var(--off)", borderRadius: "12px", padding: "4px", gap: "4px"
        }}>
          {/* Standard */}
          <button onClick={() => setMode("standard")} style={{
            padding: "10px 8px", borderRadius: "9px",
            border: "none", cursor: "pointer", transition: "all 0.2s",
            background: mode === "standard" ? "var(--white)" : "transparent",
            boxShadow: mode === "standard" ? "0 1px 6px rgba(0,0,0,0.12)" : "none",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "3px"
          }}>
            <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: mode === "standard" ? "var(--ink)" : "var(--muted)" }}>Standard</span>
            <span style={{ fontSize: "15px", fontWeight: "700", color: mode === "standard" ? "var(--ink)" : "var(--muted)" }}>{money(p.standard)}</span>
          </button>
          {/* Express */}
          <button onClick={() => setMode("express")} style={{
            padding: "10px 8px", borderRadius: "9px",
            border: "none", cursor: "pointer", transition: "all 0.2s",
            background: mode === "express" ? "var(--ink)" : "transparent",
            boxShadow: mode === "express" ? "0 1px 6px rgba(0,0,0,0.2)" : "none",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "3px"
          }}>
            <span style={{
              fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em",
              color: mode === "express" ? "var(--gold)" : "var(--muted)",
              display: "flex", alignItems: "center", gap: "3px"
            }}>
              <Zap size={10} /> Express 8H
            </span>
            <span style={{ fontSize: "15px", fontWeight: "700", color: mode === "express" ? "var(--white)" : "var(--muted)" }}>{money(p.express)}</span>
          </button>
        </div>

        {/* Bottom row: qty + add button */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "auto" }}>
          {/* Qty */}
          <div style={{
            display: "flex", alignItems: "center",
            border: "1.5px solid var(--line)", borderRadius: "10px",
            overflow: "hidden", flexShrink: 0
          }}>
            <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{
              width: "34px", height: "38px", background: "transparent",
              border: "none", cursor: "pointer", color: "var(--ink)",
              fontSize: "18px", fontWeight: "300", display: "flex", alignItems: "center", justifyContent: "center"
            }}>−</button>
            <span style={{
              width: "30px", textAlign: "center",
              fontWeight: "700", fontSize: "15px", fontFamily: "var(--sans)"
            }}>{qty}</span>
            <button onClick={() => setQty(q => q + 1)} style={{
              width: "34px", height: "38px", background: "transparent",
              border: "none", cursor: "pointer", color: "var(--ink)",
              fontSize: "18px", fontWeight: "300", display: "flex", alignItems: "center", justifyContent: "center"
            }}>+</button>
          </div>

          {/* Add button */}
          <button onClick={() => onAdd({ ...p, mode, price, qty })} style={{
            flex: 1, height: "38px", borderRadius: "10px", border: "none",
            background: "var(--gold)", color: "var(--ink)",
            fontWeight: "700", fontSize: "13px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            transition: "all 0.2s", fontFamily: "var(--ui)", letterSpacing: "0.03em"
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--ink)"; e.currentTarget.style.color = "var(--white)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--gold)"; e.currentTarget.style.color = "var(--ink)"; }}
          >
            <ShoppingBag size={14} /> Ajouter au devis
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Services() {
  const [query, setQuery] = useState("");
  const [cat,   setCat]   = useState("Tous");
  const [toast, setToast] = useState(null);
  const [, navigate] = useLocation();

  const cats     = ["Tous", "Homme", "Femme", "Linges de maison"];
  const filtered = prices.filter(p =>
    (cat === "Tous" || p.category === cat) &&
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  const addToCart = item => {
    const cart = JSON.parse(localStorage.getItem("vp_cart") || "[]");
    const idx  = cart.findIndex(c => c.id === item.id && c.mode === item.mode);
    if (idx >= 0) cart[idx].qty += item.qty;
    else cart.push(item);
    localStorage.setItem("vp_cart", JSON.stringify(cart));
    setToast(`« ${item.name} » ajouté au devis`);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <Shell>
      <PageHero
        eyebrow="La carte des soins"
        title={<>Des tarifs clairs.<br /><em>Un soin sans compromis.</em></>}
        text="Tous nos tarifs sont affichés en toute transparence. Comparez, choisissez, et confiez-nous vos pièces."
      />

      {/* Bouton flottant "Voir mon devis" */}
      <button
        onClick={() => navigate("/devis")}
        style={{
          position: "fixed", bottom: "28px", right: "28px", zIndex: 9998,
          background: "var(--gold)", color: "#111",
          border: "none", borderRadius: "100px",
          padding: "14px 24px",
          fontWeight: "700", fontSize: "15px", fontFamily: "var(--ui)",
          cursor: "pointer",
          display: "flex", alignItems: "center", gap: "10px",
          boxShadow: "0 8px 32px rgba(201,168,76,0.45)",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(201,168,76,0.55)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(201,168,76,0.45)"; }}
        aria-label="Calculer mon devis"
      >
        <ShoppingBag size={18} />
        Calculer mon prix
      </button>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)",
          background: "var(--ink)", color: "#fff", padding: "14px 28px",
          borderRadius: "100px", fontWeight: "600", fontSize: "14px",
          zIndex: 9999, boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          borderLeft: "4px solid var(--gold)", whiteSpace: "nowrap",
          animation: "fadeUp 0.3s ease"
        }}>
          ✓ &nbsp;{toast}
        </div>
      )}

      <section className="pricing-section">
        <div style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "12px", padding: "16px 20px", marginBottom: "24px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <Zap size={20} color="var(--gold)" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <h4 style={{ margin: "0 0 4px", fontSize: "15px", color: "var(--ink)", fontWeight: "600" }}>L'Offre Express 8H</h4>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)", lineHeight: 1.5 }}>
              Besoin de vos vêtements en urgence ? Choisissez l'option Express pour un traitement prioritaire (nettoyage et repassage) prêt en moins de 8 heures.
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="pricing-toolbar">
          <div className="searchbox">
            <Search size={17} color="var(--muted)" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un article…"
            />
          </div>
          <div className="chips">
            {cats.map(c => (
              <button key={c} className={cat === c ? "chip-btn active" : "chip-btn"} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "18px" }}>
          {filtered.map(p => (
            <ServiceCard key={p.id} p={p} onAdd={addToCart} />
          ))}
        </div>
        <p className="table-footnote">{filtered.length} article{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""} · Prix TTC en FCFA</p>
      </section>

      {/* CTA */}
      <section className="cta-band" style={{ marginTop: 0 }}>
        <div className="cta-dots" aria-hidden />
        <div className="cta-inner">
          <span className="eyebrow light">Vous avez sélectionné vos pièces ?</span>
          <h2 style={{ color: "#fff" }}>Consultez votre devis<br /><em style={{ color: "var(--gold)" }}>instantanément.</em></h2>
          <div className="cta-btns">
            <LiquidMetalButton label="Voir mon devis" width={240} onClick={() => navigate("/devis")} />
          </div>
        </div>
      </section>
    </Shell>
  );
}
