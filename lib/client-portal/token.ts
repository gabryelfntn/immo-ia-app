import { createHash, randomBytes } from "crypto";

export function generatePortalToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashPortalToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}
