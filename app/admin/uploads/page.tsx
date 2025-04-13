"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DocumentReview } from "@/components/document-review"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { UploadedFile } from "@/types"
import { Download, Search } from "lucide-react"
import { useState } from "react"

// Mock data - in a real app, this would come from your database
const mockFiles: UploadedFile[] = [
  {
    id: "1",
    userId: "user1",
    companyId: "company1",
    documentId: "doc1",
    status: "pending",
    fileUrl: "/files/document1.pdf",
    fileName: "ID Card - John Doe",
    fileType: "application/pdf",
    fileSize: 1024 * 1024 * 2, // 2MB
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    downloaded: false,
    archived: false,
    versions: [
      {
        url: "/files/document1.pdf",
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        fileType: "application/pdf",
      },
    ],
  },
  {
    id: "2",
    userId: "user2",
    companyId: "company1",
    documentId: "doc2",
    status: "approved",
    fileUrl: "/files/document2.pdf",
    fileName: "Tax Form - Jane Smith",
    fileType: "application/pdf",
    fileSize: 1024 * 1024 * 1.5, // 1.5MB
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4), // 4 days ago
    reviewedBy: "admin1",
    pdfUrl: "/files/document2.pdf",
    downloaded: true,
    downloadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    archived: false,
    versions: [
      {
        url: "/files/document2.pdf",
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        fileType: "application/pdf",
      },
    ],
  },
  {
    id: "3",
    userId: "user3",
    companyId: "company2",
    documentId: "doc3",
    status: "rejected",
    fileUrl: "/files/document3.jpg",
    fileName: "Contract - Bob Johnson",
    fileType: "image/jpeg",
    fileSize: 1024 * 1024 * 3, // 3MB
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
    reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6), // 6 days ago
    reviewedBy: "admin1",
    adminNotes: "The document is blurry and unreadable. Please upload a clearer version.",
    downloaded: false,
    archived: false,
    versions: [
      {
        url: "/files/document3.jpg",
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        fileType: "image/jpeg",
      },
    ],
  },
]

export default function AdminUploadsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [companyFilter, setCompanyFilter] = useState<string | null>(null)

  // In a real app, these would be fetched from your database
  const companies = [
    { id: "company1", name: "Acme Inc." },
    { id: "company2", name: "Globex Corporation" },
  ]

  const pendingFiles = mockFiles.filter((file) => file.status === "pending")
  const approvedFiles = mockFiles.filter((file) => file.status === "approved" && !file.archived)
  const rejectedFiles = mockFiles.filter((file) => file.status === "rejected")
  const archivedFiles = mockFiles.filter((file) => file.archived)

  async function handleApprove(fileId: string) {
    // In a real app, this would call your API to approve the document
    console.log("Approving file:", fileId)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  async function handleReject(fileId: string, notes: string) {
    // In a real app, this would call your API to reject the document
    console.log("Rejecting file:", fileId, "with notes:", notes)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  async function handleDownload(fileId: string) {
    // In a real app, this would download the file
    console.log("Downloading file:", fileId)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  async function handleDownloadAll() {
    // In a real app, this would download all files as a ZIP
    console.log("Downloading all files")
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Document Uploads</h2>
        <Button onClick={handleDownloadAll}>
          <Download className="mr-2 h-4 w-4" />
          Download All
        </Button>
      </div>

      <div className="flex items-center space-x-2 mt-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search files or employees..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={companyFilter || ""} onValueChange={(value) => setCompanyFilter(value || null)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Companies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="pending" className="space-y-4 mt-6">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingFiles.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedFiles.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedFiles.length})</TabsTrigger>
          <TabsTrigger value="archived">Archived ({archivedFiles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingFiles.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingFiles.map((file) => (
                <DocumentReview
                  key={file.id}
                  file={file}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Pending Documents</CardTitle>
                <CardDescription>There are no documents waiting for your review</CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="approved">
          {approvedFiles.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {approvedFiles.map((file) => (
                <DocumentReview
                  key={file.id}
                  file={file}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Approved Documents</CardTitle>
                <CardDescription>There are no approved documents to display</CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rejected">
          {rejectedFiles.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rejectedFiles.map((file) => (
                <DocumentReview
                  key={file.id}
                  file={file}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Rejected Documents</CardTitle>
                <CardDescription>There are no rejected documents to display</CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="archived">
          {archivedFiles.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {archivedFiles.map((file) => (
                <DocumentReview
                  key={file.id}
                  file={file}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Archived Documents</CardTitle>
                <CardDescription>There are no archived documents to display</CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
