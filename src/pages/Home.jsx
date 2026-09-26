import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Phone, ShieldCheck, Zap, Truck, Star, ArrowRight, Check, MapPin, Clock3, Quote } from "lucide-react";
import { Shell, Button, SectionTitle } from "../components/ui";
import { gallery, heroBackgrounds, contactInfo } from "../lib/data";
import { LiquidMetalButton } from "../components/ui/liquid-metal-button";
import { supabase } from "../lib/supabase";

/* ── Typewriter ───────────────────────────────────────── */
function useTypewriter(words, speed = 80, pause = 2000) {
  const [display, setDisplay] = useState("");
  const [wi, setWi] = useState(0);
  const [ci, setCi] = useState(0);
  const [del, setDel] = useState(false);

  useEffect(() => {
    const w = words[wi];
    let t;
    if (!del && ci < w.length)        t = setTimeout(() => setCi(c => c + 1), speed);
    else if (!del && ci === w.length) t = setTimeout(() => setDel(true), pause);
    else if (del && ci > 0)           t = setTimeout(() => setCi(c => c - 1), speed / 2);
    else { setDel(false); setWi(i => (i + 1) % words.length); }
    setDisplay(w.slice(0, ci));
    return () => clearTimeout(t);
  }, [ci, del, wi, words, speed, pause]);

  return display;
}



