import { z } from "zod";
const name = z.string().trim().min(2, "Enter at least two characters.").max(100);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a wedding date.").refine(value => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Choose a valid calendar date.");
const location = z.string().trim().max(100);
const title = z.string().trim().min(2).max(150);
export const createWeddingSchema = z.object({
  brideName: name, groomName: name, weddingDate: date,
  city: location.default(""), state: location.default(""),
  relationship: z.enum(["BRIDE", "GROOM", "OTHER"]),
  title: title.optional(), description: z.string().trim().max(2000).optional(),
}).strict();
export const updateWeddingSchema = z.object({
  brideName: name.optional(), groomName: name.optional(), weddingDate: date.optional(),
  city: location.optional(), state: location.optional(), title: title.optional(),
  description: z.string().trim().max(2000).nullable().optional(),
}).strict().refine(value => Object.values(value).some(field => field !== undefined), "At least one field is required.");
export type CreateWeddingInput = z.infer<typeof createWeddingSchema>;
export type UpdateWeddingInput = z.infer<typeof updateWeddingSchema>;
