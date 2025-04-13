"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSelectedCompany } from "@/contexts/selected-company-context"
import { useEffect, useState } from "react"

interface Company {
  id: string
  name: string
  color: string
  adminId?: string
}

interface CompanyAssociation {
  companyId: string
  adminId?: string
}

export function CompanySelector({ role }: { role: "admin" | "employee" }) {
  const [companies, setCompanies] = useState<Company[]>([])
  const { selectedCompanyId, setSelectedCompanyId } = useSelectedCompany()

  useEffect(() => {
    const loadCompanies = () => {
      try {
        const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
        if (!currentUser) return []

        const allCompanies = JSON.parse(localStorage.getItem("companies") || "[]")
        
        // Para administradores, mostrar solo las compañías que administran
        if (role === "admin") {
          return allCompanies.filter((company: Company) => company.adminId === currentUser.id)
        }
        
        // Para empleados, mostrar las compañías a las que pertenecen
        if (role === "employee" && currentUser.companies) {
          console.log("User companies:", currentUser.companies)
          return currentUser.companies
            .map((assoc: CompanyAssociation) => {
              const company = allCompanies.find((c: Company) => c.id === assoc.companyId)
              console.log(`Looking for company ${assoc.companyId}:`, company)
              return company
            })
            .filter(Boolean)
        }
        
        return []
      } catch (error) {
        console.error("Error loading companies:", error)
        return []
      }
    }

    const userCompanies = loadCompanies()
    console.log("Loaded companies:", userCompanies)
    setCompanies(userCompanies)
    
    // Seleccionar la primera compañía si no hay ninguna seleccionada
    if (userCompanies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(userCompanies[0].id)
    }
  }, [role, selectedCompanyId, setSelectedCompanyId])

  // Obtener el nombre de la compañía seleccionada
  const selectedCompany = companies.find(c => c.id === selectedCompanyId)

  return (
    <Select value={selectedCompanyId || ""} onValueChange={setSelectedCompanyId}>
      <SelectTrigger className="w-full md:w-[300px]">
        <div className="flex items-center">
          {selectedCompany && (
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: selectedCompany.color }}
            />
          )}
          <SelectValue placeholder="Select a company">
            {selectedCompany ? selectedCompany.name : "Select a company"}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {companies.map((company) => (
          <SelectItem key={company.id} value={company.id}>
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: company.color }}
              />
              {company.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
