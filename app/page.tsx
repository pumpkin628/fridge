import Link from "next/link"
import { Refrigerator, Search, ListPlus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { SetupWarning } from "@/components/setup-warning"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const supabase = await createClient()

  let fridgeCount = 0
  let itemCount = 0
  let loadError: string | null = null

  if (supabase) {
    const [fridgesRes, itemsRes] = await Promise.all([
      supabase.from("fridges").select("id", { count: "exact", head: true }),
      supabase.from("items").select("id", { count: "exact", head: true }),
    ])
    if (fridgesRes.error) loadError = fridgesRes.error.message
    else if (itemsRes.error) loadError = itemsRes.error.message
    else {
      fridgeCount = fridgesRes.count ?? 0
      itemCount = itemsRes.count ?? 0
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 p-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">家庭食材管理</h1>
        <p className="text-sm text-muted-foreground">
          記錄放在哪台冰箱、哪個區域，並追蹤剩餘數量。
        </p>
      </header>

      {!supabase ? (
        <SetupWarning />
      ) : loadError ? (
        <Card className="border-destructive/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-destructive">
              無法讀取資料
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {loadError}。請確認已執行 <code className="text-xs">supabase/schema.sql</code>{" "}
            且環境變數正確。
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-1">
              <CardDescription>冰箱</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{fridgeCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardDescription>食材筆數</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{itemCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">快速操作</h2>
        <div className="grid gap-3">
          <Link
            href="/items"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-12 justify-start gap-3 px-4 text-base"
            )}
          >
            <Search className="size-5 shrink-0" aria-hidden />
            查看／搜尋食材
          </Link>
          <Link
            href="/items/new"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-12 justify-start gap-3 px-4 text-base"
            )}
          >
            <ListPlus className="size-5 shrink-0" aria-hidden />
            新增食材
          </Link>
          <Link
            href="/fridges"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-12 justify-start gap-3 px-4 text-base"
            )}
          >
            <Refrigerator className="size-5 shrink-0" aria-hidden />
            管理冰箱與區域
          </Link>
        </div>
      </section>
    </main>
  )
}
