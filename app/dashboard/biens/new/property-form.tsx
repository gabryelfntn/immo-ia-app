"use client";

import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { createProperty, insertPropertyPhotos } from "../actions";
import { createClient } from "@/lib/supabase/client";
import {
  PROPERTY_TYPE_LABELS,
  TRANSACTION_LABELS,
} from "@/lib/properties/labels";
import {
  PROPERTY_TYPES,
  propertyCreateSchema,
  type PropertyCreateInput,
} from "@/lib/properties/schema";

type StagedPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

function sanitizeStorageFileName(name: string): string {
  const trimmed = name.trim() || "image";
  return trimmed.replace(/[^\w.\-]/g, "_").slice(0, 120);
}

function FormSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-6">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-600/90">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      ) : null}
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

export function PropertyForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [stagedPhotos, setStagedPhotos] = useState<StagedPhoto[]>([]);
  const stagedRef = useRef(stagedPhotos);
  stagedRef.current = stagedPhotos;

  useEffect(() => {
    return () => {
      stagedRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  const onDrop = useCallback((accepted: File[]) => {
    setStagedPhotos((prev) => {
      const next = [...prev];
      for (const file of accepted) {
        next.push({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
      return next;
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
    maxSize: 10 * 1024 * 1024,
  });

  function removeStagedPhoto(id: string) {
    setStagedPhotos((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  const form = useForm<PropertyCreateInput>({
    resolver: zodResolver(propertyCreateSchema),
    defaultValues: {
      type: "appartement",
      transaction: "vente",
      title: "",
      price: 0,
      surface: 0,
      rooms: 0,
      bedrooms: 0,
      address: "",
      city: "",
      zip_code: "",
      description: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(data: PropertyCreateInput) {
    setServerError(null);

    const result = await createProperty(data);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }

    const { propertyId, agencyId } = result;
    const supabase = createClient();
    const uploadedPaths: string[] = [];

    try {
      if (stagedPhotos.length > 0) {
        const photoRows: { url: string; is_main: boolean }[] = [];

        for (let i = 0; i < stagedPhotos.length; i++) {
          const { file } = stagedPhotos[i];
          const fileName = `${crypto.randomUUID()}_${sanitizeStorageFileName(file.name)}`;
          const objectPath = `${agencyId}/${propertyId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("property-photos")
            .upload(objectPath, file, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type || "image/jpeg",
            });

          if (uploadError) {
            throw new Error(uploadError.message);
          }

          uploadedPaths.push(objectPath);

          const { data: pub } = supabase.storage
            .from("property-photos")
            .getPublicUrl(objectPath);

          photoRows.push({
            url: pub.publicUrl,
            is_main: i === 0,
          });
        }

        const insertResult = await insertPropertyPhotos(propertyId, photoRows);
        if (!insertResult.ok) {
          throw new Error(insertResult.error);
        }
      }
    } catch (e) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("property-photos").remove(uploadedPaths);
      }
      setServerError(
        e instanceof Error ? e.message : "Échec lors de l’envoi des photos."
      );
      return;
    }

    stagedPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setStagedPhotos([]);

    router.push("/dashboard/biens");
    router.refresh();
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200/90 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-stone-500/50 focus:ring-2 focus:ring-stone-500/20";
  const labelClass =
    "text-xs font-semibold uppercase tracking-wider text-slate-500";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-10 flex flex-col gap-8 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-10"
    >
      <FormSection
        title="Informations principales"
        subtitle="Type de transaction et titre de référence."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="type" className={labelClass}>
              Type de bien
            </label>
            <select id="type" className={inputClass} {...register("type")}>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t} className="bg-white">
                  {PROPERTY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            {errors.type ? (
              <p className="text-xs text-red-400">{errors.type.message}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="transaction" className={labelClass}>
              Transaction
            </label>
            <select
              id="transaction"
              className={inputClass}
              {...register("transaction")}
            >
              <option value="vente" className="bg-white">
                {TRANSACTION_LABELS.vente}
              </option>
              <option value="location" className="bg-white">
                {TRANSACTION_LABELS.location}
              </option>
            </select>
            {errors.transaction ? (
              <p className="text-xs text-red-400">
                {errors.transaction.message}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="title" className={labelClass}>
            Titre de l&apos;annonce
          </label>
          <input
            id="title"
            type="text"
            className={inputClass}
            {...register("title")}
          />
          {errors.title ? (
            <p className="text-xs text-red-400">{errors.title.message}</p>
          ) : null}
        </div>
      </FormSection>

      <FormSection title="Surfaces et volumes">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="price" className={labelClass}>
              Prix (€)
            </label>
            <input
              id="price"
              type="number"
              min={0}
              step={1}
              className={inputClass}
              {...register("price", { valueAsNumber: true })}
            />
            {errors.price ? (
              <p className="text-xs text-red-400">{errors.price.message}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="surface" className={labelClass}>
              Surface (m²)
            </label>
            <input
              id="surface"
              type="number"
              min={0}
              step={1}
              className={inputClass}
              {...register("surface", { valueAsNumber: true })}
            />
            {errors.surface ? (
              <p className="text-xs text-red-400">{errors.surface.message}</p>
            ) : null}
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="rooms" className={labelClass}>
              Nombre de pièces
            </label>
            <input
              id="rooms"
              type="number"
              min={0}
              step={1}
              className={inputClass}
              {...register("rooms", { valueAsNumber: true })}
            />
            {errors.rooms ? (
              <p className="text-xs text-red-400">{errors.rooms.message}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="bedrooms" className={labelClass}>
              Chambres
            </label>
            <input
              id="bedrooms"
              type="number"
              min={0}
              step={1}
              className={inputClass}
              {...register("bedrooms", { valueAsNumber: true })}
            />
            {errors.bedrooms ? (
              <p className="text-xs text-red-400">{errors.bedrooms.message}</p>
            ) : null}
          </div>
        </div>
      </FormSection>

      <FormSection title="Localisation">
        <div className="flex flex-col gap-2">
          <label htmlFor="address" className={labelClass}>
            Adresse
          </label>
          <input
            id="address"
            type="text"
            className={inputClass}
            {...register("address")}
          />
          {errors.address ? (
            <p className="text-xs text-red-400">{errors.address.message}</p>
          ) : null}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="city" className={labelClass}>
              Ville
            </label>
            <input
              id="city"
              type="text"
              className={inputClass}
              {...register("city")}
            />
            {errors.city ? (
              <p className="text-xs text-red-400">{errors.city.message}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="zip_code" className={labelClass}>
              Code postal
            </label>
            <input
              id="zip_code"
              type="text"
              className={inputClass}
              {...register("zip_code")}
            />
            {errors.zip_code ? (
              <p className="text-xs text-red-400">{errors.zip_code.message}</p>
            ) : null}
          </div>
        </div>
      </FormSection>

      <FormSection title="Description">
        <div className="flex flex-col gap-2">
          <label htmlFor="description" className={labelClass}>
            Texte libre
          </label>
          <textarea
            id="description"
            rows={5}
            className={`${inputClass} resize-y`}
            {...register("description")}
          />
          {errors.description ? (
            <p className="text-xs text-red-400">{errors.description.message}</p>
          ) : null}
        </div>
      </FormSection>

      <FormSection
        title="Photos"
        subtitle="La première photo sera l’image principale. Max. 10 Mo par fichier."
      >
        <div
          {...getRootProps()}
          className={`flex min-h-[10rem] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-10 text-center text-sm transition-all duration-300 ${
            isDragActive
              ? "border-stone-600 bg-stone-200/40"
              : "border-slate-200/90 bg-slate-50/90 hover:border-stone-400"
          }`}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <span className="text-stone-800">Déposez les fichiers ici…</span>
          ) : (
            <span className="text-slate-500">
              Glissez-déposez des images ou cliquez pour parcourir
            </span>
          )}
        </div>

        {stagedPhotos.length > 0 ? (
          <ul className="flex flex-wrap gap-3">
            {stagedPhotos.map((p, index) => (
              <li
                key={p.id}
                className="relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200/90 bg-slate-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.previewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
                {index === 0 ? (
                  <span className="absolute left-1 top-1 rounded-md bg-neutral-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Principale
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => removeStagedPhoto(p.id)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow transition-all duration-300 hover:bg-red-500"
                  aria-label="Retirer la photo"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </FormSection>

      {serverError ? (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {serverError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-luxury-primary relative w-full rounded-xl py-4 text-sm font-semibold text-white transition-all duration-300 disabled:cursor-not-allowed sm:flex-1"
        >
          <span className="relative z-10">
            {isSubmitting
              ? stagedPhotos.length > 0
                ? "Création et envoi des photos…"
                : "Enregistrement…"
              : "Créer le bien"}
          </span>
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => router.push("/dashboard/biens")}
          className="w-full rounded-xl border border-slate-200/90 px-4 py-4 text-sm font-semibold text-slate-600 transition-all duration-300 hover:border-white/12 hover:bg-slate-50 sm:w-auto sm:px-8"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
