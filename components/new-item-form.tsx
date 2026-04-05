"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { GroceryVoiceHelper } from "@/components/grocery-voice-helper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import type { ParseInventoryResponse } from "@/lib/inventory-parse"
import { ITEM_UNITS, coerceItemUnit } from "@/lib/item-units"
import type { FridgeWithZones } from "@/lib/types"

function zonesForFridge(fridges: FridgeWithZones[], fridgeId: string) {
  return fridges.find((f) => f.id === fridgeId)?.zones ?? []
}

type Props = {
  fridges: FridgeWithZones[]
}

export function NewItemForm({ fridges }: Props) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [unit, setUnit] = useState("包")
  const [fridgeId, setFridgeId] = useState(() => fridges[0]?.id ?? "")
  const zoneOpts = useMemo(
    () => zonesForFridge(fridges, fridgeId),
    [fridges, fridgeId]
  )
  const [zoneId, setZoneId] = useState(() => {
    const fid = fridges[0]?.id
    if (!fid) return ""
    return zonesForFridge(fridges, fid)[0]?.id ?? ""
  })
  const [purchaseDate, setPurchaseDate] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applyFromAi = useCallback(
    (p: ParseInventoryResponse) => {
      setName(p.name)
      setQuantity(String(p.quantity))
      setUnit(coerceItemUnit(p.unit))
      if (p.fridge_id && fridges.some((f) => f.id === p.fridge_id)) {
        setFridgeId(p.fridge_id)
        const zs = zonesForFridge(fridges, p.fridge_id)
        if (p.zone_id && zs.some((z) => z.id === p.zone_id)) {
          setZoneId(p.zone_id)
        } else {
          setZoneId(zs[0]?.id ?? "")
        }
      }
      setPurchaseDate(p.purchase_date ?? "")
      setNotes(p.notes ?? "")
    },
    [fridges]
  )

  function syncZoneWhenFridgeChanges(nextFridgeId: string) {
    setFridgeId(nextFridgeId)
    const zs = zonesForFridge(fridges, nextFridgeId)
    setZoneId(zs[0]?.id ?? "")
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError("請填寫食材名稱")
      return
    }
    const q = Number(quantity)
    if (!Number.isFinite(q) || q < 0) {
      setError("請輸入有效的數量")
      return
    }
    if (!fridgeId || !zoneId) {
      setError("請先至「冰箱」建立冰箱與區域")
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const { error: insErr } = await supabase.from("items").insert({
        name: name.trim(),
        quantity: q,
        unit,
        fridge_id: fridgeId,
        zone_id: zoneId,
        purchase_date: purchaseDate || null,
        notes: notes.trim() || null,
      })
      if (insErr) {
        setError(insErr.message)
        return
      }
      router.push("/items")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "新增失敗")
    } finally {
      setSaving(false)
    }
  }

  if (fridges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">尚無冰箱</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          請先到「冰箱」分頁新增至少一台冰箱與一個區域，再回來新增食材。
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <GroceryVoiceHelper fridges={fridges} onApply={applyFromAi} />
      <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">名稱</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：鮮奶"
          className="text-base"
          autoComplete="off"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="quantity">數量</Label>
          <Input
            id="quantity"
            inputMode="decimal"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">單位</Label>
          <select
            id="unit"
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          >
            {ITEM_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fridge">所在冰箱</Label>
        <select
          id="fridge"
          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          value={fridgeId}
          onChange={(e) => syncZoneWhenFridgeChanges(e.target.value)}
        >
          {fridges.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="zone">所在區域</Label>
        <select
          id="zone"
          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          value={zoneId}
          onChange={(e) => setZoneId(e.target.value)}
          disabled={zoneOpts.length === 0}
        >
          {zoneOpts.length === 0 ? (
            <option value="">請先為此冰箱新增區域</option>
          ) : (
            zoneOpts.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))
          )}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="purchaseDate">購買日期</Label>
        <Input
          id="purchaseDate"
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          className="text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">備註</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="可選"
          rows={3}
          className="text-base"
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="h-11 w-full text-base" disabled={saving}>
        {saving ? "送出中…" : "新增食材"}
      </Button>
    </form>
    </div>
  )
}
