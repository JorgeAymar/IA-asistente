"use client"

import { useRef, useEffect, useState } from "react"
import type { Skill } from "@/lib/constants"
import { friendlyName } from "@/lib/utils"

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  selectedModel?: string
  models?: string[]
  onModelChange?: (model: string) => void
  skills?: Skill[]
  selectedSkillId?: string
  onSkillChange?: (skillId: string) => void
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  selectedModel,
  models = [],
  onModelChange,
  skills = [],
  selectedSkillId = "general",
  onSkillChange,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px"
  }, [value])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!disabled && value.trim()) onSubmit()
    }
  }

  const canSubmit = !disabled && value.trim().length > 0
  const activeSkill = skills.find((s) => s.id === selectedSkillId)

  return (
    <div className="w-full px-4 pb-5 pt-2">
      <div className="max-w-3xl mx-auto">

        {/* Main input container */}
        <div
          className="relative rounded-2xl transition-all duration-200 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.03) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.05) inset",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Focus ring overlay */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-200"
            style={{
              border: "1px solid rgba(139,92,246,0.4)",
              boxShadow: "0 0 0 3px rgba(139,92,246,0.08)",
              opacity: isFocused ? 1 : 0,
            }}
          />

          {/* Toolbar: modelo + skill */}
          <div className="flex items-center gap-0 px-3 pt-3 pb-1 border-b border-white/[0.04]">

            {/* Indicador online — decorativo, oculto a AT */}
            <span aria-hidden="true" className="relative flex h-1.5 w-1.5 flex-shrink-0 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>

            {/* Selector de modelo */}
            <div className="flex items-center gap-1 min-w-0 flex-1">
              {models.length > 0 && onModelChange ? (
                <select
                  value={models.find((m) => friendlyName(m) === selectedModel) ?? models[0]}
                  onChange={(e) => onModelChange(e.target.value)}
                  disabled={disabled}
                  aria-label="Seleccionar modelo"
                  className="bg-transparent text-[11px] text-gray-400 font-medium outline-none cursor-pointer appearance-none truncate disabled:cursor-not-allowed max-w-[140px]"
                  style={{ caretColor: "transparent" }}
                >
                  {models.map((m) => (
                    <option key={m} value={m} style={{ background: "#0d0d16", color: "#e5e7eb" }}>
                      {friendlyName(m)}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-[11px] text-gray-500 font-medium truncate">{selectedModel ?? "Conectando..."}</span>
              )}
              {models.length > 0 && (
                <svg aria-hidden="true" className="w-3 h-3 text-gray-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M6 9l6 6 6-6" />
                </svg>
              )}
            </div>

            {/* Separador */}
            {onSkillChange && skills.length > 0 && (
              <span aria-hidden="true" className="mx-2.5 h-3 w-px flex-shrink-0" style={{ background: "rgba(255,255,255,0.10)" }} />
            )}

            {/* Selector de skill */}
            {onSkillChange && skills.length > 0 && (
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <span aria-hidden="true" className="text-[11px] flex-shrink-0">
                  {activeSkill?.icon ?? "✨"}
                </span>
                <select
                  value={selectedSkillId}
                  onChange={(e) => onSkillChange(e.target.value)}
                  disabled={disabled}
                  aria-label="Seleccionar modo de respuesta"
                  className="bg-transparent text-[11px] font-medium outline-none cursor-pointer appearance-none truncate disabled:cursor-not-allowed"
                  style={{
                    caretColor: "transparent",
                    color: "rgba(196,181,253,0.85)",
                    maxWidth: "160px",
                  }}
                >
                  {skills.map((s) => (
                    <option key={s.id} value={s.id} style={{ background: "#0d0d16", color: "#e5e7eb" }}>
                      {s.icon} {s.label}
                    </option>
                  ))}
                </select>
                <svg aria-hidden="true" className="w-3 h-3 text-gray-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M6 9l6 6 6-6" />
                </svg>
              </div>
            )}
          </div>

          {/* Skill description preview */}
          {activeSkill?.description && (
            <p className="px-3 pt-2 pb-0 text-[10px] text-gray-500 leading-snug line-clamp-1">
              {activeSkill.description}
            </p>
          )}

          {/* Textarea */}
          <div className="flex items-end gap-2 px-3 pb-3 pt-2.5">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Envía un mensaje..."
              disabled={disabled}
              rows={1}
              aria-label="Mensaje"
              className="flex-1 bg-transparent text-white/90 placeholder-gray-500 resize-none outline-none text-sm leading-relaxed max-h-48 overflow-y-auto"
              style={{ caretColor: "#8b5cf6" }}
            />

            {/* Submit button */}
            <button
              onClick={onSubmit}
              disabled={!canSubmit}
              aria-label="Enviar mensaje"
              className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ring-1 ring-transparent"
              style={
                canSubmit
                  ? {
                      background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                      boxShadow: "0 4px 12px rgba(99,102,241,0.4), 0 1px 0 rgba(255,255,255,0.1) inset",
                    }
                  : {
                      background: "rgba(255,255,255,0.06)",
                      cursor: "not-allowed",
                    }
              }
              onMouseEnter={(e) => {
                if (canSubmit) {
                  (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)"
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 16px rgba(99,102,241,0.5), 0 1px 0 rgba(255,255,255,0.1) inset"
                }
              }}
              onMouseLeave={(e) => {
                if (canSubmit) {
                  (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(99,102,241,0.4), 0 1px 0 rgba(255,255,255,0.1) inset"
                }
              }}
            >
              {disabled ? (
                <svg aria-hidden="true" className="w-4 h-4 text-white/60 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity={0.3} />
                  <path strokeLinecap="round" d="M12 3a9 9 0 019 9" />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  className="w-4 h-4"
                  style={{ color: canSubmit ? "white" : "rgba(255,255,255,0.25)" }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2.5 px-1">
          <p className="text-[11px] text-gray-500">
            El modelo puede cometer errores. Verifica la información importante.
          </p>
          <p className="text-[11px] text-gray-500 hidden sm:flex items-center gap-1.5">
            <kbd className="font-mono bg-white/[0.04] border border-white/[0.08] px-1.5 py-0.5 rounded text-[10px] text-gray-400">Enter</kbd>
            <span>envía</span>
            <span className="text-gray-600">·</span>
            <kbd className="font-mono bg-white/[0.04] border border-white/[0.08] px-1.5 py-0.5 rounded text-[10px] text-gray-400">⇧ Enter</kbd>
            <span>línea</span>
          </p>
        </div>
      </div>
    </div>
  )
}
