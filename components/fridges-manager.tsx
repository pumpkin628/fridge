"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import type { FridgeWithZones, Zone } from "@/lib/types"

export function FridgesManager() {
  const [fridges, setFridges] = useState<FridgeWithZones[]>([])
  const [loading, setLoading] = useState(true)
  const [fridgeName, setFridgeName] = useState("")
  const [zoneNames, setZoneNames] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: qErr } = await supabase
        .from("fridges")
        .select("id, name, zones(id, fridge_id, name)")
        .order("name")
      if (qErr) {
        setError(qErr.message)
        return
      }
      const rows = (data ?? []).map((f) => ({
        id: f.id,
        name: f.name,
        zones: [...(f.zones as Zone[])].sort((a, b) =>
          a.name.localeCompare(b.name, "zh-Hant")
        ),
      }))
      setFridges(rows)
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function addFridge(e: React.FormEvent) {
    e.preventDefault()
    const name = fridgeName.trim()
    if (!name) return
    setError(null)
    try {
      const supabase = createClient()
      const { error: insErr } = await supabase.from("fridges").insert({ name })
      if (insErr) {
        setError(insErr.message)
        return
      }
      setFridgeName("")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "新增失敗")
    }
  }

  async function addZone(fridgeId: string) {
    const raw = (zoneNames[fridgeId] ?? "").trim()
    if (!raw) return
    setError(null)
    try {
      const supabase = createClient()
      const { error: insErr } = await supabase
        .from("zones")
        .insert({ fridge_id: fridgeId, name: raw })
      if (insErr) {
        setError(insErr.message)
        return
      }
      setZoneNames((prev) => ({ ...prev, [fridgeId]: "" }))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "新增區域失敗")
    }
  }

  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">載入中…</p>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">新增冰箱</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addFridge} className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={fridgeName}
              onChange={(e) => setFridgeName(e.target.value)}
              placeholder="例如：一樓冰箱"
              className="text-base sm:flex-1"
            />
            <Button type="submit" className="h-11 shrink-0 sm:w-auto">
              新增
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="space-y-4">
        {fridges.map((f) => (
          <li key={f.id}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{f.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    區域
                  </p>
                  {f.zones.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      尚無區域，請新增（例如：冷藏、冷凍）。
                    </p>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {f.zones.map((z) => (
                        <li
                          key={z.id}
                          className="rounded-full border bg-muted/50 px-3 py-1 text-sm"
                        >
                          {z.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="space-y-2 border-t pt-3">
                  <Label htmlFor={`zone-${f.id}`}>新增區域</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id={`zone-${f.id}`}
                      value={zoneNames[f.id] ?? ""}
                      onChange={(e) =>
                        setZoneNames((prev) => ({
                          ...prev,
                          [f.id]: e.target.value,
                        }))
                      }
                      placeholder="例如：冷藏、左門"
                      className="text-base sm:flex-1"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-11 shrink-0"
                      onClick={() => addZone(f.id)}
                    >
                      加入區域
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      {fridges.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          尚無冰箱，請先新增一台。
        </p>
      ) : null}
    </div>
  )
}
