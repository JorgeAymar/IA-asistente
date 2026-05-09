import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { streamOllama } from "@/lib/ollama"
import { GUEST_EMAIL, SYSTEM_PROMPT } from "@/lib/constants"

async function getOrCreateGuestUser(): Promise<string> {
  const guest = await prisma.user.upsert({
    where: { email: GUEST_EMAIL },
    update: {},
    create: { email: GUEST_EMAIL, name: "Guest" },
  })
  return guest.id
}

export async function POST(req: Request) {
  const { messages, conversationId, model, skillPrompt } = await req.json()

  const session = await auth()
  const userId = session?.user?.id ?? (await getOrCreateGuestUser())
  const selectedModel: string = model ?? process.env.DEFAULT_MODEL ?? ""
  const activeSystemPrompt: string = skillPrompt ?? SYSTEM_PROMPT

  let convId: string = conversationId ?? ""
  const userMessage: { role: string; content: string } = messages[messages.length - 1]

  if (!convId) {
    const conv = await prisma.conversation.create({
      data: { userId, title: "New Chat" },
    })
    convId = conv.id
  }

  await prisma.message.create({
    data: { conversationId: convId, role: "user", content: userMessage.content, model: null },
  })

  const encoder = new TextEncoder()
  let fullResponse = ""

  const readable = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

      try {
        send({ type: "conversation_id", id: convId })

        const ollamaMessages = messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        }))

        for await (const text of streamOllama(selectedModel, ollamaMessages, activeSystemPrompt)) {
          fullResponse += text
          send({ type: "text", text })
        }

        await prisma.message.create({
          data: {
            conversationId: convId,
            role: "assistant",
            content: fullResponse,
            model: selectedModel,
          },
        })

        const count = await prisma.message.count({ where: { conversationId: convId } })
        if (count <= 2) {
          const title =
            userMessage.content.slice(0, 60) +
            (userMessage.content.length > 60 ? "…" : "")
          await prisma.conversation.update({ where: { id: convId }, data: { title } })
        }

        send({ type: "done" })
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
        controller.close()
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido"
        send({ type: "error", message })
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
