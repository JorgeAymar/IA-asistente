"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import MessageBubble from "./MessageBubble"
import ChatInput from "./ChatInput"
import type { Skill } from "@/lib/constants"
import { friendlyName } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
  model?: string
}

interface ChatWindowProps {
  conversationId?: string
  initialMessages?: Message[]
}

const LS_MODEL_KEY = "ai-chat-selected-model"
const LS_SKILL_KEY = "ai-chat-selected-skill"

const QUICK_PROMPTS = [
  { icon: "💡", label: "Explícame un concepto", text: "Explícame un concepto complejo" },
  { icon: "⌨️", label: "Escribe código", text: "Escribe código Python para..." },
  { icon: "📝", label: "Resume texto", text: "Resume este texto:" },
  { icon: "🗓️", label: "Planificar", text: "Ayúdame a planificar..." },
]

const FEATURED_SKILL_IDS = ["emprendimiento", "dev-skills", "mckinsey-strategy", "growth-hacking"]

export default function ChatWindow({
  conversationId,
  initialMessages = [],
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [models, setModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState("")
  const [skills, setSkills] = useState<Skill[]>([])
  const [selectedSkillId, setSelectedSkillId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(LS_SKILL_KEY) ?? "general"
    }
    return "general"
  })
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isStreamingRef = useRef(false)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((list: string[]) => {
        setModels(list)
        if (list.length > 0) {
          const saved = typeof window !== "undefined"
            ? localStorage.getItem(LS_MODEL_KEY)
            : null
          const restored = saved && list.includes(saved) ? saved : list[0]
          setSelectedModel(restored)
        }
      })
    fetch("/api/skills")
      .then((r) => r.json())
      .then((list: Skill[]) => {
        if (list.length > 0) setSkills(list)
      })
  }, [])

  function handleModelChange(model: string) {
    setSelectedModel(model)
    localStorage.setItem(LS_MODEL_KEY, model)
  }

  function handleSkillChange(skillId: string) {
    setSelectedSkillId(skillId)
    localStorage.setItem(LS_SKILL_KEY, skillId)
  }

  useEffect(() => {
    if (!isStreamingRef.current) setMessages(initialMessages)
  }, [conversationId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isStreaming) return

    const userMsg: Message = { role: "user", content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setError(null)
    isStreamingRef.current = true
    setIsStreaming(true)
    setStreamingContent("")

    try {
      const skill = skills.find((s) => s.id === selectedSkillId) ?? skills[0]
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          conversationId,
          model: selectedModel,
          skillPrompt: skill.prompt,
        }),
      })

      if (!res.ok || !res.body) throw new Error("Error en la respuesta del servidor")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""
      let newConvId: string | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const lines = decoder.decode(value, { stream: true }).split("\n")
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const raw = line.slice(6).trim()
          if (raw === "[DONE]") break
          try {
            const parsed = JSON.parse(raw)
            if (parsed.type === "conversation_id") {
              newConvId = parsed.id
              if (newConvId && !conversationId) {
                window.history.replaceState(null, "", `/chat/${newConvId}`)
              }
            } else if (parsed.type === "text") {
              accumulated += parsed.text
              setStreamingContent(accumulated)
            } else if (parsed.type === "error") {
              throw new Error(parsed.message)
            }
          } catch { /* partial JSON */ }
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: accumulated, model: selectedModel },
      ])
      setStreamingContent("")

      window.dispatchEvent(new CustomEvent("conversation-updated"))

      if (newConvId && !conversationId) router.replace(`/chat/${newConvId}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido"
      setError(msg)
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${msg}`, model: selectedModel },
      ])
    } finally {
      isStreamingRef.current = false
      setIsStreaming(false)
      setStreamingContent("")
    }
  }, [input, messages, conversationId, isStreaming, router, selectedModel, selectedSkillId, skills])

  const isEmpty = messages.length === 0 && !isStreaming
  const featuredSkills = FEATURED_SKILL_IDS
    .map((id) => skills.find((s) => s.id === id))
    .filter(Boolean) as Skill[]

  return (
    <div className="relative flex flex-col h-full" style={{ background: "linear-gradient(180deg, #0a0a0f 0%, #0d0d16 100%)" }}>

      {/* Error toast */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 text-red-300 text-sm px-4 py-3 rounded-xl shadow-2xl max-w-md w-[90%] animate-message-in border border-red-900/60"
          style={{ background: "rgba(127,29,29,0.9)", backdropFilter: "blur(12px)" }}
          role="alert"
        >
          <svg aria-hidden="true" className="w-4 h-4 flex-shrink-0 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10"/>
            <path strokeLinecap="round" d="M12 8v4M12 16h.01"/>
          </svg>
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            aria-label="Cerrar error"
            className="hover:text-red-100 transition-colors p-1 rounded-lg hover:bg-red-900/50"
          >
            <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          /* Empty state — welcome screen */
          <div className="flex flex-col items-center justify-center h-full gap-8 px-4 pb-24">

            {/* Hero logo */}
            <div className="relative animate-fade-in">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl ai-avatar-glow"
                style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)" }}
              >
                <svg aria-hidden="true" className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div aria-hidden="true" className="absolute inset-0 rounded-2xl" style={{ boxShadow: "0 0 40px rgba(99,102,241,0.2)", pointerEvents: "none" }} />
            </div>

            {/* Title block */}
            <div className="text-center animate-fade-in">
              <h1 className="text-2xl font-semibold mb-2" style={{ color: "rgba(255,255,255,0.92)" }}>
                ¿En qué puedo ayudarte?
              </h1>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                Haz una pregunta, pide ayuda con código, o escribe lo que necesites.
              </p>
              {selectedModel && (
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-violet-500/70" />
                  <p className="text-[11px] text-gray-500 font-medium font-mono">{friendlyName(selectedModel)}</p>
                </div>
              )}
            </div>

            {/* Quick prompt cards */}
            <div className="grid grid-cols-2 gap-2.5 max-w-md w-full animate-fade-in">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt.text}
                  onClick={() => setInput(prompt.text)}
                  className="group relative text-left rounded-xl p-3.5 transition-all duration-200 border overflow-hidden hover:-translate-y-0.5 hover:border-violet-500/20 hover:bg-violet-500/[0.06]"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderColor: "rgba(255,255,255,0.07)",
                  }}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-xl"
                    style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.06), transparent)" }}
                  />
                  <p aria-hidden="true" className="text-lg mb-1.5 leading-none">{prompt.icon}</p>
                  <p className="text-xs font-medium text-gray-300 leading-snug group-hover:text-white transition-colors">
                    {prompt.label}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5 truncate">{prompt.text}</p>
                </button>
              ))}
            </div>

            {/* Featured skills */}
            {featuredSkills.length > 0 && (
              <div className="animate-fade-in flex flex-col items-center gap-2 max-w-md w-full">
                <p className="text-[11px] text-gray-600 uppercase tracking-widest font-semibold">Modos de respuesta</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {featuredSkills.map((skill) => (
                    <button
                      key={skill.id}
                      onClick={() => handleSkillChange(skill.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                        selectedSkillId === skill.id
                          ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                          : "bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-violet-500/30 hover:text-gray-200"
                      }`}
                    >
                      <span aria-hidden="true">{skill.icon}</span>
                      {skill.label}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      // focus the skill selector
                      const sel = document.querySelector<HTMLSelectElement>("[aria-label='Seleccionar modo de respuesta']")
                      sel?.focus()
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-white/[0.08] text-gray-600 hover:text-gray-400 hover:border-white/[0.16] transition-all"
                  >
                    Ver todos →
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Messages list */
          <div className="max-w-3xl mx-auto w-full py-4">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}

            {/* Streaming message with cursor */}
            {isStreaming && streamingContent && (
              <MessageBubble
                message={{ role: "assistant", content: streamingContent, model: selectedModel }}
                streaming={true}
              />
            )}

            {/* Loading dots (before first token) */}
            {isStreaming && !streamingContent && (
              <div className="flex gap-3 py-5 px-4 md:px-8 animate-message-in">
                <div
                  aria-hidden="true"
                  className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5, #2563eb)" }}
                >
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div
                  role="status"
                  aria-label="La IA está escribiendo..."
                  className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span aria-hidden="true" className="w-1.5 h-1.5 bg-violet-400/80 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span aria-hidden="true" className="w-1.5 h-1.5 bg-violet-400/80 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span aria-hidden="true" className="w-1.5 h-1.5 bg-violet-400/80 rounded-full animate-bounce" />
                </div>
              </div>
            )}
            <div ref={bottomRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={sendMessage}
        disabled={isStreaming}
        selectedModel={selectedModel ? friendlyName(selectedModel) : undefined}
        models={models}
        onModelChange={handleModelChange}
        skills={skills}
        selectedSkillId={selectedSkillId}
        onSkillChange={handleSkillChange}
      />
    </div>
  )
}
