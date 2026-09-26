import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  // Callback optionnel déclenché après une connexion réussie
  const [onLoginSuccess, setOnLoginSuccess] = useState(null);

  const fetchProfile = useCallback(async (authUser) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) throw error;
      setUser({ ...authUser, ...data });
      return { ...authUser, ...data };
    } catch (err) {
      console.error("Error fetching profile:", err);
      const fallback = {
        ...authUser,
        name: authUser.user_metadata?.name || "Utilisateur",
        role: "user",
      };
      setUser(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Lire la session existante au montage
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchProfile(session.user);
      else setLoading(false);
    });

    // Écouter tous les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user);
          // ✅ Si un callback de redirection post-login est enregistré, on l'appelle
          if (event === "SIGNED_IN") {
            setOnLoginSuccess(cb => {
              if (typeof cb === "function") {
                // Exécuter après le prochain rendu
                setTimeout(() => cb(profile), 0);
              }
              return null; // Vider le callback après usage
            });
          }
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const register = async (name, email, password) => {
    if (!name || !email || !password) throw new Error("Tous les champs sont requis.");
    if (password.length < 6) throw new Error("Le mot de passe doit faire au moins 6 caractères.");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) throw new Error(error.message);
    return data.user;
  };

  const login = async (email, password) => {
    if (!email || !password) throw new Error("Tous les champs sont requis.");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error("Email ou mot de passe incorrect.");
    return data.user;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (error) throw new Error("Erreur de mise à jour du profil.");
    setUser(u => ({ ...u, ...updates }));
  };

  /**
   * Enregistre un callback à appeler une seule fois après la prochaine connexion.
   * Utilisé pour la redirection contextuelle (ex: retour vers /devis après login).
   */
  const registerLoginCallback = useCallback((cb) => {
    setOnLoginSuccess(() => cb);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, register, logout, updateProfile,
      registerLoginCallback,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
