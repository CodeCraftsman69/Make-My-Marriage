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

export const forgotPasswordSchema = z.object({ email: emailSchema }).strict();
export const resetTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/, "This reset link is invalid. Request a new one.");
export const resetPasswordSchema = z.object({ token: resetTokenSchema, password: passwordSchema }).strict();
