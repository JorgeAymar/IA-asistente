const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434"

export async function GET() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`)
    const data = await res.json()
    const models = (data.models ?? []).map((m: { name: string }) => m.name)
    return Response.json(models)
  } catch {
    return Response.json([])
  }
}
