import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function buildTextPdf(
  lines: string[],
  title: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595.28, 841.89]);
  let y = 800;
  const size = 11;
  const margin = 50;
  const lineHeight = 14;
  const bottom = 50;

  function newPage() {
    page = doc.addPage([595.28, 841.89]);
    y = 800;
  }

  page.drawText(title, {
    x: margin,
    y,
    size: 16,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 28;

  for (const line of lines) {
    const parts = line.length > 110 ? chunkString(line, 110) : [line];
    for (const p of parts) {
      if (y < bottom + lineHeight) {
        newPage();
      }
      page.drawText(p, {
        x: margin,
        y,
        size,
        font,
        color: rgb(0.15, 0.15, 0.15),
      });
      y -= lineHeight;
    }
  }

  return doc.save();
}

function chunkString(s: string, max: number): string[] {
  const out: string[] = [];
  let rest = s;
  while (rest.length > max) {
    let cut = rest.lastIndexOf(" ", max);
    if (cut < max / 2) cut = max;
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) out.push(rest);
  return out.length ? out : [s];
}
