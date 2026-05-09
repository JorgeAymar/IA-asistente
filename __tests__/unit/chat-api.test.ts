/**
 * Unit tests for /api/chat and guest user logic
 * Tests: U-08 to U-14
 */
export {}
const BASE = "http://localhost:3000"

async function getGuestConversations(): Promise<{ id: string; title: string }[]> {
  const res = await fetch(`${BASE}/api/conversations`)
  return res.json()
}

async function sendChat(message: string, conversationId?: string, model = "deepseek-v4-flash:cloud") {
  const messages = [{ role: "user", content: message }]
  if (conversationId) {
    // fetch history first to build proper context
  }
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, conversationId: conversationId ?? null, model }),
  })
  return res
}

async function readSSE(res: Response): Promise<{ convId: string | null; text: string }> {
  const reader = res.body!.getReader()
  const dec = new TextDecoder()
  let convId: string | null = null
  let text = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const lines = dec.decode(value, { stream: true }).split("\n")
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      const raw = line.slice(6).trim()
      if (raw === "[DONE]") break
      try {
        const p = JSON.parse(raw)
        if (p.type === "conversation_id") convId = p.id
        if (p.type === "text") text += p.text
      } catch { /* partial */ }
    }
  }
  return { convId, text }
}

describe("U-08 — Primera conversación crea conv en BD", () => {
  test("SSE emite conversation_id para conv nueva", async () => {
    const res = await sendChat("TEST U08: Di solo la palabra INICIO")
    expect(res.status).toBe(200)
    const { convId, text } = await readSSE(res)
    expect(convId).toBeTruthy()
    expect(typeof convId).toBe("string")
    expect(text.length).toBeGreaterThan(0)
  }, 60000)
})

describe("U-09/U-10 — Mensajes se guardan en BD", () => {
  let convId: string

  test("U-09: mensaje usuario guardado, U-10: respuesta asistente guardada", async () => {
    const res = await sendChat("TEST U09-U10: Di exactamente: GUARDADO")
    const { convId: id } = await readSSE(res)
    expect(id).toBeTruthy()
    convId = id!

    // Verificar en API de conversación
    const convRes = await fetch(`${BASE}/api/conversations/${convId}`)
    expect(convRes.status).toBe(200)
    const conv = await convRes.json()
    expect(Array.isArray(conv.messages)).toBe(true)
    expect(conv.messages.length).toBe(2)

    const userMsg = conv.messages.find((m: { role: string }) => m.role === "user")
    const assistantMsg = conv.messages.find((m: { role: string }) => m.role === "assistant")

    expect(userMsg).toBeTruthy()
    expect(userMsg.content).toContain("TEST U09-U10")
    expect(assistantMsg).toBeTruthy()
    expect(assistantMsg.content.length).toBeGreaterThan(0)
  }, 60000)
})

describe("U-11/U-12 — Auto-título de conversación", () => {
  test("U-11: título se actualiza desde mensaje inicial", async () => {
    const res = await sendChat("Cuál es la capital de Francia")
    const { convId } = await readSSE(res)
    expect(convId).toBeTruthy()

    const convRes = await fetch(`${BASE}/api/conversations/${convId}`)
    const conv = await convRes.json()
    expect(conv.title).not.toBe("New Chat")
    expect(conv.title).toContain("Cuál es la capital de Francia")
  }, 60000)

  test("U-12: título largo se trunca a 60 chars con '…'", async () => {
    const longMsg = "a".repeat(80)
    const res = await sendChat(longMsg)
    const { convId } = await readSSE(res)

    const convRes = await fetch(`${BASE}/api/conversations/${convId}`)
    const conv = await convRes.json()
    expect(conv.title.length).toBeLessThanOrEqual(61)
    expect(conv.title.endsWith("…")).toBe(true)
  }, 60000)
})

describe("U-13/U-14 — Guest user", () => {
  test("U-13: guest user existe después de chatear", async () => {
    // Ya enviamos mensajes arriba, así que guest existe
    const convs = await getGuestConversations()
    expect(Array.isArray(convs)).toBe(true)
    expect(convs.length).toBeGreaterThan(0)
  }, 10000)

  test("U-14: conversaciones del guest se listan correctamente", async () => {
    const convs = await getGuestConversations()
    // Todas deben tener id y title
    for (const c of convs) {
      expect(c).toHaveProperty("id")
      expect(c).toHaveProperty("title")
      expect(typeof c.id).toBe("string")
      expect(typeof c.title).toBe("string")
    }
  }, 10000)
})
