import { expect, test } from '@playwright/test'
import { PASSWORD, USERS } from './helpers'

test('an unauthenticated visitor is redirected to the login page', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible()
})

test('an agent can log in and lands on the dashboard', async ({ page }) => {
  await page.goto('/login')

  await page.getByLabel('Email').fill(USERS.agent.email)
  await page.getByLabel('Mot de passe').fill(PASSWORD)
  await page.getByRole('button', { name: 'Se connecter' }).click()

  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible()
  const currentUser = page.getByTestId('current-user')
  await expect(currentUser).toContainText(USERS.agent.name)
  await expect(currentUser).toContainText('Agent support')
})

test('a wrong password shows an error and stays on the login page', async ({ page }) => {
  await page.goto('/login')

  await page.getByLabel('Email').fill(USERS.agent.email)
  await page.getByLabel('Mot de passe').fill('wrong-password')
  await page.getByRole('button', { name: 'Se connecter' }).click()

  await expect(page.getByTestId('login-error')).toContainText('incorrect')
  await expect(page).toHaveURL(/\/login/)
})

test('signing out returns to the login page and protects the dashboard again', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(USERS.agent.email)
  await page.getByLabel('Mot de passe').fill(PASSWORD)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.waitForURL('/')

  await page.getByRole('button', { name: 'Déconnexion' }).click()
  await page.waitForURL(/\/login/)

  await page.goto('/')
  await expect(page).toHaveURL(/\/login$/)
})
