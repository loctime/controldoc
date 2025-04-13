"use client"

import React from "react"
import { MainNav } from "@/components/main-nav"
import { CompanySelector } from "@/components/company-selector"
import type { Role } from "@/types"

interface DashboardLayoutProps {
  children: React.ReactNode
  role: Role
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <MainNav role={role} />
      <CompanySelector role={role} />
      <div className="flex-1 p-8">
        {children}
      </div>
    </div>
  )
}
