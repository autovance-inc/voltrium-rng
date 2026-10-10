import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText } from "ai";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

export const recommendationSchema = z.object({
  opportunity: z.string().describe("Short name of the recommended partnership track"),
  summary: z.string(),
  reasons: z.array(z.string()),
  next_steps: z.array(z.string()),
  draft_inquiry: z.string().describe("First-person inquiry text from the partner to Voltrium"),
});
export type Recommendation = z.infer<typeof recommendationSchema>;

const INSTRUCTIONS = `You are the partnership advisor for Voltrium, a charging network operator building the "electric highway" for long-distance commercial transport (intercity coaches, buses, trucks) in Kenya and East Africa. Voltrium builds and operates high-power charging hubs combining grid connection, transformer, battery energy storage (BESS), solar, DC fast chargers, digital control and payment. Voltrium is a network operator, not a charger supplier.

Facts you may use: Nairobi–Mombasa is the initial priority corridor; commercial validation is pending and it is NOT operational. Future corridors (Nakuru–Eldoret, Kisumu, Malaba–Kampala, Namanga–Arusha) are illustrative and subject to validation. Ecosystem partner types: fleet/bus operators, OEMs, energy & utilities, finance, insurance, technology, landowners/site hosts, government & institutions.

Partnership tracks to choose ONE from: Fleet operator charging partnership; OEM & vehicle integration; Energy & grid partnership; Hub site / landowner partnership; Infrastructure finance & investment; Insurance & risk; Technology & payments integration; Public sector & corridor planning.

Rules: never invent numbers, prices, station counts, dates, funding, existing partnerships or claims that anything is operational. Do not promise outcomes. Keep summary to 2-3 sentences, 2-4 reasons, 2-3 next steps. The draft_inquiry is written by the partner in first person, 90-160 words, professional, using only details the user supplied. If information is missing, keep it general rather than making it up.`;

export async function recommend(input: { organization: string; goals: string }): Promise<Recommendation> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI is not configured.");
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  const result = streamText({
    model: provider.responses(MODEL),
    system: INSTRUCTIONS,
    prompt: `Organization: ${input.organization}\n\nGoals and context: ${input.goals}`,
    output: Output.object({ schema: recommendationSchema }),
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  return (await result.output) as Recommendation;
}
