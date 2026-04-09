import { extractJsonObject } from "@/lib/listings/parse-response";
import { visitReportContentSchema, type VisitReportContent } from "./schema";

export function parseVisitReportJson(assistantText: string): VisitReportContent {
  const parsed = extractJsonObject(assistantText);
  const r = visitReportContentSchema.safeParse(parsed);
  if (!r.success) {
    const msg = r.error.flatten().formErrors[0] ?? "Format JSON invalide.";
    throw new Error(msg);
  }
  return r.data;
}
