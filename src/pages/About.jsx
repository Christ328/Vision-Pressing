import { Shell, Button, PageHero } from "../components/ui";
import { useLocation } from "wouter";
import { LiquidMetalButton } from "../components/ui/liquid-metal-button";

export default function About() {
  const [, navigate] = useLocation();
  return (
    <Shell>
      <div style={{ position: "relative" }}>
        <PageHero
          eyebrow="Notre maison"
          title={<>Le pressing,<br /><em>autrement.</em></>}
          text="Vision Pressing est né d'une idée simple : offrir à Tabligbo un service textile aussi exigeant que les vêtements que nous aimons porter."
        />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "150px", background: "linear-gradient(to bottom, transparent, var(--off))", pointerEvents: "none", zIndex: 10 }} />
      </div>

      {/* Story section */}
      <section className="about-story" style={{ position: "relative", zIndex: 11, marginTop: "-40px" }}>
        <div className="about-img">
          <img src="https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1100&q=85" alt="Notre atelier" />
          <div className="about-img-tag">
            <strong>Depuis 2020</strong>
            <small>Tabligbo, Togo</small>
          </div>
        </div>
        <div className="about-copy">
          <span className="eyebrow">Notre histoire</span>
          <h2>Le savoir-faire local,<br /><em>avec une vision nouvelle.</em></h2>
          <p>Nous avons créé Vision Pressing pour faire du soin du vêtement un acte de confiance. Ici, pas de chaîne impersonnelle : chaque pièce est observée, comprise et traitée avec le geste juste.</p>
          <p style={{marginTop:20}}>Notre équipe associe les méthodes professionnelles à une écoute attentive de vos besoins — qu'il s'agisse d'une chemise du quotidien, d'un grand boubou ou d'une robe de cérémonie.</p>
          <div className="about-sig">
            <span>Vision Pressing</span>
            <small>Votre élégance, notre engagement.</small>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="values-section">
        <div className="values-header">
          <span className="eyebrow">Ce qui nous guide</span>
          <h2>Trois engagements,<br /><em>une même exigence.</em></h2>
        </div>
        <div className="values-grid">
          {[
            { n: "01", title: "La précision", color: "#6366f1", text: "Chaque tissu a son langage. Nous adaptons nos gestes, produits et délais à la nature de votre pièce." },
            { n: "02", title: "La confiance", color: "#c9a84c", text: "Des prix lisibles, des délais annoncés et une communication simple à chaque étape de votre commande." },
            { n: "03", title: "La constance", color: "#10b981", text: "Le même niveau d'exigence, pour votre première chemise comme pour votre pièce la plus précieuse." },
          ].map(v => (
            <div key={v.n} className="val-card" style={{"--vc": v.color}}>
              <span className="val-n">{v.n}</span>
              <h3>{v.title}</h3>
              <p>{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <div className="cta-dots" aria-hidden />
        <div className="cta-inner">
          <span className="eyebrow light">Vous avez une pièce à confier ?</span>
          <h2 style={{color:"#fff"}}>Faites-nous confiance.</h2>
          <div className="cta-btns">
            <LiquidMetalButton label="Obtenir un devis" width={220} onClick={() => navigate("/devis")} />
            <Button href="/contact" variant="outline" style={{borderColor:"rgba(255,255,255,0.3)", color:"#fff"}}>Nous contacter</Button>
          </div>
        </div>
      </section>
    </Shell>
  );
}
