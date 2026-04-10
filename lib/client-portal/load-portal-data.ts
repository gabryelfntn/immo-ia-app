import { createServiceSupabase } from "@/lib/supabase/admin";
import { hashPortalToken } from "@/lib/client-portal/token";
import { PIPELINE_STAGE_LABELS } from "@/lib/contacts/pipeline";
import type { PipelineStage } from "@/lib/contacts/schema";
import type { MatchOutputItem } from "@/lib/matching/run-match-for-contact";

export type ClientPortalVisit = {
  id: string;
  visit_date: string;
  summary: string;
  property_title: string | null;
  property_city: string | null;
};

export type ClientPortalPayload =
  | { ok: false; error: string }
  | {
      ok: true;
      firstName: string;
      journeyLabel: string;
      journeyDetail: string;
      proposed: MatchOutputItem[];
      visits: ClientPortalVisit[];
    };

function journeyFromPipeline(stage: string | null | undefined): {
  label: string;
  detail: string;
} {
  const s = (stage ?? "premier_contact") as PipelineStage;
  const label = PIPELINE_STAGE_LABELS[s] ?? "Suivi";
  if (s === "premier_contact" || s === "qualifie") {
    return {
      label: "Recherche en cours",
      detail: `Étape : ${label} — nous affinons vos critères et sélectionnons des biens adaptés.`,
    };
  }
  if (s === "visite") {
    return {
      label: "Visites",
      detail: `Étape : ${label} — organisation ou suivi des visites de biens.`,
    };
  }
  if (s === "offre") {
    return {
      label: "Offre en cours",
      detail: `Étape : ${label} — montage ou négociation d’une offre.`,
    };
  }
  return {
    label: "Avancement",
    detail: `Étape : ${label} — votre dossier avance avec votre conseiller.`,
  };
}

export async function loadClientPortalData(
  rawToken: string
): Promise<ClientPortalPayload> {
  const trimmed = rawToken?.trim();
  if (!trimmed) {
    return { ok: false, error: "Lien invalide." };
  }

  const admin = createServiceSupabase();
  if (!admin) {
    return {
      ok: false,
      error: "Portail temporairement indisponible (configuration serveur).",
    };
  }

  const hash = hashPortalToken(trimmed);
  const { data: row, error } = await admin
    .from("client_portal_access")
    .select(
      `
      id,
      expires_at,
      revoked_at,
      match_snapshot,
      contact_id,
      contacts (
        id,
        first_name,
        last_name,
        pipeline_stage
      )
    `
    )
    .eq("token_hash", hash)
    .maybeSingle();

  if (error) {
    return { ok: false, error: "Impossible de vérifier le lien." };
  }
  if (!row) {
    return { ok: false, error: "Lien inconnu ou expiré." };
  }

  if (row.revoked_at) {
    return { ok: false, error: "Ce lien a été désactivé." };
  }

  const exp = new Date(row.expires_at as string).getTime();
  if (Number.isFinite(exp) && exp < Date.now()) {
    return { ok: false, error: "Ce lien a expiré." };
  }

  const rawContact = row.contacts as unknown;
  const c = Array.isArray(rawContact) ? rawContact[0] : rawContact;
  if (
    !c ||
    typeof c !== "object" ||
    !("id" in c) ||
    typeof (c as { id: unknown }).id !== "string"
  ) {
    return { ok: false, error: "Contact introuvable." };
  }
  const contact = c as {
    id: string;
    first_name: string;
    last_name: string;
    pipeline_stage?: string | null;
  };
  const contactId = contact.id;
  const { label: journeyLabel, detail: journeyDetail } = journeyFromPipeline(
    contact.pipeline_stage
  );

  let proposed: MatchOutputItem[] = [];
  const snap = row.match_snapshot;
  if (snap != null && Array.isArray(snap)) {
    try {
      proposed = snap as MatchOutputItem[];
    } catch {
      proposed = [];
    }
  }

  const { data: visits, error: vErr } = await admin
    .from("visit_reports")
    .select(
      `
      id,
      visit_date,
      summary,
      properties ( title, city )
    `
    )
    .eq("contact_id", contactId)
    .order("visit_date", { ascending: false })
    .limit(20);

  if (vErr) {
    return { ok: false, error: "Impossible de charger les visites." };
  }

  const visitRows: ClientPortalVisit[] = (visits ?? []).map((v) => {
    const p = v.properties as { title?: string; city?: string } | null;
    return {
      id: v.id as string,
      visit_date: v.visit_date as string,
      summary: (v.summary as string) ?? "",
      property_title: p?.title ?? null,
      property_city: p?.city ?? null,
    };
  });

  return {
    ok: true,
    firstName: contact.first_name?.trim() || "Bonjour",
    journeyLabel,
    journeyDetail,
    proposed,
    visits: visitRows,
  };
}
