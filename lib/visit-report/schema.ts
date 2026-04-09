import { z } from "zod";

export const visitReportContentSchema = z.object({
  summary: z.string().min(1),
  positivePoints: z.array(z.string()),
  negativePoints: z.array(z.string()),
  clientInterest: z.enum(["fort", "moyen", "faible"]),
  recommendation: z.string().min(1),
  nextStep: z.string().min(1),
});

export type VisitReportContent = z.infer<typeof visitReportContentSchema>;
