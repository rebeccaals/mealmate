import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
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
