"use client"

import React, { createContext, useState, useContext, ReactNode } from "react"

interface SelectedCompanyContextType {
  selectedCompanyId: string | null
  setSelectedCompanyId: (id: string | null) => void
}

const SelectedCompanyContext = createContext<SelectedCompanyContextType | undefined>(undefined)

export function SelectedCompanyProvider({ children }: { children: ReactNode }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)

  return (
    <SelectedCompanyContext.Provider value={{ selectedCompanyId, setSelectedCompanyId }}>
      {children}
    </SelectedCompanyContext.Provider>
  )
}

export function useSelectedCompany() {
  const context = useContext(SelectedCompanyContext)
  if (context === undefined) {
    throw new Error("useSelectedCompany must be used within a SelectedCompanyProvider")
  }
  return context
}