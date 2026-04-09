import { extractJsonObject } from "@/lib/listings/parse-response";
import { z } from "zod";

const matchItemSchema = z.object({
  propertyId: z.string().uuid(),
  score: z.coerce.number().min(0).max(100),
  reason: z.string().min(1).max(900),
});

const matchesResponseSchema = z.object({
  matches: z.array(matchItemSchema),
});

export type ParsedMatchItem = z.infer<typeof matchItemSchema>;

export function parseMatchesJson(assistantText: string): ParsedMatchItem[] {
  const parsed = extractJsonObject(assistantText);
  const r = matchesResponseSchema.safeParse(parsed);
  if (!r.success) {
    const msg = r.error.flatten().formErrors[0] ?? "Format JSON invalide.";
    throw new Error(msg);
  }
  const sorted = [...r.data.matches].sort((a, b) => b.score - a.score);
  return sorted.slice(0, 5);
}
