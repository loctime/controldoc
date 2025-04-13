"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSelectedCompany } from "@/contexts/selected-company-context"
import { Calendar, Clock, FileText, Plus } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

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

export default function AdminDocumentsPage() {
  // Use the context instead of props
  const { selectedCompanyId } = useSelectedCompany()
  const [documents, setDocuments] = useState<RequiredDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [previewDocument, setPreviewDocument] = useState<RequiredDocument | null>(null)

  useEffect(() => {
    // Load documents from localStorage
    const loadDocuments = () => {
      try {
        const allDocuments = JSON.parse(localStorage.getItem("documents") || "[]")
        if (selectedCompanyId) {
          return allDocuments.filter((doc: RequiredDocument) => doc.companyId === selectedCompanyId)
        }
        return []
      } catch (error) {
        console.error("Error loading documents:", error)
        return []
      }
    }

    setDocuments(loadDocuments())
    setLoading(false)
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
    <DashboardLayout role="admin">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Document Management</h2>
        <div className="flex items-center space-x-2">
          <Link href="/admin/documents/new">
            <Button disabled={!selectedCompanyId}>
              <Plus className="mr-2 h-4 w-4" />
              Add Document Type
            </Button>
          </Link>
        </div>
      </div>

      {!selectedCompanyId ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>No Company Selected</CardTitle>
            <CardDescription>Please select a company from the dropdown above to view documents.</CardDescription>
          </CardHeader>
        </Card>
      ) : loading ? (
        <div className="mt-6">Loading documents...</div>
      ) : (
        <Tabs defaultValue="all" className="space-y-4 mt-6">
          <TabsList>
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="biannual">Biannual</TabsTrigger>
            <TabsTrigger value="custom">Custom Dates</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Document Types</CardTitle>
                <CardDescription>Manage all document types for this company</CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No document types defined yet</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {documents.map((document) => (
                      <Card key={document.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{document.name}</CardTitle>
                          <CardDescription>
                            Created on {new Date(document.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center text-sm">
                              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                              <span>{formatDeadline(document)}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                              <span>Allowed types: {document.allowedFileTypes.join(", ")}</span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{document.description}</p>
                            <div className="flex justify-between mt-4">
                              <Button variant="outline" size="sm" onClick={() => setPreviewDocument(document)}>
                                View Details
                              </Button>
                              {document.exampleFileUrl && (
                                <Button variant="outline" size="sm">
                                  View Example
                                </Button>
                              )}
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

          <TabsContent value="monthly">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Documents</CardTitle>
                <CardDescription>Documents that need to be submitted monthly</CardDescription>
              </CardHeader>
              <CardContent>
                {documents.filter((d) => d.deadline.type === "monthly").length === 0 ? (
                  <p className="text-sm text-muted-foreground">No monthly document types defined</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {documents
                      .filter((d) => d.deadline.type === "monthly")
                      .map((document) => (
                        <Card key={document.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{document.name}</CardTitle>
                            <CardDescription>Due on day {document.deadline.day} of each month</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2">{document.description}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-4"
                              onClick={() => setPreviewDocument(document)}
                            >
                              View Details
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="biannual">
            <Card>
              <CardHeader>
                <CardTitle>Biannual Documents</CardTitle>
                <CardDescription>Documents that need to be submitted every 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                {documents.filter((d) => d.deadline.type === "biannual").length === 0 ? (
                  <p className="text-sm text-muted-foreground">No biannual document types defined</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {documents
                      .filter((d) => d.deadline.type === "biannual")
                      .map((document) => (
                        <Card key={document.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{document.name}</CardTitle>
                            <CardDescription>{formatDeadline(document)}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2">{document.description}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-4"
                              onClick={() => setPreviewDocument(document)}
                            >
                              View Details
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom">
            <Card>
              <CardHeader>
                <CardTitle>Custom Date Documents</CardTitle>
                <CardDescription>Documents with custom submission deadlines</CardDescription>
              </CardHeader>
              <CardContent>
                {documents.filter((d) => d.deadline.type === "custom").length === 0 ? (
                  <p className="text-sm text-muted-foreground">No custom date document types defined</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {documents
                      .filter((d) => d.deadline.type === "custom")
                      .map((document) => (
                        <Card key={document.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{document.name}</CardTitle>
                            <CardDescription>{formatDeadline(document)}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2">{document.description}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-4"
                              onClick={() => setPreviewDocument(document)}
                            >
                              View Details
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
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
            <DialogDescription>
              Created on {previewDocument && new Date(previewDocument.createdAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium">Deadline</h4>
                <p className="text-sm text-muted-foreground flex items-center mt-1">
                  <Calendar className="mr-2 h-4 w-4" />
                  {previewDocument && formatDeadline(previewDocument)}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Allowed File Types</h4>
                <p className="text-sm text-muted-foreground flex items-center mt-1">
                  <FileText className="mr-2 h-4 w-4" />
                  {previewDocument?.allowedFileTypes.join(", ")}
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium">Description</h4>
              <p className="text-sm text-muted-foreground mt-1">{previewDocument?.description}</p>
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
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
