"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
  const [consuming, setConsuming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const zoneOptions = useMemo(
    () => zonesForFridge(fridges, fridgeId),
    [fridges, fridgeId]
  )

  const canConsume = item.quantity > 0

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

  function openMoveSheet() {
    resetFromItem()
    setOpen(true)
  }

  async function consumeOne() {
    if (!canConsume || consuming) return
    setError(null)
    setConsuming(true)
    try {
      const supabase = createClient()
      const nextQty = Math.max(0, Number(item.quantity) - 1)
      const { error: upErr } = await supabase
        .from("items")
        .update({
          quantity: nextQty,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id)
      if (upErr) {
        setError(upErr.message)
        return
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失敗")
    } finally {
      setConsuming(false)
    }
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
    <div className="flex gap-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger
          type="button"
          className={cn(
            "min-w-0 flex-1 rounded-none p-4 text-left transition-colors",
            "hover:bg-accent/30 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          )}
        >
          <p className="font-medium text-foreground">{item.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {item.fridges?.name ?? "—"} · {item.zones?.name ?? "—"}
          </p>
          <p className="mt-1 text-sm font-medium text-primary">
            剩餘 {item.quantity} {item.unit}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">點此編輯詳情</p>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="max-h-[88vh] overflow-y-auto rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <form onSubmit={onSave}>
            <SheetHeader>
              <SheetTitle>編輯：{item.name}</SheetTitle>
              <SheetDescription>
                可「用掉 1」單位、修改數量，或選擇其他冰箱與區域後按儲存完成移動。
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-4 px-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 flex-1 text-base"
                  disabled={!canConsume || consuming}
                  onClick={() => void consumeOne()}
                >
                  {consuming
                    ? "處理中…"
                    : canConsume
                      ? `用掉 1 ${item.unit}`
                      : "已無庫存"}
                </Button>
              </div>
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
              <div className="space-y-2 border-t pt-4">
                <p className="text-sm font-medium">移動到別的冰箱</p>
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
      <div className="flex w-[5.25rem] shrink-0 flex-col justify-center gap-1.5 border-l border-border bg-muted/30 p-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-9 w-full px-1 text-xs leading-tight"
          disabled={!canConsume || consuming}
          onClick={() => void consumeOne()}
        >
          用掉 1
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 w-full px-1 text-xs leading-tight"
          onClick={openMoveSheet}
        >
          移動冰箱
        </Button>
      </div>
    </div>
  )
}
