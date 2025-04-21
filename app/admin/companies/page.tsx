"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Building, Copy, Plus, Users, Trash2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface Company {
  id: string
  name: string
  description?: string
  color: string
  adminId: string
  createdAt: Date
  users: string[]
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null)

  useEffect(() => {
    // Cargar empresas desde Firestore
    const loadCompanies = async () => {
      try {
        setLoading(true)
        
        // Obtener el usuario actual - intentar con ambas claves posibles
        let storedUser = localStorage.getItem("currentUser")
        
        // Si no existe, intentar con la versión en español
        if (!storedUser) {
          storedUser = localStorage.getItem("usuarioActual")
        }
        
        if (!storedUser) {
          console.warn("No se encontró información del usuario en localStorage")
          setCompanies([])
          setLoading(false)
          return
        }
        
        const currentUser = JSON.parse(storedUser)
        if (!currentUser || !currentUser.id) {
          console.warn("Información de usuario incompleta", currentUser)
          setCompanies([])
          setLoading(false)
          return
        }
        
        // Importar la función de Firebase
        const { getAdminCompanies } = await import('@/app/firebaseConfig')
        
        // Obtener las empresas del administrador desde Firestore
        const companiesData = await getAdminCompanies(currentUser.id)
        
        // Actualizar el estado
        setCompanies(companiesData)
      } catch (error) {
        console.error("Error loading companies from Firestore:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las empresas. Por favor, intenta de nuevo.",
          variant: "destructive",
        })
        setCompanies([])
      } finally {
        setLoading(false)
      }
    }

    loadCompanies()
  }, [])

  async function generateInviteLink(companyId: string) {
    try {
      // Obtener el usuario actual - intentar con ambas claves posibles
      let storedUser = localStorage.getItem("currentUser")
      
      // Si no existe, intentar con la versión en español
      if (!storedUser) {
        storedUser = localStorage.getItem("usuarioActual")
      }
      
      if (!storedUser) {
        toast({
          title: "Error",
          description: "No se pudo generar el enlace de invitación. Por favor, inicia sesión nuevamente.",
          variant: "destructive",
        })
        return
      }
      
      const currentUser = JSON.parse(storedUser)
      if (!currentUser || !currentUser.id) {
        toast({
          title: "Error",
          description: "Información de usuario incompleta. Por favor, inicia sesión nuevamente.",
          variant: "destructive",
        })
        return
      }

      // Buscar la compañía en Firestore
      const { db } = await import('@/app/firebaseConfig')
      const { doc, getDoc } = await import('firebase/firestore')
      
      // Obtener el documento de la compañía
      const companyRef = doc(db, "companies", companyId)
      const companySnap = await getDoc(companyRef)
      
      if (!companySnap.exists()) {
        // Intentar buscar en localStorage como fallback
        const companies = JSON.parse(localStorage.getItem("companies") || "[]")
        const company = companies.find((c: Company) => c.id === companyId)
        
        if (!company) {
          toast({
            title: "Error",
            description: "No se encontró la información de la empresa.",
            variant: "destructive",
          })
          return
        }
        
        // Generar URL con los datos de localStorage
        const inviteUrl = `${window.location.origin}/register/employee?companyId=${companyId}&adminId=${currentUser.id}&companyName=${encodeURIComponent(company.name)}&companyColor=${encodeURIComponent(company.color)}`
        navigator.clipboard.writeText(inviteUrl)
      } else {
        // Obtener los datos de la compañía desde Firestore
        const companyData = companySnap.data()
        
        // Generar URL con los datos de Firestore
        const inviteUrl = `${window.location.origin}/register/employee?companyId=${companyId}&adminId=${currentUser.id}&companyName=${encodeURIComponent(companyData.name)}&companyColor=${encodeURIComponent(companyData.color)}`
        navigator.clipboard.writeText(inviteUrl)
      }

      toast({
        title: "Copiado al portapapeles",
        description: "El enlace de invitación ha sido copiado al portapapeles.",
      })
    } catch (error) {
      console.error("Error generating invitation link:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el enlace de invitación. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    }
  }
  
  async function handleDeleteCompany() {
    if (!companyToDelete) return;
    
    try {
      setLoading(true);
      
      // Importar la función de Firebase
      const { deleteCompany } = await import('@/app/firebaseConfig');
      
      // Eliminar la compañía
      const success = await deleteCompany(companyToDelete);
      
      if (success) {
        // Actualizar la lista de compañías
        setCompanies(companies.filter(company => company.id !== companyToDelete));
        
        toast({
          title: "Company deleted",
          description: "The company has been successfully deleted.",
        });
      } else {
        toast({
          title: "Error",
          description: "Could not delete the company. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setOpenDeleteDialog(false);
      setCompanyToDelete(null);
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Companies</h2>
        <Link href="/admin/companies/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="mt-6">Loading companies...</div>
      ) : companies.length === 0 ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>No Companies</CardTitle>
            <CardDescription>You haven't created any companies yet.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/admin/companies/new" className="w-full">
              <Button className="w-full">
                <Building className="mr-2 h-4 w-4" />
                Create Your First Company
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id} className="flex flex-col">
              <div className="h-2" style={{ backgroundColor: company.color }} />
              <CardHeader>
                <CardTitle>{company.name}</CardTitle>
                <CardDescription>{company.description || "No description provided"}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="mr-2 h-4 w-4" />
                  <span>{company.users.length} employees</span>
                </div>
                <div className="mt-4 text-sm">
                  <span className="font-medium">Created:</span> {new Date(company.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button variant="outline" className="w-full" onClick={() => generateInviteLink(company.id)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Invitation Link
                </Button>
                <Button variant="outline" className="w-full" onClick={() => {
                  setCompanyToDelete(company.id);
                  setOpenDeleteDialog(true);
                }}>
                  <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                  <span className="text-destructive">Delete Company</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que quieres eliminar esta compañía?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los datos asociados a esta compañía, incluyendo los documentos requeridos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteCompany();
              }}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
