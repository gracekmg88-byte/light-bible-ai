import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Nouveau mot de passe — Bible Lumière" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase met automatiquement la session de récupération via le hash
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("6 caractères minimum"); return; }
    if (password !== confirm) { toast.error("Les mots de passe ne correspondent pas"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Mot de passe mis à jour");
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileShell>
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-gold shadow-glow">
            <KeyRound className="h-7 w-7 text-gold-foreground" />
          </div>
          <h1 className="font-display text-3xl">Nouveau mot de passe</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ready ? "Choisis un nouveau mot de passe sécurisé." : "Lien invalide ou expiré."}
          </p>
        </div>

        {ready && (
          <form onSubmit={submit} className="w-full space-y-3">
            <input
              type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Nouveau mot de passe"
              className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm focus:border-gold focus:outline-none"
            />
            <input
              type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirmer le mot de passe"
              className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm focus:border-gold focus:outline-none"
            />
            <button type="submit" disabled={loading} className="w-full rounded-2xl bg-gradient-gold py-3 text-sm font-semibold text-gold-foreground disabled:opacity-50">
              {loading ? "…" : "Mettre à jour"}
            </button>
          </form>
        )}
      </div>
    </MobileShell>
  );
}
