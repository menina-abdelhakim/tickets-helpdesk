import { expect, test } from '@playwright/test'
import { USERS, login } from './helpers'

/**
 * The happy path the project is judged on:
 * login → create a ticket → comment on it → close it.
 * Each run creates its own ticket so the spec can run in parallel with others.
 */
test('an admin can create, comment on and close a ticket', async ({ page }) => {
  const title = `Panne imprimante étage 3 — ${Date.now()}`

  await login(page, USERS.admin.email)

  // Create
  await page.goto('/tickets/new')
  await page.getByLabel('Titre').fill(title)
  await page
    .getByLabel('Description')
    .fill("L'imprimante du 3e étage n'imprime plus depuis ce matin, voyant orange clignotant.")
  await page.getByLabel('Priorité').selectOption('HIGH')
  await page.getByRole('button', { name: 'Créer le ticket' }).click()

  // Redirected to the detail page of the new ticket
  await page.waitForURL(/\/tickets\/[a-z0-9]+$/)
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  await expect(page.getByTestId('status-badge')).toHaveText('Ouvert')
  await expect(page.getByTestId('unassigned')).toBeVisible()

  // Take charge of it
  await page.getByTestId('assign-to-me').click()
  await expect(page.getByTestId('assignee')).toContainText(USERS.admin.name)

  // Comment
  await expect(page.getByTestId('comment-count')).toHaveText('(0)')
  await page.getByTestId('comment-input').fill('Intervention prévue cet après-midi.')
  await page.getByRole('button', { name: 'Envoyer' }).click()

  await expect(page.getByTestId('comment-count')).toHaveText('(1)')
  await expect(page.getByTestId('comment-list')).toContainText('Intervention prévue cet après-midi.')

  // Close — CLOSED is a legal transition from OPEN.
  // Assert on the badge, not the text: the actions panel also has a button
  // labelled "Clôturé", and matching that would let the next navigation race
  // ahead of the server action.
  await page.getByTestId('status-CLOSED').click()
  await expect(page.getByTestId('status-badge')).toHaveText('Clôturé')

  // And it shows up under the closed filter
  await page.goto('/tickets?status=CLOSED')
  await expect(page.getByTestId('ticket-list')).toContainText(title)
})

test('the create form rejects a description that is too short', async ({ page }) => {
  await login(page, USERS.claire.email)
  await page.goto('/tickets/new')

  await page.getByLabel('Titre').fill('Un titre parfaitement valide')
  // Bypass the browser's minlength so the server-side zod rule is what answers.
  await page.getByLabel('Description').evaluate((el) => {
    const textarea = el as HTMLTextAreaElement
    textarea.setAttribute('minlength', '0')
    textarea.value = 'trop court'
  })
  await page.getByLabel('Description').fill('trop court')
  await page.getByRole('button', { name: 'Créer le ticket' }).click()

  await expect(page.getByTestId('form-error')).toContainText('20 caractères')
})
