import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { MapPin, Check, Package, Clock, Truck, X, Search, AlertCircle } from "lucide-react";
import { Shell, Button } from "../components/ui";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { money } from "../lib/data";

const STATUS_STEPS = ["En attente", "Confirmée", "Prête", "Livrée"];

const STATUS_ICONS = {
  "En attente": Clock,
  "Confirmée":  Package,
  "Prête":      Check,
  "Livrée":     Truck,
  "Annulée":    X,
};

function getStepsDone(status) {
  const idx = STATUS_STEPS.indexOf(status);
  return idx >= 0 ? idx : -1; // -1 = Annulée
}

export default function Tracking() {
  const params = useParams();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const [orderId, setOrderId] = useState(params?.id || "");
  const [searchInput, setSearchInput] = useState(params?.id || "");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(!!params?.id);
  const [error, setError] = useState("");

  useEffect(() => {
    if (params?.id) {
      fetchOrder(params.id);
    }
  }, [params?.id]);

  const fetchOrder = async (id) => {
    if (!id.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      // Recherche par les 8 premiers caractères de l'UUID (affichage tronqué)
      const { data, error: dbError } = await supabase
        .from("orders")
        .select("*, profiles(name, email)")
        .ilike("id", `${id.trim().toLowerCase()}%`)
        .single();

      if (dbError || !data) {
        setError("Commande introuvable. Vérifiez le numéro de commande.");
        setLoading(false);
        return;
      }

      // Sécurité : un utilisateur ne peut voir que ses propres commandes
      if (user && data.user_id !== user.id && user.role !== "admin") {
        setError("Vous n'êtes pas autorisé à voir cette commande.");
        setLoading(false);
        return;
      }

      setOrder(data);
      setOrderId(id);
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    navigate(`/suivi/${searchInput.trim().toUpperCase()}`);
    fetchOrder(searchInput.trim());
  };

  const stepsDone = order ? getStepsDone(order.status) : -1;
  const isCancelled = order?.status === "Annulée";

  const steps = [
    { label: "Reçu",          desc: "Commande enregistrée", status: "En attente" },
    { label: "En traitement", desc: "Nettoyage en cours",   status: "Confirmée" },
    { label: "Prêt",          desc: "Récupération possible", status: "Prête" },
    { label: "Livré",         desc: "Commande terminée",    status: "Livrée" },
  ];

  return (
    <Shell>
      <section className="ph">
        <span className="eyebrow">Suivi en temps réel</span>
        <h1>Votre commande,<br /><em>à chaque étape.</em></h1>
        <p>Entrez votre numéro de commande pour suivre l'avancement de votre linge.</p>
      </section>

      {/* Barre de recherche */}
      <section style={{ padding: "40px clamp(20px,6vw,100px) 0", maxWidth: "700px", margin: "0 auto" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px", alignItems: "center", background: "var(--white)", border: "1px solid var(--line)", borderRadius: "16px", padding: "8px 8px 8px 20px", boxShadow: "var(--sh-sm)" }}>
          <Search size={18} color="var(--muted)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value.toUpperCase())}
            placeholder="Ex: A1B2C3D4"
            aria-label="Numéro de commande"
            style={{ flex: 1, border: "none", outline: "none", font: "500 15px var(--ui)", color: "var(--ink)", background: "transparent" }}
          />
          <button type="submit" style={{ background: "var(--gold)", color: "#111", border: "none", padding: "12px 24px", borderRadius: "10px", font: "700 14px var(--ui)", cursor: "pointer", flexShrink: 0 }}>
            Suivre
          </button>
        </form>

        {user && (
          <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "12px", textAlign: "center" }}>
            Retrouvez vos numéros de commande dans{" "}
            <a href="/compte" style={{ color: "var(--gold)", fontWeight: "600" }}>votre espace client</a>.
          </p>
        )}
      </section>

      <section className="tracking-section" style={{ padding: "40px clamp(20px,6vw,100px) 100px" }}>
        {loading && (
          <div style={{ gridColumn: "1/-1", padding: "80px", textAlign: "center", color: "var(--muted)" }}>
            Chargement…
          </div>
        )}

        {error && !loading && (
          <div style={{ gridColumn: "1/-1", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "16px", padding: "24px 32px", display: "flex", alignItems: "center", gap: "16px" }}>
            <AlertCircle size={24} color="#dc2626" />
            <div>
              <p style={{ fontWeight: "600", color: "#dc2626", margin: "0 0 4px" }}>Commande introuvable</p>
              <p style={{ color: "#374151", margin: 0, fontSize: "14px" }}>{error}</p>
            </div>
          </div>
        )}

        {!order && !loading && !error && (
          <div style={{ gridColumn: "1/-1", padding: "80px", textAlign: "center" }}>
            <Package size={48} color="var(--line)" style={{ margin: "0 auto 20px" }} />
            <p style={{ color: "var(--muted)", fontSize: "16px" }}>Entrez un numéro de commande ci-dessus pour commencer le suivi.</p>
          </div>
        )}

        {order && !loading && (
          <>
            <div className="track-card">
              {/* En-tête */}
              <div className="tc-top" style={{ background: isCancelled ? "linear-gradient(135deg, #7f1d1d, #dc2626)" : "linear-gradient(135deg, #1a1208, #2d1f0a)" }}>
                <div className="tc-info">
                  <div className="tc-icon">
                    <Package size={24} />
                  </div>
                  <div>
                    <span className="eyebrow" style={{ marginBottom: 4, color: "rgba(255,255,255,0.6)", fontSize: "11px" }}>
                      Commande #{order.id.substring(0, 8).toUpperCase()}
                    </span>
                    <h2 style={{ fontSize: 22 }}>
                      {isCancelled
                        ? "Commande annulée"
                        : order.status === "Prête"
                        ? "Votre commande est prête !"
                        : order.status === "Livrée"
                        ? "Commande livrée ✓"
                        : "Commande en cours…"}
                    </h2>
                    <p style={{ fontSize: "14px" }}>
                      {order.profiles?.name && `Client : ${order.profiles.name} · `}
                      {new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <span className="track-status" style={{
                  background: isCancelled ? "rgba(220,38,38,0.3)" : "var(--gold)",
                  color: isCancelled ? "#fff" : "#111"
                }}>
                  {order.status}
                </span>
              </div>

              {/* Timeline */}
              {!isCancelled && (
                <div className="timeline">
                  {steps.map((s, i) => {
                    const done    = i <= stepsDone;
                    const current = i === stepsDone;
                    return (
                      <div key={i} className={`tl-step${done ? " done" : ""}${current ? " current" : ""}`}>
                        <div className="tl-dot">
                          {done ? <Check size={14} /> : <span>{i + 1}</span>}
                        </div>
                        {i < steps.length - 1 && <div className="tl-line" />}
                        <div className="tl-body">
                          <strong>{s.label}</strong>
                          <small>{current ? "En cours" : done ? "Terminé" : "À venir"}</small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {isCancelled && (
                <div style={{ padding: "32px 40px" }}>
                  <div style={{ background: "#fee2e2", borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <X size={20} color="#dc2626" />
                    <p style={{ margin: 0, color: "#dc2626", fontWeight: "600", fontSize: "14px" }}>
                      Cette commande a été annulée. Contactez-nous si vous avez des questions.
                    </p>
                  </div>
                </div>
              )}

              <div className="tc-foot">
                <span><MapPin size={15} color="var(--gold)" /> Tabligbo Ntifafa-komé, Togo</span>
                <Button href="/contact" variant="outline">Besoin d'aide ?</Button>
              </div>
            </div>

            {/* Récapitulatif */}
            <div className="track-summary">
              <span className="eyebrow" style={{ marginBottom: 8, display: "block" }}>Récapitulatif</span>
              <div className="ts-rows">
                <div className="ts-row">
                  <span>{order.items?.length || 0} article{(order.items?.length || 0) > 1 ? "s" : ""}</span>
                </div>
                {order.delivery_mode && (
                  <div className="ts-row">
                    <span>Livraison</span>
                    <b>{order.delivery_mode}</b>
                  </div>
                )}
                {order.discount_applied && (
                  <div className="ts-row" style={{ color: "#059669" }}>
                    <span>Réduction fidélité</span>
                    <b>-{order.discount_applied}</b>
                  </div>
                )}
                <div className="ts-row">
                  <span>Total</span>
                  <b>{money(order.total)}</b>
                </div>
                <div className="ts-row">
                  <span>Statut</span>
                  <b style={{ color: isCancelled ? "#dc2626" : order.status === "Livrée" ? "#059669" : "var(--gold)" }}>
                    {order.status}
                  </b>
                </div>
              </div>
              <Button href="/compte" variant="outline" style={{ marginTop: 24 }}>Mon espace client</Button>
            </div>
          </>
        )}
      </section>
    </Shell>
  );
}
