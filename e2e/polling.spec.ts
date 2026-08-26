import { expect, test } from '@playwright/test'
import { USERS, login } from './helpers'

/**
 * The feature the brief asks for: a comment written by someone else shows up
 * without a reload. Two independent browser contexts, so this exercises the
 * real poll rather than a local state update.
 */
test('a comment from another user appears without reloading', async ({ browser }) => {
  const reporterContext = await browser.newContext()
  const agentContext = await browser.newContext()

  try {
    const reporterPage = await reporterContext.newPage()
    const agentPage = await agentContext.newPage()

    // The agent opens Claire's VPN ticket and notes its URL.
    await login(agentPage, USERS.agent.email)
    await agentPage.goto('/tickets')
    await agentPage.getByText('VPN').click()
    await agentPage.waitForURL(/\/tickets\/[a-z0-9]+$/)
    const ticketUrl = agentPage.url()

    // Claire sits on the same ticket, and does not touch it again.
    await login(reporterPage, USERS.claire.email)
    await reporterPage.goto(ticketUrl)
    await expect(reporterPage.getByTestId('comment-list')).toBeVisible()

    const message = `Nous intervenons sur votre poste — ${Date.now()}`
    await agentPage.getByTestId('comment-input').fill(message)
    await agentPage.getByRole('button', { name: 'Envoyer' }).click()
    await expect(agentPage.getByTestId('comment-list')).toContainText(message)

    // The poll runs every 10s; allow one full interval plus room for the request.
    await expect(reporterPage.getByTestId('comment-list')).toContainText(message, {
      timeout: 20_000,
    })
  } finally {
    await reporterContext.close()
    await agentContext.close()
  }
})
