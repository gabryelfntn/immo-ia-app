import { z } from "zod";

export const PROPERTY_TYPES = [
  "appartement",
  "maison",
  "terrain",
  "commerce",
  "bureau",
] as const;

export const PROPERTY_STATUSES = [
  "disponible",
  "sous_compromis",
  "vendu",
  "loue",
] as const;

export const propertyTypeEnum = z.enum(PROPERTY_TYPES);

export const transactionEnum = z.enum(["vente", "location"]);

export const propertyStatusEnum = z.enum(PROPERTY_STATUSES);

export const propertyCreateSchema = z.object({
  type: propertyTypeEnum,
  transaction: transactionEnum,
  title: z
    .string()
    .min(1, "Le titre est requis.")
    .max(200, "Le titre est trop long."),
  price: z.coerce
    .number({ invalid_type_error: "Prix invalide." })
    .nonnegative("Le prix doit être positif ou nul."),
  surface: z.coerce
    .number({ invalid_type_error: "Surface invalide." })
    .nonnegative("La surface doit être positive ou nulle."),
  rooms: z.coerce
    .number({ invalid_type_error: "Nombre de pièces invalide." })
    .int()
    .nonnegative(),
  bedrooms: z.coerce
    .number({ invalid_type_error: "Nombre de chambres invalide." })
    .int()
    .nonnegative(),
  address: z.string().min(1, "L'adresse est requise."),
  city: z.string().min(1, "La ville est requise."),
  zip_code: z.string().min(1, "Le code postal est requis."),
  description: z.string().optional(),
});

export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;

export type PropertyType = z.infer<typeof propertyTypeEnum>;
export type PropertyStatus = z.infer<typeof propertyStatusEnum>;
export type PropertyTransaction = z.infer<typeof transactionEnum>;
