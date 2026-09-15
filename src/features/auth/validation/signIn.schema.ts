import { z } from "zod";

export const signInSchema = z.object({
  email: z
    .string()
    .min(1, "El correo es requerido")
    .email("Ingrese un correo electrónico válido"),
  password: z.string().min(1, "La contraseña es requerida"),
  rememberMe: z.boolean().optional(),
});

export type SignInSchema = z.infer<typeof signInSchema>;
