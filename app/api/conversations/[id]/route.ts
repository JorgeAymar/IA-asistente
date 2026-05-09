import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { GUEST_EMAIL } from "@/lib/constants"

async function getUserId(): Promise<string | null> {
  const session = await auth()
  if (session?.user?.id) return session.user.id
  const guest = await prisma.user.findUnique({ where: { email: GUEST_EMAIL } })
  return guest?.id ?? null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()
  if (!userId) return new Response("Unauthorized", { status: 401 })

  const { id } = await params

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  })

  if (!conversation) return new Response("Not found", { status: 404 })

  return Response.json(conversation)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()
  if (!userId) return new Response("Unauthorized", { status: 401 })

  const { id } = await params

  await prisma.conversation.deleteMany({ where: { id, userId } })

  return new Response(null, { status: 204 })
}
