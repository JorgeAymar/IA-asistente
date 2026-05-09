import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { GUEST_EMAIL } from "@/lib/constants"

async function getUserId(): Promise<string | null> {
  const session = await auth()
  if (session?.user?.id) return session.user.id

  const guest = await prisma.user.findUnique({ where: { email: GUEST_EMAIL } })
  return guest?.id ?? null
}

export async function GET() {
  const userId = await getUserId()
  if (!userId) return Response.json([])

  const conversations = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  })

  return Response.json(conversations)
}
