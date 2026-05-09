import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "./useAuth";

/**
 * Redirige vers /auth si l'utilisateur n'est pas connecté.
 * Renvoie { user, loading } pour rendu conditionnel.
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
    }
  }, [user, loading, navigate]);
  return { user, loading };
}
