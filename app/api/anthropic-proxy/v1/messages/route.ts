import { streamOllama, ollamaNonStreaming, extractText } from "@/lib/ollama"

export async function POST(req: Request) {
  const body = await req.json()
  const model: string = body.model ?? process.env.DEFAULT_MODEL ?? ""
  const stream: boolean = body.stream ?? true
  const systemPrompt: string = body.system ?? ""
  const messages = (body.messages ?? []).map(
    (m: { role: string; content: string | { type: string; text: string }[] }) => ({
      role: m.role,
      content: extractText(m.content),
    })
  )

  if (!stream) {
    const text = await ollamaNonStreaming(model, messages, systemPrompt || undefined)
    return Response.json({
      id: `msg_${Date.now()}`,
      type: "message",
      role: "assistant",
      content: [{ type: "text", text }],
      model,
      stop_reason: "end_turn",
      usage: { input_tokens: 0, output_tokens: 0 },
    })
  }

  const encoder = new TextEncoder()
  const send = (data: object) =>
    encoder.encode(`data: ${JSON.stringify(data)}\n\n`)

  const readable = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(send({ type: "message_start", message: { id: `msg_${Date.now()}`, type: "message", role: "assistant", content: [], model, usage: { input_tokens: 0, output_tokens: 0 } } }))
        controller.enqueue(send({ type: "content_block_start", index: 0, content_block: { type: "text", text: "" } }))
        controller.enqueue(send({ type: "ping" }))

        for await (const text of streamOllama(model, messages, systemPrompt || undefined)) {
          controller.enqueue(send({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text } }))
        }

        controller.enqueue(send({ type: "content_block_stop", index: 0 }))
        controller.enqueue(send({ type: "message_delta", delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 0 } }))
        controller.enqueue(send({ type: "message_stop" }))
        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        controller.enqueue(send({ type: "error", error: { type: "api_error", message } }))
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
