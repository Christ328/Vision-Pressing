import { useState, useEffect } from "react";
import { Quote, Star, Send, AlertCircle } from "lucide-react";
import { Shell, SectionTitle } from "../components/ui";
import { useAuth } from "../lib/auth";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { supabase } from "../lib/supabase";

export default function Reviews() {
  const { user } = useAuth();
  const { redirectToLogin } = useRequireAuth();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({ text: "", stars: 5 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setReviews(data);
    setIsLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!form.text.trim()) { setError("Votre avis ne peut pas être vide."); return; }
    setError("");
    setIsSubmitting(true);
    try {
      const { error: err } = await supabase.from("reviews").insert([{
        user_id: user.id,
        name: user.name || user.email?.split("@")[0],
        text: form.text,
        stars: form.stars,
        date: "Avis client",
        avatar: (user.name || "U").substring(0, 2).toUpperCase(),
      }]);
      if (err) throw err;
      setForm({ text: "", stars: 5 });
      setSuccessMsg("Merci pour votre avis !");
      fetchReviews();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Erreur insertion avis:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Shell>
      <div className="ph">
        <SectionTitle
          eyebrow="Témoignages"
          title={<>Ils nous font <em>confiance.</em></>}
          text="Découvrez ce que nos clients pensent de la qualité de nos services et de notre accompagnement au quotidien."
          center
        />
      </div>

      {/* Leave a review form (only for logged-in users) */}
      <section style={{ maxWidth: "760px", margin: "60px auto 0", padding: "0 clamp(20px,5vw,60px) 60px" }}>
        {user ? (
          <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "20px", padding: "32px", boxShadow: "var(--sh-sm)", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "20px", marginBottom: "20px" }}>Laisser un avis</h2>
            
            {/* Star selector */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setForm(f => ({ ...f, stars: s }))}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
                  <Star size={28} fill={s <= form.stars ? "var(--gold)" : "transparent"} color="var(--gold)" />
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <textarea
                required
                value={form.text}
                onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                placeholder="Partagez votre expérience..."
                rows={4}
                style={{ width: "100%", padding: "14px", background: "var(--off)", border: "1px solid var(--line)", borderRadius: "12px", font: "400 15px var(--ui)", color: "var(--ink)", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = "var(--gold)"}
                onBlur={e => e.target.style.borderColor = "var(--line)"}
              />

              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#dc2626", fontSize: "14px", background: "#fee2e2", padding: "10px 16px", borderRadius: "10px" }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {successMsg && (
                <div style={{ color: "#059669", fontSize: "14px", background: "#d1fae5", padding: "10px 16px", borderRadius: "10px" }}>
                  ✓ {successMsg}
                </div>
              )}

              <button type="submit" disabled={isSubmitting}
                style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "8px", background: "var(--ink)", color: "var(--white)", border: "none", padding: "12px 24px", borderRadius: "12px", font: "600 15px var(--ui)", cursor: isSubmitting ? "default" : "pointer", opacity: isSubmitting ? 0.7 : 1 }}>
                <Send size={16} /> {isSubmitting ? "Publication…" : "Publier mon avis"}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ background: "var(--off)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px 32px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <p style={{ color: "var(--muted)", fontSize: "15px", margin: 0 }}>Vous souhaitez laisser un avis ?</p>
            <button onClick={redirectToLogin} style={{ color: "var(--gold)", fontWeight: "600", fontSize: "15px", background: "none", border: "none", cursor: "pointer" }}>Se connecter →</button>
          </div>
        )}
      </section>

      {/* Reviews grid */}
      <section className="section" style={{ background: "var(--off)", padding: "80px clamp(20px, 4vw, 60px)" }}>
        {isLoading ? (
          <p style={{ textAlign: "center", color: "var(--muted)" }}>Chargement des avis…</p>
        ) : (
          <div className="rvw-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", maxWidth: "1200px", margin: "0 auto" }}>
            {reviews.map((r) => (
              <div key={r.id} className="rvw">
                <Quote size={28} color="rgba(201,168,76,0.2)" className="rvw-q" />
                <div style={{ display: "flex", gap: "2px", marginBottom: "16px" }}>
                  {[1,2,3,4,5].map(star => <Star key={star} size={16} fill={star <= (r.stars || 5) ? "var(--gold)" : "transparent"} color="var(--gold)" />)}
                </div>
                <p>"{r.text}"</p>
                <footer>
                  <strong>{r.name}</strong>
                  <small>{r.date || "Avis client"}</small>
                </footer>
              </div>
            ))}
          </div>
        )}
      </section>
    </Shell>
  );
}
