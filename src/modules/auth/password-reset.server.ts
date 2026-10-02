import "server-only";
import { sendPasswordResetEmail } from "@/infrastructure/email/password-reset-email";
import { MongoPasswordResetStore } from "./mongo-password-reset-store";
import { PasswordResetService } from "./password-reset-service";

export const passwordResetService = new PasswordResetService(new MongoPasswordResetStore(), sendPasswordResetEmail);
