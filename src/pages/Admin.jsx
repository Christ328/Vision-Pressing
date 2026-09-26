import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Package, Users, Star, CheckCircle, Clock, Truck, X, LogOut,
  BarChart2, MessageSquare, MapPin, Image as ImageIcon, Plus,
  Trash2, Menu, UploadCloud, Mail, AlertTriangle, Eye, EyeOff
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { money } from "../lib/data";

const STATUSES = ["En attente", "Confirmée", "Prête", "Livrée", "Annulée"];

const STATUS_CONFIG = {
  "En attente": { color: "#d97706", bg: "#fef3c7", icon: Clock },
  "Confirmée":  { color: "#2563eb", bg: "#dbeafe", icon: Package },
  "Prête":      { color: "#059669", bg: "#d1fae5", icon: CheckCircle },
  "Livrée":     { color: "#6b7280", bg: "#f3f4f6", icon: Truck },
  "Annulée":    { color: "#dc2626", bg: "#fee2e2", icon: X },
};

// ✅ Validation de fichier image : type MIME réel + taille
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function validateImageFile(file) {
  if (!file) return "Aucun fichier sélectionné.";
  if (!ALLOWED_TYPES.includes(file.type)) return `Type non autorisé (${file.type}). Utilisez JPG, PNG ou WebP.`;
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `Fichier trop volumineux (max ${MAX_FILE_SIZE_MB} Mo).`;
  return null;
}

