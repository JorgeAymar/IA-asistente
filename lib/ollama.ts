const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434"

interface OllamaMessage {
  role: string
  content: string
}

export function extractText(
  content: string | { type: string; text: string }[]
): string {
  if (typeof content === "string") return content
  return content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
}

export async function* streamOllama(
  model: string,
  messages: OllamaMessage[],
  system?: string
): AsyncGenerator<string> {
  const ollamaMessages: OllamaMessage[] = []
  if (system) ollamaMessages.push({ role: "system", content: system })
  ollamaMessages.push(...messages)

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: ollamaMessages, stream: true }),
  })

  if (!res.ok || !res.body) {
    throw new Error(`Ollama responded with ${res.status}`)
  }

  const reader = res.body.getReader()
  const dec = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    for (const line of dec.decode(value, { stream: true }).split("\n")) {
      if (!line.trim()) continue
      try {
        const chunk = JSON.parse(line)
        const text: string = chunk.message?.content ?? ""
        if (text) yield text
      } catch { /* partial line */ }
    }
  }
}

export async function ollamaNonStreaming(
  model: string,
  messages: OllamaMessage[],
  system?: string
): Promise<string> {
  const ollamaMessages: OllamaMessage[] = []
  if (system) ollamaMessages.push({ role: "system", content: system })
  ollamaMessages.push(...messages)

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: ollamaMessages, stream: false }),
  })
  const data = await res.json()
  return data.message?.content ?? ""
}
