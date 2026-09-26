import { useState, useEffect } from "react";
import { lazy, Suspense } from "react";
import { Link, useLocation } from "wouter";
import { Phone, UserRound, X, Menu, MapPin, Clock3, ArrowRight, ArrowUpRight, LogIn, LogOut, Download } from "lucide-react";
import { contactInfo } from "../../lib/data";
import { GradientBackground } from "./GradientBackground";
import { useAuth } from "../../lib/auth";

// Lazy-load WavyBackground — contient simplex-noise (lourd)
const WavyBackground = lazy(() => import("./wavy-background").then(m => ({ default: m.WavyBackground })));

// Fallback footer sans canvas (utilisé pendant le chargement)
function FooterFallback({ children }) {
  return (
    <div style={{ background: "#0a0805", position: "relative" }}>
      {children}
    </div>
  );
}

/* PWA Install Hook */
function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showInstallNotification, setShowInstallNotification] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if user has already been prompted
      const hasBeenPrompted = localStorage.getItem('pwa-install-prompted');
      
      if (!hasBeenPrompted) {
        // Show notification on first visit
        setShowInstallNotification(true);
        localStorage.setItem('pwa-install-prompted', 'true');
      }
      
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallButton(false);
      setShowInstallNotification(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Register service worker — unregister any stale SW first
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => reg.unregister());
      }).then(() => {
        navigator.serviceWorker.register('/sw.js');
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowInstallButton(false);
        setShowInstallNotification(false);
      }
      setDeferredPrompt(null);
    }
  };

  const dismissNotification = () => {
    setShowInstallNotification(false);
  };

  return { installPWA, showInstallButton, showInstallNotification, dismissNotification };
}

