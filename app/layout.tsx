import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SelectedCompanyProvider } from "@/contexts/selected-company-context"
import { AuthProvider } from "@/contexts/auth-context"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Document Control System",
  description: "Manage document uploads and approvals for your organization",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <SelectedCompanyProvider>
              {children}
              <Toaster />
            </SelectedCompanyProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}