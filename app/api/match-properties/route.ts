import { createClient } from "@/lib/supabase/server";
import { runMatchForContact } from "@/lib/matching/run-match-for-contact";
import { z } from "zod";

const bodySchema = z.object({
  contactId: z.string().uuid("Identifiant de contact invalide."),
});

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
      parsed.error.flatten().fieldErrors.contactId?.[0] ?? "Requête invalide.";
    return Response.json({ error: msg }, { status: 400 });
  }

  const { contactId } = parsed.data;

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

  const result = await runMatchForContact(
    supabase,
    profile.agency_id,
    contactId
  );
  if (!result.ok) {
    return Response.json(
      { error: result.error },
      { status: result.status ?? 500 }
    );
  }
  return Response.json({ matches: result.matches });
}
