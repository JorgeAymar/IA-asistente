"use client"

import { useState, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { friendlyName } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
  model?: string
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className="copy-btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-500 hover:text-gray-200 hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-all duration-150"
      title="Copiar"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="text-green-400">Copiado</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path strokeLinecap="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          <span>Copiar</span>
        </>
      )}
    </button>
  )
}

export default function MessageBubble({
  message,
  streaming = false,
}: {
  message: Message
  streaming?: boolean
}) {
  const isUser = message.role === "user"

  return (
    <div className={`message-group flex gap-3 py-5 px-4 md:px-8 animate-message-in ${isUser ? "justify-end" : ""}`}>
      {/* AI Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 relative" aria-hidden="true">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg ai-avatar-glow"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)" }}
          >
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0a0a0f]" />
        </div>
      )}

      <div className={`max-w-[85%] md:max-w-[75%] ${isUser ? "flex flex-col items-end gap-1.5" : "flex flex-col gap-1.5"}`}>

        {/* Model badge for assistant */}
        {!isUser && message.model && (
          <div className="flex items-center gap-1.5 px-0.5">
            <span aria-hidden="true" className="w-1 h-1 rounded-full bg-violet-500/70 inline-block" />
            <span className="text-[10px] text-gray-500 font-medium tracking-wide">{friendlyName(message.model)}</span>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={
            isUser
              ? "relative px-4 py-3 text-white text-sm leading-relaxed shadow-lg"
              : "relative px-4 py-3 text-sm leading-relaxed shadow-sm"
          }
          style={
            isUser
              ? {
                  background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 60%, #4338ca 100%)",
                  borderRadius: "18px 18px 4px 18px",
                  boxShadow: "0 4px 24px rgba(99,102,241,0.25), 0 1px 2px rgba(0,0,0,0.3)",
                }
              : {
                  background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "4px 18px 18px 18px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
                }
          }
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const isInline = !className
                    return isInline ? (
                      <code
                        className="text-violet-300 rounded-md px-1.5 py-0.5 text-[0.8em] font-mono border border-violet-500/20"
                        style={{ background: "rgba(139,92,246,0.12)" }}
                        {...props}
                      >
                        {children}
                      </code>
                    ) : (
                      <code
                        className="block text-gray-200 rounded-b-lg px-4 py-3.5 text-xs font-mono overflow-x-auto leading-relaxed"
                        style={{ background: "rgba(0,0,0,0.4)" }}
                        {...props}
                      >
                        {children}
                      </code>
                    )
                  },
                  pre({ children }) {
                    return (
                      <div className="not-prose my-3 rounded-xl overflow-hidden border border-white/[0.06]" style={{ background: "rgba(0,0,0,0.3)" }}>
                        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/[0.05]" style={{ background: "rgba(255,255,255,0.02)" }}>
                          <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                          <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                          <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                        </div>
                        <pre className="overflow-hidden">{children}</pre>
                      </div>
                    )
                  },
                  p({ children }) {
                    return <p className="mb-3 last:mb-0 text-sm leading-7 text-gray-200">{children}</p>
                  },
                  ul({ children }) {
                    return <ul className="list-none mb-3 space-y-1.5 text-sm text-gray-200">{children}</ul>
                  },
                  ol({ children }) {
                    return <ol className="list-decimal list-inside mb-3 space-y-1.5 text-sm text-gray-200">{children}</ol>
                  },
                  li({ children }) {
                    return (
                      <li className="flex items-start gap-2">
                        <span aria-hidden="true" className="mt-2 w-1.5 h-1.5 rounded-full bg-violet-500/60 flex-shrink-0" />
                        <span>{children}</span>
                      </li>
                    )
                  },
                  h1({ children }) {
                    return <h1 className="text-base font-bold mb-2 text-white/95 mt-4 first:mt-0">{children}</h1>
                  },
                  h2({ children }) {
                    return <h2 className="text-sm font-bold mb-2 text-white/90 mt-3 first:mt-0">{children}</h2>
                  },
                  h3({ children }) {
                    return <h3 className="text-sm font-semibold mb-1.5 text-white/85 mt-2 first:mt-0">{children}</h3>
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote
                        className="border-l-2 border-violet-500/60 pl-4 my-3 text-gray-400 italic text-sm rounded-r-lg py-2"
                        style={{ background: "rgba(139,92,246,0.05)" }}
                      >
                        {children}
                      </blockquote>
                    )
                  },
                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-400 underline decoration-violet-500/40 underline-offset-2 hover:text-violet-300 hover:decoration-violet-400/60 transition-colors"
                      >
                        {children}
                      </a>
                    )
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto my-3 rounded-xl border border-white/[0.06]">
                        <table className="text-xs border-collapse w-full">{children}</table>
                      </div>
                    )
                  },
                  th({ children }) {
                    return (
                      <th
                        className="px-4 py-2.5 text-left text-gray-300 font-semibold text-xs uppercase tracking-wide border-b border-white/[0.06]"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        {children}
                      </th>
                    )
                  },
                  td({ children }) {
                    return (
                      <td className="px-4 py-2.5 text-gray-300 border-b border-white/[0.04] last:border-0">
                        {children}
                      </td>
                    )
                  },
                  strong({ children }) {
                    return <strong className="font-semibold text-white/90">{children}</strong>
                  },
                  hr() {
                    return <hr className="border-white/[0.08] my-4" />
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
              {/* Streaming cursor */}
              {streaming && (
                <span
                  aria-hidden="true"
                  className="inline-block w-0.5 h-4 bg-violet-400 animate-pulse ml-0.5 align-middle rounded-full"
                />
              )}
            </div>
          )}
        </div>

        {/* Action row for assistant messages */}
        {!isUser && (
          <div className="flex items-center px-0.5">
            {/* Always visible on mobile, hover-only on desktop */}
            <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <CopyButton text={message.content} />
            </div>
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div
          aria-hidden="true"
          className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white/80 border border-white/[0.08]"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))" }}
        >
          Tú
        </div>
      )}
    </div>
  )
}
