"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { signOut, useSession } from "next-auth/react"

interface Conversation {
  id: string
  title: string
  updatedAt: string
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return "ahora"
  if (mins < 60) return `hace ${mins} min`
  if (hours < 24) return `hace ${hours} h`
  if (days === 1) return "ayer"
  if (days < 7) return `hace ${days} días`
  return new Date(dateStr).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
}

function groupByDate(convs: Conversation[]): { label: string; items: Conversation[] }[] {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfYesterday = startOfToday - 86400000
  const startOfWeek = startOfToday - 6 * 86400000

  const groups: { label: string; items: Conversation[] }[] = [
    { label: "Hoy", items: [] },
    { label: "Ayer", items: [] },
    { label: "Esta semana", items: [] },
    { label: "Anteriores", items: [] },
  ]

  for (const c of convs) {
    const t = new Date(c.updatedAt).getTime()
    if (t >= startOfToday) groups[0].items.push(c)
    else if (t >= startOfYesterday) groups[1].items.push(c)
    else if (t >= startOfWeek) groups[2].items.push(c)
    else groups[3].items.push(c)
  }

  return groups.filter((g) => g.items.length > 0)
}

export default function Sidebar() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()

  const currentId = pathname.startsWith("/chat/")
    ? pathname.split("/chat/")[1]
    : undefined

  function loadConversations() {
    fetch("/api/conversations")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setConversations(data))
  }

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setConversations(data))
  }, [currentId])

  useEffect(() => {
    window.addEventListener("conversation-updated", loadConversations)
    return () => window.removeEventListener("conversation-updated", loadConversations)
  }, [])

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    await fetch(`/api/conversations/${id}`, { method: "DELETE" })
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (currentId === id) router.push("/chat")
  }

  function handleNewChat() {
    setIsOpen(false)
    window.location.href = "/chat"
  }

  const filtered = search.trim()
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(search.trim().toLowerCase())
      )
    : conversations

  const groups = search.trim() ? null : groupByDate(filtered)

  const ConvLink = ({ conv }: { conv: Conversation }) => (
    <Link
      key={conv.id}
      href={`/chat/${conv.id}`}
      onClick={() => setIsOpen(false)}
      className={`group flex items-start gap-2.5 px-2.5 py-2 mx-2 rounded-lg text-sm cursor-pointer transition-all duration-150 relative ${
        currentId === conv.id
          ? "bg-white/[0.06] text-white border border-white/[0.08]"
          : "text-gray-400 hover:bg-white/[0.04] hover:text-gray-200 border border-transparent"
      }`}
    >
      {/* Active indicator */}
      {currentId === conv.id && (
        <div aria-hidden="true" className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-500 rounded-r-full" />
      )}

      <svg
        aria-hidden="true"
        className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 transition-colors ${
          currentId === conv.id ? "text-violet-400" : "text-gray-600 group-hover:text-gray-400"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>

      <div className="flex-1 min-w-0">
        <p className="truncate leading-snug text-xs font-medium">{conv.title}</p>
        <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{relativeTime(conv.updatedAt)}</p>
      </div>

      <button
        onClick={(e) => handleDelete(e, conv.id)}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 hover:text-red-400 transition-all flex-shrink-0 mt-0.5 rounded hover:bg-red-400/10"
        aria-label={`Eliminar conversación: ${conv.title}`}
      >
        <svg aria-hidden="true" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </Link>
  )

  const sidebarContent = (
    <div className="flex flex-col h-full text-white" style={{ background: "linear-gradient(180deg, #0d0d14 0%, #0a0a10 100%)" }}>

      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
            <svg aria-hidden="true" className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <span className="font-semibold text-sm text-white/90 tracking-tight">{process.env.NEXT_PUBLIC_APP_NAME ?? "AI Asistente"}</span>
        </div>

        <button
          onClick={handleNewChat}
          className="group p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors border border-transparent hover:border-white/[0.06]"
          aria-label="Nuevo chat"
        >
          <svg aria-hidden="true" className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* New chat quick access */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={handleNewChat}
          className="group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-400 border border-dashed border-white/[0.08] hover:border-violet-500/30 hover:text-gray-300 hover:bg-violet-500/5 transition-all duration-200"
        >
          <svg aria-hidden="true" className="w-3.5 h-3.5 text-violet-500/60 group-hover:text-violet-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Nuevo chat</span>
        </button>
      </div>

      {/* Search — visible when there are conversations */}
      {conversations.length > 0 && (
        <div className="px-3 py-2">
          <div className="relative">
            <svg aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversación..."
              aria-label="Buscar conversación"
              className="w-full text-xs text-gray-300 placeholder-gray-500 rounded-lg pl-8 pr-3 py-1.5 outline-none border border-white/[0.06] focus:border-violet-500/30 transition-colors"
              style={{ background: "rgba(255,255,255,0.03)" }}
            />
          </div>
        </div>
      )}

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 mt-10 px-4">
            <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <svg aria-hidden="true" className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
            <p className="text-xs text-gray-500 text-center">
              {search ? "Sin resultados" : "No hay conversaciones"}
            </p>
          </div>
        ) : search.trim() ? (
          <div className="space-y-0.5 py-1">
            {filtered.map((conv) => <ConvLink key={conv.id} conv={conv} />)}
          </div>
        ) : (
          groups!.map((group) => (
            <div key={group.label} className="mb-1">
              <p className="px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-gray-600/80">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((conv) => <ConvLink key={conv.id} conv={conv} />)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer / User */}
      {session?.user && (
        <div className="p-2.5 border-t border-white/[0.05]">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="group w-full flex items-center gap-2.5 px-2.5 py-2 hover:bg-white/[0.04] rounded-lg transition-all text-left border border-transparent hover:border-white/[0.06]"
            aria-label={`Cerrar sesión de ${session.user.name ?? session.user.email}`}
          >
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" aria-hidden="true" className="w-7 h-7 rounded-full ring-1 ring-violet-500/30" />
            ) : (
              <div aria-hidden="true" className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-violet-300" style={{ background: "linear-gradient(135deg, #4c1d95, #312e81)" }}>
                {session.user.name?.[0] ?? "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-200 truncate">{session.user.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{session.user.email}</p>
            </div>
            <svg aria-hidden="true" className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 flex-shrink-0 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-lg border border-white/[0.08] backdrop-blur-sm transition-colors hover:bg-white/[0.06]"
        style={{ background: "rgba(10,10,15,0.9)" }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Cerrar barra lateral" : "Abrir barra lateral"}
        aria-expanded={isOpen}
        aria-controls="sidebar"
      >
        <svg aria-hidden="true" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 animate-fade-in"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <div
        id="sidebar"
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-60 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Barra lateral de navegación"
      >
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-60 md:flex-shrink-0 md:flex-col border-r border-white/[0.04]">
        {sidebarContent}
      </div>
    </>
  )
}
