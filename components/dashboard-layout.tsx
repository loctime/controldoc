"use client"

import React from "react"
import { MainNav } from "@/components/main-nav"
import { CompanySelector } from "@/components/company-selector"
import { SelectedCompanyProvider } from "@/contexts/selected-company-context"
import type { Role } from "@/types"

interface DashboardLayoutProps {
  children: React.ReactNode
  role: Role
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  return (
    <SelectedCompanyProvider>
      <div className="flex min-h-screen flex-col">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <MainNav role={role} />
            <div className="ml-auto flex items-center space-x-4">
              <CompanySelector role={role} />
            </div>
          </div>
        </div>
        <div className="flex-1 p-8">
          {children}
        </div>
      </div>
    </SelectedCompanyProvider>
  )
}
