import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Zap, X, Check, Sparkles, ShoppingBag, ArrowLeft, Send, Truck, MapPin, Phone } from "lucide-react";
import { Shell, PageHero, Button } from "../components/ui";
import { LiquidMetalButton } from "../components/ui/liquid-metal-button";
import { money } from "../lib/data";
import { useAuth } from "../lib/auth";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { supabase } from "../lib/supabase";

const WHATSAPP_NUMBER = "22890788178";

export default function Quote() {
  const [items, setItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [deliveryLocations, setDeliveryLocations] = useState([]);
  const [deliveryMode, setDeliveryMode] = useState("none");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const { user } = useAuth();
  const { redirectToLogin } = useRequireAuth();
  const [, navigate] = useLocation();

  // ✅ Snapshot du total de nettoyage au moment de la commande (évite cleaningTotal=0 après clear())
  const snapshotRef = useRef({ cleaningTotal: 0 });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("vp_cart") || "[]");
    setItems(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("vp_cart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    supabase.from("delivery_locations").select("*").order("name").then(({ data }) => {
      if (data) setDeliveryLocations(data);
    });
  }, []);

  useEffect(() => {
    if (user) {
      if ((user.discount_10_remaining || 0) > 0) setAppliedDiscount("10%");
      else if ((user.discount_5_remaining || 0) > 0) setAppliedDiscount("5%");
    }
  }, [user]);

  const cleaningTotal = items.reduce((s, i) => s + i.qty * i.price, 0);

  const selectedLoc = deliveryLocations.find(l => l.name === selectedLocation);
  let deliveryPrice = 0;
  if (selectedLoc && deliveryMode !== "none") {
    if (deliveryMode === "collect")  deliveryPrice = selectedLoc.collection_price;
    else if (deliveryMode === "dropoff") deliveryPrice = selectedLoc.dropoff_price;
    else if (deliveryMode === "both")    deliveryPrice = selectedLoc.collection_price + selectedLoc.dropoff_price;
  }

  const subtotal = cleaningTotal + deliveryPrice;
  const discountAmount = appliedDiscount
    ? Math.round(subtotal * (appliedDiscount === "10%" ? 0.10 : 0.05))
    : 0;
  const total = subtotal - discountAmount;

  const upd = (id, mode, key, val) => {
    setItems(items.map(i => {
      if (i.id !== id || i.mode !== mode) return i;
      if (key === "mode") return { ...i, mode: val, price: val === "express" ? i.express : i.standard };
      return { ...i, [key]: val };
    }));
  };

  const remove = (id, mode) => setItems(items.filter(i => !(i.id === id && i.mode === mode)));
  const clear = () => { setItems([]); localStorage.removeItem("vp_cart"); };

  const handleCheckout = async () => {
    if (!user) {
      redirectToLogin();
      return;
    }
    if (deliveryMode !== "none" && !selectedLocation) {
      alert("Veuillez sélectionner un lieu de livraison.");
      return;
    }

    // ✅ Snapshot des valeurs AVANT clear()
    const snapshotCleaningTotal = cleaningTotal;
    const snapshotItems = [...items];
    const snapshotDeliveryPrice = deliveryPrice;
    const snapshotDiscountAmount = discountAmount;
    const snapshotTotal = total;
    const snapshotDeliveryMode = deliveryMode;
    const snapshotSelectedLocation = selectedLocation;
    const snapshotAppliedDiscount = appliedDiscount;

    setIsSubmitting(true);
    try {
      const orderPayload = {
        user_id: user.id,
        items: snapshotItems,
        total: snapshotTotal,
        status: "En attente",
        delivery_mode: snapshotDeliveryMode !== "none" ? snapshotDeliveryMode : null,
        delivery_location: snapshotDeliveryMode !== "none" ? snapshotSelectedLocation : null,
        delivery_price: snapshotDeliveryPrice,
        maps_link: mapsLink || null,
        discount_applied: snapshotAppliedDiscount || null,
        loyalty_counted: false,
      };

      const { data, error } = await supabase
        .from("orders")
        .insert([orderPayload])
        .select()
        .single();

      if (error) throw error;

      // Décrémenter la réduction utilisée
      if (snapshotAppliedDiscount && user) {
        const field = snapshotAppliedDiscount === "10%" ? "discount_10_remaining" : "discount_5_remaining";
        const current = snapshotAppliedDiscount === "10%"
          ? (user.discount_10_remaining || 0)
          : (user.discount_5_remaining || 0);
        await supabase.from("profiles")
          .update({ [field]: Math.max(0, current - 1) })
          .eq("id", user.id);
      }

      // ✅ Stocker le snapshot dans le state de succès
      setSuccessOrder({
        ...data,
        itemsList: snapshotItems,
        cleaningTotal: snapshotCleaningTotal,
        deliveryMode: snapshotDeliveryMode,
        selectedLocation: snapshotSelectedLocation,
        deliveryPrice: snapshotDeliveryPrice,
        appliedDiscount: snapshotAppliedDiscount,
        discountAmount: snapshotDiscountAmount,
        total: snapshotTotal,
      });
      clear();
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de la création de la commande.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendWhatsApp = () => {
    if (!successOrder) return;
    const itemsList = successOrder.itemsList
      .map(i => `- ${i.qty}x ${i.name} (${i.mode === "express" ? "Express 8H" : "Standard"}): ${money(i.qty * i.price)}`)
      .join("%0A");
    const deliveryLine = successOrder.deliveryMode && successOrder.deliveryMode !== "none"
      ? `%0A🚚 Livraison (${successOrder.deliveryMode}): ${successOrder.selectedLocation} - ${money(successOrder.deliveryPrice)}`
      : "";
    const discountLine = successOrder.appliedDiscount
      ? `%0A🎁 Réduction fidélité (${successOrder.appliedDiscount}): -${money(successOrder.discountAmount)}`
      : "";
    const mapsLine = mapsLink ? `%0A📍 Ma localisation: ${mapsLink}` : "";

    const text = `Bonjour Vision Pressing !%0A%0AJe viens de passer une commande en ligne.%0A%0A📋 N° ${successOrder.id.substring(0,8).toUpperCase()}%0A👤 ${user?.name || ""}%0A%0A🧺 Articles :%0A${itemsList}${deliveryLine}${discountLine}%0A%0A💰 *TOTAL : ${money(successOrder.total)} FCFA*${mapsLine}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank");
  };

  const deliveryModes = [
    { id: "none",    label: "Pas de livraison",   desc: "Je dépose moi-même" },
    { id: "collect", label: "Collecte seulement", desc: "Vous venez chercher chez moi" },
    { id: "dropoff", label: "Dépôt seulement",    desc: "Vous livrez chez moi" },
    { id: "both",    label: "Collecte + Dépôt",   desc: "Récupération et retour à domicile" },
  ];

  return (
    <Shell>
      <PageHero
        eyebrow="Estimation personnalisée"
        title={<>Votre devis,<br /><em>en temps réel.</em></>}
        text="Vérifiez votre sélection, choisissez votre mode de livraison et confirmez."
      />

      <section style={{ padding: "60px clamp(20px,6vw,100px) 100px", maxWidth: "860px", margin: "0 auto" }}>
        {!successOrder && (
          <a href="/services" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--gold)", fontWeight: "600", fontSize: "15px", marginBottom: "36px", textDecoration: "none" }}>
            <ArrowLeft size={16} /> Ajouter des articles depuis Services &amp; Tarifs
          </a>
        )}

        {successOrder ? (
          /* ── SUCCESS STATE ── */
          <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "20px", padding: "60px 40px", textAlign: "center", boxShadow: "var(--sh-sm)" }}>
            <div style={{ width: "72px", height: "72px", background: "#d1fae5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <Check size={36} color="#10b981" />
            </div>
            <h2 style={{ fontSize: "28px", marginBottom: "12px" }}>Commande enregistrée !</h2>
            <p style={{ color: "var(--muted)", fontSize: "16px", maxWidth: "440px", margin: "0 auto 32px", lineHeight: 1.6 }}>
              Votre commande <strong>N° {successOrder.id.substring(0,8).toUpperCase()}</strong> est bien reçue.<br />
              Envoyez le récapitulatif par WhatsApp pour finaliser.
            </p>

            <div style={{ background: "var(--off)", borderRadius: "16px", padding: "20px", maxWidth: "400px", margin: "0 auto 32px", textAlign: "left" }}>
              {/* ✅ cleaningTotal pris depuis le snapshot, pas recalculé depuis items vidé */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
                <span style={{ color: "var(--muted)" }}>Nettoyage</span>
                <strong>{money(successOrder.cleaningTotal)}</strong>
              </div>
              {successOrder.deliveryPrice > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
                  <span style={{ color: "var(--muted)" }}>Livraison ({successOrder.deliveryMode})</span>
                  <strong>{money(successOrder.deliveryPrice)}</strong>
                </div>
              )}
              {successOrder.discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", color: "#10b981" }}>
                  <span>🎁 Réduction fidélité ({successOrder.appliedDiscount})</span>
                  <strong>- {money(successOrder.discountAmount)}</strong>
                </div>
              )}
              <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "12px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px" }}>
                <strong>Total</strong>
                <strong style={{ color: "var(--gold)" }}>{money(successOrder.total)}</strong>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
              <button
                onClick={sendWhatsApp}
                style={{ display: "inline-flex", alignItems: "center", gap: "12px", background: "#25D366", color: "white", padding: "16px 32px", borderRadius: "100px", fontSize: "16px", fontWeight: "700", border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(37,211,102,0.4)", transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "none"}
              >
                <Send size={20} /> Envoyer le récapitulatif via WhatsApp
              </button>
              <Button href="/compte" variant="outline">Voir mon historique</Button>
            </div>
          </div>

        ) : items.length === 0 ? (
          /* ── EMPTY STATE ── */
          <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "20px", padding: "80px 40px", textAlign: "center", boxShadow: "var(--sh-sm)" }}>
            <Sparkles size={40} color="var(--gold)" style={{ margin: "0 auto 20px" }} />
            <h2 style={{ fontSize: "24px", marginBottom: "12px" }}>Votre devis est vide</h2>
            <p style={{ color: "var(--muted)", fontSize: "16px", marginBottom: "32px" }}>
              Rendez-vous sur la page Services &amp; Tarifs pour sélectionner vos articles.
            </p>
            <LiquidMetalButton label="Voir les Services &amp; Tarifs" width={280} onClick={() => navigate("/services")} />
          </div>

        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* ── ARTICLES ── */}
            {items.map((i, idx) => (
              <div key={`${i.id}-${i.mode}-${idx}`} style={{
                background: "var(--white)", border: "1px solid var(--line)", borderRadius: "16px",
                padding: "20px 24px", boxShadow: "var(--sh-sm)",
                display: "grid", gridTemplateColumns: "1fr auto auto auto", alignItems: "center", gap: "16px"
              }}>
                <div>
                  <strong style={{ fontSize: "16px", display: "block", marginBottom: "4px" }}>{i.name}</strong>
                  <span style={{ fontSize: "12px", color: "var(--muted)", background: "var(--off)", padding: "3px 10px", borderRadius: "100px" }}>{i.category}</span>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={() => upd(i.id, i.mode, "mode", "standard")} style={{ padding: "6px 12px", borderRadius: "8px", border: `1.5px solid ${i.mode === "standard" ? "var(--ink)" : "var(--line)"}`, background: i.mode === "standard" ? "var(--ink)" : "transparent", color: i.mode === "standard" ? "var(--white)" : "var(--muted)", fontWeight: "600", fontSize: "12px", cursor: "pointer", transition: "all 0.2s" }}>Standard</button>
                  <button onClick={() => upd(i.id, i.mode, "mode", "express")} style={{ padding: "6px 12px", borderRadius: "8px", border: `1.5px solid ${i.mode === "express" ? "var(--gold)" : "var(--line)"}`, background: i.mode === "express" ? "rgba(201,168,76,0.15)" : "transparent", color: i.mode === "express" ? "var(--gold)" : "var(--muted)", fontWeight: "600", fontSize: "12px", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "4px" }}><Zap size={11} />Express 8H</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--line)", borderRadius: "10px", overflow: "hidden" }}>
                  <button onClick={() => upd(i.id, i.mode, "qty", Math.max(1, i.qty - 1))} style={{ width: "34px", height: "34px", background: "var(--off)", border: "none", cursor: "pointer", fontWeight: "700", fontSize: "16px", color: "var(--ink)" }}>−</button>
                  <span style={{ width: "36px", textAlign: "center", fontWeight: "700", fontSize: "15px" }}>{i.qty}</span>
                  <button onClick={() => upd(i.id, i.mode, "qty", i.qty + 1)} style={{ width: "34px", height: "34px", background: "var(--off)", border: "none", cursor: "pointer", fontWeight: "700", fontSize: "16px", color: "var(--ink)" }}>+</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <strong style={{ fontSize: "17px", color: "var(--ink)", whiteSpace: "nowrap" }}>{money(i.qty * i.price)}</strong>
                  <button
                    onClick={() => remove(i.id, i.mode)}
                    aria-label={`Supprimer ${i.name}`}
                    style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1.5px solid var(--line)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(17,17,17,0.4)", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.color = "#dc2626"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "rgba(17,17,17,0.4)"; }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}

            {/* ── LIVRAISON ── */}
            <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px", boxShadow: "var(--sh-sm)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div style={{ width: "36px", height: "36px", background: "rgba(201,168,76,0.1)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Truck size={18} color="var(--gold)" />
                </div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>Mode de livraison</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                {deliveryModes.map(m => (
                  <button key={m.id} onClick={() => setDeliveryMode(m.id)} style={{
                    padding: "14px 16px", borderRadius: "12px", textAlign: "left", cursor: "pointer", transition: "all 0.2s",
                    border: `2px solid ${deliveryMode === m.id ? "var(--gold)" : "var(--line)"}`,
                    background: deliveryMode === m.id ? "rgba(201,168,76,0.08)" : "var(--off)",
                  }}>
                    <div style={{ fontWeight: "700", fontSize: "14px", color: deliveryMode === m.id ? "var(--ink)" : "var(--muted)", marginBottom: "4px" }}>{m.label}</div>
                    <div style={{ fontSize: "12px", color: "var(--muted)" }}>{m.desc}</div>
                  </button>
                ))}
              </div>
              {deliveryMode !== "none" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label htmlFor="delivery-location" style={{ fontSize: "13px", fontWeight: "600", color: "var(--muted)", display: "block", marginBottom: "8px" }}>Votre quartier / Zone</label>
                    <select id="delivery-location" value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}
                      style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1.5px solid var(--line)", background: "var(--white)", fontSize: "15px", color: "var(--ink)", outline: "none" }}>
                      <option value="">— Choisir un lieu —</option>
                      {deliveryLocations.map(l => (
                        <option key={l.id} value={l.name}>
                          {l.name}
                          {deliveryMode === "collect" && ` — Collecte: ${money(l.collection_price)}`}
                          {deliveryMode === "dropoff" && ` — Dépôt: ${money(l.dropoff_price)}`}
                          {deliveryMode === "both" && ` — Aller-retour: ${money(l.collection_price + l.dropoff_price)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="maps-link" style={{ fontSize: "13px", fontWeight: "600", color: "var(--muted)", display: "block", marginBottom: "8px" }}>
                      <MapPin size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                      Lien Google Maps (optionnel mais recommandé)
                    </label>
                    <input id="maps-link" type="url" placeholder="https://maps.google.com/..." value={mapsLink} onChange={e => setMapsLink(e.target.value)}
                      style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1.5px solid var(--line)", background: "var(--white)", fontSize: "14px", color: "var(--ink)", outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>
              )}
            </div>

            {/* ── RÉSUMÉ + COMMANDE ── */}
            <div style={{ background: "var(--ink)", color: "#fff", borderRadius: "20px", padding: "28px 32px", marginTop: "8px" }}>
              {appliedDiscount && (
                <div style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "12px", padding: "12px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "20px" }}>🎁</span>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "14px", color: "#10b981" }}>Réduction fidélité -{appliedDiscount} appliquée !</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>Économie de {money(discountAmount)}</div>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.7, fontSize: "14px" }}>
                  <span>Nettoyage ({items.length} article{items.length > 1 ? "s" : ""})</span>
                  <span>{money(cleaningTotal)}</span>
                </div>
                {deliveryPrice > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.7, fontSize: "14px" }}>
                    <span>Livraison ({deliveryMode})</span>
                    <span>{money(deliveryPrice)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#10b981", fontSize: "14px" }}>
                    <span>Réduction {appliedDiscount}</span>
                    <span>- {money(discountAmount)}</span>
                  </div>
                )}
                <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.15)", margin: "8px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "16px", opacity: 0.7 }}>Total estimé</span>
                  <strong style={{ fontSize: "28px", color: "var(--gold)" }}>{money(total)}</strong>
                </div>
              </div>
              <p style={{ fontSize: "13px", opacity: 0.5, marginBottom: "24px" }}>Montant confirmé après inspection de vos pièces.</p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                <LiquidMetalButton
                  label={isSubmitting ? "Enregistrement..." : "Valider la commande"}
                  width={240}
                  onClick={handleCheckout}
                />
                <button onClick={clear} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", padding: "14px 20px", borderRadius: "12px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>
                  Vider le devis
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </Shell>
  );
}
