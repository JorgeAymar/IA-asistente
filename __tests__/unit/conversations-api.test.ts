/**
 * Unit tests for /api/conversations and /api/conversations/[id]
 * Tests: U-15 to U-20
 */
export {}
const BASE = "http://localhost:3000"

async function createConversationViaChat(msg: string) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: msg }],
      conversationId: null,
      model: "deepseek-v4-flash:cloud",
    }),
  })
  const reader = res.body!.getReader()
  const dec = new TextDecoder()
  let convId: string | null = null
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    for (const line of dec.decode(value, { stream: true }).split("\n")) {
      if (!line.startsWith("data: ")) continue
      try {
        const p = JSON.parse(line.slice(6))
        if (p.type === "conversation_id") { convId = p.id; break }
      } catch { /* */ }
    }
    if (convId) { reader.cancel(); break }
  }
  return convId!
}

describe("U-15 — GET /api/conversations retorna array", () => {
  test("responde 200 con array JSON", async () => {
    const res = await fetch(`${BASE}/api/conversations`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })
})

describe("U-16 — GET /api/conversations orden desc por updatedAt", () => {
  test("primera conv es más reciente", async () => {
    const res = await fetch(`${BASE}/api/conversations`)
    const data: { updatedAt: string }[] = await res.json()
    if (data.length < 2) return // skip if not enough data

    const first = new Date(data[0].updatedAt).getTime()
    const second = new Date(data[1].updatedAt).getTime()
    expect(first).toBeGreaterThanOrEqual(second)
  })
})

describe("U-17 — GET /api/conversations/[id] conv válida", () => {
  let convId: string

  beforeAll(async () => {
    convId = await createConversationViaChat("TEST U17: Di solo VALIDO")
  }, 35000)

  test("retorna conv con messages ordenados asc", async () => {
    const res = await fetch(`${BASE}/api/conversations/${convId}`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty("id", convId)
    expect(Array.isArray(data.messages)).toBe(true)
    expect(data.messages.length).toBeGreaterThan(0)

    // Verificar orden asc
    for (let i = 1; i < data.messages.length; i++) {
      const prev = new Date(data.messages[i - 1].createdAt).getTime()
      const curr = new Date(data.messages[i].createdAt).getTime()
      expect(prev).toBeLessThanOrEqual(curr)
    }
  })
})

describe("U-18 — GET /api/conversations/[id] id inválido", () => {
  test("retorna 404 para id que no existe", async () => {
    const res = await fetch(`${BASE}/api/conversations/id-que-no-existe-xyz123`)
    expect(res.status).toBe(404)
  })
})

describe("U-19/U-20 — DELETE /api/conversations/[id]", () => {
  let convId: string

  beforeAll(async () => {
    convId = await createConversationViaChat("TEST U19: Di solo BORRAR")
  }, 35000)

  test("U-19: DELETE retorna 204 y elimina la conv", async () => {
    const deleteRes = await fetch(`${BASE}/api/conversations/${convId}`, {
      method: "DELETE",
    })
    expect(deleteRes.status).toBe(204)

    // Verificar que ya no existe
    const getRes = await fetch(`${BASE}/api/conversations/${convId}`)
    expect(getRes.status).toBe(404)
  })

  test("U-20: DELETE idempotente — 2do delete no falla", async () => {
    const res = await fetch(`${BASE}/api/conversations/${convId}`, {
      method: "DELETE",
    })
    expect(res.status).toBe(204)
  })
})
