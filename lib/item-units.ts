/** 表單可選單位（與新增食材下拉一致） */
export const ITEM_UNITS = [
  "包",
  "盒",
  "瓶",
  "顆",
  "公斤",
  "公克",
  "份",
  "個",
  "條",
  "罐",
] as const

export type ItemUnit = (typeof ITEM_UNITS)[number]

export function coerceItemUnit(raw: string): string {
  const t = raw.trim()
  if (ITEM_UNITS.includes(t as ItemUnit)) return t
  const synonyms: Record<string, string> = {
    罐: "罐",
    樽: "瓶",
    盒: "盒",
    包: "包",
    袋: "包",
    入: "盒",
    杯: "份",
    台斤: "公斤",
    斤: "公斤",
    克: "公克",
    g: "公克",
    kg: "公斤",
  }
  return synonyms[t] ?? "個"
}
