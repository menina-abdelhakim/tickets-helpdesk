import { expect, test } from '@playwright/test'
import { USERS, login } from './helpers'

test.describe('audit trail', () => {
  test('records creation, assignment and status changes on the timeline', async ({ page }) => {
    const title = `Badge d’accès inopérant — ${Date.now()}`

    await login(page, USERS.admin.email)
    await page.goto('/tickets/new')
    await page.getByLabel('Titre').fill(title)
    await page
      .getByLabel('Description')
      .fill("Mon badge n'ouvre plus la porte du 2e étage depuis ce matin.")
    await page.getByRole('button', { name: 'Créer le ticket' }).click()
    await page.waitForURL(/\/tickets\/[a-z0-9]+$/)

    // Creation is recorded straight away.
    await expect(page.getByTestId('timeline-event').first()).toContainText('a ouvert le ticket')

    await page.getByTestId('assign-to-me').click()
    await expect(page.getByTestId('timeline-event').nth(1)).toContainText('pris le ticket en charge')

    await page.getByTestId('status-IN_PROGRESS').click()
    await expect(page.getByTestId('timeline-event').nth(2)).toContainText('a changé le statut')
    await expect(page.getByTestId('timeline-event').nth(2)).toContainText('En cours')

    // The trail survives a reload: it is stored, not derived from client state.
    await page.reload()
    await expect(page.getByTestId('timeline-event')).toHaveCount(3)
  })
})

test.describe('full-text search', () => {
  test('ignores accents and matches word variants', async ({ page }) => {
    await login(page, USERS.agent.email)

    // "ecran" without the accent must still find "Écran externe…".
    await page.goto('/tickets?q=ecran')
    await expect(page.getByTestId('ticket-list')).toContainText('Écran externe')

    // Stemming: the plural finds the singular in the title.
    await page.goto('/tickets?q=licences')
    await expect(page.getByTestId('ticket-list')).toContainText('Licence Office')
  })

  test('searches descriptions, not only titles', async ({ page }) => {
    await login(page, USERS.agent.email)
    // This word appears only in the VPN ticket's description.
    await page.goto('/tickets?q=wifi')
    await expect(page.getByTestId('ticket-list')).toContainText('VPN')
  })

  test('shows an empty state when nothing matches', async ({ page }) => {
    await login(page, USERS.agent.email)
    await page.goto('/tickets?q=zzzzintrouvable')
    await expect(page.getByTestId('empty-state')).toBeVisible()
  })

  test('never lets a search widen what a reporter may see', async ({ page }) => {
    // "facturation" matches a ticket Samir opened; Claire must not find it.
    await login(page, USERS.claire.email)
    await page.goto('/tickets?q=facturation')
    await expect(page.getByTestId('empty-state')).toBeVisible()
  })
})

test.describe('sorting', () => {
  test('sorts by priority, most urgent first', async ({ page }) => {
    await login(page, USERS.agent.email)
    await page.goto('/tickets?sort=priority&dir=desc')

    const first = page.getByTestId('ticket-list').locator('li').first()
    await expect(first).toContainText('Urgente')
  })

  test('keeps the active filter when sorting', async ({ page }) => {
    await login(page, USERS.agent.email)
    await page.goto('/tickets?status=OPEN')
    await page.getByRole('link', { name: /Priorité/ }).click()

    await expect(page).toHaveURL(/status=OPEN/)
    await expect(page).toHaveURL(/sort=priority/)
  })
})

test.describe('rate limiting', () => {
  test('blocks a burst of ticket creation', async ({ page }) => {
    await login(page, USERS.samir.email)

    // The limit is 5 per 10 minutes; the sixth must be refused.
    for (let i = 1; i <= 6; i++) {
      await page.goto('/tickets/new')
      await page.getByLabel('Titre').fill(`Demande automatique numéro ${i}`)
      await page
        .getByLabel('Description')
        .fill('Contenu généré pour vérifier la limite de création de tickets.')
      await page.getByRole('button', { name: 'Créer le ticket' }).click()

      if (i < 6) {
        await page.waitForURL(/\/tickets\/[a-z0-9]+$/)
      }
    }

    await expect(page.getByTestId('form-error')).toContainText('Trop de tickets')
  })
})
