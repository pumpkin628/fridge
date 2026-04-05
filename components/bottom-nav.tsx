"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ListPlus, Refrigerator, Search } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "首頁", icon: Home },
  { href: "/items", label: "食材", icon: Search },
  { href: "/items/new", label: "新增", icon: ListPlus },
  { href: "/fridges", label: "冰箱", icon: Refrigerator },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80"
      aria-label="主要導覽"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around gap-1 px-2 pt-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-xs font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
