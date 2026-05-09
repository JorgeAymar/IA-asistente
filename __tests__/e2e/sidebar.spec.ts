import { test, expect } from "@playwright/test"

test.describe("Sidebar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chat")
    await page.waitForSelector("select")
  })

  test("F-05: título 'AI Chat' visible en desktop", async ({ page }) => {
    await expect(page.locator(".hidden.md\\:flex").getByText("AI Chat")).toBeVisible()
  })

  test("F-06: botón nuevo chat navega a /chat limpio", async ({ page }) => {
    // Primero crear una conv
    const ta = page.getByPlaceholder("Envía un mensaje...")
    await ta.fill("Mensaje para F06")
    await ta.press("Enter")
    await page.waitForURL(/\/chat\/.+/, { timeout: 5000 })

    // Click nuevo chat
    await page.locator(".hidden.md\\:flex button[title='Nuevo chat']").click()
    await expect(page).toHaveURL(/\/chat$/)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })

  test("F-07: nueva conversación aparece en sidebar", async ({ page }) => {
    const ta = page.getByPlaceholder("Envía un mensaje...")
    await ta.fill("F07: Di solo SIDEBAR")
    await ta.press("Enter")
    await page.waitForURL(/\/chat\/.+/, { timeout: 5000 })
    // Esperar event conversation-updated
    await page.waitForTimeout(3000)

    const links = page.locator(".hidden.md\\:flex a")
    await expect(links.first()).toBeVisible()
    const count = await links.count()
    expect(count).toBeGreaterThan(0)
  })

  test("F-09: eliminar conversación la quita del sidebar", async ({ page }) => {
    // Crear conv
    const ta = page.getByPlaceholder("Envía un mensaje...")
    await ta.fill("F09: Para eliminar")
    await ta.press("Enter")
    await page.waitForURL(/\/chat\/.+/, { timeout: 5000 })
    await page.waitForTimeout(3000)

    const sidebar = page.locator(".hidden.md\\:flex")
    const firstLink = sidebar.locator("a").first()
    // Capture the href to track this specific conversation
    const href = await firstLink.getAttribute("href")

    // Hover y click delete
    await firstLink.hover()
    await firstLink.locator("button").click()
    await page.waitForTimeout(1000)

    // The deleted conversation should no longer be in the sidebar
    if (href) {
      await expect(sidebar.locator(`a[href="${href}"]`)).not.toBeVisible()
    }
  })

  test("F-11: toggle hamburguesa no visible en desktop", async ({ page }) => {
    const toggle = page.locator("button.md\\:hidden")
    await expect(toggle).not.toBeVisible()
  })

  test("F-12/F-13: mobile — drawer abre y cierra", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const toggle = page.locator("button.md\\:hidden.fixed")
    await expect(toggle).toBeVisible()

    await toggle.click()
    const drawer = page.locator("div.md\\:hidden.fixed.inset-y-0")
    await expect(drawer).toHaveClass(/translate-x-0/)

    // Cerrar con overlay (click outside drawer, right side of 390px screen)
    await page.locator("div.md\\:hidden.fixed.inset-0.z-40").click({ position: { x: 350, y: 400 } })
    await expect(drawer).toHaveClass(/-translate-x-full/)
  })
})
