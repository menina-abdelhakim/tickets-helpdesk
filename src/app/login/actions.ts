'use server'

import { AuthError } from 'next-auth'
import { signIn } from '@/auth'

export type LoginState = { error?: string }

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/',
    })
    return {}
  } catch (error) {
    // signIn signals a successful redirect by throwing NEXT_REDIRECT, which
    // must bubble up. Only real auth failures are turned into a message.
    if (error instanceof AuthError) {
      return { error: 'Email ou mot de passe incorrect.' }
    }
    throw error
  }
}
