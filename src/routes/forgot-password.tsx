import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeyRound, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Mot de passe oublié — Bible Lumière" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Lien envoyé ! Vérifie ta boîte mail.");
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de l'envoi");
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
          <h1 className="font-display text-3xl">Mot de passe oublié</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {sent ? "Consulte ta boîte mail pour réinitialiser ton mot de passe." : "Reçois un lien pour le réinitialiser."}
          </p>
        </div>

        {!sent && (
          <form onSubmit={submit} className="w-full space-y-3">
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
              className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm focus:border-gold focus:outline-none"
            />
            <button type="submit" disabled={loading} className="w-full rounded-2xl bg-gradient-gold py-3 text-sm font-semibold text-gold-foreground disabled:opacity-50">
              {loading ? "Envoi…" : "Envoyer le lien"}
            </button>
          </form>
        )}

        <Link to="/auth" className="mt-6 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowLeft className="h-3 w-3" /> Retour à la connexion
        </Link>
      </div>
    </MobileShell>
  );
}
