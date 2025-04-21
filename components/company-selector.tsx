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
    const loadCompanies = async () => {
      try {
        // Intentar obtener el usuario actual de localStorage (con ambas claves posibles)
        let storedUser = localStorage.getItem("currentUser")
        if (!storedUser) {
          storedUser = localStorage.getItem("usuarioActual")
        }
        
        if (!storedUser) {
          console.warn("No se encontró información del usuario")
          return []
        }
        
        const currentUser = JSON.parse(storedUser)
        if (!currentUser || !currentUser.id) {
          console.warn("Información de usuario incompleta")
          return []
        }

        // Importar las funciones de Firebase
        const { db } = await import('@/app/firebaseConfig')
        const { collection, query, where, getDocs, doc, getDoc } = await import('firebase/firestore')
        
        let companiesData: Company[] = []
        
        // Para administradores, obtener compañías donde son administradores
        if (role === "admin") {
          const companiesRef = collection(db, "companies")
          const q = query(companiesRef, where("adminId", "==", currentUser.id))
          const querySnapshot = await getDocs(q)
          
          companiesData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Company[]
        }
        // Para empleados, obtener compañías a las que pertenecen
        else if (role === "employee" && currentUser.companies) {
          // Obtener el documento del usuario para asegurarnos de tener los datos actualizados
          const userDocRef = doc(db, "users", currentUser.id)
          const userDocSnap = await getDoc(userDocRef)
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data()
            const userCompanies = userData.companies || []
            
            // Obtener los datos de cada compañía
            const companyPromises = userCompanies.map(async (assoc: CompanyAssociation) => {
              const companyDocRef = doc(db, "companies", assoc.companyId)
              const companyDocSnap = await getDoc(companyDocRef)
              
              if (companyDocSnap.exists()) {
                return {
                  id: companyDocSnap.id,
                  ...companyDocSnap.data(),
                } as Company
              }
              return null
            })
            
            const companyResults = await Promise.all(companyPromises)
            companiesData = companyResults.filter(Boolean) as Company[]
          }
        }
        
        // Fallback a localStorage si no hay datos en Firestore
        if (companiesData.length === 0) {
          console.warn("No se encontraron empresas en Firestore, intentando con localStorage")
          const allCompanies = JSON.parse(localStorage.getItem("companies") || "[]")
          
          if (role === "admin") {
            companiesData = allCompanies.filter((company: Company) => company.adminId === currentUser.id)
          } else if (role === "employee" && currentUser.companies) {
            companiesData = currentUser.companies
              .map((assoc: CompanyAssociation) => {
                return allCompanies.find((c: Company) => c.id === assoc.companyId)
              })
              .filter(Boolean)
          }
        }
        
        return companiesData
      } catch (error) {
        console.error("Error cargando empresas:", error)
        return []
      }
    }

    // Cargar las empresas
    loadCompanies().then(userCompanies => {
      console.log("Empresas cargadas:", userCompanies)
      setCompanies(userCompanies)
      
      // Seleccionar la primera compañía si no hay ninguna seleccionada y hay compañías disponibles
      if (userCompanies.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(userCompanies[0].id)
      } else if (userCompanies.length === 0) {
        // Si no hay compañías, asegurarse de que selectedCompanyId sea null
        setSelectedCompanyId(null)
      }
    })
  }, [role, selectedCompanyId, setSelectedCompanyId])

  // Obtener el nombre de la compañía seleccionada
  const selectedCompany = companies.find(c => c.id === selectedCompanyId)

  // Si no hay compañías disponibles, mostrar un mensaje
  if (companies.length === 0) {
    return (
      <div className="text-sm text-muted-foreground px-4 py-2 border rounded-md">
        No hay empresas disponibles
      </div>
    )
  }

  return (
    <Select value={selectedCompanyId || ""} onValueChange={setSelectedCompanyId}>
      <SelectTrigger className="w-full md:w-[300px]">
        <div className="flex items-center">
          {selectedCompany && (
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: selectedCompany?.color || "#ccc" }}
            />
          )}
          <SelectValue placeholder="Seleccionar empresa">
            {selectedCompany ? selectedCompany.name : "Seleccionar empresa"}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {companies.map((company) => (
          <SelectItem key={company.id} value={company.id}>
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: company.color || "#ccc" }}
              />
              {company.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
