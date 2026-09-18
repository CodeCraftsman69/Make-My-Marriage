import "server-only";

import { z } from "zod";

const optionalString = (schema: z.ZodString = z.string()) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),

  MONGODB_URI: optionalString(z.string().min(1)),
  MONGODB_DB_NAME: optionalString(z.string().min(1)),

  SESSION_SECRET: optionalString(z.string().min(32)),

  R2_ACCOUNT_ID: optionalString(z.string().min(1)),
  R2_ACCESS_KEY_ID: optionalString(z.string().min(1)),
  R2_SECRET_ACCESS_KEY: optionalString(z.string().min(1)),
  R2_PRIVATE_BUCKET: optionalString(z.string().min(1)),
  R2_PUBLIC_BUCKET: optionalString(z.string().min(1)),
  R2_PUBLIC_BASE_URL: optionalString(z.string().url()),

  RESEND_API_KEY: optionalString(z.string().min(1)),
  EMAIL_FROM: optionalString(z.string().min(3)),
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  const variables = parsedEnvironment.error.issues
    .map((issue) => issue.path.join("."))
    .filter(Boolean)
    .join(", ");

  throw new Error(`Invalid server environment configuration${variables ? `: ${variables}` : "."}`);
}

export const env = Object.freeze(parsedEnvironment.data);

const mongoConfigSchema = z.object({
  uri: z.string().min(1),
  databaseName: z.string().min(1),
});

export function getMongoConfig() {
  const result = mongoConfigSchema.safeParse({
    uri: env.MONGODB_URI,
    databaseName: env.MONGODB_DB_NAME,
  });

  if (!result.success) {
    throw new Error("MongoDB is not configured. Set MONGODB_URI and MONGODB_DB_NAME.");
  }

  return result.data;
}
