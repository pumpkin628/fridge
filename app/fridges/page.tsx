import { createClient } from "@/lib/supabase/server"
import { FridgesManager } from "@/components/fridges-manager"
import { SetupWarning } from "@/components/setup-warning"

export const dynamic = "force-dynamic"

export default async function FridgesPage() {
  const supabase = await createClient()

  if (!supabase) {
    return (
      <main className="mx-auto flex max-w-lg flex-col gap-4 p-4">
        <h1 className="text-xl font-semibold">冰箱與區域</h1>
        <SetupWarning />
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-semibold">冰箱與區域</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          先建立冰箱，再為每台冰箱加上區域（冷藏、冷凍、門架等）。
        </p>
      </div>
      <FridgesManager />
    </main>
  )
}
