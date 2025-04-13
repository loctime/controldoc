"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Building, Copy, Plus, Users } from "lucide-react"
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

  useEffect(() => {
    // In a real app, this would be an API call
    const loadCompanies = () => {
      try {
        const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
        if (!currentUser || !currentUser.id) {
          return []
        }

        const allCompanies = JSON.parse(localStorage.getItem("companies") || "[]")
        return allCompanies.filter((company: Company) => company.adminId === currentUser.id)
      } catch (error) {
        console.error("Error loading companies:", error)
        return []
      }
    }

    setCompanies(loadCompanies())
    setLoading(false)
  }, [])

  function generateInviteLink(companyId: string) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
    if (!currentUser || !currentUser.id) {
      toast({
        title: "Error",
        description: "Could not generate invitation link. Please try again.",
        variant: "destructive",
      })
      return
    }

    // Buscar la compañía para obtener su nombre y color
    const companies = JSON.parse(localStorage.getItem("companies") || "[]")
    const company = companies.find((c: Company) => c.id === companyId)
    
    if (!company) {
      toast({
        title: "Error",
        description: "Company information not found.",
        variant: "destructive",
      })
      return
    }

    // Generar URL con todos los parámetros necesarios
    const inviteUrl = `${window.location.origin}/register/employee?companyId=${companyId}&adminId=${currentUser.id}&companyName=${encodeURIComponent(company.name)}&companyColor=${encodeURIComponent(company.color)}`
    navigator.clipboard.writeText(inviteUrl)

    toast({
      title: "Copied to clipboard",
      description: "The invitation link has been copied to your clipboard.",
    })
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
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => generateInviteLink(company.id)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Invitation Link
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
