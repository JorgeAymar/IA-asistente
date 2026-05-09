# Arquitectura — AI Asistente

## Visión general

La app es un cliente de chat que actúa como proxy entre el navegador y un servidor Ollama externo. No tiene lógica de IA propia — delega todo al modelo seleccionado.

```
Browser  ←──SSE──  Next.js App  ──HTTP──→  Ollama Server
                        │
                    PostgreSQL
```

---

## Flujo de un mensaje

```
1. Usuario escribe → ChatInput (componente)
   └─ onSubmit → ChatWindow.sendMessage()

2. ChatWindow.sendMessage()
   ├─ Agrega mensaje usuario al estado local
   ├─ POST /api/chat { messages, model, skillPrompt, conversationId }
   └─ Lee el stream SSE de la respuesta

3. /api/chat (route handler — servidor)
   ├─ Verifica sesión (NextAuth) → userId o guestUser
   ├─ Crea/recupera Conversation en PostgreSQL
   ├─ Guarda Message(role=user) en PostgreSQL
   ├─ Llama streamOllama(model, messages, systemPrompt)
   │   └─ POST OLLAMA_URL/api/chat { stream: true }
   ├─ Emite SSE: { type: "conversation_id", id }
   ├─ Por cada token: emite SSE { type: "text", text }
   └─ Al terminar: guarda Message(role=assistant) en PostgreSQL

4. ChatWindow recibe SSE
   ├─ conversation_id → actualiza URL con history.replaceState
   ├─ text → acumula en streamingContent → MessageBubble muestra cursor
   └─ [DONE] → mueve a messages[], emite "conversation-updated"

5. Sidebar escucha "conversation-updated"
   └─ Recarga /api/conversations → actualiza lista
```

---

## Componentes

### ChatWindow
Orquestador principal. Maneja todo el estado de la sesión de chat:
- `messages[]` — historial completo
- `isStreaming` / `streamingContent` — estado del stream activo
- `selectedModel` / `selectedSkillId` — persistidos en localStorage
- `skills[]` / `models[]` — cargados desde APIs al montar

### ChatInput
Presentacional. Recibe estado y callbacks. Responsabilidades:
- Toolbar: selector de modelo + selector de skill con preview de descripción
- Textarea auto-resize con focus ring activado por estado
- Botón enviar con indicador de streaming

### MessageBubble
Renderiza un mensaje. Diferencia visual entre usuario (burbuja violeta derecha) y AI (fondo oscuro izquierda con markdown completo). Acepta prop `streaming` para mostrar cursor pulsante.

### Sidebar
Historial de conversaciones agrupado por fecha (Hoy / Ayer / Esta semana / Anteriores). Escucha evento `"conversation-updated"` para refrescarse sin recargar la página.

---

## APIs

| Ruta | Método | Función |
|------|--------|---------|
| `/api/chat` | POST | Recibe mensaje, hace streaming desde Ollama, guarda en DB |
| `/api/models` | GET | Lista modelos disponibles en Ollama (`/api/tags`) |
| `/api/skills` | GET | Lee archivos `.md` de `/skills/`, devuelve array de Skills |
| `/api/conversations` | GET | Lista conversaciones del usuario autenticado |
| `/api/conversations/[id]` | GET | Mensajes de una conversación |
| `/api/conversations/[id]` | DELETE | Elimina conversación y sus mensajes |
| `/api/anthropic-proxy/v1/messages` | POST | Proxy compatible Anthropic SDK → Ollama |

---

## Base de datos

```
users
  id, name, email, image
  └── conversations (1:N)
        id, title, userId, createdAt, updatedAt
        └── messages (1:N)
              id, conversationId, role, content, model, createdAt

accounts   (OAuth providers — NextAuth)
sessions   (JWT sessions — NextAuth)
```

### Índices

```sql
-- Listado del sidebar (ordenado por updatedAt)
CREATE INDEX ON conversations (user_id, updated_at DESC);

-- Carga de historial de conversación
CREATE INDEX ON messages (conversation_id);
```

---

## Skills — flujo de datos

```
/skills/emprendimiento.md
    │
    ▼
GET /api/skills
    ├─ Lee todos los .md del directorio
    ├─ Parsea frontmatter manualmente (sin gray-matter)
    │   └─ Extrae: description (frontmatter), label (H1 del body), icon (ICON_MAP)
    └─ Devuelve: Skill[]

ChatWindow
    ├─ Carga skills[] al montar
    ├─ selectedSkillId persiste en localStorage
    └─ Al enviar: busca skill.prompt → envía como skillPrompt

/api/chat
    └─ Usa skillPrompt como system prompt de Ollama
```

---

## Streaming SSE

El servidor emite eventos en el formato `data: {...}\n\n`:

```
data: {"type":"conversation_id","id":"clxxx..."}

data: {"type":"text","text":"Hola"}
data: {"type":"text","text":", ¿cómo"}
data: {"type":"text","text":" puedo ayudarte?"}

data: [DONE]
```

El cliente lee con `ReadableStream` + `TextDecoder` y acumula tokens en `streamingContent`. Cuando llega `[DONE]`, el contenido acumulado se mueve a `messages[]`.

---

## Autenticación

NextAuth v5 con proveedor GitHub. Si no hay sesión activa, el usuario se sirve como **invitado** (`guest@local`). El usuario invitado puede chatear pero sus conversaciones se mezclan con las de otros invitados en la misma instancia.

Para producción multi-usuario se recomienda requerir login antes de crear conversaciones.

---

## localStorage

| Key | Valor | Propósito |
|-----|-------|-----------|
| `ai-chat-selected-model` | string (model id) | Recordar modelo elegido entre sesiones |
| `ai-chat-selected-skill` | string (skill id) | Recordar skill elegida entre sesiones |
