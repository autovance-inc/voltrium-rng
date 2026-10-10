import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { inquirySchema, submitInquiry } from "@/lib/inquiry.functions";

const fleetOptions = ["Not yet operating", "1–10 vehicles", "11–50 vehicles", "51–200 vehicles", "200+ vehicles"];

const field =
  "w-full min-w-0 border border-border bg-background/60 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-primary";

export function InquiryForm({
  prefill,
}: {
  prefill?: { organization: string; project_needs: string };
}) {
  const submit = useServerFn(submitInquiry);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const values = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const parsed = inquirySchema.safeParse(values);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] ??= i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    setStatus("sending");
    try {
      await submit({ data: parsed.data });
      setStatus("done");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="border border-primary/50 p-8 md:p-10" role="status">
        <p className="label-tech-primary">Inquiry received</p>
        <p className="display-md mt-3">Thank you.</p>
        <p className="mt-4 text-muted-foreground">The Voltrium team will review your inquiry.</p>
        <button type="button" onClick={() => setStatus("idle")} className="label-tech mt-8 hover:text-primary">
          Submit another inquiry →
        </button>
      </div>
    );
  }

  const Err = ({ n }: { n: string }) =>
    errors[n] ? <p className="mt-2 text-sm text-destructive">{errors[n]}</p> : null;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 border border-border bg-surface/40 p-5 sm:grid-cols-2 sm:p-8 md:p-10">
      <p className="label-tech-primary sm:col-span-2">Partnership inquiry</p>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="sm:col-span-2">
        <span className="label-tech">Organization *</span>
        <input name="organization" maxLength={150} className={`${field} mt-2`} placeholder="Company or institution" />
        <Err n="organization" />
      </label>
      <label>
        <span className="label-tech">Contact name *</span>
        <input name="contact_name" maxLength={100} autoComplete="name" className={`${field} mt-2`} />
        <Err n="contact_name" />
      </label>
      <label>
        <span className="label-tech">Email *</span>
        <input name="email" type="email" maxLength={255} autoComplete="email" className={`${field} mt-2`} />
        <Err n="email" />
      </label>
      <label>
        <span className="label-tech">Phone</span>
        <input name="phone" type="tel" maxLength={30} autoComplete="tel" className={`${field} mt-2`} />
        <Err n="phone" />
      </label>
      <label>
        <span className="label-tech">Fleet size</span>
        <select name="fleet_size" defaultValue="" className={`${field} mt-2`}>
          <option value="">Select…</option>
          {fleetOptions.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </label>
      <label className="sm:col-span-2">
        <span className="label-tech">Project needs *</span>
        <textarea
          name="project_needs"
          rows={5}
          maxLength={2000}
          className={`${field} mt-2 resize-y`}
          placeholder="Routes, charging requirements, timelines, partnership interest…"
        />
        <Err n="project_needs" />
      </label>
      <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={status === "sending"}
          className="label-tech bg-primary px-8 py-4 text-primary-foreground transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Submit inquiry"}
        </button>
        {status === "error" && (
          <p className="text-sm text-destructive">Something went wrong. Please try again or email us.</p>
        )}
      </div>
    </form>
  );
}
