import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import { AuthProvider } from "./lib/auth";

// Lazy load all pages — each becomes its own chunk
const Home     = lazy(() => import("./pages/Home"));
const Services = lazy(() => import("./pages/Services"));
const Quote    = lazy(() => import("./pages/Quote"));
const About    = lazy(() => import("./pages/About"));
const Gallery  = lazy(() => import("./pages/Gallery"));
const Reviews  = lazy(() => import("./pages/Reviews"));
const Contact  = lazy(() => import("./pages/Contact"));
const Account  = lazy(() => import("./pages/Account"));
const Tracking = lazy(() => import("./pages/Tracking"));
const Admin    = lazy(() => import("./pages/Admin"));
const Login    = lazy(() => import("./pages/Login"));

function PageLoader() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", background: "var(--off)"
    }}>
      <div style={{
        width: "40px", height: "40px", borderRadius: "50%",
        border: "3px solid var(--line)", borderTopColor: "var(--gold)",
        animation: "spin 0.7s linear infinite"
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/"           component={Home} />
          <Route path="/services"   component={Services} />
          <Route path="/devis"      component={Quote} />
          <Route path="/apropos"    component={About} />
          <Route path="/galerie"    component={Gallery} />
          <Route path="/avis"       component={Reviews} />
          <Route path="/contact"    component={Contact} />
          <Route path="/compte"     component={Account} />
          <Route path="/suivi"      component={Tracking} />
          <Route path="/suivi/:id"  component={Tracking} />
          <Route path="/admin"      component={Admin} />
          <Route path="/connexion"  component={Login} />
          <Route path="*"><Home /></Route>
        </Switch>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
