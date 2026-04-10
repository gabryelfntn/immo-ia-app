function icsEscapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r/g, "");
}

function formatIcsUtcStamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

export function buildVisitReportIcs(args: {
  id: string;
  visitDate: string;
  summary: string;
  propertyTitle: string;
  propertyCity: string;
  contactName: string;
}): string {
  const datePart = args.visitDate.slice(0, 10).replace(/-/g, "");
  const stamp = formatIcsUtcStamp(new Date());
  const title = `Visite — ${args.propertyTitle}${args.propertyCity ? ` (${args.propertyCity})` : ""}`;
  const desc = [
    `Client : ${args.contactName}`,
    "",
    args.summary,
  ].join("\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ImmoAI//FR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${args.id}@immoai.local`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${datePart}`,
    `SUMMARY:${icsEscapeText(title)}`,
    `DESCRIPTION:${icsEscapeText(desc)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
