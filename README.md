# AI Asistente

Chat local con modelos de IA vía [Ollama](https://ollama.com). Historial persistido en PostgreSQL, autenticación OAuth con GitHub, skills configurables por archivo `.md`.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4 |
| Auth | NextAuth v5 (GitHub OAuth + modo invitado) |
| Base de datos | PostgreSQL 14+ vía Prisma ORM |
| IA | Ollama (streaming SSE) |
| Deploy | Docker Compose (app + db) |

---

## Inicio rápido

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.example .env   # edita con tus valores

# 3. Base de datos
npx prisma generate
npx prisma migrate deploy

# 4. Ollama (en otra terminal)
ollama serve

# 5. Servidor de desarrollo
npm run dev
```

La app queda en `http://localhost:3000`.

---

## Variables de entorno

```env
# Base de datos
DATABASE_URL="postgresql://usuario@localhost:5432/chatapp?schema=public"

# NextAuth
AUTH_SECRET="<genera: openssl rand -base64 32>"
AUTH_URL="http://localhost:3000"

# GitHub OAuth — github.com/settings/developers → New OAuth App
# Callback: http://localhost:3000/api/auth/callback/github
AUTH_GITHUB_ID="..."
AUTH_GITHUB_SECRET="..."

# Ollama
OLLAMA_URL="http://localhost:11434"
DEFAULT_MODEL="deepseek-v4-flash:cloud"

# App
NEXT_PUBLIC_APP_NAME="AI Asistente"

# System prompt base (opcional — las skills lo sobreescriben)
# SYSTEM_PROMPT="Eres un asistente..."
```

---

## Autenticación

Login con **GitHub OAuth**. Los usuarios sin cuenta se sirven como **invitados** (usuario `guest@local` creado automáticamente — sin historial persistido entre sesiones distintas).

Configurar GitHub OAuth:
1. `github.com/settings/developers` → New OAuth App
2. Callback URL: `http://localhost:3000/api/auth/callback/github`
3. Pega Client ID y Secret en `.env`

---

## Skills

Las skills definen cómo responde el modelo. Se cargan desde archivos `.md` en `/skills/` — **sin tocar código**.

### Formato de archivo

```markdown
---
name: emprendimiento
description: Asesor de customer discovery basado en Steve Blank.
---

# Asesor de Emprendimiento

Eres un mentor con 15 años acompañando fundadores...
```

El frontmatter es opcional. Si existe, `description` aparece como preview en la toolbar del input.

### Agregar una skill

1. Crea `skills/mi-skill.md` con el prompt del sistema
2. Reinicia el servidor
3. La skill aparece automáticamente en el selector

### Icono

El archivo `app/api/skills/route.ts` contiene `ICON_MAP` — agrega `"mi-skill": "🎯"` para asignar un emoji. Si no está en el mapa, usa `✨` por defecto.

### Skills incluidas (45)

| Categoría | Skills |
|-----------|--------|
| Negocio | emprendimiento, plan-negocios, lean-startup, lean-startup-100, mba-esencial, okrs-estrategia |
| Ventas | hacking-sales, sales-copywriting, psicologia-ventas, negociacion, russell-brunson, alex-hormozi |
| Marketing | growth-hacking, growth-linkedin, digital-agency, ecommerce, retail-strategy, iman-gadzhi |
| Finanzas | finanzas-pyme, contabilidad-basica, bookkeeping, venture-capital |
| Tech | dev-skills, dev-career, machine-learning, saas-builder, ai-agents |
| Seguridad | cybersecurity, ethical-hacking, network-security, cloud-security, red-teaming, malware-forense |
| Estrategia | mckinsey-strategy, business-analysis, storytelling, dark-psychology, habitos-productividad |
| Otros | dan-martel, jaime-higuera, sean-ellis, producto, precio-estrategia |

---

## Arquitectura

Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para el diagrama completo y el flujo de un mensaje.

```
ia-asistente/
├── app/
│   ├── api/
│   │   ├── chat/route.ts              # Streaming SSE → Ollama
│   │   ├── models/route.ts            # Lista modelos de Ollama
│   │   ├── skills/route.ts            # Lee /skills/*.md
│   │   ├── conversations/             # CRUD conversaciones
│   │   │   └── [id]/route.ts
│   │   ├── auth/[...nextauth]/        # NextAuth handlers
│   │   └── anthropic-proxy/           # Proxy compatible Anthropic SDK
│   ├── chat/
│   │   ├── page.tsx                   # /chat — nueva conversación
│   │   ├── layout.tsx                 # Layout con Sidebar
│   │   └── [id]/page.tsx              # /chat/:id — conversación existente
│   ├── login/page.tsx
│   └── layout.tsx
├── components/
│   ├── ChatWindow.tsx                 # Orquestador: estado, fetch, streaming
│   ├── ChatInput.tsx                  # Toolbar (modelo + skill) + textarea
│   ├── MessageBubble.tsx              # Burbuja markdown con cursor de streaming
│   └── Sidebar.tsx                    # Historial agrupado por fecha
├── lib/
│   ├── constants.ts                   # GUEST_EMAIL, SYSTEM_PROMPT, Skill interface
│   ├── ollama.ts                      # streamOllama(), ollamaNonStreaming()
│   ├── prisma.ts                      # Cliente Prisma singleton
│   └── utils.ts                       # friendlyName()
├── prisma/
│   └── schema.prisma                  # User, Conversation, Message, Account, Session
├── skills/                            # 45 archivos .md de skills
├── .claude/agents/                    # 184 agentes para Claude Code / VSCode
├── auth.ts                            # NextAuth — proveedor GitHub
├── Dockerfile
└── docker-compose.yml
```

---

## Docker

```bash
# Configurar .env (AUTH_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET, OLLAMA_URL)

# Construir y arrancar
docker compose up --build -d
```

App en `http://localhost:3000`. Ollama es **externo** — apunta con `OLLAMA_URL`.

### Variables Docker vs local

| Variable | Local | Docker |
|---|---|---|
| `DATABASE_URL` | `localhost:5432` | `db:5432` (automático) |
| `OLLAMA_URL` | `http://localhost:11434` | URL de tu servidor Ollama externo |

### Comandos útiles

```bash
docker compose logs -f app        # Logs de la app
docker compose exec app sh         # Shell en el contenedor
docker compose down                # Detener
docker compose down -v             # Detener + borrar volúmenes
```

---

## Comandos de desarrollo

```bash
npm run dev              # Servidor con Turbopack
npm run build            # Build de producción
npm run start            # Servidor de producción
npm run test             # Tests unitarios (Jest)
npm run test:e2e         # Tests E2E — requiere servidor corriendo
npm run test:e2e:report  # Abre reporte Playwright
```

---

## Proxy Anthropic

`/api/anthropic-proxy/v1/messages` expone una API compatible con el SDK de Anthropic, redirigiendo llamadas a Ollama. Útil para integrar herramientas que esperan la API de Anthropic con modelos locales.

---

## Agentes Claude Code

El directorio `.claude/agents/` contiene 184 agentes especializados (de [agency-agents](https://github.com/msitarzewski/agency-agents)) disponibles en Claude Code / VSCode para este proyecto. No forman parte de la app en ejecución.
