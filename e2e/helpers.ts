import type { Page } from '@playwright/test'

export const PASSWORD = 'demo1234'

export const USERS = {
  admin: { email: 'admin@tickets.dev', name: 'Nadia Bensalem' },
  agent: { email: 'agent@tickets.dev', name: 'Marc Lefèvre' },
  claire: { email: 'claire@tickets.dev', name: 'Claire Fontaine' },
  samir: { email: 'samir@tickets.dev', name: 'Samir Haddad' },
} as const

export async function login(page: Page, email: string): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mot de passe').fill(PASSWORD)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.waitForURL('/')
}
