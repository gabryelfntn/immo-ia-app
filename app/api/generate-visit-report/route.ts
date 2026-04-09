import { createClient } from "@/lib/supabase/server";
import { callClaudeForVisitReport } from "@/lib/visit-report/anthropic";
import {
  buildVisitReportUserPrompt,
  type ContactForVisitPrompt,
  type PropertyForVisitPrompt,
} from "@/lib/visit-report/build-prompt";
import { parseVisitReportJson } from "@/lib/visit-report/parse-response";
import {
  visitReportContentSchema,
  type VisitReportContent,
} from "@/lib/visit-report/schema";
import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date attendue au format AAAA-MM-JJ.");

const reportPayloadSchema = visitReportContentSchema;

const bodySchema = z.object({
  propertyId: z.string().uuid("Identifiant de bien invalide."),
  contactId: z.string().uuid("Identifiant de contact invalide."),
  visitNotes: z
    .string()
    .min(1, "Les notes de visite sont requises.")
    .max(32000, "Notes trop longues."),
  visitDate: isoDate,
  /** Si présent : enregistrement sans nouvel appel IA (après prévisualisation). */
  report: reportPayloadSchema.optional(),
  /**
   * Si true : génère le JSON via l’IA sans enregistrer en base.
   * Ignoré lorsque `report` est fourni.
   */
  dryRun: z.boolean().optional(),
});

function rowToResponse(
  content: VisitReportContent,
  id: string,
  visitDate: string,
  saved: boolean
) {
  return {
    id,
    visitDate,
    saved,
    summary: content.summary,
    positivePoints: content.positivePoints,
    negativePoints: content.negativePoints,
    clientInterest: content.clientInterest,
    recommendation: content.recommendation,
    nextStep: content.nextStep,
  };
}

async function loadPropertyAndContact(
  supabase: Awaited<ReturnType<typeof createClient>>,
  agencyId: string,
  propertyId: string,
  contactId: string
): Promise<{
  property: PropertyForVisitPrompt;
  contact: ContactForVisitPrompt;
} | null> {
  const { data: propertyRow, error: pErr } = await supabase
    .from("properties")
    .select(
      "title, type, transaction, price, surface, rooms, bedrooms, city, address, zip_code, description"
    )
    .eq("id", propertyId)
    .eq("agency_id", agencyId)
    .maybeSingle();

  if (pErr || !propertyRow) return null;

  const { data: contactRow, error: cErr } = await supabase
    .from("contacts")
    .select(
      "first_name, last_name, type, budget_min, budget_max, desired_city"
    )
    .eq("id", contactId)
    .eq("agency_id", agencyId)
    .maybeSingle();

  if (cErr || !contactRow) return null;

  const transaction = propertyRow.transaction as "vente" | "location";
  if (transaction !== "vente" && transaction !== "location") return null;

  const property: PropertyForVisitPrompt = {
    title: propertyRow.title as string,
    type: propertyRow.type as string,
    transaction,
    price: Number(propertyRow.price),
    surface: Number(propertyRow.surface),
    rooms: Number(propertyRow.rooms),
    bedrooms: Number(propertyRow.bedrooms),
    city: propertyRow.city as string,
    address: propertyRow.address as string,
    zip_code: propertyRow.zip_code as string,
    description:
      typeof propertyRow.description === "string" ? propertyRow.description : null,
  };

  const contact: ContactForVisitPrompt = {
    first_name: contactRow.first_name as string,
    last_name: contactRow.last_name as string,
    type: contactRow.type as string,
    budget_min:
      contactRow.budget_min != null ? Number(contactRow.budget_min) : null,
    budget_max:
      contactRow.budget_max != null ? Number(contactRow.budget_max) : null,
    desired_city:
      typeof contactRow.desired_city === "string"
        ? contactRow.desired_city
        : null,
  };

  return { property, contact };
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const msg =
      parsed.error.flatten().fieldErrors.visitDate?.[0] ??
      parsed.error.flatten().fieldErrors.visitNotes?.[0] ??
      parsed.error.flatten().fieldErrors.propertyId?.[0] ??
      parsed.error.flatten().fieldErrors.contactId?.[0] ??
      parsed.error.flatten().formErrors[0] ??
      "Requête invalide.";
    return Response.json({ error: msg }, { status: 400 });
  }

  const { propertyId, contactId, visitNotes, visitDate, report, dryRun } =
    parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.agency_id) {
    return Response.json({ error: "Agence introuvable." }, { status: 403 });
  }

  const agencyId = profile.agency_id as string;

  const loaded = await loadPropertyAndContact(
    supabase,
    agencyId,
    propertyId,
    contactId
  );

  if (!loaded) {
    return Response.json(
      { error: "Bien ou contact introuvable pour cette agence." },
      { status: 404 }
    );
  }

  const { property, contact } = loaded;

  let content: VisitReportContent;

  if (report) {
    content = report;
  } else {
    const userPrompt = buildVisitReportUserPrompt(
      property,
      contact,
      visitDate,
      visitNotes
    );

    let assistantText: string;
    try {
      assistantText = await callClaudeForVisitReport(userPrompt);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Échec de l’appel IA.";
      return Response.json({ error: message }, { status: 502 });
    }

    try {
      content = parseVisitReportJson(assistantText);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Impossible de lire la réponse du modèle.";
      return Response.json({ error: message }, { status: 502 });
    }
  }

  const skipInsert = report ? false : dryRun === true;

  if (skipInsert) {
    return Response.json({
      report: rowToResponse(content, "", visitDate, false),
    });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("visit_reports")
    .insert({
      property_id: propertyId,
      contact_id: contactId,
      agency_id: agencyId,
      agent_id: user.id,
      visit_date: visitDate,
      raw_notes: visitNotes,
      summary: content.summary,
      positive_points: content.positivePoints,
      negative_points: content.negativePoints,
      client_interest: content.clientInterest,
      recommendation: content.recommendation,
      next_step: content.nextStep,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return Response.json(
      {
        error:
          insertError?.message ??
          "Enregistrement impossible (table visit_reports manquante ?).",
      },
      { status: 500 }
    );
  }

  return Response.json({
    report: rowToResponse(
      content,
      inserted.id as string,
      visitDate,
      true
    ),
  });
}
