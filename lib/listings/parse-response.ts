import { z } from "zod";

const listingsShape = z.object({
  classique: z.string().min(1),
  dynamique: z.string().min(1),
  premium: z.string().min(1),
});

export type ParsedListings = z.infer<typeof listingsShape>;

export function extractJsonObject(text: string): unknown {
  let t = text.trim();
  const fence = /^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```$/im.exec(t);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("JSON introuvable dans la réponse du modèle.");
  }
  const slice = t.slice(start, end + 1);
  return JSON.parse(slice) as unknown;
}

export function parseListingsJson(assistantText: string): ParsedListings {
  const parsed = extractJsonObject(assistantText);
  const r = listingsShape.safeParse(parsed);
  if (!r.success) {
    const msg = r.error.flatten().formErrors[0] ?? "Format JSON invalide.";
    throw new Error(msg);
  }
  return r.data;
}
