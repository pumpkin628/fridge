import { NextResponse } from "next/server"
import OpenAI from "openai"
import { z } from "zod"
import { coerceItemUnit } from "@/lib/item-units"
import {
  parseInventoryRequestSchema,
  validateFridgeZonePair,
  type ParseInventoryResponse,
} from "@/lib/inventory-parse"

export const maxDuration = 30

const rawModelSchema = z.object({
  name: z.string(),
  quantity: z.number().nonnegative(),
  unit: z.string(),
  fridge_id: z.string().uuid().nullable().optional(),
  zone_id: z.string().uuid().nullable().optional(),
  purchase_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  hint: z.string().nullable().optional(),
})

function taipeiDateString(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei" }).format(
    new Date()
  )
}

function buildSystemPrompt(fridgesJson: string): string {
  const today = taipeiDateString()
  return `你是家庭冰箱食材紀錄助手。使用者會用繁體中文口語描述「買了什麼、多少、放在哪台冰箱哪個區域」。
今日日期（台北時區）：${today}。若使用者說「今天買、剛買」，purchase_date 請用此日期。
請只輸出一個 JSON 物件（不要 markdown），欄位如下：
- name: 食材名稱（簡短，例如 牛奶）
- quantity: 數字（幾罐、幾包）
- unit: 量詞，用繁體中文：包、盒、瓶、顆、公斤、公克、份、個、條、罐 之一
- fridge_id: 必須從下面列表選一台冰箱的 id；無法判斷時用 null
- zone_id: 必須是該冰箱底下某區域的 id，且與 fridge_id 對應；無法判斷時用 null
- purchase_date: "YYYY-MM-DD" 或 null（若說今天、剛買、今天買，用今天日期；未提及則 null）
- notes: 其他補充或 null
- hint: 簡短繁體中文說明為何 fridge/zone 填 null，或 null

規則：
1. fridge_id 與 zone_id 必須完全來自提供的列表，不可捏造 uuid。
2. 「冷藏、冷藏庫、冷藏室」盡量對應名稱含「冷藏」的區域；「冷凍」同理。
3. 「一樓」對應名稱含「一樓」的冰箱，以此類推。

目前冰箱與區域（JSON）：
${fridgesJson}`
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey?.trim()) {
    return NextResponse.json(
      { error: "伺服器未設定 OPENAI_API_KEY，請在 .env.local 加入後重啟。" },
      { status: 501 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "無效的 JSON" }, { status: 400 })
  }

  const parsedReq = parseInventoryRequestSchema.safeParse(body)
  if (!parsedReq.success) {
    return NextResponse.json({ error: "參數格式錯誤" }, { status: 400 })
  }

  const { text, fridges } = parsedReq.data
  if (fridges.length === 0) {
    return NextResponse.json(
      { error: "請先建立至少一台冰箱與區域。" },
      { status: 400 }
    )
  }

  const fridgesJson = JSON.stringify(
    fridges.map((f) => ({
      id: f.id,
      name: f.name,
      zones: f.zones.map((z) => ({ id: z.id, name: z.name })),
    })),
    null,
    0
  )

  const openai = new OpenAI({ apiKey })

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(fridgesJson) },
        { role: "user", content: text },
      ],
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) {
      return NextResponse.json({ error: "模型未回傳內容" }, { status: 502 })
    }

    let json: unknown
    try {
      json = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: "模型回傳非合法 JSON" }, { status: 502 })
    }

    const modelParsed = rawModelSchema.safeParse(json)
    if (!modelParsed.success) {
      return NextResponse.json({ error: "無法解析模型輸出" }, { status: 502 })
    }

    const m = modelParsed.data
    const unit = coerceItemUnit(m.unit)
    const pair = validateFridgeZonePair(fridges, m.fridge_id ?? null, m.zone_id ?? null)

    const hint =
      pair == null
        ? (m.hint?.trim() || "無法對應到現有冰箱或區域，請手動選擇。")
        : m.hint?.trim() || null

    const result: ParseInventoryResponse = {
      name: m.name.trim() || "未命名",
      quantity: m.quantity,
      unit,
      fridge_id: pair?.fridge_id ?? null,
      zone_id: pair?.zone_id ?? null,
      purchase_date: m.purchase_date?.trim() || null,
      notes: m.notes?.trim() || null,
      hint,
    }

    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : "OpenAI 請求失敗"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
