import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import ChatWindow from "@/components/ChatWindow"
import { GUEST_EMAIL } from "@/lib/constants"

async function getUserId(): Promise<string | null> {
  const session = await auth()
  if (session?.user?.id) return session.user.id
  const guest = await prisma.user.findUnique({ where: { email: GUEST_EMAIL } })
  return guest?.id ?? null
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const userId = await getUserId()
  const { id } = await params

  if (!userId) notFound()

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  })

  if (!conversation) notFound()

  const messages = conversation.messages.map(
    (m: { role: string; content: string; model?: string | null }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
      model: m.model ?? undefined,
    })
  )

  return <ChatWindow conversationId={id} initialMessages={messages} />
}
