import { callClaudeMessages } from "@/lib/ai-lab/call-claude";
import { loadAgencyContextSnippet } from "@/lib/ai-lab/agency-context";
import { requireAgencySession } from "@/lib/ai-lab/require-agency-session";
import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(12_000),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(24),
});

function validateAlternation(
  messages: z.infer<typeof messageSchema>[]
): string | null {
  if (messages[0]?.role !== "user") {
    return "La conversation doit commencer par un message utilisateur.";
  }
  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1]!.role;
    const cur = messages[i]!.role;
    if (prev === cur) {
      return "Les messages doivent alterner utilisateur / assistant.";
    }
  }
  if (messages[messages.length - 1]?.role !== "user") {
    return "Le dernier message doit être celui de l’utilisateur.";
  }
  return null;
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
    return Response.json(
      { error: "Requête invalide (messages)." },
      { status: 400 }
    );
  }

  const altErr = validateAlternation(parsed.data.messages);
  if (altErr) {
    return Response.json({ error: altErr }, { status: 400 });
  }

  const session = await requireAgencySession();
  if (!session.ok) return session.response;

  const ctx = await loadAgencyContextSnippet(session.supabase, session.agencyId);

  const system = `Tu es l’assistant CRM d’une agence immobilière en France. Tu aides les agents sur : relances, visites, mandats, négociation, rédaction d’emails courts, organisation.
Contexte agence : ${ctx}
Règles : français, ton professionnel et concis, pas de promesses légales, oriente vers un conseiller en cas de doute juridique. Pas de markdown excessif : paragraphes et listes courtes si utile.`;

  let reply: string;
  try {
    reply = await callClaudeMessages({
      system,
      messages: parsed.data.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      maxTokens: 2048,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Échec de l’appel IA.";
    return Response.json({ error: message }, { status: 502 });
  }

  return Response.json({ reply });
}
