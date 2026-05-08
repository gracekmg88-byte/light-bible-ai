import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Trash2, NotebookPen, Save, Check, Loader2, FileText, FileDown } from "lucide-react";
import { jsPDF } from "jspdf";

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

const MOODS = ["Joie", "Paix", "Gratitude", "Foi", "Espérance", "Combat", "Repentance"];

const entrySchema = z.object({
  title: z.string().trim().max(120, "Titre trop long (max 120)"),
  content: z.string().trim().max(5000, "Contenu trop long (max 5000)"),
  mood: z.string().trim().max(40, "Humeur trop longue").nullable(),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
});

type SaveState = "idle" | "saving" | "saved" | "error";

function AgendaPage() {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);
  const editingRef = useRef<Entry | null>(null);
  editingRef.current = editing;

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
    setSaveState("idle");
  };

  const persist = async (e: Entry): Promise<Entry | null> => {
    if (!user) return null;
    const parsed = entrySchema.safeParse({
      title: e.title, content: e.content, mood: e.mood || null, entry_date: e.entry_date,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Données invalides");
      setSaveState("error");
      return null;
    }
    if (!parsed.data.title && !parsed.data.content) {
      // ne rien sauver tant que l'entrée est vide
      setSaveState("idle");
      return null;
    }
    const payload = { ...parsed.data, user_id: user.id };
    if (e.id) {
      const { data, error } = await supabase
        .from("agenda_entries").update(payload).eq("id", e.id).select().maybeSingle();
      if (error) { toast.error(error.message); setSaveState("error"); return null; }
      setSaveState("saved");
      return data as Entry | null;
    }
    const { data, error } = await supabase
      .from("agenda_entries").insert(payload).select().maybeSingle();
    if (error) { toast.error(error.message); setSaveState("error"); return null; }
    setSaveState("saved");
    return data as Entry | null;
  };

  const update = (patch: Partial<Entry>) => {
    if (!editing) return;
    const next = { ...editing, ...patch };
    setEditing(next);
    setSaveState("saving");
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      const cur = editingRef.current;
      if (!cur) return;
      const saved = await persist(cur);
      if (saved) {
        // rebind id after first insert so next saves are updates
        if (!cur.id && saved.id) {
          setEditing((prev) => (prev ? { ...prev, id: saved.id, updated_at: saved.updated_at } : prev));
        }
        load();
      }
    }, 700);
  };

  const closeEditor = async () => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (editing && saveState !== "saved") {
      const saved = await persist(editing);
      if (saved) load();
    }
    setEditing(null);
    setSaveState("idle");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("agenda_entries").delete().eq("id", id);
    setConfirmDelete(null);
    if (error) toast.error(error.message);
    else { toast.success("Entrée supprimée"); load(); }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const exportTxt = () => {
    if (entries.length === 0) { toast.error("Aucune entrée à exporter"); return; }
    const lines = entries.map((e) => {
      return [
        `Date : ${formatDate(e.entry_date)}`,
        `Titre : ${e.title || "(sans titre)"}`,
        `Humeur : ${e.mood || "—"}`,
        "",
        e.content || "",
        "",
        "─────────────────────────────",
        "",
      ].join("\n");
    });
    const blob = new Blob([`Mon agenda — Bible Lumière\n\n${lines.join("\n")}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `agenda-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    if (entries.length === 0) { toast.error("Aucune entrée à exporter"); return; }
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    const width = doc.internal.pageSize.getWidth() - margin * 2;
    const pageH = doc.internal.pageSize.getHeight();
    let y = margin;

    doc.setFont("helvetica", "bold"); doc.setFontSize(20);
    doc.text("Mon agenda — Bible Lumière", margin, y); y += 28;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(120);
    doc.text(`Exporté le ${formatDate(new Date().toISOString().slice(0, 10))}`, margin, y);
    y += 24;

    const ensure = (h: number) => { if (y + h > pageH - margin) { doc.addPage(); y = margin; } };

    entries.forEach((e) => {
      ensure(80);
      doc.setTextColor(180, 140, 30);
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.text(formatDate(e.entry_date).toUpperCase(), margin, y); y += 14;
      doc.setTextColor(20);
      doc.setFontSize(15);
      const titleLines = doc.splitTextToSize(e.title || "(sans titre)", width);
      doc.text(titleLines, margin, y); y += titleLines.length * 18;
      if (e.mood) {
        doc.setFont("helvetica", "italic"); doc.setFontSize(10); doc.setTextColor(110);
        doc.text(`Humeur : ${e.mood}`, margin, y); y += 14;
      }
      doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(40);
      const body = doc.splitTextToSize(e.content || "—", width);
      body.forEach((line: string) => { ensure(16); doc.text(line, margin, y); y += 15; });
      y += 10;
      doc.setDrawColor(220); doc.line(margin, y, margin + width, y); y += 18;
    });

    doc.save(`agenda-${new Date().toISOString().slice(0, 10)}.pdf`);
  };



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
        {entries.length > 0 && (
          <div className="flex gap-2">
            <button onClick={exportPdf} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gold/40 bg-card py-2 text-xs font-medium text-gold">
              <FileDown className="h-3.5 w-3.5" /> Exporter PDF
            </button>
            <button onClick={exportTxt} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2 text-xs font-medium">
              <FileText className="h-3.5 w-3.5" /> Exporter .txt
            </button>
          </div>
        )}
        {entries.length === 0 && !editing && (
          <div className="py-12 text-center">
            <NotebookPen className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">Aucune entrée pour le moment.</p>
            <button onClick={newEntry} className="mt-4 inline-flex items-center gap-1 rounded-xl bg-gradient-gold px-4 py-2 text-sm font-medium text-gold-foreground">
              <Plus className="h-3.5 w-3.5" /> Créer ma première entrée
            </button>
          </div>
        )}
        {entries.map((e) => (
          <article key={e.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <button onClick={() => { setEditing(e); setSaveState("saved"); }} className="min-w-0 flex-1 text-left">
                <p className="text-[10px] uppercase tracking-widest text-gold">
                  {new Date(e.entry_date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <h3 className="mt-1 font-display text-lg leading-tight">{e.title || "Sans titre"}</h3>
                {e.mood && <span className="mt-1 inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">{e.mood}</span>}
              </button>
              <button onClick={() => setConfirmDelete(e.id)} className="rounded-lg border border-border p-2 text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {e.content && <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-foreground/90">{e.content}</p>}
          </article>
        ))}
      </div>

      {/* Editor */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end bg-background/80 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gold">
                {editing.id ? "Modifier" : "Nouvelle entrée"}
              </p>
              <SaveBadge state={saveState} />
            </div>
            <input
              type="date"
              value={editing.entry_date}
              onChange={(e) => update({ entry_date: e.target.value })}
              className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              placeholder="Titre"
              maxLength={120}
              value={editing.title}
              onChange={(e) => update({ title: e.target.value })}
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />

            <div className="mt-2">
              <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Humeur</p>
              <div className="flex flex-wrap gap-1.5">
                {MOODS.map((m) => {
                  const active = (editing.mood ?? "") === m;
                  return (
                    <button
                      key={m}
                      onClick={() => update({ mood: active ? "" : m })}
                      className={`rounded-full border px-3 py-1 text-xs ${active ? "border-gold/60 bg-gold/10 text-gold" : "border-border text-muted-foreground"}`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            <textarea
              placeholder="Mes pensées, mes inspirations…"
              maxLength={5000}
              value={editing.content}
              onChange={(e) => update({ content: e.target.value })}
              rows={9}
              className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <p className="mt-1 text-right text-[10px] text-muted-foreground">{editing.content.length}/5000</p>

            <div className="mt-3 flex gap-2">
              <button onClick={closeEditor} className="flex-1 rounded-xl border border-border py-2 text-sm">
                Fermer
              </button>
              <button
                onClick={async () => { const s = await persist(editing); if (s) { load(); toast.success("Enregistré"); } }}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-gradient-gold py-2 text-sm font-medium text-gold-foreground"
              >
                <Save className="h-4 w-4" /> Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
            <p className="font-display text-lg">Supprimer cette entrée ?</p>
            <p className="mt-1 text-xs text-muted-foreground">Cette action est définitive.</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-xl border border-border py-2 text-sm">Annuler</button>
              <button onClick={() => remove(confirmDelete)} className="flex-1 rounded-xl bg-destructive py-2 text-sm font-medium text-destructive-foreground">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}

function SaveBadge({ state }: { state: SaveState }) {
  if (state === "saving") return <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Enregistrement…</span>;
  if (state === "saved") return <span className="inline-flex items-center gap-1 text-[10px] text-gold"><Check className="h-3 w-3" /> Enregistré</span>;
  if (state === "error") return <span className="text-[10px] text-destructive">Erreur</span>;
  return null;
}
