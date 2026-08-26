import { expect, test } from '@playwright/test'
import { USERS, login } from './helpers'

/**
 * Visibility rules: a reporter sees only their own tickets, and cannot act on
 * the workflow. These are the assertions that make the role model meaningful.
 */
test('a reporter sees only their own tickets', async ({ page }) => {
  await login(page, USERS.claire.email)
  await page.goto('/tickets')

  // Seeded: Claire opened the VPN ticket, Samir opened the billing outage.
  await expect(page.getByTestId('ticket-list')).toContainText('VPN')
  await expect(page.getByTestId('ticket-list')).not.toContainText('Serveur de facturation')
})

/**
 * Global setup reseeds before the suite, and no other spec touches Samir's
 * tickets, so his scoped counts are stable even under parallel execution.
 * Asserting the agent's global counts here instead would race with any spec
 * that creates a ticket.
 */
test('dashboard counts are scoped to what the reporter may see', async ({ page }) => {
  await login(page, USERS.samir.email)

  // Seeded for Samir: 1 OPEN, 1 IN_PROGRESS, 1 RESOLVED, 0 CLOSED.
  await expect(page.getByTestId('count-OPEN')).toContainText('1')
  await expect(page.getByTestId('count-IN_PROGRESS')).toContainText('1')
  await expect(page.getByTestId('count-RESOLVED')).toContainText('1')
  await expect(page.getByTestId('count-CLOSED')).toContainText('0')
})

test('an agent sees every ticket', async ({ page }) => {
  await login(page, USERS.agent.email)
  await page.goto('/tickets')

  await expect(page.getByTestId('ticket-list')).toContainText('VPN')
  await expect(page.getByTestId('ticket-list')).toContainText('Serveur de facturation')
})

test("a reporter cannot open someone else's ticket", async ({ page }) => {
  // Find the id of a ticket Claire did not create, as an agent.
  await login(page, USERS.agent.email)
  await page.goto('/tickets')
  await page.getByText('Serveur de facturation').click()
  await page.waitForURL(/\/tickets\/[a-z0-9]+$/)
  const foreignTicketUrl = page.url()

  // Then try to reach it as Claire.
  await page.getByRole('button', { name: 'Déconnexion' }).click()
  await page.waitForURL(/\/login/)
  await login(page, USERS.claire.email)

  const response = await page.goto(foreignTicketUrl)
  expect(response?.status()).toBe(404)
})

test('a reporter is not offered agent actions on their own ticket', async ({ page }) => {
  await login(page, USERS.claire.email)
  await page.goto('/tickets')
  await page.getByText('VPN').click()
  await page.waitForURL(/\/tickets\/[a-z0-9]+$/)

  await expect(page.getByTestId('assign-to-me')).toHaveCount(0)
  await expect(page.getByTestId('status-CLOSED')).toHaveCount(0)
  // But they can still take part in the discussion.
  await expect(page.getByTestId('comment-input')).toBeVisible()
})
