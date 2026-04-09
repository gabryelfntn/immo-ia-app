type ResendSendEmailResponse =
  | { id: string }
  | { message: string; name?: string; statusCode?: number };

export async function sendEmailWithResend(args: {
  to: string;
  from: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<{ messageId: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error("RESEND_API_KEY manquant.");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: args.to,
      from: args.from,
      subject: args.subject,
      text: args.text,
      reply_to: args.replyTo,
    }),
  });

  const raw = await res.text();
  let data: unknown = null;
  try {
    data = JSON.parse(raw);
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg =
      (data as { message?: string })?.message ??
      raw ??
      `Resend: ${res.status}`;
    throw new Error(`Resend: ${res.status} — ${msg}`);
  }

  const parsed = data as ResendSendEmailResponse;
  if (!parsed || typeof (parsed as { id?: unknown }).id !== "string") {
    throw new Error("Réponse Resend invalide.");
  }

  return { messageId: (parsed as { id: string }).id };
}

