import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SetupWarning() {
  return (
    <Card className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">請設定 Supabase</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          複製專案根目錄的{" "}
          <code className="rounded bg-amber-100 px-1 py-0.5 text-xs dark:bg-amber-900/60">
            .env.local.example
          </code>{" "}
          為{" "}
          <code className="rounded bg-amber-100 px-1 py-0.5 text-xs dark:bg-amber-900/60">
            .env.local
          </code>
          ，填入 URL 與 anon key；並在 Supabase 執行{" "}
          <code className="rounded bg-amber-100 px-1 py-0.5 text-xs dark:bg-amber-900/60">
            supabase/schema.sql
          </code>
          。
        </p>
      </CardContent>
    </Card>
  )
}
