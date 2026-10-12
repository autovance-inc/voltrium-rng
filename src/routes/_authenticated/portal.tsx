import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Logo } from "@/components/voltrium/Logo";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => ({
    meta: [
      { title: "Partner Portal — Voltrium" },
      { name: "description", content: "Review, reply to and follow up on Voltrium partnership inquiries." },
      { property: "og:title", content: "Partner Portal — Voltrium" },
      { property: "og:description", content: "Review, reply to and follow up on Voltrium partnership inquiries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Portal,
});

type Inquiry = Tables<"partnership_inquiries">;
type Activity = Tables<"inquiry_activity">;

const STATUSES = [
  { v: "new", l: "New" },
  { v: "contacted", l: "Contacted" },
  { v: "in_discussion", l: "In discussion" },
  { v: "closed", l: "Closed" },
];
const statusLabel = (v: string) => STATUSES.find((s) => s.v === v)?.l ?? v;
const today = () => new Date().toISOString().slice(0, 10);
const isOverdue = (i: Inquiry) => !!i.follow_up_date && i.status !== "closed" && i.follow_up_date < today();
const field = "w-full min-w-0 border border-border bg-background/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

function Portal() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const admin = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return { email: "", ok: false };
      const { data, error } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      if (error) throw error;
      return { email: u.user.email ?? "", ok: !!data };
    },
  });

  const inquiries = useQuery({
    queryKey: ["inquiries"],
    enabled: !!admin.data?.ok,
    queryFn: async () => {
      const { data, error } = await supabase.from("partnership_inquiries").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [filter, setFilter] = useState<string>("open");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = useMemo(() => {
    const all = inquiries.data ?? [];
    return all.filter((i) => {
      if (filter === "open" && i.status === "closed") return false;
      if (filter === "overdue" && !isOverdue(i)) return false;
      if (!["open", "overdue", "all"].includes(filter) && i.status !== filter) return false;
      const s = q.trim().toLowerCase();
      return !s || `${i.organization} ${i.contact_name} ${i.email}`.toLowerCase().includes(s);
    });
  }, [inquiries.data, filter, q]);

  const selected = inquiries.data?.find((i) => i.id === selectedId) ?? null;
  const overdueCount = (inquiries.data ?? []).filter(isOverdue).length;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-5 md:px-10">
          <div className="flex items-center gap-4">
            <a href="/" aria-label="Voltrium home"><Logo /></a>
            <span className="label-tech-primary hidden sm:inline">Partner portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="label-tech hidden md:inline">{admin.data?.email}</span>
            <button onClick={signOut} className="label-tech border border-border px-4 py-2 hover:text-primary">Sign out</button>
          </div>
        </div>
      </header>

      {admin.isLoading ? (
        <p className="p-10 text-muted-foreground">Loading…</p>
      ) : !admin.data?.ok ? (
        <div className="mx-auto max-w-lg p-10">
          <h1 className="display-md">No access</h1>
          <p className="mt-4 text-muted-foreground">This account isn't allowed to view the partner portal.</p>
        </div>
      ) : (
        <main className="mx-auto grid max-w-[1400px] gap-6 px-5 py-8 md:px-10 lg:grid-cols-[minmax(0,420px)_1fr]">
          <section className={cn("min-w-0", selected && "hidden lg:block")}>
            <h1 className="display-md">Inquiries</h1>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { v: "open", l: "Open" },
                { v: "overdue", l: `Overdue (${overdueCount})` },
                ...STATUSES,
                { v: "all", l: "All" },
              ].map((f) => (
                <button
                  key={f.v}
                  onClick={() => setFilter(f.v)}
                  className={cn("label-tech border px-3 py-2", filter === f.v ? "border-primary text-primary" : "border-border")}
                >
                  {f.l}
                </button>
              ))}
            </div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search organization, name, email" className={`${field} mt-4`} />
            {inquiries.error && <p className="mt-4 text-sm text-destructive">Couldn't load inquiries.</p>}
            <ul className="mt-4 divide-y divide-border border border-border">
              {list.length === 0 && <li className="p-5 text-sm text-muted-foreground">{inquiries.isLoading ? "Loading…" : "No inquiries here."}</li>}
              {list.map((i) => (
                <li key={i.id}>
                  <button
                    onClick={() => setSelectedId(i.id)}
                    className={cn("block w-full p-4 text-left transition-colors hover:bg-surface", selectedId === i.id && "bg-surface")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0 truncate font-medium">{i.organization}</span>
                      <span className="label-tech shrink-0">{statusLabel(i.status)}</span>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{i.contact_name} · {i.email}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{new Date(i.created_at).toLocaleDateString()}</span>
                      {i.follow_up_date && (
                        <span className={cn(isOverdue(i) && "text-destructive")}>
                          Follow up {i.follow_up_date}{isOverdue(i) && " · overdue"}
                        </span>
                      )}
                      {i.assigned_to && <span>→ {i.assigned_to}</span>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className={cn("min-w-0", !selected && "hidden lg:block")}>
            {selected ? (
              <Detail key={selected.id} inquiry={selected} onBack={() => setSelectedId(null)} />
            ) : (
              <div className="grid h-64 place-items-center border border-dashed border-border text-muted-foreground">
                Select an inquiry
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  );
}

function Detail({ inquiry, onBack }: { inquiry: Inquiry; onBack: () => void }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState(inquiry.status);
  const [follow, setFollow] = useState(inquiry.follow_up_date ?? "");
  const [assigned, setAssigned] = useState(inquiry.assigned_to ?? "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [reply, setReply] = useState(`Hello ${inquiry.contact_name},\n\nThank you for your inquiry about partnering with Voltrium.\n\n\n\nBest regards,\nVoltrium`);
  const [actErr, setActErr] = useState<string | null>(null);

  const activity = useQuery({
    queryKey: ["activity", inquiry.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("inquiry_activity").select("*").eq("inquiry_id", inquiry.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function save(patch?: Partial<Inquiry>) {
    setSaving(true);
    setSaveMsg(null);
    const { error } = await supabase
      .from("partnership_inquiries")
      .update({ status, follow_up_date: follow || null, assigned_to: assigned.trim() || null, updated_at: new Date().toISOString(), ...patch })
      .eq("id", inquiry.id);
    setSaving(false);
    setSaveMsg(error ? "Couldn't save changes." : "Saved.");
    if (!error) await qc.invalidateQueries({ queryKey: ["inquiries"] });
    return !error;
  }

  async function addActivity(kind: "note" | "reply", body: string) {
    setActErr(null);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("inquiry_activity").insert({ inquiry_id: inquiry.id, kind, body, author_id: u.user?.id ?? null });
    if (error) {
      setActErr("Couldn't save to the timeline.");
      return false;
    }
    await qc.invalidateQueries({ queryKey: ["activity", inquiry.id] });
    return true;
  }

  async function sendReply() {
    const subject = `Re: Voltrium partnership inquiry — ${inquiry.organization}`;
    window.location.href = `mailto:${inquiry.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(reply)}`;
    if (await addActivity("reply", reply)) {
      if (status === "new") {
        setStatus("contacted");
        await save({ status: "contacted" });
      }
    }
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="label-tech hover:text-primary lg:hidden">← All inquiries</button>
      <div className="border border-border p-5 md:p-8">
        <p className="label-tech">Received {new Date(inquiry.created_at).toLocaleString()}</p>
        <h2 className="display-md mt-2 break-words">{inquiry.organization}</h2>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="label-tech">Contact</dt><dd className="mt-1">{inquiry.contact_name}</dd></div>
          <div><dt className="label-tech">Email</dt><dd className="mt-1 break-all"><a className="hover:text-primary" href={`mailto:${inquiry.email}`}>{inquiry.email}</a></dd></div>
          <div><dt className="label-tech">Phone</dt><dd className="mt-1">{inquiry.phone ? <a className="hover:text-primary" href={`tel:${inquiry.phone}`}>{inquiry.phone}</a> : "—"}</dd></div>
          <div><dt className="label-tech">Fleet size</dt><dd className="mt-1">{inquiry.fleet_size ?? "—"}</dd></div>
        </dl>
        <p className="label-tech mt-6">Project needs</p>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{inquiry.project_needs}</p>
      </div>

      <div className="grid gap-4 border border-border p-5 sm:grid-cols-3 md:p-8">
        <p className="label-tech-primary sm:col-span-3">Follow-up</p>
        <label><span className="label-tech">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${field} mt-2`}>
            {STATUSES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
        </label>
        <label><span className="label-tech">Follow-up date</span>
          <input type="date" value={follow} onChange={(e) => setFollow(e.target.value)} className={`${field} mt-2`} />
        </label>
        <label><span className="label-tech">Assigned to</span>
          <input value={assigned} maxLength={100} onChange={(e) => setAssigned(e.target.value)} placeholder="Name" className={`${field} mt-2`} />
        </label>
        <div className="flex items-center gap-4 sm:col-span-3">
          <button onClick={() => save()} disabled={saving} className="label-tech bg-primary px-6 py-3 text-primary-foreground disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
          {saveMsg && <span className="text-sm text-muted-foreground" role="status">{saveMsg}</span>}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="border border-border p-5 md:p-8">
          <p className="label-tech-primary">Reply</p>
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={8} className={`${field} mt-3 resize-y`} />
          <button onClick={sendReply} disabled={!reply.trim()} className="label-tech mt-3 border border-primary/60 px-5 py-3 text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-50">
            Open in email app & log reply
          </button>
        </div>
        <div className="border border-border p-5 md:p-8">
          <p className="label-tech-primary">Internal note</p>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={8} maxLength={4000} placeholder="Private — only visible in the portal" className={`${field} mt-3 resize-y`} />
          <button
            onClick={async () => { if (note.trim() && (await addActivity("note", note.trim()))) setNote(""); }}
            disabled={!note.trim()}
            className="label-tech mt-3 border border-border px-5 py-3 hover:text-primary disabled:opacity-50"
          >
            Add note
          </button>
        </div>
      </div>
      {actErr && <p className="text-sm text-destructive">{actErr}</p>}

      <div className="border border-border p-5 md:p-8">
        <p className="label-tech-primary">Timeline</p>
        <ul className="mt-4 space-y-4">
          {(activity.data ?? []).length === 0 && <li className="text-sm text-muted-foreground">{activity.isLoading ? "Loading…" : "No replies or notes yet."}</li>}
          {(activity.data ?? []).map((a: Activity) => (
            <li key={a.id} className={cn("border-l-2 pl-4", a.kind === "reply" ? "border-primary" : "border-border")}>
              <p className="label-tech">{a.kind === "reply" ? "Reply sent" : "Note"} · {new Date(a.created_at).toLocaleString()}</p>
              <p className="mt-1 whitespace-pre-line text-sm">{a.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
