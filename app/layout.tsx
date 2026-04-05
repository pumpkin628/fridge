import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { BottomNav } from "@/components/bottom-nav"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "家庭食材管理",
  description: "記錄食材所在冰箱、區域與數量",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <div className="flex flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  )
}
