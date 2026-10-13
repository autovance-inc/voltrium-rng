import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Logo } from "@/components/voltrium/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My Inquiries — Voltrium Partner Dashboard" },
      { name: "description", content: "Track the status of your Voltrium partnership inquiries and read replies from the team." },
      { property: "og:title", content: "My Inquiries — Voltrium Partner Dashboard" },
      { property: "og:description", content: "Track the status of your Voltrium partnership inquiries and read replies from the team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

const LABEL: Record<string, string> = {
  new: "Received",
  contacted: "Contacted",
  in_discussion: "In discussion",
  closed: "Closed",
};

function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const data = useQuery({
    queryKey: ["partner-dashboard"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const [inq, rep, adm] = await Promise.all([
        supabase.rpc("my_inquiries"),
        supabase.rpc("my_inquiry_replies"),
        u.user ? supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" }) : Promise.resolve({ data: false, error: null }),
      ]);
      if (inq.error) throw inq.error;
      if (rep.error) throw rep.error;
      return { email: u.user?.email ?? "", inquiries: inq.data ?? [], replies: rep.data ?? [], isAdmin: !!adm.data };
    },
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between gap-4 px-5 md:px-10">
          <a href="/" aria-label="Voltrium home"><Logo /></a>
          <div className="flex items-center gap-3">
            {data.data?.isAdmin && (
              <a href="/portal" className="label-tech-primary border border-primary/50 px-4 py-2">Admin portal</a>
            )}
            <button onClick={signOut} className="label-tech border border-border px-4 py-2 hover:text-primary">Sign out</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1100px] px-5 py-10 md:px-10">
        <p className="label-tech-primary">Partner dashboard</p>
        <h1 className="display-md mt-2">My inquiries</h1>
        <p className="mt-2 break-all text-sm text-muted-foreground">{data.data?.email}</p>

        {data.isLoading && <p className="mt-8 text-muted-foreground">Loading…</p>}
        {data.error && <p className="mt-8 text-destructive">Couldn't load your inquiries. Please refresh.</p>}
        {data.data && data.data.inquiries.length === 0 && (
          <div className="mt-8 border border-dashed border-border p-8">
            <p>No inquiries yet for this email address.</p>
            <p className="mt-2 text-sm text-muted-foreground">Inquiries appear here when they were sent with the same email you signed in with.</p>
            <a href="/contact" className="label-tech-primary mt-5 inline-block">Send an inquiry →</a>
          </div>
        )}

        <ul className="mt-8 space-y-6">
          {data.data?.inquiries.map((i) => {
            const replies = data.data.replies.filter((r) => r.inquiry_id === i.id);
            return (
              <li key={i.id} className="border border-border p-5 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="label-tech">Sent {new Date(i.created_at).toLocaleDateString()}</p>
                    <h2 className="mt-1 break-words text-xl font-medium">{i.organization}</h2>
                  </div>
                  <span className="label-tech-primary border border-primary/50 px-3 py-1">{LABEL[i.status] ?? i.status}</span>
                </div>
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{i.project_needs}</p>
                <div className="mt-6 border-t border-border pt-5">
                  <p className="label-tech">Replies from Voltrium</p>
                  {replies.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">No replies yet. The team will be in touch.</p>
                  ) : (
                    <ul className="mt-3 space-y-4">
                      {replies.map((r) => (
                        <li key={r.id} className="border-l-2 border-primary pl-4">
                          <p className="label-tech">{new Date(r.created_at).toLocaleString()}</p>
                          <p className="mt-1 whitespace-pre-line text-sm">{r.body}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
