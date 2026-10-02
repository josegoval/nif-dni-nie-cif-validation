import { z } from "zod";

// The schema of the sign-up form. The form library (React Hook Form with
// zodResolver) shows each issue's message next to its field.
export const signupSchema = z.object({
  name: z.string().trim().min(1, "Enter your name"),
  email: z.email("Enter a valid email address"),
});

export type SignupForm = z.infer<typeof signupSchema>;
