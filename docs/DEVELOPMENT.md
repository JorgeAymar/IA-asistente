# Guía de Desarrollo

## Prerrequisitos

- Node.js 20+
- PostgreSQL 14+ corriendo localmente
- Ollama corriendo en `http://localhost:11434`
- Al menos un modelo descargado en Ollama (`ollama pull deepseek-v4-flash:cloud`)

---

## Setup inicial

```bash
# Clonar
git clone https://github.com/JorgeAymar/IA-asistente.git
cd IA-asistente

# Instalar dependencias
npm install

# Variables de entorno
cp .env.example .env
# Edita .env con tus valores (ver README.md)

# Generar cliente Prisma
npx prisma generate

# Crear tablas
npx prisma migrate deploy

# Iniciar
npm run dev
```

---

## Estructura de ramas

```
main        ← producción
```

El proyecto usa un flujo simple de rama única. Para features importantes, crear rama `feature/nombre` y abrir PR.

---

## Tests

### Unitarios (Jest)

```bash
npm run test           # modo watch
npm run test -- --ci   # modo CI (una sola ejecución)
```

Archivos en `__tests__/unit/`. Testean lógica pura (parsers, utilidades).

### E2E (Playwright)

Requieren el servidor corriendo en `http://localhost:3000`.

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run test:e2e                # headless
npm run test:e2e:report         # abre el reporte HTML
```

Archivos en `__tests__/e2e/`. Testean flujos completos: envío de mensaje, streaming, historial, selector de modelo.

---

## Agregar una API route

1. Crear `app/api/mi-ruta/route.ts`
2. Exportar handlers: `GET`, `POST`, `DELETE`, etc.
3. Usar `auth()` para verificar sesión si se necesita

```ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })
  // ...
  return Response.json(data)
}
```

---

## Agregar un modelo

Los modelos los provee Ollama. Para agregar uno:

```bash
ollama pull nombre-del-modelo
```

Aparece automáticamente en el selector de la app al recargar (la ruta `/api/models` consulta `OLLAMA_URL/api/tags` en tiempo real).

---

## Agregar una skill

1. Crear `/skills/mi-skill.md` con el system prompt
2. Opcionalmente agregar frontmatter con `description`
3. Opcionalmente agregar icono en `ICON_MAP` en `app/api/skills/route.ts`
4. Reiniciar el servidor de desarrollo

Ver [SKILLS.md](SKILLS.md) para el formato completo.

---

## Variables de entorno en Docker

Para producción con Docker, las variables se pasan en `docker-compose.yml` o como secrets. Las mínimas obligatorias:

```env
AUTH_SECRET=<32 bytes aleatorios>
AUTH_GITHUB_ID=<id>
AUTH_GITHUB_SECRET=<secret>
OLLAMA_URL=http://tu-servidor-ollama:11434
```

Las que tienen default en `docker-compose.yml` y pueden quedarse como están:
- `DATABASE_URL` — apunta automáticamente al servicio `db`
- `DEFAULT_MODEL` — `deepseek-v4-flash:cloud`
- `NEXT_PUBLIC_APP_NAME` — `AI Asistente`

---

## Limpiar caché de Turbopack

Si hay errores raros de runtime que no corresponden al código actual:

```bash
rm -rf .next
npm run dev
```

---

## Prisma — comandos útiles

```bash
npx prisma studio          # UI visual de la base de datos
npx prisma migrate dev     # Crear nueva migración en desarrollo
npx prisma migrate deploy  # Aplicar migraciones en producción
npx prisma generate        # Regenerar cliente después de cambiar schema.prisma
npx prisma db push         # Sync schema sin migración (solo dev)
```
