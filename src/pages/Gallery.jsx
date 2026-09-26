import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { X, ZoomIn, ChevronLeft, ChevronRight, Star, Sparkles } from "lucide-react";
import { Shell, Button, PageHero } from "../components/ui";
import { LiquidMetalButton } from "../components/ui/liquid-metal-button";
import { gallery, contactInfo } from "../lib/data";
import { supabase } from "../lib/supabase";

/* ── Lightbox avec trap focus ──────────────────────────── */
function Lightbox({ items, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx);

  const prev = () => setIdx(i => (i - 1 + items.length) % items.length);
  const next = () => setIdx(i => (i + 1) % items.length);

  // ✅ Trap focus + fermeture clavier
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", handleKey);
    // Bloquer le scroll du body
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [idx]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "fadeIn 0.25s ease",
      }}
    >
      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>

      <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <img
          src={items[idx][1]}
          alt={items[idx][0]}
          style={{ maxWidth: "90vw", maxHeight: "75vh", objectFit: "contain", borderRadius: "16px", boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }}
        />
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <p style={{ font: "400 20px var(--serif)", color: "#fff" }}>{items[idx][0]}</p>
          <span style={{ font: "400 13px var(--sans)", color: "rgba(255,255,255,0.5)", marginTop: "4px", display: "block" }}>
            {idx + 1} / {items.length} · Vision Pressing, Tabligbo
          </span>
        </div>
      </div>

      {/* Buttons */}
      <button onClick={onClose} aria-label="Fermer" style={{ position: "fixed", top: "24px", right: "24px", width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "20px" }}>
        <X size={22} />
      </button>
      <button onClick={e => { e.stopPropagation(); prev(); }} aria-label="Précédent" style={{ position: "fixed", left: "24px", top: "50%", transform: "translateY(-50%)", width: "52px", height: "52px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <ChevronLeft size={24} />
      </button>
      <button onClick={e => { e.stopPropagation(); next(); }} aria-label="Suivant" style={{ position: "fixed", right: "24px", top: "50%", transform: "translateY(-50%)", width: "52px", height: "52px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <ChevronRight size={24} />
      </button>
    </div>
  );
}

export default function Gallery() {
  const [lightbox, setLightbox] = useState(null);
  const [transformations, setTransformations] = useState([]);
  const [, navigate] = useLocation();

  useEffect(() => {
    supabase.from("gallery").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setTransformations(data);
    });
  }, []);

  return (
    <Shell>
      {/* ── Page hero ─────────────────────────────── */}
      <PageHero
        eyebrow="Notre pressing en images"
        title={<>Decouvrez<br /><em>Vision Pressing.</em></>}
        text="Découvrez l'univers de Vision Pressing à Tabligbo — des pièces soignées, des gestes précis, une passion sincère pour le soin textile."
      />

      {/* ── Gallery grid ──────────────────────────── */}
      <section className="gallery-section">
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 clamp(16px,4vw,60px) 80px" }}>

          {/* Main showcase grid */}
          <div className="gal-grid" style={{ marginBottom: "20px" }}>
            {gallery.map(([label, img], i) => (
              <div
                key={i}
                className={`gal-item gi-${i}`}
                onClick={() => setLightbox(i)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === "Enter" && setLightbox(i)}
                aria-label={`Voir la photo: ${label}`}
              >
                <img src={img} alt={label} loading={i === 0 ? "eager" : "lazy"} />
                <div className="gal-overlay">
                  <span className="gal-num">0{i + 1}</span>
                  <strong>{label}</strong>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", opacity: 0.75 }}>
                    <ZoomIn size={14} color="#fff" />
                    <span style={{ font: "400 12px var(--sans)", color: "#fff" }}>Agrandir</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Info strip */}
          <div style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "16px", padding: "28px 40px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: "20px",
          }}>
            <div>
              <p style={{ font: "600 18px var(--sans)", color: "#fff", marginBottom: "4px" }}>Vision Pressing</p>
              <p style={{ font: "400 14px var(--sans)", color: "rgba(255,255,255,0.55)" }}>{contactInfo.addressFull} — {contactInfo.daysSimple} · {contactInfo.hoursSimple}</p>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <a
                href={contactInfo.mapsLink}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "12px 24px", borderRadius: "8px",
                  background: "var(--gold)", color: "#fff",
                  font: "500 14px var(--sans)", border: "none", cursor: "pointer",
                  textDecoration: "none", transition: "all 0.3s",
                }}
              >
                Voir sur Google Maps
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ── Transformations Avant/Après ─────────── */}
      {transformations.length > 0 && (
        <section style={{ padding: "80px clamp(16px,4vw,60px)", maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ marginBottom: "48px", textAlign: "center" }}>
            <span className="eyebrow" style={{ marginBottom: "8px", display: "block" }}>Transformations</span>
            <h2 style={{ fontSize: "clamp(28px,4vw,40px)", margin: 0 }}>Avant &amp; <em>Après</em></h2>
            <p style={{ color: "var(--muted)", marginTop: "12px", maxWidth: "480px", marginLeft: "auto", marginRight: "auto" }}>Voyez par vous-mêmes la qualité de nos soins.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" }}>
            {transformations.map(t => (
              <div key={t.id} style={{ background: "var(--white)", borderRadius: "20px", overflow: "hidden", border: "1px solid var(--line)", boxShadow: "var(--sh-sm)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", position: "relative" }}>
                  <div style={{ position: "relative" }}>
                    <img src={t.before_url} alt="Avant" style={{ width: "100%", height: "220px", objectFit: "cover", display: "block" }} />
                    <span style={{ position: "absolute", top: "10px", left: "10px", background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Avant</span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <img src={t.after_url} alt="Après" style={{ width: "100%", height: "220px", objectFit: "cover", display: "block" }} />
                    <span style={{ position: "absolute", top: "10px", left: "10px", background: "var(--gold)", color: "#111", fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Après</span>
                  </div>
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "var(--white)", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
                    <Sparkles size={16} color="var(--gold)" />
                  </div>
                </div>
                <div style={{ padding: "16px 20px" }}>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "var(--ink)" }}>{t.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────── */}
      <section style={{ padding: "0 20px" }}>
        <div className="cta-card">
          <div className="cta-dots" aria-hidden />
          <span className="eyebrow light">Confiez-nous votre linge</span>
          <h2>Votre pièce mérite<br /><em style={{ color: "var(--gold)" }}>le meilleur soin.</em></h2>
          <div className="cta-card-actions">
            <LiquidMetalButton label="Obtenir un devis" width={220} onClick={() => navigate("/devis")} />
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox !== null && (
        <Lightbox items={gallery} startIdx={lightbox} onClose={() => setLightbox(null)} />
      )}
    </Shell>
  );
}
