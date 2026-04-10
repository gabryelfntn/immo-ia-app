"use client";

import { createClient } from "@/lib/supabase/client";
import { sanitizeStorageFileName } from "@/lib/storage/sanitize-file-name";
import { registerContactAttachment, deleteContactAttachment } from "./attachment-actions";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Download, Loader2, Trash2, Upload } from "lucide-react";

export type AttachmentRow = {
  id: string;
  storage_path: string;
  file_name: string;
  label: string | null;
};

type Props = {
  contactId: string;
  agencyId: string;
  attachments: AttachmentRow[];
};

export function ContactAttachmentsPanel({
  contactId,
  agencyId,
  attachments,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function download(path: string) {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("contact-files")
      .createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) {
      setErr(error?.message ?? "Lien indisponible.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr(null);

    const max = 12 * 1024 * 1024;
    if (file.size > max) {
      setErr("Fichier trop volumineux (max. 12 Mo).");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const safe = `${crypto.randomUUID()}_${sanitizeStorageFileName(file.name)}`;
      const objectPath = `${agencyId}/${contactId}/${safe}`;

      const { error: upErr } = await supabase.storage
        .from("contact-files")
        .upload(objectPath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "application/octet-stream",
        });

      if (upErr) {
        setErr(upErr.message);
        return;
      }

      const reg = await registerContactAttachment({
        contactId,
        storagePath: objectPath,
        fileName: file.name,
        mimeType: file.type || undefined,
        sizeBytes: file.size,
      });

      if (!reg.ok) {
        await supabase.storage.from("contact-files").remove([objectPath]);
        setErr(reg.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 card-luxury">
      <h2 className="text-lg font-bold text-slate-900">Pièces jointes</h2>
      <p className="mt-1 text-sm text-slate-500">
        PDF, images ou documents (max. 12 Mo). Stockage sécurisé par agence.
      </p>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt"
        onChange={(e) => void onFileChange(e)}
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-stone-400 disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        Ajouter un fichier
      </button>
      {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}
      <ul className="mt-6 space-y-2">
        {attachments.length === 0 ? (
          <li className="text-sm text-slate-500">Aucune pièce jointe.</li>
        ) : (
          attachments.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
            >
              <span className="min-w-0 truncate text-sm font-medium text-slate-800">
                {a.label?.trim() || a.file_name}
              </span>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void download(a.storage_path)}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-white"
                  aria-label="Télécharger"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const r = await deleteContactAttachment(a.id);
                      if (!r.ok) setErr(r.error);
                      else router.refresh();
                    })
                  }
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-rose-300 hover:text-rose-700"
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
