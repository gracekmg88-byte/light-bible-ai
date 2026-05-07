import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Trash2, NotebookPen, Save } from "lucide-react";

export const Route = createFileRoute("/agenda")({
  head: () => ({ meta: [{ title: "Mon agenda — Bible Lumière" }] }),
  component: AgendaPage,
});

type Entry = {
  id: string;
  title: string;
  content: string;
  mood: string | null;
  entry_date: string;
  updated_at: string;
};

function AgendaPage() {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("agenda_entries")
      .select("*")
      .order("entry_date", { ascending: false })
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    else setEntries((data ?? []) as Entry[]);
  };

  useEffect(() => { load(); }, [user]);

  const newEntry = () => {
    setEditing({
      id: "",
      title: "",
      content: "",
      mood: "",
      entry_date: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    });
  };

  const save = async () => {
    if (!editing || !user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      title: editing.title,
      content: editing.content,
      mood: editing.mood || null,
      entry_date: editing.entry_date,
    };
    const { error } = editing.id
      ? await supabase.from("agenda_entries").update(payload).eq("id", editing.id)
      : await supabase.from("agenda_entries").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Enregistré");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("agenda_entries").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Supprimé"); load(); }
  };

  if (authLoading) return <MobileShell><div className="p-8 text-center text-sm text-muted-foreground">Chargement…</div></MobileShell>;

  if (!user) return (
    <MobileShell>
      <PageHeader title="Mon agenda" />
      <div className="px-5 pt-10 text-center">
        <NotebookPen className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">Connecte-toi pour écrire tes pensées.</p>
        <Link to="/auth" className="mt-4 inline-block rounded-xl bg-gradient-gold px-4 py-2 text-sm text-gold-foreground">Se connecter</Link>
      </div>
    </MobileShell>
  );

  return (
    <MobileShell>
      <PageHeader
        title="Mon agenda"
        subtitle="Pensées & inspirations"
        right={
          <button onClick={newEntry} className="inline-flex items-center gap-1 rounded-xl bg-gradient-gold px-3 py-2 text-xs font-medium text-gold-foreground">
            <Plus className="h-3.5 w-3.5" /> Nouveau
          </button>
        }
      />
      <div className="px-5 pt-6 pb-4 space-y-3">
        {entries.length === 0 && !editing && (
          <p className="py-12 text-center text-sm text-muted-foreground">Aucune entrée pour le moment.</p>
        )}
        {entries.map((e) => (
          <article key={e.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-widest text-gold">
                  {new Date(e.entry_date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <h3 className="mt-1 font-display text-lg leading-tight">{e.title || "Sans titre"}</h3>
                {e.mood && <p className="text-xs text-muted-foreground">{e.mood}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditing(e)} className="rounded-lg border border-border p-2 text-xs">Modifier</button>
                <button onClick={() => remove(e.id)} className="rounded-lg border border-border p-2 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{e.content}</p>
          </article>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md mx-auto rounded-t-3xl border-t border-border bg-card p-5 max-h-[90vh] overflow-y-auto">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gold">{editing.id ? "Modifier" : "Nouvelle entrée"}</p>
            <input
              type="date"
              value={editing.entry_date}
              onChange={(e) => setEditing({ ...editing, entry_date: e.target.value })}
              className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              placeholder="Titre"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              placeholder="Humeur (optionnel)"
              value={editing.mood ?? ""}
              onChange={(e) => setEditing({ ...editing, mood: e.target.value })}
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Mes pensées, mes inspirations…"
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
              rows={8}
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <div className="mt-3 flex gap-2">
              <button onClick={() => setEditing(null)} className="flex-1 rounded-xl border border-border py-2 text-sm">Annuler</button>
              <button onClick={save} disabled={saving} className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-gradient-gold py-2 text-sm font-medium text-gold-foreground disabled:opacity-60">
                <Save className="h-4 w-4" /> {saving ? "…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
