import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { advisorSchema, recommendPartnership } from "@/lib/advisor.functions";
import type { Recommendation } from "@/lib/advisor.server";

const field =
  "w-full min-w-0 border border-border bg-background/60 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-primary";

export function PartnerAdvisor({
  onUseDraft,
}: {
  onUseDraft: (d: { organization: string; project_needs: string }) => void;
}) {
  const run = useServerFn(recommendPartnership);
  const [org, setOrg] = useState("");
  const [goals, setGoals] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rec, setRec] = useState<Recommendation | null>(null);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    const parsed = advisorSchema.safeParse({ organization: org, goals });
    if (!parsed.success) return setErr(parsed.error.issues[0]?.message ?? "Please check your details");
    setErr(null);
    setLoading(true);
    try {
      const r = await run({ data: parsed.data });
      if (r.ok) setRec(r.result);
      else setErr(r.error);
    } catch {
      setErr("We couldn't generate a recommendation. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-primary/40 bg-surface/40 p-5 sm:p-8 md:p-10">
      <p className="label-tech-primary">AI partnership advisor</p>
      <p className="mt-3 text-muted-foreground">
        Describe your organization and goals. We'll suggest a relevant partnership track and draft your inquiry.
      </p>
      <form onSubmit={go} className="mt-6 grid gap-4">
        <input
          value={org}
          onChange={(e) => setOrg(e.target.value)}
          maxLength={150}
          placeholder="Organization"
          aria-label="Organization"
          className={field}
        />
        <textarea
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          rows={4}
          maxLength={1500}
          placeholder="What you do and what you want to achieve — e.g. we run intercity coaches and want to electrify routes to the coast."
          aria-label="Goals"
          className={`${field} resize-y`}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={loading}
            className="label-tech border border-primary/60 px-6 py-3 text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Analysing…" : rec ? "Regenerate" : "Get recommendation"}
          </button>
          {err && <p className="text-sm text-destructive">{err}</p>}
        </div>
      </form>

      {rec && (
        <div className="mt-8 border-t border-border pt-8" aria-live="polite">
          <p className="label-tech">Recommended opportunity</p>
          <p className="display-md mt-2 text-primary">{rec.opportunity}</p>
          <p className="mt-4 text-muted-foreground">{rec.summary}</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="label-tech">Why it fits</p>
              <ul className="mt-2 space-y-2 text-sm">
                {rec.reasons.map((r) => (
                  <li key={r} className="border-l border-primary/50 pl-3">{r}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="label-tech">Next steps</p>
              <ul className="mt-2 space-y-2 text-sm">
                {rec.next_steps.map((r) => (
                  <li key={r} className="border-l border-border pl-3">{r}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="label-tech mt-6">Draft inquiry</p>
          <p className="mt-2 whitespace-pre-line border border-border bg-background/60 p-4 text-sm leading-relaxed">
            {rec.draft_inquiry}
          </p>
          <button
            type="button"
            onClick={() => onUseDraft({ organization: org.trim(), project_needs: rec.draft_inquiry })}
            className="label-tech mt-5 bg-primary px-6 py-3 text-primary-foreground transition-opacity hover:opacity-85"
          >
            Use this draft in the form ↓
          </button>
          <p className="mt-4 text-xs text-muted-foreground">
            AI-generated suggestion. Review and edit before sending.
          </p>
        </div>
      )}
    </div>
  );
}
