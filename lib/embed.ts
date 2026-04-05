/** Supabase 單一外鍵關聯有時推斷為物件或陣列，統一成 { name } */
export function embedName(
  value: unknown
): { name: string } | null {
  if (value == null) return null
  const row = Array.isArray(value) ? value[0] : value
  if (row && typeof row === "object" && "name" in row) {
    const n = (row as { name: unknown }).name
    if (typeof n === "string") return { name: n }
  }
  return null
}
