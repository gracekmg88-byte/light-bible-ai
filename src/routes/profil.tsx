import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User as UserIcon, Mail } from "lucide-react";

export const Route = createFileRoute("/profil")({
  component: Profil,
});

function Profil() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <MobileShell><div /></MobileShell>;

  if (!user) {
    return (
      <MobileShell>
        <PageHeader title="Profil" />
        <div className="flex flex-col items-center px-5 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-aurora shadow-glow">
            <UserIcon className="h-7 w-7" />
          </div>
          <h2 className="font-display text-xl">Bienvenue</h2>
          <p className="mt-1 text-sm text-muted-foreground">Connecte-toi pour synchroniser tes notes et favoris.</p>
          <Link to="/auth" className="mt-6 rounded-xl bg-gradient-gold px-6 py-3 text-sm font-medium text-gold-foreground">
            Se connecter / S'inscrire
          </Link>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <PageHeader title="Profil" />
      <div className="px-5 pt-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-aurora">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-base">{user.user_metadata?.full_name ?? "Disciple"}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{user.email}</p>
            </div>
          </div>
        </div>

        <button
          onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" /> Se déconnecter
        </button>
      </div>
    </MobileShell>
  );
}