/* ── Photo Gallery (after hero) ────────────────────────── */
function PhotoGallery() {
  return (
    <section className="dotted-rainbow-bg" style={{ padding: "100px 0" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 clamp(16px,4vw,60px)", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <span className="eyebrow" style={{ color: "var(--gold)" }}>Notre environnement</span>
          <h2 style={{ color: "var(--ink)", marginTop: "16px", fontSize: "clamp(32px,4vw,54px)" }}>
            Découvrez <em style={{ color: "var(--gold)" }}>Vision Pressing</em>
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
          {gallery.map(([label, img], i) => (
            <div key={i} style={{
              borderRadius: "var(--r)", overflow: "hidden",
              boxShadow: "var(--sh)", position: "relative",
              border: "1px solid var(--line)"
            }}>
              <img
                src={img}
                alt={label}
                loading={i === 0 ? "eager" : "lazy"}
                style={{ width: "100%", height: "340px", objectFit: "cover", display: "block", transition: "transform 0.5s ease" }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                onError={(e) => { e.target.src = "/gallery/p1.jpg"; }}
              />
              <div style={{
                position: "absolute", bottom: "16px", left: "16px",
                background: "var(--white)", padding: "8px 16px",
                borderRadius: "30px", font: "600 13px var(--ui)",
                color: "var(--ink)", boxShadow: "var(--sh-sm)",
                borderLeft: "3px solid var(--gold)"
              }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Review Card ───────────────────────────────────────── */
function Review({ quote, name, date, avatar, accent, stars }) {
  const initials = avatar || name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const bg = accent || "var(--ink)";
  return (
    <div className="rvw" style={{ "--a": accent }}>
      <div style={{ position: "absolute", top: "24px", right: "28px", color: "var(--line)", opacity: 0.4 }}>
        <Quote size={32} />
      </div>
      <div className="rvw-top">
        {Array.from({ length: stars || 5 }).map((_, i) => <Star key={i} size={15} fill="var(--gold)" color="var(--gold)" />)}
      </div>
      <p style={{ fontStyle: "italic", fontSize: "16px", lineHeight: 1.8, margin: "16px 0 28px", fontFamily: "var(--serif)" }}>"{quote}"</p>
      <footer style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{
          width: "46px", height: "46px", borderRadius: "50%",
          background: bg, color: "var(--white)",
          display: "flex", alignItems: "center", justifyContent: "center",
          font: "700 15px var(--ui)", flexShrink: 0,
          boxShadow: `0 4px 12px ${bg}55`
        }}>
          {initials}
        </div>
        <div>
          <strong style={{ font: "600 15px var(--ui)", display: "block", color: "var(--ink)" }}>{name}</strong>
          <small style={{ font: "400 12px var(--ui)", color: "rgba(17,17,17,0.5)" }}>{date || "Client satisfait"}</small>
        </div>
      </footer>
    </div>
  );
}

/* ── Service Card ─────────────────────────────────────── */
function Svc({ icon: Icon, title, desc }) {
  return (
    <div className="svc"
      style={{
        background: "var(--white)", border: "1px solid var(--line)",
        borderRadius: "var(--r)", padding: "32px",
        display: "flex", flexDirection: "column", gap: "16px",
        boxShadow: "var(--sh-sm)", transition: "all 0.3s ease",
        borderBottom: "3px solid transparent"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = "var(--sh-lg)";
        e.currentTarget.style.borderBottomColor = "var(--gold)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "var(--sh-sm)";
        e.currentTarget.style.borderBottomColor = "transparent";
      }}
    >
      <div style={{
        width: "56px", height: "56px", borderRadius: "14px",
        background: "var(--off)", display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--gold)"
      }}>
        <Icon size={28} />
      </div>
      <h3 style={{ font: "700 20px var(--ui)", color: "var(--ink)", margin: 0 }}>{title}</h3>
      <p style={{ font: "400 15px/1.6 var(--ui)", color: "rgba(17,17,17,0.6)", margin: 0 }}>{desc}</p>
    </div>
  );
}



/* ── HERO ───────────────────────────────────────────────── */
const heroWords = [
  "votre garde-robe.",
  "vos pièces délicates.",
  "votre linge de maison.",
  "les tenues de cérémonie."
];

/* ── HERO ───────────────────────────────────────────────── */
function HeroNelco() {
  const [bgIndex, setBgIndex] = useState(0);
  // ✅ Hook appelé au niveau du composant, pas dans le JSX
  const typed = useTypewriter(heroWords, 80, 2500);
  const [, navigate] = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % heroBackgrounds.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hero-nelco">
      <div className="hero-bg-overlay" />
      {heroBackgrounds.map((url, idx) => (
        <img
          key={idx}
          src={url}
          alt={idx === 0 ? "Vision Pressing — accueil" : ""}
          aria-hidden={idx !== bgIndex}
          loading={idx === 0 ? "eager" : "lazy"}
          className={`hero-bg-layer ${idx === bgIndex ? "is-active" : ""}`}
        />
      ))}

      <div className="hero-nelco-inner">
        <div className="hero-nelco-left">
          <div className="premium-badge">
            <div className="badge-shimmer"></div>
            <div className="badge-content">
              <span className="badge-text">L'excellence du soin textile</span>
            </div>
            <div className="badge-glow"></div>
          </div>
          <h1>
            Le soin parfait pour<br />
            <span style={{ color: "var(--gold)", fontStyle: "italic" }}>{typed}</span>
          </h1>
          <p>
            Des services flexibles, rapides et soignés pensés pour s'adapter à vos besoins et à votre budget. Votre linge, notre passion.
          </p>
          <div className="hero-nelco-btns">
            <LiquidMetalButton label="Passer commande" width={220} onClick={() => navigate("/services")} />
            <Button href="/devis" variant="outline" style={{ background: "transparent" }}>Nos tarifs</Button>
          </div>
        </div>

        <div className="hero-nelco-right">
          {gallery.slice(0, 4).map(([title, url], idx) => {
            let addClass = "";
            if (idx === 0) addClass = "h-pic-1";
            return (
              <div key={idx} className={`h-pic ${addClass}`}>
                <img src={url} alt={title || "Pressing Photo"} loading={idx === 0 ? "eager" : "lazy"} />
                <div className="h-pic-label">
                  <strong>Vision Pressing</strong>
                  <small>{title || "Service Premium"}</small>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const legacyWords = ["votre confiance.", "chaque détail.", "l'élégance.", "vos pièces précieuses."];

export default function Home() {
  const typed = useTypewriter(legacyWords, 70, 2000);
  const [homeReviews, setHomeReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data) setHomeReviews(data);
        setReviewsLoading(false);
      });
  }, []);

  return (
    <Shell>
      {/* ── Canvas animé en fond — desktop uniquement ─── */}
      {typeof window !== "undefined" && window.innerWidth >= 768 && (
        <canvas id="dot-canvas" aria-hidden="true" style={{
          position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none", opacity: 0.45,
          width: "100%", height: "100%"
        }} />
      )}
      <DotCanvas />

      {/* ══════════ HERO ════════════════════════════════ */}
      <HeroNelco />

      {/* ══════════ PHOTO GALLERY ═══════════════════════ */}
      <PhotoGallery />

      {/* STRIP — Carousel infini */}
      <section className="strip">
        <div className="strip-track">
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 0 }}>
              <div className="strip-pill">
                <div className="strip-pill-icon"><Clock3 size={20} color="var(--gold)" /></div>
                <div className="strip-pill-text">
                  <strong>07h00 – 21h00</strong>
                  <small>7j/7 · Tous les jours</small>
                </div>
              </div>
              <div className="strip-pill">
                <div className="strip-pill-icon"><MapPin size={20} color="var(--gold)" /></div>
                <div className="strip-pill-text">
                  <strong>Tabligbo, Togo</strong>
                  <small>HFQQ+XR</small>
                </div>
              </div>
              <div className="strip-pill">
                <div className="strip-pill-icon"><Zap size={20} color="var(--gold)" /></div>
                <div className="strip-pill-text">
                  <strong>Express 8H</strong>
                  <small>Livraison rapide</small>
                </div>
              </div>
              <div className="strip-pill">
                <div className="strip-pill-icon"><Truck size={20} color="var(--gold)" /></div>
                <div className="strip-pill-text">
                  <strong>Collecte</strong>
                  <small>A domicile</small>
                </div>
              </div>
              <div className="strip-pill">
                <div className="strip-pill-icon"><Star size={20} color="var(--gold)" /></div>
                <div className="strip-pill-text">
                  <strong>Des clients satisfaits</strong>
                  <small>Service de qualité</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ SERVICES ════════════════════════════ */}
      <section className="services">
        <SectionTitle
          eyebrow="Nos savoir-faire"
          title={<>Le soin,<br /><em>dans toutes ses formes.</em></>}
          text="Découvrez notre gamme complète de services d'entretien textile, pensés pour tous vos besoins."
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginTop: "48px" }}>
          {[
            { icon: ShieldCheck, title: "Blanchisserie industrielle", desc: "Traitement en grand volume pour professionnels avec une rigueur absolue." },
            { icon: Zap, title: "Lavage et pliage du linge", desc: "Un service quotidien pour un linge de maison et des vêtements impeccables." },
            { icon: Truck, title: "Livraison", desc: "Collecte et livraison directement à votre domicile ou bureau." },
            { icon: Star, title: "Nettoyage de tissus délicats", desc: "Soin particulier pour la soie, le cachemire et les tenues de cérémonie." },
            { icon: Check, title: "Pressing de vêtements", desc: "Nettoyage à sec professionnel pour redonner éclat et tenue à vos habits." },
            { icon: ArrowRight, title: "Repassage", desc: "Des finitions parfaites, sans plis, pour une allure toujours élégante." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="svc">
              <div className="svc-icon"><Icon size={26} color="#fff" /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
        <div className="services-cta">
          <LiquidMetalButton label="Consulter tous nos tarifs" width={280} onClick={() => navigate("/services")} />
        </div>
      </section>

      {/* HORAIRES & ADRESSE */}
      <section className="hours-section">
        <div className="hours-inner">
          <div className="hours-left">
            <span className="eyebrow" style={{ fontFamily: "var(--serif)", fontSize: "13px" }}>Nous trouver</span>
            <h2>Venez nous<br /><em>rendre visite.</em></h2>
            <p>
              Vision Pressing est ouvert <strong>7 jours sur 7</strong>, de <strong>07h00 à 21h00</strong>,
              pour s'adapter à votre emploi du temps. Nous sommes situés à Tabligbo, Togo.
            </p>
            <div className="hours-info-cards">
              <div className="hours-info-card">
                <Clock3 size={20} color="var(--gold)" />
                <div>
                  <strong>07h00 – 21h00</strong>
                  <small>Tous les jours sans exception</small>
                </div>
              </div>
              <div className="hours-info-card">
                <MapPin size={20} color="var(--gold)" />
                <div>
                  <strong>Tabligbo, Togo</strong>
                  <small>HFQQ+XR · Accès facile</small>
                </div>
              </div>
            </div>
            <div className="hours-actions">
              <a href={contactInfo.mapsLink} target="_blank" rel="noopener noreferrer" className="hours-maps-btn">
                <MapPin size={16} /> Ouvrir dans Google Maps
              </a>
            </div>
          </div>
          <div className="hours-right">
            <div className="hours-visual-card">
              <div className="hvc-badge">
                <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
                  {[1,2,3,4,5].map(i => <Star key={i} size={18} fill="var(--gold)" color="var(--gold)" />)}
                </div>
                <span className="hvc-score">Qualité</span>
                <span className="hvc-label">Service garanti</span>
                <small className="hvc-source">Tabligbo Ntifafa-komé</small>
              </div>
              <div className="hvc-divider" />
              <div className="hvc-features">
                {[
                  { icon: Zap, label: "Express 8H" },
                  { icon: Truck, label: "Collecte domicile" },
                  { icon: ShieldCheck, label: "Soin certifié" },
                  { icon: Check, label: "Prix transparents" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="hvc-feature">
                    <Icon size={16} color="var(--gold)" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DARK BAND — Devis */}
      <section className="dark-band">
        <div className="db-dots" aria-hidden />
        <div className="db-copy">
          <span className="eyebrow light">Estimation instantanée</span>
          <h2 style={{ color: "#fff" }}>Votre devis,<br /><em>en 30 secondes.</em></h2>
          <p>Sélectionnez vos pièces, choisissez votre délai et obtenez un montant précis — sans inscription.</p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <LiquidMetalButton label="Calculer mon devis" width={240} onClick={() => navigate("/devis")} />
          </div>
          <div className="db-reassurance">
            <span><Check size={14} /> Prix fixes, sans surprise</span>
            <span><Zap size={14} /> Express 8H disponible</span>
            <span><ShieldCheck size={14} /> Pièces en sécurité</span>
          </div>
        </div>
        <div className="db-visual">
          <div className="receipt">
            <div className="rcpt-head">
              <span className="rcpt-brand">VISION PRESSING</span>
              <span className="rcpt-tag">Express 8H</span>
            </div>
            <div className="rcpt-body">
              <div className="rcpt-row"><span>Chemise Luxe x 2</span><b>3 000 FCFA</b></div>
              <div className="rcpt-row"><span>Robe cérémonie x 1</span><b>2 500 FCFA</b></div>
              <div className="rcpt-row"><span>Bazin complet 2P</span><b>2 000 FCFA</b></div>
              <div className="rcpt-row accent"><span><Zap size={12} /> Tarif Express 8H</span><b>appliqué</b></div>
            </div>
            <div className="rcpt-foot">
              <span>Total estimé</span>
              <strong>7 500 <small>FCFA</small></strong>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ REVIEWS ═════════════════════════════ */}
      <section className="reviews">
        <SectionTitle
          center
          eyebrow="Témoignages clients"
          title={<>La confiance<br /><em>se repasse aussi.</em></>}
          text="Découvrez les avis de nos clients sur la qualité de nos services."
        />
        {reviewsLoading ? (
          <p style={{ textAlign: "center", color: "var(--muted)", marginTop: "40px" }}>Chargement des avis…</p>
        ) : homeReviews.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--muted)", marginTop: "40px" }}>
            Soyez le premier à laisser un avis !
          </p>
        ) : (
          <div className="rvw-grid">
            {homeReviews.map((r, i) => (
              <Review
                key={r.id}
                accent={["var(--gold)", "var(--ink)"][i % 2]}
                quote={r.text}
                name={r.name}
                date={r.date || "Avis client"}
                avatar={r.avatar}
                stars={r.stars}
              />
            ))}
          </div>
        )}
        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <LiquidMetalButton label="Voir tous les avis" width={240} onClick={() => navigate("/avis")} />
        </div>
      </section>

      {/* CTA Card */}
      <section style={{ padding: "0 20px" }}>
        <div className="cta-card">
          <div className="cta-dots" aria-hidden />
          <span className="eyebrow light">Une expérience unique</span>
          <h2>L'art du soin textile.</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", margin: "0", maxWidth: "500px" }}>
            Redécouvrez le plaisir de porter des vêtements parfaitement entretenus. Un service rapide, soigné et transparent.
          </p>
          <div className="cta-card-actions">
            <LiquidMetalButton label="Découvrir nos tarifs" width={240} onClick={() => navigate("/services")} />
            <button className="btn btn--light" onClick={() => navigate("/devis")}>Faire une estimation</button>
          </div>
        </div>
      </section>
    </Shell>
  );
}

/* ── Canvas dot animation — desktop only ───────────────── */
function DotCanvas() {
  useEffect(() => {
    // Skip entirely on mobile — too heavy on low-end CPUs
    if (window.innerWidth < 768) return;

    const canvas = document.getElementById("dot-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let t = 0;
    let running = true;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    // Reduced from 60 to 30 dots for better perf
    const colors = ["#c9a84c", "#6366f1", "#10b981", "#f59e0b"];
    const dots = Array.from({ length: 30 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2 + 1,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      color: colors[i % colors.length],
      alpha: Math.random() * 0.5 + 0.2,
    }));

    const observer = new IntersectionObserver(
      ([entry]) => { running = entry.isIntersecting; },
      { threshold: 0 }
    );
    observer.observe(canvas);

    let lastTime = 0;
    const draw = (timestamp) => {
      raf = requestAnimationFrame(draw);
      if (!running) return;
      // Throttle to ~30fps on desktop
      if (timestamp - lastTime < 33) return;
      lastTime = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.008;

      ctx.fillStyle = "rgba(201,168,76,0.12)";
      const gap = 36;
      for (let x = (t * gap) % gap; x < canvas.width + gap; x += gap) {
        for (let y = (t * gap) % gap; y < canvas.height + gap; y += gap) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      dots.forEach(d => {
        d.x += d.dx;
        d.y += d.dy;
        if (d.x < 0 || d.x > canvas.width)  d.dx *= -1;
        if (d.y < 0 || d.y > canvas.height) d.dy *= -1;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.globalAlpha = d.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    };
    draw(0);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, []);

  return null;
}
