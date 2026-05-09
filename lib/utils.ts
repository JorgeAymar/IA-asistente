export function friendlyName(model: string): string {
  return model
    .replace(/:cloud$/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
