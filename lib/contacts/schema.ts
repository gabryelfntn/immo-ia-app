import { z } from "zod";

export const CONTACT_TYPES = [
  "prospect",
  "acheteur",
  "vendeur",
  "locataire",
  "proprietaire",
] as const;

export const CONTACT_STATUSES = ["froid", "tiede", "chaud", "client"] as const;

export const PIPELINE_STAGES = [
  "premier_contact",
  "qualifie",
  "visite",
  "offre",
  "signature",
  "fidelisation",
] as const;

export const contactTypeEnum = z.enum(CONTACT_TYPES);

export const contactStatusEnum = z.enum(CONTACT_STATUSES);

export const pipelineStageEnum = z.enum(PIPELINE_STAGES);

const emptyToUndefined = (val: unknown) =>
  val === "" || val === null || val === undefined ? undefined : val;

const optionalNonNegativeNumber = z.preprocess(
  emptyToUndefined,
  z.coerce.number({ invalid_type_error: "Nombre invalide." }).nonnegative().optional()
);

export const contactCreateSchema = z
  .object({
    first_name: z.string().min(1, "Le prénom est requis.").max(120),
    last_name: z.string().min(1, "Le nom est requis.").max(120),
    email: z.string().min(1, "L’e-mail est requis.").email("E-mail invalide."),
    phone: z.string().min(1, "Le téléphone est requis.").max(40),
    type: contactTypeEnum,
    status: contactStatusEnum,
    budget_min: optionalNonNegativeNumber,
    budget_max: optionalNonNegativeNumber,
    desired_city: z
      .string()
      .max(200)
      .optional()
      .transform((s) => (s?.trim() ? s.trim() : undefined)),
    notes: z
      .string()
      .max(10000)
      .optional()
      .transform((s) => (s?.trim() ? s.trim() : undefined)),
    pipeline_stage: pipelineStageEnum.optional().default("premier_contact"),
    prospecting_consent: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (
      data.budget_min != null &&
      data.budget_max != null &&
      data.budget_max < data.budget_min
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le budget max. doit être supérieur ou égal au budget min.",
        path: ["budget_max"],
      });
    }
  });

export type ContactCreateInput = z.infer<typeof contactCreateSchema>;

export type ContactType = z.infer<typeof contactTypeEnum>;
export type ContactStatus = z.infer<typeof contactStatusEnum>;
export type PipelineStage = z.infer<typeof pipelineStageEnum>;
