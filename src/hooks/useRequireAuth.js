/**
 * useRequireAuth — redirige vers /connexion si l'utilisateur n'est pas connecté,
 * en passant la page courante comme paramètre `redirect` pour y revenir après login.
 *
 * Usage :
 *   const { user, redirectToLogin } = useRequireAuth();
 *   // Dans un handler :
 *   if (!user) { redirectToLogin(); return; }
 */
import { useLocation } from "wouter";
import { useAuth } from "../lib/auth";

export function useRequireAuth() {
  const { user, loading } = useAuth();
  const [location, navigate] = useLocation();

  const redirectToLogin = () => {
    navigate(`/connexion?redirect=${encodeURIComponent(location)}`);
  };

  return { user, loading, redirectToLogin };
}
