# Skills — Guía completa

Las skills determinan cómo responde el modelo. Cada skill es un **system prompt** empaquetado en un archivo `.md` con frontmatter opcional.

---

## Crear una skill

### Formato mínimo

```markdown
# Nombre de la Skill

Eres un experto en X. Cuando el usuario pregunte...
```

### Formato completo (recomendado)

```markdown
---
name: mi-skill
description: Una línea que describe qué hace esta skill. Aparece en el tooltip del selector.
---

# Mi Skill

Eres un [rol]. Tu objetivo es [objetivo].

## Cómo respondes
- Punto 1
- Punto 2

## Reglas
- Siempre...
- Nunca...
```

Guarda el archivo en `/skills/mi-skill.md` y reinicia el servidor. La skill aparece automáticamente ordenada alfabéticamente en el selector.

---

## Frontmatter

| Campo | Tipo | Uso |
|-------|------|-----|
| `name` | string | ID interno (ignorado — se usa el nombre del archivo) |
| `description` | string | Preview de 1 línea en la toolbar del input |

Cualquier otro campo del frontmatter es ignorado.

---

## Iconos

El icono se asigna en `app/api/skills/route.ts` en el objeto `ICON_MAP`:

```ts
const ICON_MAP: Record<string, string> = {
  "mi-skill": "🎯",
  // ...
}
```

Si el id no está en el mapa, usa `✨` por defecto.

---

## Skills disponibles

### Negocios y emprendimiento

| Archivo | Nombre | Descripción |
|---------|--------|-------------|
| `emprendimiento.md` | Asesor de Emprendimiento | Customer discovery, Steve Blank |
| `plan-negocios.md` | Plan de Negocios | Estructurar y validar un plan |
| `lean-startup.md` | Lean Startup | Build-Measure-Learn, Eric Ries |
| `lean-startup-100.md` | Lean Startup $100 | Negocios con capital mínimo |
| `mba-esencial.md` | MBA Esencial | Conceptos de MBA aplicados |
| `okrs-estrategia.md` | OKRs y Estrategia | Objectives & Key Results |

### Ventas

| Archivo | Nombre | Descripción |
|---------|--------|-------------|
| `hacking-sales.md` | Hacking Sales | Ventas basadas en datos |
| `sales-copywriting.md` | Sales Copywriting | Copy que convierte |
| `psicologia-ventas.md` | Psicología de Ventas | Principios de influencia |
| `negociacion.md` | Negociación | Técnicas de negociación |
| `russell-brunson.md` | Russell Brunson | Funnels y marketing de respuesta directa |
| `alex-hormozi.md` | Alex Hormozi | Ofertas irresistibles, $100M |

### Marketing y crecimiento

| Archivo | Nombre | Descripción |
|---------|--------|-------------|
| `growth-hacking.md` | Growth Hacking | Crecimiento acelerado |
| `growth-linkedin.md` | LinkedIn Growth | Estrategia en LinkedIn |
| `digital-agency.md` | Agencia Digital | Operaciones de agencia |
| `ecommerce.md` | E-Commerce | Tiendas en línea |
| `retail-strategy.md` | Retail Strategy | Estrategia retail |
| `iman-gadzhi.md` | Iman Gadzhi | SMMA y agencias |

### Finanzas

| Archivo | Nombre | Descripción |
|---------|--------|-------------|
| `finanzas-pyme.md` | Finanzas PyME | Gestión financiera para PyMEs |
| `contabilidad-basica.md` | Contabilidad Básica | Conceptos contables |
| `bookkeeping.md` | Bookkeeping | Registro contable |
| `venture-capital.md` | Venture Capital | Inversión en startups |

### Tecnología

| Archivo | Nombre | Descripción |
|---------|--------|-------------|
| `dev-skills.md` | Dev Skills | Habilidades de desarrollo |
| `dev-career.md` | Dev Career | Carrera en tecnología |
| `machine-learning.md` | Machine Learning | ML y data science |
| `saas-builder.md` | SaaS Builder | Construir productos SaaS |
| `ai-agents.md` | AI Agents | Agentes de IA |

### Ciberseguridad

| Archivo | Nombre | Descripción |
|---------|--------|-------------|
| `cybersecurity.md` | Cybersecurity | Seguridad informática |
| `ethical-hacking.md` | Ethical Hacking | Pentesting y hacking ético |
| `network-security.md` | Network Security | Seguridad de redes |
| `cloud-security.md` | Cloud Security | Seguridad en la nube |
| `red-teaming.md` | Red Teaming | Simulación de ataques |
| `malware-forense.md` | Malware Forense | Análisis de malware |

### Estrategia

| Archivo | Nombre | Descripción |
|---------|--------|-------------|
| `mckinsey-strategy.md` | McKinsey Strategy | Frameworks de consultoría estratégica |
| `business-analysis.md` | Business Analysis | Análisis de negocio |
| `storytelling.md` | Storytelling | Narrativa y comunicación |
| `dark-psychology.md` | Dark Psychology | Psicología de la persuasión |
| `habitos-productividad.md` | Hábitos y Productividad | GTD y sistemas de productividad |

### Otros

| Archivo | Nombre | Descripción |
|---------|--------|-------------|
| `dan-martel.md` | Dan Martell | SaaS y mentoring |
| `jaime-higuera.md` | Jaime Higuera | Ventas para LATAM |
| `sean-ellis.md` | Sean Ellis | Product-market fit |
| `producto.md` | Producto | Product management |
| `precio-estrategia.md` | Precio y Estrategia | Pricing strategy |

---

## Parseo interno

El archivo `app/api/skills/route.ts` parsea los `.md` con un parser manual (sin dependencias externas) que:

1. Detecta si hay frontmatter (`---`)
2. Extrae `description` del frontmatter con regex
3. Extrae el `label` del primer H1 del body (`# Título`)
4. Si no hay H1, convierte el nombre del archivo a title case
5. Devuelve `{ id, label, icon, prompt, description }`

El `prompt` es **todo el body** (sin frontmatter), que se envía a Ollama como system prompt.
