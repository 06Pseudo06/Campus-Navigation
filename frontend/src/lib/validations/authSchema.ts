import { z } from "zod";
import { FormErrors } from "@/types/auth";

/**
 * Login Validation Schema
 * - Email: required, valid email format
 * - Password: required, minimum 6 characters
 * - Remember me: optional boolean
 */
export const loginSchema = z.object({
  email: z
    .string({ message: "Email address is required." })
    .trim()
    .min(1, { message: "Email address is required." })
    .email({ message: "Please enter a valid email address." }),
  password: z
    .string({ message: "Password is required." })
    .min(1, { message: "Password is required." })
    .min(6, { message: "Password must be at least 6 characters." }),
  rememberMe: z.boolean().default(false),
});

export type LoginSchema = z.infer<typeof loginSchema>;

/**
 * Signup Validation Schema
 * - Full Name: required
 * - Email: required, valid email format
 * - Password: required, minimum 8 characters
 * - Confirm Password: required, must match password
 */
export const signupSchema = z
  .object({
    fullName: z
      .string({ message: "Full name is required." })
      .trim()
      .min(1, { message: "Full name is required." }),
    email: z
      .string({ message: "Email address is required." })
      .trim()
      .min(1, { message: "Email address is required." })
      .email({ message: "Please enter a valid email address." }),
    password: z
      .string({ message: "Password is required." })
      .min(1, { message: "Password is required." })
      .min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z
      .string({ message: "Confirm password is required." })
      .min(1, { message: "Confirm password is required." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SignupSchema = z.infer<typeof signupSchema>;

/**
 * Converts a ZodError into the application's existing FormErrors structure.
 * Preserves the first (highest priority) error message per field without overwriting.
 */
export function formatZodErrors(error: z.ZodError): FormErrors {
  const formatted: FormErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as keyof FormErrors;
    if (field && !formatted[field]) {
      formatted[field] = issue.message;
    }
  }
  return formatted;
}
