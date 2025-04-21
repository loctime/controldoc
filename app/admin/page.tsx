"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, FileCheck, FileWarningIcon as FilePending, Users, FileX } from "lucide-react"
import Link from "next/link"
import { ReactNode, useEffect, useState } from "react"
import { getAllUserDocuments, approveDocument, rejectDocument, isAdmin } from "@/app/firebaseConfig"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

// Interfaz para los documentos
interface Document {
  id: string;
  name: string;
  description?: string;
  userId: string;
  userName?: string;
  companyId: string;
  companyName?: string;
  fileUrl: string;
  status: "pending" | "approved" | "rejected";
  uploadedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  fileType: string;
}

// Componente para mostrar la lista de documentos pendientes
function PendingDocumentsList({ documents, onApprove, onReject }: { 
  documents: Document[], 
  onApprove: (doc: Document) => void, 
  onReject: (doc: Document) => void 
}) {
  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay documentos pendientes de aprobación</p>;
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-medium">{doc.name}</h3>
            <p className="text-sm text-muted-foreground">Usuario: {doc.userName || doc.userId}</p>
            <p className="text-sm text-muted-foreground">Empresa: {doc.companyName || doc.companyId}</p>
            <p className="text-sm text-muted-foreground">Subido: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" asChild>
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">Ver</a>
            </Button>
            <Button variant="default" size="sm" onClick={() => onApprove(doc)}>Aprobar</Button>
            <Button variant="destructive" size="sm" onClick={() => onReject(doc)}>Rechazar</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Create a wrapper component that can accept the selectedCompanyId prop
function AdminDashboardContent({ selectedCompanyId, children }: { selectedCompanyId?: string | null, children: ReactNode }) {
  return <>{children}</>
}

export default function AdminDashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Estadísticas calculadas a partir de los documentos
  const stats = {
    companies: 0,
    users: 0,
    pendingDocuments: documents.filter(doc => doc.status === "pending").length,
    approvedDocuments: documents.filter(doc => doc.status === "approved").length,
    rejectedDocuments: documents.filter(doc => doc.status === "rejected").length,
  }

  // Cargar documentos al iniciar
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        // Verificar si hay un usuario en localStorage
        const storedUser = typeof window !== 'undefined' ? localStorage.getItem("currentUser") : null;
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setCurrentUser(user);
          
          // Verificar si el usuario es administrador
          if (!isAdmin(user)) {
            console.error("No tienes permisos de administrador");
            return;
          }
          
          // Cargar todos los documentos
          const allDocs = await getAllUserDocuments();
          setDocuments(allDocs);
        }
      } catch (error) {
        console.error("Error loading documents:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDocuments();
  }, []);
  
  // Función para aprobar un documento
  const handleApproveDocument = async (doc: Document) => {
    try {
      await approveDocument(doc.id);
      
      // Actualizar el estado local
      setDocuments(prevDocs => 
        prevDocs.map(d => 
          d.id === doc.id 
            ? { ...d, status: "approved", approvedAt: new Date().toISOString() } 
            : d
        )
      );
      
      toast({
        title: "Documento aprobado",
        description: `El documento ${doc.name} ha sido aprobado correctamente.`,
      });
    } catch (error) {
      console.error("Error approving document:", error);
      toast({
        title: "Error",
        description: "No se pudo aprobar el documento. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };
  
  // Función para abrir el diálogo de rechazo
  const handleOpenRejectDialog = (doc: Document) => {
    setSelectedDocument(doc);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };
  
  // Función para rechazar un documento
  const handleRejectDocument = async () => {
    if (!selectedDocument) return;
    
    try {
      await rejectDocument(selectedDocument.id, rejectionReason);
      
      // Actualizar el estado local
      setDocuments(prevDocs => 
        prevDocs.map(d => 
          d.id === selectedDocument.id 
            ? { 
                ...d, 
                status: "rejected", 
                rejectedAt: new Date().toISOString(),
                rejectionReason
              } 
            : d
        )
      );
      
      toast({
        title: "Documento rechazado",
        description: `El documento ${selectedDocument.name} ha sido rechazado.`,
      });
      
      setRejectDialogOpen(false);
      setSelectedDocument(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting document:", error);
      toast({
        title: "Error",
        description: "No se pudo rechazar el documento. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout role="admin">
      <AdminDashboardContent>
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          <div className="flex items-center space-x-2">
            <Link href="/admin/companies/new">
              <Button>Add Company</Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4 mt-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
            <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
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
                  <p className="text-xs text-muted-foreground">Total companies managed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.users}</div>
                  <p className="text-xs text-muted-foreground">Total registered employees</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Documents</CardTitle>
                  <FilePending className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingDocuments}</div>
                  <p className="text-xs text-muted-foreground">Awaiting your review</p>
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
            </div>
          
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Recent Uploads</CardTitle>
                  <CardDescription>Documents uploaded in the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* In a real app, this would be a list of recent uploads */}
                  <p className="text-sm text-muted-foreground">No recent uploads to display</p>
                </CardContent>
              </Card>
          
              <Card className="col-span-3">
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
          
          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>All document activity across your companies</CardDescription>
              </CardHeader>
              <CardContent>
                {/* In a real app, this would be a list of recent activity */}
                <p className="text-sm text-muted-foreground">No recent activity to display</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Documentos pendientes de aprobación</CardTitle>
                <CardDescription>Documentos que requieren tu revisión</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Cargando documentos...</p>
                ) : (
                  <PendingDocumentsList 
                    documents={documents.filter(doc => doc.status === "pending")} 
                    onApprove={handleApproveDocument}
                    onReject={handleOpenRejectDialog}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AdminDashboardContent>
      
      {/* Diálogo para rechazar documentos */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar documento</DialogTitle>
            <DialogDescription>
              Por favor, proporciona un motivo para el rechazo del documento.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo del rechazo"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRejectDocument}>Rechazar documento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
