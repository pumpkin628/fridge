"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Mic, MicOff, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  parseInventoryResponseSchema,
  type ParseInventoryResponse,
} from "@/lib/inventory-parse"
import { coerceItemUnit } from "@/lib/item-units"
import type { FridgeWithZones } from "@/lib/types"

type Props = {
  fridges: FridgeWithZones[]
  onApply: (data: ParseInventoryResponse) => void
}

/** 部分 TS lib 未含 Web Speech 型別 */
type WebSpeechRecognition = {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  stop: () => void
  onresult: ((this: void, ev: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null
  onerror: ((this: void) => void) | null
  onend: ((this: void) => void) | null
}

function getSpeechRecognition(): WebSpeechRecognition | null {
  if (typeof window === "undefined") return null
  const w = window as typeof window & {
    SpeechRecognition?: new () => WebSpeechRecognition
    webkitSpeechRecognition?: new () => WebSpeechRecognition
  }
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
  if (!Ctor) return null
  return new Ctor()
}

export function GroceryVoiceHelper({ fridges, onApply }: Props) {
  const [text, setText] = useState("")
  const [listening, setListening] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [lastHint, setLastHint] = useState<string | null>(null)
  const [speechError, setSpeechError] = useState<string | null>(null)
  const recRef = useRef<WebSpeechRecognition | null>(null)

  const stopListening = useCallback(() => {
    recRef.current?.stop()
    recRef.current = null
    setListening(false)
  }, [])

  useEffect(() => {
    return () => stopListening()
  }, [stopListening])

  function startListening() {
    setSpeechError(null)
    const rec = getSpeechRecognition()
    if (!rec) {
      setSpeechError("此瀏覽器不支援語音輸入，請改用 Chrome／Edge，或直接打字。")
      return
    }
    rec.lang = "zh-TW"
    rec.interimResults = false
    rec.continuous = false
    rec.onresult = (event: { results: ArrayLike<{ 0: { transcript: string } }> }) => {
      const said = Array.from(event.results)
        .map((r) => r[0]?.transcript ?? "")
        .join("")
        .trim()
      if (said) {
        setText((prev) => (prev ? `${prev} ${said}` : said))
      }
    }
    rec.onerror = () => {
      setSpeechError("語音辨識失敗，請確認已允許麥克風權限。")
      stopListening()
    }
    rec.onend = () => {
      setListening(false)
      recRef.current = null
    }
    recRef.current = rec
    setListening(true)
    rec.start()
  }

  async function parseAndApply() {
    const t = text.trim()
    if (!t) return
    setParsing(true)
    setLastHint(null)
    try {
      const res = await fetch("/api/parse-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t, fridges }),
      })
      const json = await res.json()
      if (!res.ok) {
        setLastHint(typeof json.error === "string" ? json.error : "解析失敗")
        return
      }
      const parsed = parseInventoryResponseSchema.safeParse(json)
      if (!parsed.success) {
        setLastHint("回傳格式異常，請重試。")
        return
      }
      const data = parsed.data
      data.unit = coerceItemUnit(data.unit)
      onApply(data)
      setLastHint(
        data.hint
          ? data.hint
          : "已帶入表單，請確認後再送出。"
      )
    } catch {
      setLastHint("網路錯誤，請稍後再試。")
    } finally {
      setParsing(false)
    }
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4" aria-hidden />
          語音／文字快速帶入
        </CardTitle>
        <CardDescription>
          用說的或打字，例如：「我買了兩罐牛奶放在一樓冷藏」。需設定{" "}
          <code className="text-xs">OPENAI_API_KEY</code>。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="在此輸入或點麥克風說話…"
          rows={3}
          className="text-base"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={listening ? "destructive" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => (listening ? stopListening() : startListening())}
          >
            {listening ? (
              <>
                <MicOff className="size-4" aria-hidden />
                停止聆聽
              </>
            ) : (
              <>
                <Mic className="size-4" aria-hidden />
                語音輸入
              </>
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            disabled={parsing || !text.trim()}
            onClick={() => void parseAndApply()}
          >
            <Sparkles className="size-4" aria-hidden />
            {parsing ? "解析中…" : "解析並帶入表單"}
          </Button>
        </div>
        {speechError ? (
          <p className="text-sm text-amber-700 dark:text-amber-400">{speechError}</p>
        ) : null}
        {lastHint ? (
          <p className="text-sm text-muted-foreground">{lastHint}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
