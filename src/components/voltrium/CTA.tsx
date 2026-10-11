import { useState } from "react";

import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_HREF, mailto } from "./config";
import { InquiryForm } from "./InquiryForm";
import { PartnerAdvisor } from "./PartnerAdvisor";
import { Reveal } from "./Reveal";

export function CTA({ headingLevel = "h2" }: { headingLevel?: "h1" | "h2" }) {
  const [draft, setDraft] = useState<{ organization: string; project_needs: string; n: number } | null>(null);
  return (
    <section id="contact" className="relative overflow-hidden border-b border-border">
      <div className="grid-lines-fine pointer-events-none absolute inset-0 opacity-70" />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-[140px] md:size-[700px]"
        style={{ background: "var(--color-primary-dim)" }}
      />
      <div className="relative mx-auto grid max-w-[1400px] gap-14 px-5 py-24 sm:px-8 md:px-10 md:py-36 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div className="min-w-0">
          <Reveal as={headingLevel} className="display-xl break-words lg:text-[clamp(3rem,5.4vw,5.5rem)]">
            The electric highway
            <br />
            <span className="text-primary text-glow">starts here.</span>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-8 text-lg leading-relaxed text-muted-foreground md:text-xl">
              Build the charging network.
              <br />
              Power the corridor.
              <br />
              Move East Africa.
            </p>
          </Reveal>
          <Reveal delay={140} className="mt-10 space-y-5 border-t border-border pt-8">
            <div>
              <p className="label-tech">Email</p>
              <a href={mailto("Voltrium enquiry")} className="mt-1 block break-all text-lg hover:text-primary">
                {CONTACT_EMAIL}
              </a>
            </div>
            <div>
              <p className="label-tech">Phone</p>
              <a href={CONTACT_PHONE_HREF} className="mt-1 block text-lg hover:text-primary">
                {CONTACT_PHONE}
              </a>
            </div>
            <div>
              <p className="label-tech">Base</p>
              <p className="mt-1 text-lg">Nairobi · Kenya · East Africa</p>
            </div>
          </Reveal>
        </div>
        <Reveal delay={160} className="min-w-0 space-y-8">
          <PartnerAdvisor
            onUseDraft={(d) => {
              setDraft({ ...d, n: (draft?.n ?? 0) + 1 });
              requestAnimationFrame(() =>
                document.getElementById("inquiry-form")?.scrollIntoView({ behavior: "smooth", block: "start" }),
              );
            }}
          />
          <InquiryForm key={draft?.n ?? 0} prefill={draft ?? undefined} />
        </Reveal>
      </div>
    </section>
  );
}
