import { test, expect } from "@playwright/test"

test.describe("Navegación y redirecciones", () => {
  test("F-01: / redirige a /chat", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/chat/)
  })

  test("F-02: /chat muestra pantalla de bienvenida", async ({ page }) => {
    await page.goto("/chat")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(page.getByRole("heading", { level: 1 })).toContainText("¿En qué puedo ayudarte?")
  })

  test("F-03: /chat/id-inexistente muestra 404", async ({ page }) => {
    await page.goto("/chat/este-id-no-existe-nunca-xyz")
    await expect(page.getByText("404")).toBeVisible()
  })

  test("F-04: /login muestra botón de GitHub", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByRole("button", { name: /github/i })).toBeVisible()
  })
})
