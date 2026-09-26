import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { supabase } from "./lib/supabase.js";

/* ── Keep Supabase alive ─────────────────────────────────────────
   Ping léger toutes les 3 jours pour éviter la mise en veille
   du projet sur le plan gratuit Supabase.
   Aucun impact visible pour l'utilisateur.
──────────────────────────────────────────────────────────────── */
(function keepSupabaseAlive() {
  const KEY = "vp_last_ping";
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

  try {
    const last = parseInt(localStorage.getItem(KEY) || "0", 10);
    if (Date.now() - last < THREE_DAYS_MS) return; // pas encore besoin

    // Requête ultra-légère : juste 1 ID dans reviews
    supabase
      .from("reviews")
      .select("id")
      .limit(1)
      .then(() => {
        localStorage.setItem(KEY, String(Date.now()));
      })
      .catch(() => {}); // Silencieux si offline
  } catch (_) {}
})();
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", color: "#ff0000", backgroundColor: "#ffe6e6", fontFamily: "monospace", minHeight: "100vh" }}>
          <h2>Application Error</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{this.state.error?.stack || this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);