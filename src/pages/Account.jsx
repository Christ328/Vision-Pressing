import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, LogOut, Package, Clock, CheckCircle, X, Gift, Menu, User as UserIcon, Zap, MapPin } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { supabase } from "../lib/supabase";
import { money } from "../lib/data";

const STATUS_COLORS = {
  "En attente": { bg: "#fef3c7", color: "#d97706", icon: Clock },
  "Confirmée":  { bg: "#dbeafe", color: "#2563eb", icon: Package },
  "Prête":      { bg: "#d1fae5", color: "#059669", icon: CheckCircle },
  "Livrée":     { bg: "#f3f4f6", color: "#6b7280", icon: CheckCircle },
  "Annulée":    { bg: "#fee2e2", color: "#dc2626", icon: X },
};

/* ── Modal récapitulatif commande client ── */
function OrderModal({ order: o, onClose }) {
  const statusStyle = STATUS_COLORS[o.status] || { bg: "#f3f4f6", color: "#374151" };
  const StatusIcon  = statusStyle.icon || Clock;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: "24px", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflow: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.25)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "22px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#111" }}>
              Commande #{o.id.substring(0, 6).toUpperCase()}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6b7280" }}>
              {new Date(o.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Statut */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: statusStyle.bg, padding: "14px 18px", borderRadius: "14px" }}>
            <StatusIcon size={18} color={statusStyle.color} />
            <div>
              <div style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: statusStyle.color }}>Statut</div>
              <div style={{ fontWeight: "700", fontSize: "16px", color: statusStyle.color }}>{o.status}</div>
            </div>
          </div>

          {/* Articles */}
          <div>
            <div style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af", marginBottom: "10px" }}>
              Articles ({o.items?.length || 0})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(o.items || []).map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f9fafb", borderRadius: "10px" }}>
                  <div>
                    <span style={{ fontWeight: "600", fontSize: "14px", color: "#111" }}>{item.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>×{item.qty}</span>
                      {item.mode === "express" ? (
                        <span style={{ background: "#111", color: "#c9a84c", fontSize: "10px", fontWeight: "700", padding: "1px 7px", borderRadius: "100px", display: "flex", alignItems: "center", gap: "3px" }}>
                          <Zap size={9} /> Express
                        </span>
                      ) : (
                        <span style={{ background: "#f3f4f6", color: "#6b7280", fontSize: "10px", fontWeight: "600", padding: "1px 7px", borderRadius: "100px" }}>Standard</span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontWeight: "700", fontSize: "14px", color: "#111" }}>{money((item.price || 0) * (item.qty || 1))}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Livraison */}
          {o.delivery_mode && (
            <div style={{ background: "#f9fafb", borderRadius: "12px", padding: "14px 18px" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af", marginBottom: "8px" }}>Livraison</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "14px", color: "#374151" }}>
                  <strong>{o.delivery_mode}</strong>
                  {o.delivery_location && <span style={{ color: "#6b7280" }}> — {o.delivery_location}</span>}
                </div>
                <span style={{ fontWeight: "700", fontSize: "14px" }}>{money(o.delivery_price || 0)}</span>
              </div>
              {o.maps_link && (
                <a href={o.maps_link} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#3b82f6", marginTop: "8px", textDecoration: "none" }}>
                  <MapPin size={12} /> Voir sur Google Maps
                </a>
              )}
            </div>
          )}

          {/* Réduction */}
          {o.discount_applied && (
            <div style={{ background: "#d1fae5", borderRadius: "12px", padding: "12px 18px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Gift size={16} color="#059669" />
              <span style={{ fontSize: "14px", color: "#059669", fontWeight: "600" }}>Réduction fidélité appliquée ({o.discount_applied})</span>
            </div>
          )}

          {/* Total */}
          <div style={{ background: "#111", borderRadius: "16px", padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: "600", fontSize: "15px" }}>Total payé</span>
            <span style={{ color: "var(--gold)", fontWeight: "800", fontSize: "24px" }}>{money(o.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Account() {
  const { user, loading, logout } = useAuth();
  const { redirectToLogin } = useRequireAuth();
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!loading && !user) redirectToLogin();
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) setOrders(data);
          setIsLoading(false);
        });
    }
  }, [user]);

  if (loading || !user) return <div style={{ padding: "100px", textAlign: "center", fontFamily: "var(--ui)" }}>Chargement...</div>;

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const totalSpent = user.total_spent || 0;
  const progressTo50k = Math.min(100, (totalSpent / 50000) * 100);
  const progressTo100k = totalSpent > 50000 ? Math.min(100, ((totalSpent - 50000) / 50000) * 100) : 0;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f3f4f6", fontFamily: "var(--ui)" }}>
      {/* Sidebar Mobile Toggle */}
      <div className="account-mobile-header">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", marginRight: "16px" }}><Menu size={24} /></button>
        <span style={{ fontWeight: "700", color: "var(--gold)" }}>Mon Espace</span>
      </div>

      {/* Sidebar */}
      <aside className={`account-sidebar${sidebarOpen ? " open" : ""}`} style={{
        width: "260px", background: "#111", color: "#fff", display: "flex", flexDirection: "column",
        position: "fixed", top: 0, bottom: 0, left: 0,
        transition: "transform 0.3s ease",
      }}>
        <div style={{ padding: "24px 20px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", color: "#111", fontWeight: "700", fontSize: "18px" }}>
            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <div style={{ fontWeight: "700", fontSize: "15px" }}>{user.name?.split(" ")[0] || "Client"}</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Espace Personnel</div>
          </div>
        </div>
        
        <nav style={{ flex: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <button onClick={() => { setActiveTab("orders"); setSidebarOpen(false); }}
            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "10px", border: "none", cursor: "pointer", transition: "all 0.2s", background: activeTab === "orders" ? "rgba(201,168,76,0.15)" : "transparent", color: activeTab === "orders" ? "var(--gold)" : "rgba(255,255,255,0.6)", fontWeight: activeTab === "orders" ? "600" : "400", fontSize: "15px", textAlign: "left" }}>
            <Package size={18} /> Mes Commandes
          </button>
          <button onClick={() => { setActiveTab("loyalty"); setSidebarOpen(false); }}
            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "10px", border: "none", cursor: "pointer", transition: "all 0.2s", background: activeTab === "loyalty" ? "rgba(201,168,76,0.15)" : "transparent", color: activeTab === "loyalty" ? "var(--gold)" : "rgba(255,255,255,0.6)", fontWeight: activeTab === "loyalty" ? "600" : "400", fontSize: "15px", textAlign: "left" }}>
            <Gift size={18} /> Club Fidélité
          </button>
          {user.role === 'admin' && (
            <button onClick={() => setLocation("/admin")}
              style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "10px", border: "none", cursor: "pointer", transition: "all 0.2s", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: "15px", textAlign: "left" }}>
              <UserIcon size={18} /> Panel Admin
            </button>
          )}
        </nav>

        <div style={{ padding: "20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button onClick={() => setLocation("/")} style={{ width: "100%", display: "block", color: "rgba(255,255,255,0.6)", fontSize: "14px", textDecoration: "none", marginBottom: "16px", textAlign: "center", background: "none", border: "none", cursor: "pointer" }}>← Retour au site</button>
          <button onClick={handleLogout} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)", color: "#fca5a5", padding: "10px", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="account-main" style={{ flex: 1, padding: "40px", marginLeft: "260px", marginTop: "0" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 8px", color: "#111" }}>Bonjour, {user.name?.split(" ")[0]}</h1>
            <p style={{ color: "#6b7280", margin: 0 }}>Gérez vos commandes et vos avantages fidélité.</p>
          </div>
          <button onClick={() => setLocation("/services")} style={{ background: "var(--gold)", color: "#111", border: "none", padding: "12px 24px", borderRadius: "100px", fontWeight: "700", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 14px rgba(201,168,76,0.3)" }}>
            <Package size={16} /> Nouvelle commande
          </button>
        </div>

        {activeTab === "orders" && (
          <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid #e5e7eb", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>Historique des commandes</h2>
            </div>

            {isLoading ? (
              <div style={{ padding: "60px", textAlign: "center", color: "#9ca3af" }}>Chargement...</div>
            ) : orders.length === 0 ? (
              <div style={{ padding: "60px", textAlign: "center" }}>
                <Package size={40} color="#d1d5db" style={{ marginBottom: "16px" }} />
                <div style={{ color: "#6b7280", fontSize: "15px" }}>Aucune commande pour le moment.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {orders.map((o, idx) => {
                  const statusStyle = STATUS_COLORS[o.status] || { bg: "#f3f4f6", color: "#374151" };
                  const StatusIcon  = statusStyle.icon || Clock;
                  return (
                    <div
                      key={o.id}
                      onClick={() => setSelectedOrder(o)}
                      style={{
                        padding: "16px 20px",
                        borderBottom: idx < orders.length - 1 ? "1px solid #f3f4f6" : "none",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        gap: "12px", cursor: "pointer", transition: "background 0.15s",
                        flexWrap: "wrap",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {/* Gauche : icône + infos */}
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                        <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: statusStyle.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <StatusIcon size={18} color={statusStyle.color} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: "700", fontSize: "14px", color: "#111" }}>
                            #{o.id.substring(0, 6).toUpperCase()}
                            <span style={{ fontWeight: "400", color: "#9ca3af", fontSize: "12px", marginLeft: "8px" }}>
                              {new Date(o.created_at).toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                          <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>
                            {o.items?.length || 0} article{(o.items?.length || 0) > 1 ? "s" : ""}
                            {o.delivery_mode && ` · ${o.delivery_mode}`}
                            {o.discount_applied && <span style={{ color: "#059669", marginLeft: "6px", fontWeight: "600" }}>✓ Réduc</span>}
                          </div>
                        </div>
                      </div>

                      {/* Droite : montant + statut */}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontWeight: "700", fontSize: "16px", color: "#111" }}>{money(o.total)}</span>
                        <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: "4px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap" }}>
                          {o.status}
                        </span>
                        <ArrowRight size={16} color="#d1d5db" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Modal récapitulatif */}
        {selectedOrder && <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}

        {activeTab === "loyalty" && (
          <div style={{ display: "grid", gap: "24px" }}>
            {/* Loyalty Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              
              {/* Palier 1 */}
              <div style={{ background: "linear-gradient(135deg, #111, #222)", borderRadius: "20px", padding: "24px", color: "#fff", position: "relative", overflow: "hidden" }}>
                <Gift size={100} color="rgba(255,255,255,0.03)" style={{ position: "absolute", right: "-20px", bottom: "-20px" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--gold)", fontWeight: "700", marginBottom: "8px" }}>Palier 1 • 50 000 FCFA</div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "20px" }}>3 réductions de -5%</h3>
                  <p style={{ margin: "0 0 24px", fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>Sur vos prochaines commandes</p>
                  
                  {/* Progress bar */}
                  <div style={{ background: "rgba(255,255,255,0.1)", height: "8px", borderRadius: "4px", marginBottom: "12px", overflow: "hidden" }}>
                    <div style={{ width: `${progressTo50k}%`, height: "100%", background: "var(--gold)", borderRadius: "4px", transition: "width 1s ease" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "600" }}>
                    <span>{money(Math.min(totalSpent, 50000))}</span>
                    <span style={{ color: "var(--gold)" }}>{money(50000)}</span>
                  </div>
                </div>
              </div>

              {/* Palier 2 */}
              <div style={{ background: "linear-gradient(135deg, #c9a84c, #b3933b)", borderRadius: "20px", padding: "24px", color: "#111", position: "relative", overflow: "hidden" }}>
                <Gift size={100} color="rgba(0,0,0,0.05)" style={{ position: "absolute", right: "-20px", bottom: "-20px" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#111", fontWeight: "700", marginBottom: "8px" }}>Palier 2 • 100 000 FCFA</div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "20px" }}>5 réductions de -10%</h3>
                  <p style={{ margin: "0 0 24px", fontSize: "13px", color: "rgba(0,0,0,0.6)" }}>Sur vos prochaines commandes</p>
                  
                  {/* Progress bar */}
                  <div style={{ background: "rgba(0,0,0,0.1)", height: "8px", borderRadius: "4px", marginBottom: "12px", overflow: "hidden" }}>
                    <div style={{ width: `${progressTo100k}%`, height: "100%", background: "#111", borderRadius: "4px", transition: "width 1s ease" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "600" }}>
                    <span>{money(Math.max(0, Math.min(totalSpent - 50000, 50000)))}</span>
                    <span style={{ color: "#111" }}>{money(50000)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Available Discounts */}
            <div style={{ background: "#fff", borderRadius: "20px", padding: "24px", border: "1px solid #e5e7eb" }}>
              <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: "700" }}>Vos réductions disponibles</h3>
              
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px", padding: "20px", background: "#fef3c7", borderRadius: "16px", border: "1px dashed #d97706" }}>
                  <div style={{ fontSize: "24px", fontWeight: "800", color: "#d97706", marginBottom: "8px" }}>-5%</div>
                  <div style={{ fontSize: "14px", color: "#92400e", fontWeight: "600" }}>{user.discount_5_remaining || 0} utilisations restantes</div>
                </div>
                
                <div style={{ flex: "1 1 200px", padding: "20px", background: "#d1fae5", borderRadius: "16px", border: "1px dashed #059669" }}>
                  <div style={{ fontSize: "24px", fontWeight: "800", color: "#059669", marginBottom: "8px" }}>-10%</div>
                  <div style={{ fontSize: "14px", color: "#065f46", fontWeight: "600" }}>{user.discount_10_remaining || 0} utilisations restantes</div>
                </div>
              </div>
              <p style={{ marginTop: "16px", fontSize: "13px", color: "#6b7280" }}>
                * Les réductions s'appliquent automatiquement lors de votre prochaine commande. Si vous possédez les deux, la plus avantageuse (-10%) sera utilisée en priorité.
              </p>
            </div>
          </div>
        )}

      </main>

      <style dangerouslySetInnerHTML={{__html:`
        .account-mobile-header {
          display: flex;
          align-items: center;
          padding: 16px;
          background: #111;
          color: #fff;
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
        }
        .account-sidebar { z-index: 90; }
        .account-main { margin-left: 260px; padding: 40px; margin-top: 0; }
        @media (min-width: 769px) {
          .account-mobile-header { display: none !important; }
          .account-sidebar { transform: translateX(0) !important; }
        }
        @media (max-width: 768px) {
          .account-sidebar { transform: translateX(-100%); }
          .account-sidebar.open { transform: translateX(0) !important; }
          .account-main { margin-left: 0 !important; padding: 72px 16px 24px !important; }
        }
      `}} />
    </div>
  );
}
