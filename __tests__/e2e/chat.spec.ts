import { test, expect } from "@playwright/test"

test.describe("Chat Input", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chat")
    await page.waitForSelector("select")
  })

  test("F-19: textarea existe", async ({ page }) => {
    await expect(page.getByPlaceholder("Envía un mensaje...")).toBeVisible()
  })

  test("F-21: Shift+Enter añade nueva línea sin enviar", async ({ page }) => {
    const ta = page.getByPlaceholder("Envía un mensaje...")
    await ta.fill("linea1")
    await ta.press("Shift+Enter")
    const value = await ta.inputValue()
    expect(value).toContain("\n")
    // No hubo envío — seguimos en /chat
    await expect(page).toHaveURL(/\/chat$/)
  })

  test("F-22: botón send deshabilitado con textarea vacía", async ({ page }) => {
    // El botón send tiene disabled cuando el textarea está vacío
    const ta = page.getByPlaceholder("Envía un mensaje...")
    await ta.fill("")
    const isDisabled = await page.locator("div.flex.items-end button").evaluate(
      (btn) => (btn as HTMLButtonElement).disabled
    )
    expect(isDisabled).toBe(true)
  })

  test("F-23: quick-prompt card rellena el textarea", async ({ page }) => {
    const card = page.getByRole("button", { name: /explícame/i })
    await card.click()
    const value = await page.getByPlaceholder("Envía un mensaje...").inputValue()
    expect(value).toContain("Explícame")
  })

  test("F-24: textarea crece con texto multilinea", async ({ page }) => {
    const ta = page.getByPlaceholder("Envía un mensaje...")
    const heightBefore = await ta.evaluate((el) => el.scrollHeight)
    await ta.fill("linea1\nlinea2\nlinea3\nlinea4\nlinea5")
    await page.waitForTimeout(100)
    const heightAfter = await ta.evaluate((el) => el.scrollHeight)
    expect(heightAfter).toBeGreaterThan(heightBefore)
  })
})

test.describe("Flujo completo de chat", () => {
  test("F-26/F-27/F-28/F-29: enviar mensaje → streaming → URL cambia", async ({ page }) => {
    await page.goto("/chat")
    await page.waitForSelector("select")

    const ta = page.getByPlaceholder("Envía un mensaje...")
    await ta.fill("Di exactamente esta palabra: FUNCIONA")
    await ta.press("Enter")

    // F-26: burbuja usuario visible (scope to main content to avoid sidebar matches)
    await expect(page.locator("p.whitespace-pre-wrap").filter({ hasText: "Di exactamente esta palabra: FUNCIONA" })).toBeVisible({ timeout: 3000 })

    // F-27: indicador de carga (dots)
    await expect(page.locator("span.animate-bounce").first()).toBeVisible({ timeout: 3000 })

    // F-29: URL cambia a /chat/[id]
    await page.waitForURL(/\/chat\/.+/, { timeout: 10000 })
    expect(page.url()).toMatch(/\/chat\/.+/)

    // F-28: esperar texto de respuesta
    await page.waitForFunction(
      () => document.querySelectorAll("span.animate-bounce").length === 0,
      { timeout: 50000 }
    )
  })

  test("F-30: historial guardado — recarga muestra mensajes", async ({ page }) => {
    await page.goto("/chat")
    await page.waitForSelector("select")

    const ta = page.getByPlaceholder("Envía un mensaje...")
    await ta.fill("F30: Memoria persistente — di PERSISTIDO")
    await ta.press("Enter")
    await page.waitForURL(/\/chat\/.+/, { timeout: 10000 })

    // Esperar respuesta
    await page.waitForFunction(
      () => document.querySelectorAll("span.animate-bounce").length === 0,
      { timeout: 50000 }
    )

    // Recargar
    await page.reload()
    await page.waitForSelector("textarea")

    // Mensajes deben estar visibles
    await expect(page.getByText("F30: Memoria persistente")).toBeVisible({ timeout: 5000 })
  })

  test("F-32: navegar a conversación existente muestra historial", async ({ page }) => {
    // Crear conv
    await page.goto("/chat")
    await page.waitForSelector("select")
    const ta = page.getByPlaceholder("Envía un mensaje...")
    await ta.fill("F32: Historial de conversación — di HISTORIA")
    await ta.press("Enter")
    await page.waitForURL(/\/chat\/.+/, { timeout: 10000 })
    await page.waitForFunction(
      () => document.querySelectorAll("span.animate-bounce").length === 0,
      { timeout: 50000 }
    )
    const convUrl = page.url()

    // Ir a nuevo chat y volver
    await page.goto("/chat")
    await page.goto(convUrl)
    await page.waitForSelector("textarea")

    await expect(page.getByText("F32: Historial de conversación")).toBeVisible({ timeout: 5000 })
  })
})

test.describe("Selector de modelo", () => {
  test("F-14: carga modelos de Ollama en el select", async ({ page }) => {
    await page.goto("/chat")
    await page.waitForSelector("select")
    const options = await page.locator("select option").count()
    expect(options).toBeGreaterThan(0)
  })

  test("F-15: primer modelo por defecto es kimi-k2.6:cloud", async ({ page }) => {
    await page.goto("/chat")
    await page.waitForSelector("select")
    const value = await page.locator("select").inputValue()
    expect(value).toBe("kimi-k2.6:cloud")
  })

  test("F-16: cambiar modelo funciona", async ({ page }) => {
    await page.goto("/chat")
    await page.waitForSelector("select")
    await page.locator("select").selectOption("deepseek-v4-flash:cloud")
    const value = await page.locator("select").inputValue()
    expect(value).toBe("deepseek-v4-flash:cloud")
  })

  test("F-17: badge de modelo aparece en respuesta AI", async ({ page }) => {
    await page.goto("/chat")
    await page.waitForSelector("select")

    const ta = page.getByPlaceholder("Envía un mensaje...")
    await ta.fill("Di solo: BADGE")
    await ta.press("Enter")
    await page.waitForURL(/\/chat\/.+/, { timeout: 10000 })
    await page.waitForFunction(
      () => document.querySelectorAll("span.animate-bounce").length === 0,
      { timeout: 50000 }
    )

    // Badge debe mostrar el modelo seleccionado
    const badge = page.locator("span.font-mono").first()
    await expect(badge).toBeVisible({ timeout: 5000 })
    const text = await badge.textContent()
    expect(text).toContain("cloud")
  })
})
