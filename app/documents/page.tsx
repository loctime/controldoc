"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Upload } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useSelectedCompany } from "@/contexts/selected-company-context"

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

export default function EmployeeDocumentsPage() {
  const { selectedCompanyId } = useSelectedCompany()
  const [documents, setDocuments] = useState<RequiredDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [previewDocument, setPreviewDocument] = useState<RequiredDocument | null>(null)

  useEffect(() => {
    // Cargar documentos requeridos desde Firestore
    const loadDocuments = async () => {
      if (!selectedCompanyId) {
        setDocuments([])
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        
        // Importar las funciones de Firebase
        const { db } = await import('@/app/firebaseConfig')
        const { collection, query, where, getDocs } = await import('firebase/firestore')
        
        console.log("Cargando documentos requeridos para la empresa:", selectedCompanyId)
        
        // Consultar documentos de Firestore filtrados por companyId
        const requiredDocsRef = collection(db, "requiredDocuments")
        const q = query(requiredDocsRef, where("companyId", "==", selectedCompanyId))
        const querySnapshot = await getDocs(q)
        
        // Convertir los documentos de Firestore al formato RequiredDocument
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as RequiredDocument[]
        
        console.log("Documentos requeridos encontrados:", docs.length)
        setDocuments(docs)
      } catch (error) {
        console.error("Error cargando documentos desde Firestore:", error)
        
        // Fallback a localStorage si hay un error
        try {
          const allDocuments = JSON.parse(localStorage.getItem("requiredDocuments") || "[]")
          const filteredDocs = allDocuments.filter((doc: RequiredDocument) => doc.companyId === selectedCompanyId)
          console.log("Documentos cargados desde localStorage:", filteredDocs.length)
          setDocuments(filteredDocs)
        } catch (localError) {
          console.error("Error cargando desde localStorage:", localError)
          setDocuments([])
        }
      } finally {
        setLoading(false)
      }
    }

    loadDocuments()
  }, [selectedCompanyId])

  function formatDeadline(document: RequiredDocument) {
    const { deadline } = document

    if (deadline.type === "monthly" && deadline.day) {
      return `Monthly (Day ${deadline.day})`
    } else if (deadline.type === "biannual" && deadline.months) {
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ]
      const formattedMonths = deadline.months.map((m) => monthNames[m - 1]).join(", ")
      return `Biannual (${formattedMonths})`
    } else if (deadline.type === "custom" && deadline.date) {
      return `Custom (${new Date(deadline.date).toLocaleDateString()})`
    }

    return "No deadline set"
  }

  return (
    <DashboardLayout role="employee">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Required Documents</h2>
      </div>

      {!selectedCompanyId ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>No Company Selected</CardTitle>
            <CardDescription>
              Please select a company from the dropdown above to view required documents.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : loading ? (
        <div className="mt-6">Loading documents...</div>
      ) : (
        <Tabs defaultValue="all" className="space-y-4 mt-6">
          <TabsList>
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="submitted">Submitted</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Required Documents</CardTitle>
                <CardDescription>Documents you need to upload for this company</CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No required documents for this company</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {documents.map((document) => (
                      <Card key={document.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{document.name}</CardTitle>
                          <CardDescription>Due: {formatDeadline(document)}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center text-sm">
                              <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                              <span>Allowed types: {document.allowedFileTypes.join(", ")}</span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{document.description}</p>
                            <div className="flex justify-between mt-4">
                              <Button variant="outline" size="sm" onClick={() => setPreviewDocument(document)}>
                                View Details
                              </Button>
                              <Link href={`/uploads/new?documentId=${document.id}&companyId=${selectedCompanyId}`}>
                                <Button size="sm">
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Documents</CardTitle>
                <CardDescription>Documents you still need to upload</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No pending documents</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submitted">
            <Card>
              <CardHeader>
                <CardTitle>Submitted Documents</CardTitle>
                <CardDescription>Documents you have already uploaded</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No submitted documents</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Document Details Dialog */}
      <Dialog open={!!previewDocument} onOpenChange={() => setPreviewDocument(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewDocument?.name}</DialogTitle>
            <DialogDescription>Due: {previewDocument && formatDeadline(previewDocument)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium">Description</h4>
              <p className="text-sm text-muted-foreground mt-1">{previewDocument?.description}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium">Allowed File Types</h4>
              <p className="text-sm text-muted-foreground flex items-center mt-1">
                <FileText className="mr-2 h-4 w-4" />
                {previewDocument?.allowedFileTypes.join(", ")}
              </p>
            </div>
            {previewDocument?.exampleFileUrl && (
              <div>
                <h4 className="text-sm font-medium">Example File</h4>
                <div className="mt-2 border rounded p-2">
                  {previewDocument.exampleFileUrl.startsWith("data:image") ? (
                    <img
                      src={previewDocument.exampleFileUrl || "/placeholder.svg"}
                      alt="Example file"
                      className="max-h-60 object-contain mx-auto"
                    />
                  ) : (
                    <div className="p-4 bg-muted flex items-center justify-center">
                      <p className="text-sm">File uploaded (not previewable)</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Link href={`/uploads/new?documentId=${previewDocument?.id}&companyId=${selectedCompanyId}`}>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
