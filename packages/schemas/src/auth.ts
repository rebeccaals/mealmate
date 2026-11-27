import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Ugyldig e-postadresse'),
  password: z.string().min(8, 'Passordet må ha minst 8 tegn'),
})

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    displayName: z.string(),
  }),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type AuthResponse = z.infer<typeof AuthResponseSchema>
