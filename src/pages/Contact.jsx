import { useState } from "react";
import { useLocation } from "wouter";
import { MapPin, Clock3, Phone, MessageCircle, Send, Check, AlertCircle } from "lucide-react";
import { Shell } from "../components/ui";
import { LiquidMetalButton } from "../components/ui/liquid-metal-button";
import { contactInfo } from "../lib/data";
import { supabase } from "../lib/supabase";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ nom: "", tel: "", objet: "", msg: "" });

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nom.trim() || !form.tel.trim() || !form.msg.trim()) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const { error: dbError } = await supabase.from("messages").insert([{
        nom: form.nom.trim(),
        tel: form.tel.trim(),
        objet: form.objet || "Non précisé",
        message: form.msg.trim(),
        lu: false,
      }]);
      if (dbError) throw dbError;
      setSent(true);
      setForm({ nom: "", tel: "", objet: "", msg: "" });
    } catch (err) {
      console.error("Erreur envoi message:", err);
      setError("Une erreur est survenue. Veuillez réessayer ou nous contacter directement par téléphone.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Shell>
      <div style={{ position: "relative" }}>
        <section className="ph">
          <span className="eyebrow">Parlons de vos pièces</span>
          <h1>Une question ?<br /><em>Nous sommes là.</em></h1>
          <p>Passez nous voir à Tabligbo, appelez-nous ou laissez-nous un message. Réponse rapide garantie.</p>
        </section>
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: "150px",
          background: "linear-gradient(to bottom, transparent, var(--off))",
          pointerEvents: "none", zIndex: 10
        }} />
      </div>

      <section className="contact-section">
        {/* Info side */}
        <div className="contact-info">
          <div className="ci-premium-card">
            <div className="ci-header">
              <span className="eyebrow" style={{ color: "var(--gold)" }}>Informations</span>
              <h2 style={{ fontSize: "26px", margin: "8px 0 24px" }}>Nous trouver</h2>
            </div>
            <div className="ci-items">
              <div className="ci-item">
                <div className="ci-item-icon"><MapPin size={18} /></div>
                <div>
                  <strong>Adresse</strong>
                  <span>HFQQ+XR, Tabligbo, Togo</span>
                </div>
              </div>
              <div className="ci-item">
                <div className="ci-item-icon"><Clock3 size={18} /></div>
                <div>
                  <strong>Horaires</strong>
                  <span>07h00 – 21h00 · Tous les jours</span>
                </div>
              </div>
              <div className="ci-item">
                <div className="ci-item-icon"><Phone size={18} /></div>
                <div>
                  <strong>Téléphone &amp; WhatsApp</strong>
                  <span>+228 90 78 81 78</span>
                </div>
              </div>
            </div>
            <div className="ci-actions">
              <a href="tel:+22890788178" className="ci-btn-primary">
                <Phone size={15} /> Appeler
              </a>
              <a href="https://wa.me/22890788178" target="_blank" rel="noreferrer" className="ci-btn-secondary">
                <MessageCircle size={15} /> WhatsApp
              </a>
            </div>
            <a href={contactInfo.mapsLink} target="_blank" rel="noreferrer" className="ci-maps-link">
              <MapPin size={14} /> Voir sur Google Maps
            </a>
          </div>
        </div>

        {/* Form side */}
        <div className="contact-form-wrap">
          {sent ? (
            <div className="cf-success">
              <div className="cf-success-icon"><Check size={32} color="var(--gold)" /></div>
              <h3>Message envoyé !</h3>
              <p>Nous vous répondrons dans les plus brefs délais. Merci de votre confiance.</p>
              <button onClick={() => setSent(false)} className="cf-reset">Envoyer un autre message</button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={submit}>
              <span className="eyebrow">Votre message</span>
              <h2 style={{ fontSize: "28px", margin: "8px 0 32px" }}>On vous écoute.</h2>

              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#dc2626", fontSize: "14px", background: "#fee2e2", padding: "12px 16px", borderRadius: "12px", marginBottom: "8px" }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div className="cf-row">
                <label className="cf-label">
                  <span>Votre nom <span style={{ color: "#dc2626" }}>*</span></span>
                  <input name="nom" value={form.nom} onChange={handle} required placeholder="Ex. Ama Kossi" />
                </label>
                <label className="cf-label">
                  <span>Téléphone <span style={{ color: "#dc2626" }}>*</span></span>
                  <input name="tel" value={form.tel} onChange={handle} required type="tel" placeholder="+228 ..." />
                </label>
              </div>

              <label className="cf-label">
                <span>Objet</span>
                <select name="objet" value={form.objet} onChange={handle}>
                  <option value="">Choisir un sujet...</option>
                  <option>Demande de devis</option>
                  <option>Informations sur les services</option>
                  <option>Collecte à domicile</option>
                  <option>Autre demande</option>
                </select>
              </label>

              <label className="cf-label">
                <span>Votre message <span style={{ color: "#dc2626" }}>*</span></span>
                <textarea name="msg" value={form.msg} onChange={handle} required rows="5" placeholder="Comment pouvons-nous vous aider ?" />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <LiquidMetalButton
                  label={isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
                  width={240}
                  onClick={submit}
                />
              </div>
            </form>
          )}
        </div>
      </section>
    </Shell>
  );
}
