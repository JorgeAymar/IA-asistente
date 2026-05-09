import { readdirSync, readFileSync, existsSync } from "fs"
import { join } from "path"
import type { Skill } from "@/lib/constants"

const ICON_MAP: Record<string, string> = {
  "ai-agents": "🤖",
  "alex-hormozi": "💰",
  "bookkeeping": "📒",
  "business-analysis": "📊",
  "cashvertising": "📣",
  "cloud-security": "☁️",
  "contabilidad-basica": "🧾",
  "cybersecurity": "🛡️",
  "dan-martel": "⏱️",
  "dark-psychology": "🧠",
  "dev-career": "👨‍💻",
  "dev-skills": "💻",
  "digital-agency": "🏢",
  "ecommerce": "🛒",
  "emprendimiento": "🚀",
  "ethical-hacking": "🔓",
  "finanzas-pyme": "💵",
  "growth-hacking": "📈",
  "growth-linkedin": "🔗",
  "habitos-productividad": "⚡",
  "hacking-sales": "🎯",
  "iman-gadzhi": "🌐",
  "jaime-higuera": "🇲🇽",
  "lean-startup": "🔄",
  "lean-startup-100": "💡",
  "machine-learning": "🧬",
  "malware-forense": "🦠",
  "mba-esencial": "🎓",
  "mckinsey-strategy": "♟️",
  "negociacion": "🤝",
  "network-security": "🔐",
  "okrs-estrategia": "🎯",
  "plan-negocios": "📋",
  "precio-estrategia": "🏷️",
  "producto": "📦",
  "psicologia-ventas": "🧩",
  "red-teaming": "🕵️",
  "retail-strategy": "🏪",
  "russell-brunson": "🔺",
  "saas-builder": "☁️",
  "sales-copywriting": "✍️",
  "sean-ellis": "📊",
  "storytelling": "📖",
  "venture-capital": "💼",
  "ycombinator": "🅨",
}

function parseSkillFile(raw: string): { body: string; description?: string } {
  if (!raw.startsWith("---")) return { body: raw.trim() }
  const end = raw.indexOf("\n---", 3)
  if (end === -1) return { body: raw.trim() }
  const frontmatter = raw.slice(3, end)
  const body = raw.slice(end + 4).trim()
  const descMatch = frontmatter.match(/^description:\s*(.+)$/m)
  return { body, description: descMatch?.[1]?.trim() }
}

function extractLabel(body: string, id: string): string {
  const h1 = body.match(/^#\s+(.+)$/m)
  if (h1) return h1[1].trim()
  return id
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export async function GET() {
  try {
    const skillsDir = join(process.cwd(), "skills")
    if (!existsSync(skillsDir)) return Response.json([])

    const files = readdirSync(skillsDir).filter((f) => f.endsWith(".md"))

    const skills: Skill[] = files
      .map((filename) => {
        const id = filename.replace(/\.md$/, "")
        const raw = readFileSync(join(skillsDir, filename), "utf-8")
        const { body, description } = parseSkillFile(raw)
        const label = extractLabel(body, id)
        return {
          id,
          label,
          icon: ICON_MAP[id] ?? "✨",
          prompt: body,
          description,
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))

    return Response.json(skills)
  } catch {
    return Response.json([])
  }
}
