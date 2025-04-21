"use client"

import { cn } from "@/lib/utils"
import { Building, FileText, Home, LogOut, Settings, Upload, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "./theme-toggle"

interface MainNavProps {
  role: "admin" | "employee"
}

export function MainNav({ role }: MainNavProps) {
  const pathname = usePathname()

  const adminLinks = [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/companies", label: "Companies", icon: Building },
    { href: "/admin/documents", label: "Documents", icon: FileText },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/uploads", label: "Uploads", icon: Upload },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ]

  const employeeLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/uploads", label: "My Uploads", icon: Upload },
    { href: "/documents", label: "Required Documents", icon: FileText },
    { href: "/settings", label: "Settings", icon: Settings },
  ]

  const links = role === "admin" ? adminLinks : employeeLinks

  return (
    <>
      <div className="flex items-center space-x-4">
        <Link href="/" className="font-bold text-xl">
          Control de documentos
        </Link>
      </div>
      <nav className="mx-6 flex items-center space-x-4 lg:space-x-6">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center text-sm font-medium transition-colors hover:text-primary",
                pathname === link.href ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="mr-2 h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
      </nav>
      <div className="ml-auto flex items-center space-x-4">
        <ThemeToggle />
        <Link
          href="/logout"
          className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Link>
      </div>
    </>
  )
}
