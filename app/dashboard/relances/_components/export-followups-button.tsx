"use client";

import { Download } from "lucide-react";
import { useState } from "react";

export function ExportFollowupsButton() {
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      const r = await fetch("/api/export-followups-csv");
      if (!r.ok) {
        const text = await r.text();
        window.alert(text || "Export impossible.");
        return;
      }
      const blob = await r.blob();
      const cd = r.headers.get("Content-Disposition");
      let name = `relances-${new Date().toISOString().slice(0, 10)}.csv`;
      const m = cd?.match(/filename="([^"]+)"/);
      if (m?.[1]) name = m[1];
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:border-emerald-500/35 hover:bg-emerald-500/10 hover:text-emerald-800 disabled:opacity-50"
    >
      <Download className="h-4 w-4 text-emerald-400" />
      {busy ? "Export…" : "Exporter CSV"}
    </button>
  );
}
