import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../lib/auth";

export default function Login() {
  const [location, navigate] = useLocation();
  const search = useSearch(); // ex: "?redirect=/devis"
  const { login, register, user, loading, registerLoginCallback } = useAuth();

  const [mode, setMode]       = useState("login");
  const [form, setForm]       = useState({ name: "", email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError]     = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lire la destination de redirection depuis l'URL
  const redirectTo = (() => {
    const params = new URLSearchParams(search);
    return params.get("redirect") || null;
  })();

  // ✅ Si l'utilisateur est déjà connecté, rediriger immédiatement
  useEffect(() => {
    if (!loading && user) {
      const dest = redirectTo || (user.role === "admin" ? "/admin" : "/compte");
      navigate(dest, { replace: true });
    }
  }, [user, loading, redirectTo, navigate]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const trimmedEmail = form.email.trim();

      if (mode === "register") {
        await register(form.name, trimmedEmail, form.password);
        // Pour l'inscription, Supabase peut nécessiter une confirmation email.
        // On enregistre le callback pour quand la session sera active.
      } else {
        await login(trimmedEmail, form.password);
      }

      // ✅ Enregistrer le callback de redirection AVANT que onAuthStateChange se déclenche.
      // La redirection sera exécutée par auth.jsx une fois le profil chargé.
      registerLoginCallback((profile) => {
        const dest = redirectTo || (profile?.role === "admin" ? "/admin" : "/compte");
        navigate(dest, { replace: true });
      });

    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldStyle = {
    width: "100%", padding: "14px 14px 14px 44px",
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "12px", color: "#fff", font: "400 15px var(--ui)",
    outline: "none", transition: "border 0.3s", boxSizing: "border-box",
  };

  // Pendant le chargement initial (vérification session), ne rien afficher
  if (loading) return null;
  // Si déjà connecté, le useEffect gère la redirection
  if (user) return null;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0f0c09 0%, #1a1208 60%, #111 100%)",
      padding: "20px", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.18, backgroundImage: "radial-gradient(rgba(201,168,76,0.9) 2px, transparent 2px)", backgroundSize: "32px 32px", animation: "driftBg 25s linear infinite" }} />
      <div style={{ position: "absolute", top: "20%", left: "10%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "15%", right: "10%", width: "320px", height: "320px", background: "radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: "440px", position: "relative", zIndex: 2 }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <a href="/">
            <img src="/logo.jpg" alt="Vision Pressing" style={{ height: "60px", width: "auto" }} />
          </a>
        </div>

        {/* Bannière contextuelle si redirection */}
        {redirectTo && (
          <div style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "12px", padding: "12px 16px", marginBottom: "20px", textAlign: "center", color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>
            🔒 Connectez-vous pour continuer
          </div>
        )}

        <div style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "24px", padding: "36px", boxShadow: "0 40px 80px rgba(0,0,0,0.5)" }}>
          {/* Tabs Connexion / Inscription */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: "12px", padding: "4px", marginBottom: "28px" }}>
            {["login", "register"].map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{ flex: 1, padding: "10px", border: "none", borderRadius: "9px", cursor: "pointer", font: "600 14px var(--ui)", transition: "all 0.3s", background: mode === m ? "var(--gold)" : "transparent", color: mode === m ? "#000" : "rgba(255,255,255,0.5)" }}>
                {m === "login" ? "Connexion" : "Inscription"}
              </button>
            ))}
          </div>

          <h2 style={{ color: "#fff", font: "700 26px var(--serif)", margin: "0 0 6px", fontStyle: "italic" }}>
            {mode === "login" ? "Bon retour !" : "Rejoignez-nous"}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", font: "400 14px var(--ui)", margin: "0 0 24px" }}>
            {mode === "login" ? "Accédez à votre espace personnel." : "Créez votre compte gratuitement."}
          </p>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "12px 16px", marginBottom: "18px", color: "#fca5a5", font: "400 13px var(--ui)" }}>
              {error}
            </div>
          )}

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {mode === "register" && (
              <label style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                <span style={{ color: "rgba(255,255,255,0.55)", font: "500 12px var(--ui)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Nom complet</span>
                <div style={{ position: "relative" }}>
                  <User size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
                  <input type="text" required value={form.name} onChange={set("name")} placeholder="Votre nom complet" style={fieldStyle}
                    onFocus={(e) => e.target.style.borderColor = "var(--gold)"} onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.12)"} />
                </div>
              </label>
            )}

            <label style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              <span style={{ color: "rgba(255,255,255,0.55)", font: "500 12px var(--ui)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Email</span>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
                <input type="email" required value={form.email} onChange={set("email")} placeholder="votre@email.com" style={fieldStyle}
                  onFocus={(e) => e.target.style.borderColor = "var(--gold)"} onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.12)"} />
              </div>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              <span style={{ color: "rgba(255,255,255,0.55)", font: "500 12px var(--ui)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Mot de passe</span>
              <div style={{ position: "relative" }}>
                <Lock size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
                <input type={showPwd ? "text" : "password"} required value={form.password} onChange={set("password")} placeholder="••••••••" style={{ ...fieldStyle, paddingRight: "44px" }}
                  onFocus={(e) => e.target.style.borderColor = "var(--gold)"} onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.12)"} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0 }}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>

            <button type="submit" disabled={isSubmitting}
              style={{ marginTop: "6px", padding: "15px", background: "linear-gradient(135deg, #c9a84c, #e8c56c)", border: "none", borderRadius: "12px", font: "700 15px var(--ui)", color: "#000", cursor: isSubmitting ? "default" : "pointer", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", opacity: isSubmitting ? 0.7 : 1 }}
              onMouseEnter={(e) => { if (!isSubmitting) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(201,168,76,0.4)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
              {isSubmitting ? "Connexion…" : (mode === "login" ? "Se connecter" : "Créer mon compte")}
              {!isSubmitting && <ArrowRight size={17} />}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "20px", color: "rgba(255,255,255,0.3)", font: "400 13px var(--ui)" }}>
            {mode === "login" ? "Pas de compte ? " : "Déjà inscrit ? "}
            <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", font: "600 13px var(--ui)" }}>
              {mode === "login" ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </div>

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <a href="/" style={{ color: "rgba(255,255,255,0.6)", font: "500 14px var(--ui)", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: "2px" }}>
            ← Retour à l'accueil
          </a>
        </div>
        <p style={{ textAlign: "center", marginTop: "20px", color: "rgba(255,255,255,0.18)", font: "400 12px var(--ui)" }}>
          © 2026 Vision Pressing · Tabligbo, Togo
        </p>
      </div>
    </div>
  );
}
