"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, FileCheck, FileWarningIcon as FilePending, FileX } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useSelectedCompany } from "@/contexts/selected-company-context"
import { CompanySelector } from "@/components/company-selector"

interface Company {
  id: string
  name: string
  color: string
}

interface RequiredDocument {
  id: string
  name: string
  description: string
  companyId: string
  deadline: {
    type: "monthly" | "biannual" | "custom"
    day?: number
    months?: number[]
    date?: Date
  }
  allowedFileTypes: string[]
  createdAt: Date
  exampleFileUrl?: string
}

export default function EmployeeDashboard() {
  const [companies, setCompanies] = useState<Company[]>([])
  const { selectedCompanyId } = useSelectedCompany()
  const [stats, setStats] = useState({
    companies: 0,
    pendingDocuments: 0,
    approvedDocuments: 0,
    rejectedDocuments: 0,
  })
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([])
  
  // Load user's companies and stats
  useEffect(() => {
    const loadUserData = () => {
      try {
        const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
        if (!currentUser || !currentUser.companies) return { companies: [], stats: { companies: 0, pendingDocuments: 0, approvedDocuments: 0, rejectedDocuments: 0 } }
        
        console.log("Current user:", currentUser)
        
        const allCompanies = JSON.parse(localStorage.getItem("companies") || "[]")
        const userCompanies = currentUser.companies
          .map((assoc: { companyId: string }) => {
            return allCompanies.find((c: Company) => c.id === assoc.companyId)
          })
          .filter(Boolean)
        
        console.log("User companies:", userCompanies)
        
        // En una app real, estos datos vendrían de tu base de datos
        const userStats = {
          companies: userCompanies.length,
          pendingDocuments: 3,
          approvedDocuments: 8,
          rejectedDocuments: 1,
        }
        
        return { companies: userCompanies, stats: userStats }
      } catch (error) {
        console.error("Error loading user data:", error)
        return { companies: [], stats: { companies: 0, pendingDocuments: 0, approvedDocuments: 0, rejectedDocuments: 0 } }
      }
    }
    
    const { companies: userCompanies, stats: userStats } = loadUserData()
    setCompanies(userCompanies)
    setStats(userStats)
  }, [])

  // Cargar documentos requeridos cuando cambia la compañía seleccionada
  useEffect(() => {
    if (!selectedCompanyId) return;
    
    const loadRequiredDocuments = () => {
      try {
        // Obtener todos los documentos requeridos del localStorage
        const allDocuments = JSON.parse(localStorage.getItem("requiredDocuments") || "[]");
        
        // Filtrar solo los documentos de la compañía seleccionada
        const companyDocuments = allDocuments.filter(
          (doc: RequiredDocument) => doc.companyId === selectedCompanyId
        );
        
        console.log(`Found ${companyDocuments.length} required documents for company ${selectedCompanyId}`);
        return companyDocuments;
      } catch (error) {
        console.error("Error loading required documents:", error);
        return [];
      }
    };
    
    setRequiredDocuments(loadRequiredDocuments());
  }, [selectedCompanyId]);

  return (
    <DashboardLayout role="employee">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">My Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Link href="/uploads/new">
            <Button>Upload Document</Button>
          </Link>
        </div>
      </div>

      {/* Company selector */}
      <div className="my-4">
        <CompanySelector role="employee" />
      </div>

      <Tabs defaultValue="overview" className="space-y-4 mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="required">Required Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Companies</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.companies}</div>
                <p className="text-xs text-muted-foreground">You belong to</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Documents</CardTitle>
                <FilePending className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingDocuments}</div>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved Documents</CardTitle>
                <FileCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.approvedDocuments}</div>
                <p className="text-xs text-muted-foreground">Successfully processed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected Documents</CardTitle>
                <FileX className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rejectedDocuments}</div>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your document activity in the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                {/* In a real app, this would be a list of recent activity */}
                <p className="text-sm text-muted-foreground">No recent activity to display</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
                <CardDescription>Documents due in the next 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                {/* In a real app, this would be a list of upcoming deadlines */}
                <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="required">
          {selectedCompanyId ? (
            <Card>
              <CardHeader>
                <CardTitle>Required Documents</CardTitle>
                <CardDescription>Documents you need to upload for {companies.find(c => c.id === selectedCompanyId)?.name}</CardDescription>
              </CardHeader>
              <CardContent>
                {requiredDocuments.length > 0 ? (
                  <div className="space-y-4">
                    {requiredDocuments.map((doc) => (
                      <div key={doc.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{doc.name}</h3>
                            <p className="text-sm text-muted-foreground">{doc.description}</p>
                            <div className="mt-2 text-xs text-muted-foreground">
                              <p>Allowed file types: {doc.allowedFileTypes.join(", ")}</p>
                              <p>
                                Deadline: {doc.deadline.type === "monthly" 
                                  ? `Monthly (Day ${doc.deadline.day})` 
                                  : doc.deadline.type === "biannual" 
                                    ? `Biannual (Months ${doc.deadline.months?.join(", ")})` 
                                    : `Custom date`}
                              </p>
                            </div>
                          </div>
                          <Link href={`/uploads/new?documentId=${doc.id}`}>
                            <Button size="sm">Upload</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No required documents to display</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Company Selected</CardTitle>
                <CardDescription>Please select a company to view required documents</CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
