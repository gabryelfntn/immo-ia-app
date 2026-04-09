"use client";

import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { createContact } from "../actions";
import {
  CONTACT_STATUSES,
  CONTACT_TYPES,
  contactCreateSchema,
  type ContactCreateInput,
} from "@/lib/contacts/schema";
import {
  CONTACT_STATUS_LABELS,
  CONTACT_TYPE_LABELS,
} from "@/lib/contacts/labels";

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
    <section className="rounded-2xl border border-white/[0.08] bg-[#0a0a0f]/50 p-6">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500/90">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-1 text-sm text-zinc-600">{subtitle}</p>
      ) : null}
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

export function ContactForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ContactCreateInput>({
    resolver: zodResolver(contactCreateSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      type: "prospect",
      status: "froid",
      budget_min: undefined,
      budget_max: undefined,
      desired_city: "",
      notes: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(data: ContactCreateInput) {
    setServerError(null);
    const result = await createContact(data);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    router.push("/dashboard/contacts");
    router.refresh();
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#0a0a0f] px-4 py-3 text-sm text-zinc-100 outline-none transition-all duration-300 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20";
  const labelClass =
    "text-xs font-semibold uppercase tracking-wider text-zinc-500";

  const numberSetValueAs = (v: unknown) =>
    v === "" || v === null || v === undefined ? undefined : Number(v);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-10 flex flex-col gap-8 rounded-2xl border border-white/[0.08] bg-[#12121a] p-6 sm:p-10"
    >
      <FormSection title="Identité">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="first_name" className={labelClass}>
              Prénom
            </label>
            <input
              id="first_name"
              type="text"
              autoComplete="given-name"
              className={inputClass}
              {...register("first_name")}
            />
            {errors.first_name ? (
              <p className="text-xs text-red-400">{errors.first_name.message}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="last_name" className={labelClass}>
              Nom
            </label>
            <input
              id="last_name"
              type="text"
              autoComplete="family-name"
              className={inputClass}
              {...register("last_name")}
            />
            {errors.last_name ? (
              <p className="text-xs text-red-400">{errors.last_name.message}</p>
            ) : null}
          </div>
        </div>
      </FormSection>

      <FormSection title="Coordonnées">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className={labelClass}>
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={inputClass}
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-xs text-red-400">{errors.email.message}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="phone" className={labelClass}>
              Téléphone
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              className={inputClass}
              {...register("phone")}
            />
            {errors.phone ? (
              <p className="text-xs text-red-400">{errors.phone.message}</p>
            ) : null}
          </div>
        </div>
      </FormSection>

      <FormSection title="Qualification CRM">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="type" className={labelClass}>
              Type
            </label>
            <select id="type" className={inputClass} {...register("type")}>
              {CONTACT_TYPES.map((t) => (
                <option key={t} value={t} className="bg-[#12121a]">
                  {CONTACT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            {errors.type ? (
              <p className="text-xs text-red-400">{errors.type.message}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="status" className={labelClass}>
              Statut
            </label>
            <select id="status" className={inputClass} {...register("status")}>
              {CONTACT_STATUSES.map((s) => (
                <option key={s} value={s} className="bg-[#12121a]">
                  {CONTACT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            {errors.status ? (
              <p className="text-xs text-red-400">{errors.status.message}</p>
            ) : null}
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Critères optionnels"
        subtitle="Budget et zone géographique souhaités."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="budget_min" className={labelClass}>
              Budget min. (€){" "}
              <span className="font-normal normal-case text-zinc-600">
                optionnel
              </span>
            </label>
            <input
              id="budget_min"
              type="number"
              min={0}
              step={1}
              className={inputClass}
              {...register("budget_min", { setValueAs: numberSetValueAs })}
            />
            {errors.budget_min ? (
              <p className="text-xs text-red-400">{errors.budget_min.message}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="budget_max" className={labelClass}>
              Budget max. (€){" "}
              <span className="font-normal normal-case text-zinc-600">
                optionnel
              </span>
            </label>
            <input
              id="budget_max"
              type="number"
              min={0}
              step={1}
              className={inputClass}
              {...register("budget_max", { setValueAs: numberSetValueAs })}
            />
            {errors.budget_max ? (
              <p className="text-xs text-red-400">{errors.budget_max.message}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="desired_city" className={labelClass}>
            Ville recherchée{" "}
            <span className="font-normal normal-case text-zinc-600">
              optionnel
            </span>
          </label>
          <input
            id="desired_city"
            type="text"
            className={inputClass}
            {...register("desired_city")}
          />
          {errors.desired_city ? (
            <p className="text-xs text-red-400">
              {errors.desired_city.message}
            </p>
          ) : null}
        </div>
      </FormSection>

      <FormSection title="Notes internes">
        <div className="flex flex-col gap-2">
          <label htmlFor="notes" className={labelClass}>
            Notes{" "}
            <span className="font-normal normal-case text-zinc-600">
              optionnel
            </span>
          </label>
          <textarea
            id="notes"
            rows={4}
            className={`${inputClass} resize-y`}
            {...register("notes")}
          />
          {errors.notes ? (
            <p className="text-xs text-red-400">{errors.notes.message}</p>
          ) : null}
        </div>
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
            {isSubmitting ? "Enregistrement…" : "Créer le contact"}
          </span>
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => router.push("/dashboard/contacts")}
          className="w-full rounded-xl border border-white/10 px-4 py-4 text-sm font-semibold text-zinc-300 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04] sm:w-auto sm:px-8"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