/* ── Scroll-aware header ──────────────────────────────── */
export function Shell({ children }) {
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const { installPWA, showInstallButton, showInstallNotification, dismissNotification } = usePWAInstall();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Close menu on route change and scroll to top
  useEffect(() => { 
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location]);

  const links = [
    ["/", "Accueil"],
    ["/services", "Services & tarifs"],
    ["/devis", "Devis"],
    ["/apropos", "À propos"],
    ["/galerie", "Galerie"],
    ["/avis", "Avis"],
    ["/contact", "Contact"],
  ];

  const handleLinkClick = (href) => {
    setOpen(false);
    navigate(href);
    setTimeout(() => window.scrollTo(0, 0), 50);
  };

  return (
    <div className="site-wrap">
      {/* PWA Install Notification */}
      {showInstallNotification && (
        <div className="pwa-notification">
          <div className="pwa-notification-content">
            <div className="pwa-notification-icon">📱</div>
            <div className="pwa-notification-text">
              <strong>Installer Vision Pressing</strong>
              <span>Accédez rapidement à nos services depuis votre écran d'accueil</span>
            </div>
            <div className="pwa-notification-actions">
              <button onClick={installPWA} className="pwa-install-primary">Installer</button>
              <button onClick={dismissNotification} className="pwa-install-dismiss">Plus tard</button>
            </div>
          </div>
        </div>
      )}

      <header className="hdr hdr--solid">
        <div className="hdr-inner">
          <Link href="/" className="logo-link" onClick={() => handleLinkClick("/")}>
            <img src="/logo.jpg" alt="Vision Pressing" className="site-logo" />
          </Link>

          <nav className={`hdr-nav${open ? " is-open" : ""}`}>
            {links.map(([h, l]) => (
              <Link
                key={h} href={h}
                className={`hdr-link${location === h ? " is-active" : ""}`}
                onClick={() => handleLinkClick(h)}
              >{l}</Link>
            ))}
            {/* Mobile auth section */}
            {open && (
              user ? (
                <>
                  <Link href="/compte" className="hdr-link" onClick={() => handleLinkClick("/compte")}>Mon compte</Link>
                  {user.role === 'admin' && <Link href="/admin" className="hdr-link" style={{ color: 'var(--gold)' }} onClick={() => handleLinkClick("/admin")}>Administration</Link>}
                  <button className="hdr-link hdr-logout-mobile" style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }} onClick={async () => { await logout(); setOpen(false); }}>
                    Se déconnecter
                  </button>
                </>
              ) : (
                <Link href="/connexion" className="hdr-link hdr-login-mobile" onClick={() => handleLinkClick("/connexion")}>
                  Se connecter
                </Link>
              )
            )}
          </nav>

          <div className="hdr-right">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link href="/admin" className="hdr-btn-login" style={{ background: 'rgba(201,168,76,0.15)', borderColor: 'var(--gold)', color: 'var(--gold)' }} title="Administration" onClick={() => handleLinkClick("/admin")}>
                    Admin
                  </Link>
                )}
                <Link href="/compte" className="hdr-btn-login" title="Mon compte" onClick={() => handleLinkClick("/compte")}>
                  <UserRound size={16} /> {user.name?.split(" ")[0]}
                </Link>
                <button className="hdr-icon" onClick={async () => await logout()} title="Déconnexion">
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <Link href="/connexion" className="hdr-btn-login" onClick={() => handleLinkClick("/connexion")}>
                Connexion
              </Link>
            )}
            <button className="hdr-burger" onClick={() => setOpen(v => !v)} aria-label="Menu" aria-expanded={open}>
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className={location !== "/" ? "page-bg" : ""}>{children}</main>

      <Suspense fallback={<FooterFallback>{/* footer content */}</FooterFallback>}>
      <WavyBackground 
        containerClassName="ftr" 
        className="w-full flex flex-col"
        backgroundFill="#0a0805"
        waveOpacity={0.2}
        blur={8}
      >
        <div className="ftr-top">
          <div className="ftr-brand">
            <Link href="/" className="logo-link">
              <img src="/logo.jpg" alt="Vision Pressing" className="site-logo ftr-logo" />
            </Link>
            <p>Le pressing haut de gamme qui transforme chaque pièce en une expérience de soin unique, au cœur de Tabligbo Ntifafa-komé.</p>
            <a href="tel:+22890788178" className="ftr-cta">Prendre contact <ArrowUpRight size={14} /></a>
          </div>
          <div className="ftr-col">
            <b>Navigation</b>
            <ul>
              {links.map(([h, l]) => <li key={h}><Link href={h}>{l}</Link></li>)}
            </ul>
          </div>
          <div className="ftr-col">
            <b>Nous trouver</b>
            <address>
              <p><a href={contactInfo.mapsLink} target="_blank" rel="noopener noreferrer"><MapPin size={14} /> Tabligbo Ntifafa-komé</a></p>
              <p><Clock3 size={14} /> 7j/7 · 07h–21h</p>
              <p><a href={`tel:${contactInfo.phone.replace(/\s+/g, '')}`}><Phone size={14} /> {contactInfo.phone}</a></p>
            </address>
          </div>
        </div>
        <div className="ftr-bottom">
          <span>© 2026 Vision Pressing. Tous droits réservés.</span>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            {showInstallButton && (
              <button 
                onClick={installPWA}
                className="pwa-install-btn"
                title="Installer l'application Vision Pressing"
              >
                <Download size={14} /> Installer l'app
              </button>
            )}
            <span>Pressing haut de gamme · Tabligbo Ntifafa-komé, Togo</span>
          </div>
        </div>
      </WavyBackground>
      </Suspense>
    </div>
  );
}

export function SectionTitle({ eyebrow, title, text, center = false, light = false }) {
  return (
    <div className={`st${center ? " st--center" : ""}${light ? " st--light" : ""}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

export function Button({ href, children, variant = "", onClick, style }) {
  const cls = `btn btn--${variant || "primary"}`;
  return href ? (
    <Link href={href} className={cls} onClick={onClick} style={style}>{children}<ArrowRight size={16} /></Link>
  ) : (
    <button className={cls} onClick={onClick} style={style}>{children}<ArrowRight size={16} /></button>
  );
}

export function PageHero({ eyebrow, title, text }) {
  return (
    <div style={{ position: "relative" }}>
      <section className="ph" style={{ position: "relative" }}>
        <GradientBackground />
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </section>
      {/* Gradient fade transition to page body */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: "150px",
        background: "linear-gradient(to bottom, transparent, var(--off))",
        pointerEvents: "none", zIndex: 10
      }} />
    </div>
  );
}


