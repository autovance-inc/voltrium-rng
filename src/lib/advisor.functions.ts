import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const advisorSchema = z.object({
  organization: z.string().trim().min(2, "Tell us your organization").max(150),
  goals: z.string().trim().min(20, "Describe your goals in a sentence or two (20+ characters)").max(1500),
});

function statusOf(e: unknown): number | undefined {
  const o = e as { statusCode?: number; cause?: { statusCode?: number }; lastError?: { statusCode?: number } };
  return o?.statusCode ?? o?.cause?.statusCode ?? o?.lastError?.statusCode;
}

export const recommendPartnership = createServerFn({ method: "POST" })
  .inputValidator((d) => advisorSchema.parse(d))
  .handler(async ({ data }) => {
    const { recommend } = await import("./advisor.server");
    try {
      return { ok: true as const, result: await recommend(data) };
    } catch (e) {
      const s = statusOf(e);
      console.error("advisor error", s, e);
      const message =
        s === 429
          ? "The advisor is busy right now. Please try again in a minute."
          : s === 402 || s === 403
            ? "The advisor is temporarily unavailable. Please use the form directly."
            : "We couldn't generate a recommendation. Please try again or use the form directly.";
      return { ok: false as const, error: message };
    }
  });
