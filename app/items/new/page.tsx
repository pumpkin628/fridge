import { createClient } from "@/lib/supabase/server"
import { NewItemForm } from "@/components/new-item-form"
import { SetupWarning } from "@/components/setup-warning"
import type { FridgeWithZones, Zone } from "@/lib/types"

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

export default async function NewItemPage() {
  const supabase = await createClient()

  if (!supabase) {
    return (
      <main className="mx-auto flex max-w-lg flex-col gap-4 p-4">
        <h1 className="text-xl font-semibold">新增食材</h1>
        <SetupWarning />
      </main>
    )
  }

  const { data: fridgeData, error } = await supabase
    .from("fridges")
    .select("id, name, zones(id, fridge_id, name)")
    .order("name")

  if (error) {
    return (
      <main className="mx-auto flex max-w-lg flex-col gap-4 p-4">
        <h1 className="text-xl font-semibold">新增食材</h1>
        <p className="text-sm text-destructive">{error.message}</p>
      </main>
    )
  }

  const fridges = mapFridges(fridgeData)

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">新增食材</h1>
      <NewItemForm fridges={fridges} />
    </main>
  )
}