export default function Admin() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();

  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [stats, setStats] = useState({ total: 0, pending: 0, revenue: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMessage, setExpandedMessage] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null); // Modal récapitulatif

  // Form states
  const [locForm, setLocForm] = useState({ name: "", collection_price: 0, dropoff_price: 0 });
  const [galForm, setGalForm] = useState({ before: null, after: null, desc: "" });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  useEffect(() => {
    if (user?.role === "admin") loadAll();
  }, [user]);

  // ✅ loadAll robuste : chaque table est traitée indépendamment
  // Une table manquante n'empêche pas les autres de charger
  const loadAll = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const [ordersRes, reviewsRes, usersRes, delivRes, galRes, msgRes] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("reviews").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").eq("role", "user").order("created_at", { ascending: false }),
        supabase.from("delivery_locations").select("*").order("created_at", { ascending: false }),
        supabase.from("gallery").select("*").order("created_at", { ascending: false }),
        supabase.from("messages").select("*").order("created_at", { ascending: false }),
      ]);

      // ✅ Si la table orders échoue (critique), on affiche l'erreur
      if (ordersRes.error) throw ordersRes.error;

      const ordersData = ordersRes.data || [];
      const usersData = usersRes.data || [];
      
      // Enrichir les commandes avec les infos utilisateur
      const enrichedOrders = ordersData.map(order => {
        const user = usersData.find(u => u.id === order.user_id);
        return {
          ...order,
          profiles: user ? { 
            name: user.name, 
            email: user.email, 
            total_spent: user.total_spent 
          } : null
        };
      });
      
      setOrders(enrichedOrders);
      // Tables optionnelles : on ignore silencieusement les erreurs (tables pas encore créées)
      setReviews(reviewsRes.data || []);
      setUsers(usersData);
      setDeliveries(delivRes.data || []);
      setGallery(galRes.data || []);
      setMessages(msgRes.data || []);

      if (delivRes.error) console.warn("delivery_locations:", delivRes.error.message);
      if (galRes.error)   console.warn("gallery:", galRes.error.message);
      if (msgRes.error)   console.warn("messages:", msgRes.error.message);

      setStats({
        total:   enrichedOrders.length,
        pending: enrichedOrders.filter(o => o.status === "En attente").length,
        revenue: enrichedOrders.filter(o => o.status !== "Annulée").reduce((s, o) => s + (o.total || 0), 0),
      });
    } catch (err) {
      console.error("Erreur chargement admin:", err);
      setLoadError(`Erreur : ${err.message || "Vérifiez votre connexion et rechargez la page."}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (id, status) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (!error) setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  // ✅ Logique fidélité corrigée : palier cumulatif robuste
  const validateLoyalty = async (order) => {
    if (order.loyalty_counted || !order.user_id) return;

    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", order.user_id)
      .single();

    if (profErr || !profile) return;

    const prevTotal = profile.total_spent || 0;
    const newTotal = prevTotal + (order.total || 0);
    const updates = {};

    // Palier 100k : 5 réductions de 10%
    const prevCrossed100k = Math.floor(prevTotal / 100000);
    const newCrossed100k  = Math.floor(newTotal  / 100000);
    const earned10 = newCrossed100k - prevCrossed100k;
    if (earned10 > 0) {
      updates.discount_10_remaining = (profile.discount_10_remaining || 0) + earned10 * 5;
    }

    // Palier 50k (tranche de 50k hors multiple de 100k) : 3 réductions de 5%
    // On repère les franchissements de la bande [50k, 100k), [150k, 200k), etc.
    const prevBand50 = Math.floor(prevTotal / 50000);
    const newBand50  = Math.floor(newTotal  / 50000);
    const earned5 = (newBand50 - prevBand50) - earned10 * 2; // soustraire les fois déjà comptées en 100k
    if (earned5 > 0) {
      updates.discount_5_remaining = (profile.discount_5_remaining || 0) + earned5 * 3;
    }

    updates.total_spent = newTotal;

    await supabase.from("profiles").update(updates).eq("id", profile.id);
    await supabase.from("orders").update({ loyalty_counted: true }).eq("id", order.id);

    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, loyalty_counted: true } : o));
  };

  // ✅ Confirmation avant suppression commande
  const deleteOrder = async (id) => {
    if (!window.confirm("Supprimer cette commande définitivement ? Cette action est irréversible.")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (!error) setOrders(prev => prev.filter(o => o.id !== id));
  };

  // ✅ Confirmation avant suppression client
  const deleteUser = async (id) => {
    if (!window.confirm("Supprimer ce client et toutes ses données ? Cette action est irréversible.")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (!error) setUsers(prev => prev.filter(u => u.id !== id));
  };

  // ✅ Confirmation avant suppression avis
  const deleteReview = async (id) => {
    if (!window.confirm("Supprimer cet avis définitivement ?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (!error) setReviews(prev => prev.filter(r => r.id !== id));
  };

  // --- Messages ---
  const markMessageRead = async (id) => {
    const { error } = await supabase.from("messages").update({ lu: true }).eq("id", id);
    if (!error) setMessages(prev => prev.map(m => m.id === id ? { ...m, lu: true } : m));
  };

  // ✅ Confirmation avant suppression message
  const deleteMessage = async (id) => {
    if (!window.confirm("Supprimer ce message définitivement ?")) return;
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (!error) setMessages(prev => prev.filter(m => m.id !== id));
  };

  // --- Deliveries ---
  const addLocation = async (e) => {
    e.preventDefault();
    if (!locForm.name.trim()) return;
    const { data, error } = await supabase.from("delivery_locations").insert([locForm]).select();
    if (!error && data) {
      setDeliveries([data[0], ...deliveries]);
      setLocForm({ name: "", collection_price: 0, dropoff_price: 0 });
    }
  };

  // ✅ Confirmation avant suppression lieu
  const deleteLocation = async (id) => {
    if (!window.confirm("Supprimer ce lieu de livraison ?")) return;
    const { error } = await supabase.from("delivery_locations").delete().eq("id", id);
    if (!error) setDeliveries(prev => prev.filter(l => l.id !== id));
  };

  // --- Gallery ---
  // ✅ Upload avec validation MIME + taille
  const uploadImage = async (file, prefix) => {
    const validationError = validateImageFile(file);
    if (validationError) throw new Error(validationError);

    const ext = file.type.split("/")[1]; // Récupérer l'extension depuis le MIME réel
    const fileName = `${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("gallery").upload(fileName, file, {
      contentType: file.type,
      cacheControl: "3600",
    });
    if (error) throw error;
    const { data: publicData } = supabase.storage.from("gallery").getPublicUrl(fileName);
    return publicData.publicUrl;
  };

  const handleUploadGallery = async (e) => {
    e.preventDefault();
    setUploadError("");
    if (!galForm.before || !galForm.after) {
      setUploadError("Veuillez sélectionner les deux photos (Avant et Après).");
      return;
    }
    if (gallery.length >= 5) {
      setUploadError("Limite de 5 paires atteinte. Supprimez une paire existante.");
      return;
    }

    // Valider les deux fichiers avant d'uploader
    const errBefore = validateImageFile(galForm.before);
    const errAfter  = validateImageFile(galForm.after);
    if (errBefore) { setUploadError(`Photo "Avant" : ${errBefore}`); return; }
    if (errAfter)  { setUploadError(`Photo "Après" : ${errAfter}`); return; }

    setIsUploading(true);
    try {
      const beforeUrl = await uploadImage(galForm.before, "before");
      const afterUrl  = await uploadImage(galForm.after,  "after");
      const { data, error } = await supabase.from("gallery").insert([{
        before_url:  beforeUrl,
        after_url:   afterUrl,
        description: galForm.desc,
      }]).select();
      if (error) throw error;
      if (data) {
        setGallery([data[0], ...gallery]);
        setGalForm({ before: null, after: null, desc: "" });
        // Réinitialiser les inputs file
        document.querySelectorAll('input[type="file"]').forEach(i => i.value = "");
      }
    } catch (err) {
      setUploadError(err.message || "Erreur lors de l'upload. Vérifiez que le bucket 'gallery' est public.");
    } finally {
      setIsUploading(false);
    }
  };

  // ✅ Confirmation avant suppression galerie
  const deleteGalleryItem = async (id) => {
    if (!window.confirm("Supprimer cette paire Avant/Après ?")) return;
    const { error } = await supabase.from("gallery").delete().eq("id", id);
    if (!error) setGallery(prev => prev.filter(g => g.id !== id));
  };

  if (loading || !user) return null;
  if (user.role !== "admin") return null;

  const unreadMessages = messages.filter(m => !m.lu).length;
  const [selectedUser, setSelectedUser] = useState(null);

  const tabs = [
    { id: "overview",   label: "Tableau de bord", icon: BarChart2,    count: null },
    { id: "orders",     label: "Commandes",        icon: Package,      count: orders.length },
    { id: "messages",   label: "Messages",         icon: Mail,         count: messages.length, badge: unreadMessages },
    { id: "deliveries", label: "Livraisons",       icon: MapPin,       count: deliveries.length },
    { id: "gallery",    label: "Galerie",          icon: ImageIcon,    count: gallery.length },
    { id: "users",      label: "Clients",          icon: Users,        count: users.length },
    { id: "reviews",    label: "Avis",             icon: Star,         count: reviews.length },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f3f4f6", fontFamily: "var(--ui)" }}>
      {/* Mobile Header */}
      <div className="admin-mobile-header">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Menu" style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", marginRight: "16px" }}>
          <Menu size={24} />
        </button>
        <span style={{ fontWeight: "700", color: "var(--gold)" }}>Admin Vision Pressing</span>
      </div>

      {/* Sidebar */}
      <aside className={`admin-sidebar${sidebarOpen ? " open" : ""}`} style={{
        width: "260px", background: "#111", color: "#fff", display: "flex", flexDirection: "column",
        position: "fixed", top: 0, bottom: 0, left: 0, transition: "transform 0.3s ease",
      }}>
        <div style={{ padding: "24px 20px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <img src="/logo.jpg" alt="VP" style={{ height: "36px", borderRadius: "8px" }} />
          <div>
            <div style={{ fontWeight: "700", color: "var(--gold)", fontSize: "15px" }}>Vision Pressing</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Dashboard Admin</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", borderRadius: "10px", border: "none", cursor: "pointer",
                  transition: "all 0.2s",
                  background: active ? "rgba(201,168,76,0.15)" : "transparent",
                  color: active ? "var(--gold)" : "rgba(255,255,255,0.6)",
                  fontWeight: active ? "600" : "400", fontSize: "15px"
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Icon size={18} /> {tab.label}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {/* Badge non-lus pour les messages */}
                  {tab.badge > 0 && (
                    <span style={{ background: "#dc2626", color: "#fff", padding: "2px 7px", borderRadius: "100px", fontSize: "10px", fontWeight: "700" }}>
                      {tab.badge}
                    </span>
                  )}
                  <span style={{ background: active ? "var(--gold)" : "rgba(255,255,255,0.1)", color: active ? "#000" : "#fff", padding: "2px 8px", borderRadius: "100px", fontSize: "11px", fontWeight: "700" }}>
                    {tab.count}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <a href="/" style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: "14px", textDecoration: "none", marginBottom: "16px", textAlign: "center" }}>← Retour au site</a>
          <button onClick={logout} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)", color: "#fca5a5", padding: "10px", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main" style={{ flex: 1, padding: "40px", marginLeft: "260px" }}>

        {/* Erreur de chargement */}
        {loadError && (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "12px", padding: "16px 20px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px", color: "#dc2626" }}>
            <AlertTriangle size={20} />
            <span style={{ fontSize: "14px", fontWeight: "600" }}>{loadError}</span>
            <button onClick={loadAll} style={{ marginLeft: "auto", background: "#dc2626", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>Réessayer</button>
          </div>
        )}

        {/* ── ONGLET TABLEAU DE BORD ── */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <h2 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: "700", color: "#111" }}>Tableau de bord</h2>
              <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>Vue d'ensemble de l'activité Vision Pressing</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              {[
                { label: "Commandes totales", value: stats.total,          icon: Package,   color: "#6366f1", sub: `${stats.pending} en attente` },
                { label: "Chiffre d'affaires",value: money(stats.revenue), icon: BarChart2, color: "#059669", sub: "Hors annulées" },
                { label: "Clients inscrits",  value: users.length,         icon: Users,     color: "#f59e0b", sub: "Comptes actifs" },
                { label: "Messages reçus",    value: messages.length,      icon: Mail,      color: "#ec4899",
                  sub: unreadMessages > 0 ? `${unreadMessages} non lu${unreadMessages > 1 ? "s" : ""}` : "Tous lus", subColor: unreadMessages > 0 ? "#dc2626" : "#059669" },
              ].map(({ label, value, icon: Icon, color, sub, subColor }) => (
                <div key={label} style={{ background: "#fff", borderRadius: "16px", padding: "20px", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                    <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                    <div style={{ width: "32px", height: "32px", background: color + "15", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={16} color={color} />
                    </div>
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: "800", color: "#111", lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: "12px", color: subColor || "#6b7280", marginTop: "8px", fontWeight: "500" }}>{sub}</div>
                </div>
              ))}
            </div>
            {/* Raccourcis rapides */}
            <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#9ca3af", marginBottom: "14px" }}>Accès rapide</div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {[
                  { label: "Voir commandes", tab: "orders", color: "#6366f1" },
                  { label: `Messages${unreadMessages > 0 ? ` (${unreadMessages})` : ""}`, tab: "messages", color: "#ec4899" },
                  { label: "Gérer clients", tab: "users", color: "#f59e0b" },
                  { label: "Galerie", tab: "gallery", color: "#059669" },
                ].map(({ label, tab, color }) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: color + "15", color, border: `1px solid ${color}30`, padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ONGLET COMMANDES ── */}
        {activeTab === "orders" && (
          <div className="admin-card">
            <div className="admin-card-header"><h2>Toutes les commandes</h2></div>
            {isLoading ? <div className="admin-empty">Chargement…</div> : orders.length === 0 ? <div className="admin-empty">Aucune commande.</div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {orders.map((o, idx) => {
                  const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG["En attente"];
                  return (
                    <div key={o.id} style={{
                      padding: "16px 20px",
                      borderBottom: idx < orders.length - 1 ? "1px solid #f3f4f6" : "none",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      flexWrap: "wrap", gap: "12px",
                      cursor: "pointer", transition: "background 0.15s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      onClick={() => setSelectedOrder(o)}
                    >
                      {/* Gauche : ID + client + date */}
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Package size={18} color={cfg.color} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: "700", fontSize: "14px", color: "#111" }}>
                            #{o.id.substring(0,6).toUpperCase()}
                            <span style={{ fontWeight: "400", color: "#9ca3af", fontSize: "13px", marginLeft: "8px" }}>
                              {new Date(o.created_at).toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                          <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {o.profiles?.name || "Client inconnu"} · {o.items?.length || 0} article{(o.items?.length || 0) > 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>

                      {/* Droite : total + statut + actions */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: "700", fontSize: "15px", color: "#111" }}>{money(o.total)}</span>
                        <select value={o.status}
                          onChange={e => { e.stopPropagation(); updateOrderStatus(o.id, e.target.value); }}
                          onClick={e => e.stopPropagation()}
                          style={{ background: cfg.bg, color: cfg.color, border: "none", padding: "5px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", outline: "none" }}>
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={e => { e.stopPropagation(); deleteOrder(o.id); }} className="admin-btn-danger" title="Supprimer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── MODAL RÉCAPITULATIF COMMANDE ADMIN ── */}
        {selectedOrder && (() => {
          const o = selectedOrder;
          const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG["En attente"];
          return (
            <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
              onClick={() => setSelectedOrder(null)}>
              <div style={{ background: "#fff", borderRadius: "24px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflow: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.25)" }}
                onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ padding: "24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Commande #{o.id.substring(0,6).toUpperCase()}</h2>
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6b7280" }}>{new Date(o.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={18} />
                  </button>
                </div>

                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Client */}
                  <div style={{ background: "#f9fafb", borderRadius: "12px", padding: "16px" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af", marginBottom: "8px" }}>Client</div>
                    <div style={{ fontWeight: "600", fontSize: "15px" }}>{o.profiles?.name || "Inconnu"}</div>
                    <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>{o.profiles?.email}</div>
                  </div>

                  {/* Statut + fidélité */}
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, background: cfg.bg, borderRadius: "12px", padding: "14px", minWidth: "120px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: cfg.color, marginBottom: "6px" }}>Statut</div>
                      <select value={o.status} onChange={e => { updateOrderStatus(o.id, e.target.value); setSelectedOrder({...o, status: e.target.value}); }}
                        style={{ background: "transparent", border: "none", color: cfg.color, fontWeight: "700", fontSize: "15px", cursor: "pointer", outline: "none", width: "100%" }}>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1, background: o.loyalty_counted ? "#d1fae5" : "#f3f4f6", borderRadius: "12px", padding: "14px", minWidth: "120px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: o.loyalty_counted ? "#059669" : "#6b7280", marginBottom: "6px" }}>Fidélité</div>
                      {o.loyalty_counted
                        ? <span style={{ fontSize: "14px", fontWeight: "600", color: "#059669" }}>✓ Validée</span>
                        : <button onClick={() => { validateLoyalty(o); setSelectedOrder({...o, loyalty_counted: true}); }} style={{ background: "#10b981", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Valider</button>
                      }
                    </div>
                  </div>

                  {/* Articles */}
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af", marginBottom: "12px" }}>Articles commandés</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {(o.items || []).map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f9fafb", borderRadius: "10px" }}>
                          <div>
                            <span style={{ fontWeight: "600", fontSize: "14px" }}>{item.name}</span>
                            <span style={{ fontSize: "12px", color: "#6b7280", marginLeft: "8px" }}>×{item.qty} · {item.mode === "express" ? "⚡ Express" : "Standard"}</span>
                          </div>
                          <span style={{ fontWeight: "700", fontSize: "14px" }}>{money((item.price || 0) * (item.qty || 1))}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Livraison */}
                  {o.delivery_mode && (
                    <div style={{ background: "#f9fafb", borderRadius: "12px", padding: "16px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af", marginBottom: "8px" }}>Livraison</div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "14px" }}>{o.delivery_mode} — {o.delivery_location}</span>
                        <span style={{ fontWeight: "700", fontSize: "14px" }}>{money(o.delivery_price || 0)}</span>
                      </div>
                      {o.maps_link && <a href={o.maps_link} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "#3b82f6", marginTop: "6px", display: "block" }}>📍 Voir sur Maps</a>}
                    </div>
                  )}

                  {/* Réduction */}
                  {o.discount_applied && (
                    <div style={{ background: "#d1fae5", borderRadius: "12px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "14px", color: "#059669", fontWeight: "600" }}>Réduction appliquée ({o.discount_applied})</span>
                    </div>
                  )}

                  {/* Total */}
                  <div style={{ background: "#111", borderRadius: "14px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#fff", fontWeight: "600", fontSize: "15px" }}>Total</span>
                    <span style={{ color: "var(--gold)", fontWeight: "800", fontSize: "22px" }}>{money(o.total)}</span>
                  </div>

                  {/* Supprimer */}
                  <button onClick={() => { deleteOrder(o.id); setSelectedOrder(null); }} style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "12px", borderRadius: "12px", fontWeight: "600", fontSize: "14px", cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <Trash2 size={16} /> Supprimer cette commande
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── ONGLET MESSAGES ── */}
        {activeTab === "messages" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="admin-card">
              <div className="admin-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2>Messages reçus</h2>
                {unreadMessages > 0 && (
                  <span style={{ background: "#fee2e2", color: "#dc2626", padding: "4px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: "700" }}>
                    {unreadMessages} non lu{unreadMessages > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="admin-empty">Chargement…</div>
            ) : messages.length === 0 ? (
              <div className="admin-card">
                <div className="admin-empty" style={{ padding: "60px", textAlign: "center", color: "#9ca3af" }}>
                  <Mail size={40} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
                  <p>Aucun message pour le moment.</p>
                </div>
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} style={{
                  background: "#fff", borderRadius: "16px", border: `1px solid ${m.lu ? "#e5e7eb" : "#fde68a"}`,
                  boxShadow: m.lu ? "0 2px 8px rgba(0,0,0,0.03)" : "0 2px 16px rgba(201,168,76,0.15)",
                  overflow: "hidden", transition: "all 0.2s"
                }}>
                  {/* En-tête du message */}
                  <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "44px", height: "44px", borderRadius: "50%", flexShrink: 0,
                        background: m.lu ? "#f3f4f6" : "rgba(201,168,76,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: m.lu ? "#6b7280" : "var(--gold)", fontWeight: "700", fontSize: "16px"
                      }}>
                        {m.nom ? m.nom.charAt(0).toUpperCase() : "?"}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <strong style={{ fontSize: "15px", color: "#111" }}>{m.nom}</strong>
                          {!m.lu && (
                            <span style={{ background: "#fef3c7", color: "#d97706", padding: "2px 8px", borderRadius: "100px", fontSize: "11px", fontWeight: "700" }}>Nouveau</span>
                          )}
                          {m.objet && m.objet !== "Non précisé" && (
                            <span style={{ background: "#f3f4f6", color: "#374151", padding: "2px 10px", borderRadius: "100px", fontSize: "12px" }}>{m.objet}</span>
                          )}
                        </div>
                        <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>
                          <a href={`tel:${m.tel}`} style={{ color: "#6b7280", textDecoration: "none" }}>📞 {m.tel}</a>
                          {" · "}
                          {new Date(m.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {!m.lu && (
                        <button onClick={() => markMessageRead(m.id)}
                          style={{ display: "flex", alignItems: "center", gap: "6px", background: "#d1fae5", color: "#059669", border: "none", padding: "7px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                          <Eye size={14} /> Marquer lu
                        </button>
                      )}
                      <button onClick={() => setExpandedMessage(expandedMessage === m.id ? null : m.id)}
                        style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f3f4f6", color: "#374151", border: "none", padding: "7px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                        {expandedMessage === m.id ? <EyeOff size={14} /> : <Eye size={14} />}
                        {expandedMessage === m.id ? "Réduire" : "Voir le message"}
                      </button>
                      <button onClick={() => deleteMessage(m.id)} className="admin-btn-danger" aria-label="Supprimer ce message">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Corps du message (expandable) */}
                  {expandedMessage === m.id && (
                    <div style={{ padding: "0 24px 20px", borderTop: "1px solid #f3f4f6" }}>
                      <p style={{ margin: "16px 0 0", fontSize: "14px", lineHeight: "1.7", color: "#374151", background: "#f9fafb", padding: "16px", borderRadius: "12px", whiteSpace: "pre-wrap" }}>
                        {m.message}
                      </p>
                      <div style={{ marginTop: "12px", display: "flex", gap: "10px" }}>
                        <a href={`tel:${m.tel}`}
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#111", color: "#fff", padding: "9px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", textDecoration: "none" }}>
                          📞 Rappeler
                        </a>
                        <a href={`https://wa.me/${m.tel.replace(/\s+/g, "").replace(/^\+/, "")}`} target="_blank" rel="noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#25D366", color: "#fff", padding: "9px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", textDecoration: "none" }}>
                          💬 WhatsApp
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── ONGLET LIVRAISONS ── */}
        {activeTab === "deliveries" && (
          <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "1fr 2fr", alignItems: "start" }}>
            <div className="admin-card">
              <div className="admin-card-header"><h3>Ajouter un lieu</h3></div>
              <form onSubmit={addLocation} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <input required placeholder="Nom du lieu (ex: Cacavéli)" value={locForm.name} onChange={e => setLocForm({ ...locForm, name: e.target.value })} className="admin-input" />
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", display: "block", marginBottom: "6px" }}>Prix Collecte (Aller)</label>
                  <input type="number" min="0" required value={locForm.collection_price} onChange={e => setLocForm({ ...locForm, collection_price: Number(e.target.value) })} className="admin-input" />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", display: "block", marginBottom: "6px" }}>Prix Dépôt (Retour)</label>
                  <input type="number" min="0" required value={locForm.dropoff_price} onChange={e => setLocForm({ ...locForm, dropoff_price: Number(e.target.value) })} className="admin-input" />
                </div>
                <button type="submit" className="admin-btn-primary">Ajouter le lieu</button>
              </form>
            </div>
            <div className="admin-card">
              <div className="admin-card-header"><h3>Lieux enregistrés</h3></div>
              {deliveries.length === 0 ? (
                <div className="admin-empty">Aucun lieu enregistré.</div>
              ) : (
                <table className="admin-table">
                  <thead><tr><th>Lieu</th><th>Collecte</th><th>Dépôt</th><th></th></tr></thead>
                  <tbody>
                    {deliveries.map(d => (
                      <tr key={d.id}>
                        <td style={{ fontWeight: "600" }}>{d.name}</td>
                        <td>{money(d.collection_price)}</td>
                        <td>{money(d.dropoff_price)}</td>
                        <td style={{ textAlign: "right" }}>
                          <button onClick={() => deleteLocation(d.id)} className="admin-btn-danger" aria-label={`Supprimer ${d.name}`}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── ONGLET GALERIE ── */}
        {activeTab === "gallery" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            
            {/* Formulaire upload */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h3>Ajouter une paire Avant / Après</h3>
                <span style={{ background: gallery.length >= 5 ? "#fee2e2" : "#f0fdf4", color: gallery.length >= 5 ? "#dc2626" : "#16a34a", padding: "4px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: "700" }}>
                  {gallery.length} / 5
                </span>
              </div>
              <div style={{ padding: "24px" }}>
                {uploadError && (
                  <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "10px", padding: "12px 16px", color: "#dc2626", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                    <AlertTriangle size={16} /> {uploadError}
                  </div>
                )}
                <form onSubmit={handleUploadGallery} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    {[
                      { label: "Photo Avant", key: "before", color: "#fef3c7", border: "#fde68a", text: "#d97706" },
                      { label: "Photo Après", key: "after",  color: "#d1fae5", border: "#6ee7b7", text: "#059669" }
                    ].map(({ label, key, color, border, text }) => (
                      <div key={key} style={{ background: color, borderRadius: "14px", padding: "20px", border: `2px dashed ${border}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: text }} />
                          <span style={{ fontWeight: "700", fontSize: "14px", color: text }}>{label}</span>
                        </div>
                        {galForm[key] ? (
                          <div style={{ position: "relative" }}>
                            <img
                              src={URL.createObjectURL(galForm[key])}
                              alt={label}
                              style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "10px", display: "block" }}
                            />
                            <button type="button" onClick={() => setGalForm({ ...galForm, [key]: null })}
                              style={{ position: "absolute", top: "8px", right: "8px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer", padding: "20px", border: "none", background: "transparent" }}>
                            <UploadCloud size={28} color={text} />
                            <span style={{ fontSize: "13px", color: text, fontWeight: "600" }}>Cliquer pour choisir</span>
                            <span style={{ fontSize: "11px", color: text, opacity: 0.7 }}>JPG, PNG, WebP · max 5 Mo</span>
                            <input type="file" accept="image/jpeg,image/png,image/webp" required style={{ display: "none" }}
                              onChange={e => setGalForm({ ...galForm, [key]: e.target.files[0] || null })} />
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                  <input placeholder="Description (ex: Nettoyage costume soie)" value={galForm.desc}
                    onChange={e => setGalForm({ ...galForm, desc: e.target.value })} className="admin-input" required />
                  <button type="submit" disabled={isUploading || gallery.length >= 5} className="admin-btn-primary"
                    style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                    <UploadCloud size={18} /> {isUploading ? "Envoi en cours..." : "Publier dans la galerie"}
                  </button>
                </form>
              </div>
            </div>

            {/* Grille galerie */}
            {gallery.length === 0 ? (
              <div className="admin-card">
                <div className="admin-empty" style={{ padding: "60px", textAlign: "center" }}>
                  <ImageIcon size={40} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
                  <p style={{ color: "#9ca3af" }}>Aucune paire publiée. Ajoutez votre première transformation.</p>
                </div>
              </div>
            ) : (
              <div>
                <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700", color: "#374151" }}>
                  Transformations publiées ({gallery.length})
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" }}>
                  {gallery.map((g, idx) => (
                    <div key={g.id} style={{ background: "#fff", borderRadius: "20px", overflow: "hidden", border: "1px solid #e5e7eb", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
                      {/* Header */}
                      <div style={{ padding: "14px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", color: "#6b7280" }}>
                            {idx + 1}
                          </div>
                          <span style={{ fontWeight: "600", fontSize: "14px", color: "#111" }}>{g.description || "Transformation"}</span>
                        </div>
                        <button onClick={() => deleteGalleryItem(g.id)} className="admin-btn-danger" aria-label="Supprimer" title="Supprimer cette paire">
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Images Avant / Après côte à côte */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", position: "relative" }}>
                        <div style={{ position: "relative" }}>
                          <img src={g.before_url} alt="Avant" loading="lazy"
                            style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }} />
                          <span style={{ position: "absolute", bottom: "10px", left: "10px", background: "rgba(217,119,6,0.9)", color: "#fff", padding: "3px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: "700", backdropFilter: "blur(4px)" }}>
                            Avant
                          </span>
                        </div>
                        <div style={{ position: "relative" }}>
                          <img src={g.after_url} alt="Après" loading="lazy"
                            style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }} />
                          <span style={{ position: "absolute", bottom: "10px", right: "10px", background: "rgba(5,150,105,0.9)", color: "#fff", padding: "3px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: "700", backdropFilter: "blur(4px)" }}>
                            Après
                          </span>
                        </div>
                        {/* Séparateur central */}
                        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "3px", background: "#fff", transform: "translateX(-50%)", zIndex: 2 }} />
                        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 3, background: "#fff", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontSize: "14px" }}>
                          →
                        </div>
                      </div>

                      <div style={{ padding: "12px 20px", background: "#f9fafb", fontSize: "12px", color: "#9ca3af" }}>
                        Ajouté le {new Date(g.created_at).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ONGLET CLIENTS ── */}
        {activeTab === "users" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="admin-card-header" style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e5e7eb", padding: "20px 24px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Clients inscrits ({users.length})</h2>
            </div>
            {users.length === 0 ? (
              <div className="admin-card"><div className="admin-empty">Aucun client inscrit.</div></div>
            ) : (
              users.map(u => (
                <div key={u.id}
                  onClick={() => setSelectedUser(u)}
                  style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e5e7eb", padding: "16px 20px", cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "14px" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {/* Avatar */}
                  <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg, #c9a84c, #f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", color: "#111", fontWeight: "800", fontSize: "16px", flexShrink: 0 }}>
                    {(u.name || u.email || "?").charAt(0).toUpperCase()}
                  </div>
                  {/* Infos swipeables */}
                  <div style={{ flex: 1, minWidth: 0, overflowX: "auto", display: "flex", gap: "20px", alignItems: "center", scrollbarWidth: "none" }}>
                    <div style={{ flexShrink: 0, minWidth: "120px" }}>
                      <div style={{ fontWeight: "700", fontSize: "14px", color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name || "—"}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px", whiteSpace: "nowrap" }}>{u.email}</div>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: "center" }}>
                      <div style={{ fontSize: "12px", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Dépensé</div>
                      <div style={{ fontWeight: "700", fontSize: "14px", color: "#059669" }}>{money(u.total_spent || 0)}</div>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: "center" }}>
                      <div style={{ fontSize: "12px", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Réd. 5%</div>
                      <div style={{ fontWeight: "700", fontSize: "14px", color: u.discount_5_remaining > 0 ? "#d97706" : "#d1d5db" }}>{u.discount_5_remaining || 0}x</div>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: "center" }}>
                      <div style={{ fontSize: "12px", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Réd. 10%</div>
                      <div style={{ fontWeight: "700", fontSize: "14px", color: u.discount_10_remaining > 0 ? "#059669" : "#d1d5db" }}>{u.discount_10_remaining || 0}x</div>
                    </div>
                  </div>
                  {/* Flèche */}
                  <div style={{ color: "#d1d5db", flexShrink: 0 }}>›</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── MODAL CLIENT ── */}
        {selectedUser && (() => {
          const u = selectedUser;
          return (
            <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
              onClick={() => setSelectedUser(null)}>
              <div style={{ background: "#fff", borderRadius: "24px", width: "100%", maxWidth: "460px", maxHeight: "90vh", overflow: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.25)" }}
                onClick={e => e.stopPropagation()}>
                <div style={{ padding: "22px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, #c9a84c, #f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", color: "#111", fontWeight: "800", fontSize: "20px" }}>
                      {(u.name || u.email || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "17px", color: "#111" }}>{u.name || "Client sans nom"}</div>
                      <div style={{ fontSize: "13px", color: "#6b7280" }}>{u.email}</div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUser(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={18} />
                  </button>
                </div>
                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ background: "#f9fafb", borderRadius: "14px", padding: "18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "14px", color: "#6b7280", fontWeight: "600" }}>Total dépensé</span>
                    <span style={{ fontWeight: "800", fontSize: "20px", color: "#059669" }}>{money(u.total_spent || 0)}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div style={{ background: "#fef3c7", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                      <div style={{ fontSize: "28px", fontWeight: "800", color: "#d97706" }}>{u.discount_5_remaining || 0}</div>
                      <div style={{ fontSize: "12px", color: "#92400e", fontWeight: "600", marginTop: "4px" }}>Réductions -5%</div>
                    </div>
                    <div style={{ background: "#d1fae5", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                      <div style={{ fontSize: "28px", fontWeight: "800", color: "#059669" }}>{u.discount_10_remaining || 0}</div>
                      <div style={{ fontSize: "12px", color: "#065f46", fontWeight: "600", marginTop: "4px" }}>Réductions -10%</div>
                    </div>
                  </div>
                  <div style={{ background: "#f9fafb", borderRadius: "12px", padding: "14px" }}>
                    <div style={{ fontSize: "12px", color: "#9ca3af", fontWeight: "600", marginBottom: "6px" }}>INSCRIT LE</div>
                    <div style={{ fontSize: "14px", color: "#374151", fontWeight: "600" }}>{new Date(u.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</div>
                  </div>
                  <button onClick={() => { deleteUser(u.id); setSelectedUser(null); }} style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "12px", borderRadius: "12px", fontWeight: "600", fontSize: "14px", cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <Trash2 size={16} /> Supprimer ce client
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── ONGLET AVIS ── */}
        {activeTab === "reviews" && (
          <div style={{ display: "grid", gap: "16px" }}>
            {reviews.length === 0 ? (
              <div className="admin-card"><div className="admin-empty">Aucun avis.</div></div>
            ) : (
              reviews.map(r => (
                <div key={r.id} style={{ background: "#fff", padding: "24px", borderRadius: "16px", border: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
                      {[1,2,3,4,5].map(s => <Star key={s} size={14} fill={s <= r.stars ? "#c9a84c" : "transparent"} color="#c9a84c" />)}
                    </div>
                    <p style={{ margin: "0 0 8px", color: "#374151" }}>"{r.text}"</p>
                    <small style={{ color: "#9ca3af" }}><strong>{r.name}</strong> · {new Date(r.created_at).toLocaleDateString("fr-FR")}</small>
                  </div>
                  <button onClick={() => deleteReview(r.id)} className="admin-btn-danger" aria-label="Supprimer cet avis">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{__html:`
        .admin-mobile-header {
          display: flex; align-items: center; padding: 16px;
          background: #111; color: #fff;
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
        }
        .admin-sidebar { z-index: 90; }
        .admin-main { margin-left: 260px; padding: 40px; margin-top: 0; }
        @media (min-width: 769px) {
          .admin-mobile-header { display: none !important; }
          .admin-sidebar { transform: translateX(0) !important; }
        }
        @media (max-width: 768px) {
          .admin-sidebar { transform: translateX(-100%); }
          .admin-sidebar.open { transform: translateX(0) !important; }
          .admin-main { margin-left: 0 !important; padding: 72px 16px 24px !important; }
        }
        .admin-card { background: #fff; border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 2px 10px rgba(0,0,0,0.03); overflow: hidden; }
        .admin-card-header { padding: 20px 24px; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; justify-content: space-between; }
        .admin-card-header h2, .admin-card-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: #111; }
        .admin-empty { padding: 60px; text-align: center; color: #9ca3af; }
        .admin-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .admin-table th { padding: 14px 20px; text-align: left; color: #6b7280; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; background: #f9fafb; border-bottom: 1px solid #f3f4f6; }
        .admin-table td { padding: 16px 20px; border-bottom: 1px solid #f3f4f6; color: #374151; vertical-align: top; }
        .admin-input { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #d1d5db; outline: none; font-size: 14px; box-sizing: border-box; font-family: var(--ui); }
        .admin-input:focus { border-color: #c9a84c; }
        .admin-btn-primary { background: #111; color: #fff; padding: 12px 20px; border-radius: 10px; border: none; font-weight: 600; cursor: pointer; transition: 0.2s; font-family: var(--ui); }
        .admin-btn-primary:hover:not(:disabled) { background: #000; }
        .admin-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .admin-btn-danger { background: #fee2e2; color: #dc2626; padding: 8px 12px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
        .admin-btn-danger:hover { background: #fecaca; }
      `}} />
    </div>
  );
}
