import { z } from "zod";

export const followupEmailSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  tone: z.string().min(1),
});

export type FollowupEmail = z.infer<typeof followupEmailSchema>;

