"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"
import type { FridgeWithZones, ItemRow } from "@/lib/types"
import { cn } from "@/lib/utils"

function zonesForFridge(fridges: FridgeWithZones[], fridgeId: string) {
  const f = fridges.find((x) => x.id === fridgeId)
  return f?.zones ?? []
}

type ItemRowProps = {
  item: ItemRow
  fridges: FridgeWithZones[]
}

export function ItemRow({ item, fridges }: ItemRowProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [quantity, setQuantity] = useState(String(item.quantity))
  const [fridgeId, setFridgeId] = useState(item.fridge_id)
  const [zoneId, setZoneId] = useState(item.zone_id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const zoneOptions = useMemo(
    () => zonesForFridge(fridges, fridgeId),
    [fridges, fridgeId]
  )

  function resetFromItem() {
    setQuantity(String(item.quantity))
    setFridgeId(item.fridge_id)
    setZoneId(item.zone_id)
    setError(null)
  }

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next) resetFromItem()
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const q = Number(quantity)
    if (!Number.isFinite(q) || q < 0) {
      setError("請輸入有效的數量")
      return
    }
    const zIds = new Set(zoneOptions.map((z) => z.id))
    if (!zIds.has(zoneId)) {
      setError("請選擇有效的區域")
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const { error: upErr } = await supabase
        .from("items")
        .update({
          quantity: q,
          fridge_id: fridgeId,
          zone_id: zoneId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id)
      if (upErr) {
        setError(upErr.message)
        return
      }
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失敗")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger
        type="button"
        className={cn(
          "w-full rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors",
          "hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        <p className="font-medium text-foreground">{item.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {item.fridges?.name ?? "—"} · {item.zones?.name ?? "—"}
        </p>
        <p className="mt-1 text-sm font-medium text-primary">
          剩餘 {item.quantity} {item.unit}
        </p>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[88vh] overflow-y-auto rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <form onSubmit={onSave}>
          <SheetHeader>
            <SheetTitle>編輯：{item.name}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4 px-4">
            <div className="space-y-2">
              <Label htmlFor={`qty-${item.id}`}>數量</Label>
              <Input
                id={`qty-${item.id}`}
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="text-base"
              />
              <p className="text-xs text-muted-foreground">單位：{item.unit}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`fridge-${item.id}`}>冰箱</Label>
              <select
                id={`fridge-${item.id}`}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={fridgeId}
                onChange={(e) => {
                  const next = e.target.value
                  setFridgeId(next)
                  const zs = zonesForFridge(fridges, next)
                  setZoneId(zs[0]?.id ?? "")
                }}
              >
                {fridges.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`zone-${item.id}`}>區域</Label>
              <select
                id={`zone-${item.id}`}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                disabled={zoneOptions.length === 0}
              >
                {zoneOptions.length === 0 ? (
                  <option value="">請先在「冰箱」新增區域</option>
                ) : (
                  zoneOptions.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>
          <SheetFooter className="mt-6 flex-row gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? "儲存中…" : "儲存"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
