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
import { useEffect, useState } from "react"
import { toast } from "@/components/ui/use-toast"

// Definir el tipo de documento subido
interface UploadedDocument {
  id: string
  userId: string
  userName: string
  companyId: string
  requiredDocumentId: string
  requiredDocumentName: string
  status: "pending" | "approved" | "rejected"
  fileUrl: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: string
  notes?: string
  approvedAt?: string
  expirationDate?: string
  rejectedAt?: string
  rejectionComments?: string
  reviewedBy?: string
  archived?: boolean
}

export default function AdminUploadsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [companyFilter, setCompanyFilter] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [companies, setCompanies] = useState<{id: string, name: string}[]>([])
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Cargar el usuario actual y los documentos subidos
  useEffect(() => {
    const loadUserAndData = async () => {
      try {
        // 1. Cargar el usuario actual
        const storedUser = typeof window !== 'undefined' ? localStorage.getItem("currentUser") : null;
        let user = null;
        if (storedUser) {
          user = JSON.parse(storedUser);
          setCurrentUser(user);
        }

        // 2. Importar las funciones de Firebase
        const { db } = await import('@/app/firebaseConfig');
        const { collection, getDocs, query, where, orderBy } = await import('firebase/firestore');

        // 3. Cargar las empresas
        const companiesRef = collection(db, "companies");
        const companiesSnapshot = await getDocs(companiesRef);
        const companiesData = companiesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setCompanies(companiesData);

        // 4. Cargar todos los documentos subidos
        const uploadsRef = collection(db, "userUploads");
        const uploadsQuery = query(uploadsRef, orderBy("uploadedAt", "desc"));
        const uploadsSnapshot = await getDocs(uploadsQuery);
        const uploadsData = uploadsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UploadedDocument[];
        setUploadedDocuments(uploadsData);

      } catch (error) {
        console.error("Error cargando datos:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los documentos. Por favor, intenta de nuevo.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserAndData();
  }, []);

  // Filtrar documentos por estado
  const pendingFiles = uploadedDocuments.filter((file) => 
    file.status === "pending" && 
    (!companyFilter || file.companyId === companyFilter) &&
    (searchTerm === "" || 
     file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     file.requiredDocumentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     file.userName.toLowerCase().includes(searchTerm.toLowerCase()))
  )
  
  const approvedFiles = uploadedDocuments.filter((file) => 
    file.status === "approved" && 
    !file.archived &&
    (!companyFilter || file.companyId === companyFilter) &&
    (searchTerm === "" || 
     file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     file.requiredDocumentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     file.userName.toLowerCase().includes(searchTerm.toLowerCase()))
  )
  
  const rejectedFiles = uploadedDocuments.filter((file) => 
    file.status === "rejected" &&
    (!companyFilter || file.companyId === companyFilter) &&
    (searchTerm === "" || 
     file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     file.requiredDocumentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     file.userName.toLowerCase().includes(searchTerm.toLowerCase()))
  )
  
  const archivedFiles = uploadedDocuments.filter((file) => 
    file.archived &&
    (!companyFilter || file.companyId === companyFilter) &&
    (searchTerm === "" || 
     file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     file.requiredDocumentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     file.userName.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  async function handleApprove(fileId: string) {
    try {
      // Mostrar un diálogo para establecer la fecha de vencimiento
      const expirationDate = prompt("Ingrese la fecha de vencimiento (YYYY-MM-DD):");
      if (!expirationDate) return;
      
      // Validar el formato de la fecha
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(expirationDate)) {
        toast({
          title: "Formato de fecha inválido",
          description: "Por favor, ingrese la fecha en formato YYYY-MM-DD",
          variant: "destructive",
        });
        return;
      }
      
      // Importar la función de Firebase
      const { updateDocumentStatus } = await import('@/app/firebaseConfig');
      
      // Actualizar el estado del documento
      await updateDocumentStatus(fileId, "approved", expirationDate);
      
      // Actualizar la lista de documentos
      const updatedDocs = uploadedDocuments.map(doc => {
        if (doc.id === fileId) {
          return {
            ...doc,
            status: "approved",
            approvedAt: new Date().toISOString(),
            expirationDate,
            reviewedBy: currentUser?.id
          };
        }
        return doc;
      });
      
      setUploadedDocuments(updatedDocs);
      
      toast({
        title: "Documento aprobado",
        description: `El documento ha sido aprobado con fecha de vencimiento: ${expirationDate}`,
      });
    } catch (error) {
      console.error("Error al aprobar el documento:", error);
      toast({
        title: "Error",
        description: "No se pudo aprobar el documento. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  }

  async function handleReject(fileId: string, comments: string) {
    try {
      // Importar la función de Firebase
      const { updateDocumentStatus } = await import('@/app/firebaseConfig');
      
      // Actualizar el estado del documento
      await updateDocumentStatus(fileId, "rejected", null, comments);
      
      // Actualizar la lista de documentos
      const updatedDocs = uploadedDocuments.map(doc => {
        if (doc.id === fileId) {
          return {
            ...doc,
            status: "rejected",
            rejectedAt: new Date().toISOString(),
            rejectionComments: comments,
            reviewedBy: currentUser?.id
          };
        }
        return doc;
      });
      
      setUploadedDocuments(updatedDocs);
      
      toast({
        title: "Documento rechazado",
        description: "El documento ha sido rechazado con los comentarios proporcionados.",
      });
    } catch (error) {
      console.error("Error al rechazar el documento:", error);
      toast({
        title: "Error",
        description: "No se pudo rechazar el documento. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  }

  async function handleDownload(fileId: string) {
    try {
      // Buscar el documento en la lista
      const document = uploadedDocuments.find(doc => doc.id === fileId);
      if (!document) {
        throw new Error("Documento no encontrado");
      }
      
      // Abrir la URL del archivo en una nueva pestaña
      window.open(document.fileUrl, "_blank");
      
      toast({
        title: "Descarga iniciada",
        description: "El documento se está descargando.",
      });
    } catch (error) {
      console.error("Error al descargar el documento:", error);
      toast({
        title: "Error",
        description: "No se pudo descargar el documento. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
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
