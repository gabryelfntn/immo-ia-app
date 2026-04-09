import { extractJsonObject } from "@/lib/listings/parse-response";
import { followupEmailSchema, type FollowupEmail } from "./schema";

export function parseFollowupEmailJson(assistantText: string): FollowupEmail {
  const parsed = extractJsonObject(assistantText);
  const r = followupEmailSchema.safeParse(parsed);
  if (!r.success) {
    const msg = r.error.flatten().formErrors[0] ?? "Format JSON invalide.";
    throw new Error(msg);
  }
  return r.data;
}

