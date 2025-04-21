"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { FileUp, Loader2, AlertCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { uploadUserDocument, getCompanyRequiredDocuments } from "@/app/firebaseConfig"
import { useSelectedCompany } from "@/contexts/selected-company-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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

const formSchema = z.object({
  file: z.instanceof(File, {
    message: "Please select a file to upload",
  }),
  notes: z.string().optional(),
})

export default function NewUploadPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [document, setDocument] = useState<RequiredDocument | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { selectedCompanyId } = useSelectedCompany()

  const documentId = searchParams.get("documentId")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: "",
    },
  })

  // Cargar el usuario actual
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = typeof window !== 'undefined' ? localStorage.getItem("currentUser") : null;
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    
    loadUser();
  }, []);

  // Cargar documentos requeridos cuando cambia la compañía seleccionada
  useEffect(() => {
    const loadRequiredDocuments = async () => {
      if (!selectedCompanyId) {
        setRequiredDocuments([]);
        setLoadingDocuments(false);
        return;
      }
      
      setLoadingDocuments(true);
      try {
        // Importar las funciones de Firebase
        const { getRequiredDocuments } = await import('@/app/firebaseConfig');
        
        // Obtener documentos requeridos de Firestore
        const companyDocs = await getRequiredDocuments(selectedCompanyId);
        
        console.log(`Encontrados ${companyDocs.length} documentos requeridos para la empresa ${selectedCompanyId}`);
        
        setRequiredDocuments(companyDocs);
        
        // Si hay un documentId en la URL, buscar ese documento específico
        if (documentId) {
          const foundDocument = companyDocs.find((doc: RequiredDocument) => doc.id === documentId);
          if (foundDocument) {
            setDocument(foundDocument);
          }
        }
      } catch (error) {
        console.error("Error loading required documents:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los documentos requeridos. Por favor, intenta de nuevo.",
          variant: "destructive",
        });
      } finally {
        setLoadingDocuments(false);
      }
    };
    
    loadRequiredDocuments();
  }, [selectedCompanyId, documentId])

  // Manejar la vista previa del archivo
  const handleFileChange = (file: File | null) => {
    if (!file) {
      setFilePreview(null);
      return;
    }

    // Crear una vista previa para imágenes
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // Para otros tipos de archivos, mostrar un icono genérico
      setFilePreview(null);
    }
  };
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!document || !selectedCompanyId || !currentUser) {
      toast({
        title: "Error",
        description: "Falta información del documento, la empresa o el usuario.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Preparar los datos del documento
      const documentData = {
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        companyId: selectedCompanyId,
        requiredDocumentId: document.id,
        requiredDocumentName: document.name,
        notes: values.notes || "",
      };

      // Importar la función de Firebase
      const { uploadUserDocument } = await import('@/app/firebaseConfig');
      
      // Subir el documento a Firebase
      console.log("Subiendo archivo a Firebase:", values.file.name);
      
      // Crear el documento en Firestore y subir el archivo a Storage
      const result = await uploadUserDocument(documentData, values.file);
      
      console.log("Documento subido correctamente:", result);

      toast({
        title: "Documento subido",
        description: "Tu documento ha sido subido correctamente y está pendiente de revisión.",
      });

      // Redirigir a la página de documentos subidos
      router.push("/uploads");
    } catch (error) {
      console.error("Error al subir el documento:", error);
      toast({
        title: "Error",
        description: "Hubo un error al subir tu documento. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (loadingDocuments) {
    return (
      <DashboardLayout role="employee">
        <div className="flex items-center justify-between space-y-2 mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Subir Documento</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Cargando...</CardTitle>
            <CardDescription>Cargando información de documentos requeridos.</CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }
  
  if (!selectedCompanyId) {
    return (
      <DashboardLayout role="employee">
        <div className="flex items-center justify-between space-y-2 mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Subir Documento</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>No hay empresa seleccionada</CardTitle>
            <CardDescription>
              Por favor, selecciona una empresa del selector en la parte superior para ver los documentos requeridos.
            </CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }
  
  if (!document && documentId) {
    return (
      <DashboardLayout role="employee">
        <div className="flex items-center justify-between space-y-2 mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Subir Documento</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Documento no encontrado</CardTitle>
            <CardDescription>
              El documento que estás intentando subir no se pudo encontrar. Por favor, selecciona un documento de la página de Documentos Requeridos.
            </CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }
  
  if (!document && requiredDocuments.length === 0) {
    return (
      <DashboardLayout role="employee">
        <div className="flex items-center justify-between space-y-2 mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Subir Documento</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>No hay documentos requeridos</CardTitle>
            <CardDescription>
              No hay documentos requeridos para esta empresa. Por favor, contacta al administrador.
            </CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }
  
  // Si no hay un documento específico seleccionado pero hay documentos requeridos,
  // mostrar la lista de documentos disponibles para subir
  if (!document && requiredDocuments.length > 0) {
    return (
      <DashboardLayout role="employee">
        <div className="flex items-center justify-between space-y-2 mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Seleccionar Documento para Subir</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requiredDocuments.map((doc) => (
            <Card key={doc.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{doc.name}</CardTitle>
                <CardDescription>
                  {doc.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={() => router.push(`/uploads/new?documentId=${doc.id}`)}
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  Subir este documento
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="employee">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Upload {document?.name}</h2>
      </div>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>{document?.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {document?.exampleFileUrl && (
                <div className="mb-6 p-4 border rounded-md bg-muted/30">
                  <h3 className="text-sm font-medium mb-2">Example Document</h3>
                  {document.exampleFileUrl?.startsWith("data:image") ? (
                    <img
                      src={document.exampleFileUrl || "/placeholder.svg"}
                      alt="Example document"
                      className="max-h-40 object-contain mx-auto"
                    />
                  ) : (
                    <div className="p-4 bg-muted flex items-center justify-center">
                      <p className="text-sm">Example file (not previewable)</p>
                    </div>
                  )}
                </div>
              )}

              {/* Vista previa del archivo */}
              {filePreview && (
                <div className="mb-6 p-4 border rounded-md bg-muted/30">
                  <h3 className="text-sm font-medium mb-2">Vista previa</h3>
                  <img
                    src={filePreview}
                    alt="Vista previa del documento"
                    className="max-h-40 object-contain mx-auto"
                  />
                </div>
              )}
              
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Importante</AlertTitle>
                <AlertDescription>
                  Este documento será revisado por el administrador. Asegúrate de que el archivo cumpla con los requisitos especificados.
                </AlertDescription>
              </Alert>
              
              <FormField
                control={form.control}
                name="file"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Archivo</FormLabel>
                    <FormControl>
                      <Input
                        {...fieldProps}
                        type="file"
                        accept={document?.allowedFileTypes.join(",")}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            onChange(file)
                            handleFileChange(file)
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Tipos de archivo permitidos: {document?.allowedFileTypes.join(", ")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Cualquier información adicional sobre este documento..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Notas opcionales para el revisor</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <FileUp className="mr-2 h-4 w-4" />
                    Upload Document
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
