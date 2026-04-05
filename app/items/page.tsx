import { createClient } from "@/lib/supabase/server"
import { SetupWarning } from "@/components/setup-warning"
import { ItemRow } from "@/components/item-row"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { embedName } from "@/lib/embed"
import { asNumber } from "@/lib/number"
import type { FridgeWithZones, ItemRow as ItemRowType, Zone } from "@/lib/types"

export const dynamic = "force-dynamic"

function mapFridges(data: unknown): FridgeWithZones[] {
  const rows = (data ?? []) as {
    id: string
    name: string
    zones: Zone[] | null
  }[]
  return rows.map((f) => ({
    id: f.id,
    name: f.name,
    zones: [...(f.zones ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name, "zh-Hant")
    ),
  }))
}

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const term = q?.trim() ?? ""
  const supabase = await createClient()

  if (!supabase) {
    return (
      <main className="mx-auto flex max-w-lg flex-col gap-4 p-4">
        <h1 className="text-xl font-semibold">食材清單</h1>
        <SetupWarning />
      </main>
    )
  }

  let itemsQuery = supabase
    .from("items")
    .select(
      "id, name, quantity, unit, fridge_id, zone_id, purchase_date, notes, fridges(name), zones(name)"
    )
    .order("updated_at", { ascending: false })

  if (term) {
    itemsQuery = itemsQuery.ilike("name", `%${term}%`)
  }

  const { data: rawItems, error: itemsErr } = await itemsQuery

  const { data: fridgeData, error: fridgeErr } = await supabase
    .from("fridges")
    .select("id, name, zones(id, fridge_id, name)")
    .order("name")

  const fridges = mapFridges(fridgeData)
  const items: ItemRowType[] = (rawItems ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    quantity: asNumber(row.quantity),
    unit: row.unit,
    fridge_id: row.fridge_id,
    zone_id: row.zone_id,
    purchase_date: row.purchase_date,
    notes: row.notes,
    fridges: embedName(row.fridges),
    zones: embedName(row.zones),
  }))

  const listError = itemsErr?.message ?? fridgeErr?.message ?? null

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">食材清單</h1>

      <form method="get" action="/items" className="flex gap-2">
        <Input
          name="q"
          defaultValue={term}
          placeholder="搜尋食材名稱"
          className="text-base"
          aria-label="搜尋食材名稱"
        />
        <Button type="submit" variant="secondary" className="shrink-0">
          搜尋
        </Button>
      </form>

      {term ? (
        <p className="text-sm text-muted-foreground">
          關鍵字「{term}」：{items.length} 筆
        </p>
      ) : null}

      {listError ? (
        <p className="text-sm text-destructive" role="alert">
          {listError}
        </p>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {term ? "找不到符合的食材。" : "尚無食材，請到「新增」建立一筆。"}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <ItemRow item={item} fridges={fridges} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
