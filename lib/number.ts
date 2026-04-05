export function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}
