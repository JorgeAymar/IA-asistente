/**
 * Unit tests for /api/models
 * Tests: U-21, U-22
 */
export {}
const BASE = "http://localhost:3000"

describe("U-21 — GET /api/models con Ollama activo", () => {
  test("retorna array de strings no vacío", async () => {
    const res = await fetch(`${BASE}/api/models`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
    for (const model of data) {
      expect(typeof model).toBe("string")
      expect(model.length).toBeGreaterThan(0)
    }
  })

  test("todos los modelos tienen nombre con formato válido", async () => {
    const res = await fetch(`${BASE}/api/models`)
    const data: string[] = await res.json()
    for (const model of data) {
      // Formato esperado: "nombre:tag" o "nombre"
      expect(model).toMatch(/^[\w\.\-]+(:[\w\.\-]+)?$/)
    }
  })

  test("incluye modelos conocidos de Ollama", async () => {
    const res = await fetch(`${BASE}/api/models`)
    const data: string[] = await res.json()
    const known = ["kimi-k2.6:cloud", "deepseek-v4-flash:cloud", "gpt-oss:20b-cloud"]
    const hasKnown = known.some((k) => data.includes(k))
    expect(hasKnown).toBe(true)
  })
})

describe("U-22 — /api/models estructura de respuesta", () => {
  test("Content-Type es application/json", async () => {
    const res = await fetch(`${BASE}/api/models`)
    expect(res.headers.get("content-type")).toContain("application/json")
  })

  test("respuesta es parseable como JSON", async () => {
    const res = await fetch(`${BASE}/api/models`)
    const text = await res.text()
    expect(() => JSON.parse(text)).not.toThrow()
    const data = JSON.parse(text)
    expect(Array.isArray(data)).toBe(true)
  })
})
