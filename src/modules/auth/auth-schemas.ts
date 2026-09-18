import { z } from "zod";

import { emailSchema } from "@/shared/validation";

export const passwordSchema = z
  .string()
  .min(12, "Password must contain at least 12 characters.")
  .max(128, "Password must contain at most 128 characters.");

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1).max(128),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
