"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle, FileUp, RefreshCw } from "lucide-react"
import { useState } from "react"

export default function DiagnosticsPage() {
  const [loading, setLoading] = useState(false)
  const [storageStatus, setStorageStatus] = useState<any>(null)
  const [fileUploadStatus, setFileUploadStatus] = useState<any>(null)
  const [firebaseConfig, setFirebaseConfig] = useState<any>(null)

  // Verificar la disponibilidad de Firebase Storage
  const checkStorage = async () => {
    try {
      setLoading(true)
      
      // Importar la función de verificación
      const { checkStorageAvailability } = await import('@/app/firebaseConfig')
      
      // Ejecutar la verificación
      const result = await checkStorageAvailability()
      setStorageStatus(result)
      
      if (result.available) {
        toast({
          title: "Firebase Storage está disponible",
          description: "La conexión con Firebase Storage funciona correctamente.",
        })
      } else {
        toast({
          title: "Problema con Firebase Storage",
          description: `Error: ${result.error || "Desconocido"}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al verificar Storage:", error)
      setStorageStatus({
        available: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      })
      
      toast({
        title: "Error al verificar Storage",
        description: "Ocurrió un error al intentar verificar Firebase Storage.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Probar la subida de un archivo
  const testFileUpload = async () => {
    try {
      setLoading(true)
      setFileUploadStatus(null)
      
      // Importar la función de subida
      const { uploadFile } = await import('@/app/firebaseConfig')
      
      // Crear un archivo de prueba
      const testBlob = new Blob(["Archivo de prueba para Firebase Storage"], { type: "text/plain" })
      const testFile = new File([testBlob], "test_upload.txt", { type: "text/plain" })
      
      // Intentar subir el archivo
      const url = await uploadFile(testFile)
      
      if (url) {
        setFileUploadStatus({
          success: true,
          url,
        })
        
        toast({
          title: "Archivo subido correctamente",
          description: "La subida de archivos a Firebase Storage funciona correctamente.",
        })
      } else {
        setFileUploadStatus({
          success: false,
          error: "No se pudo obtener la URL del archivo subido",
        })
        
        toast({
          title: "Error al subir archivo",
          description: "No se pudo obtener la URL del archivo subido.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al subir archivo de prueba:", error)
      setFileUploadStatus({
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      })
      
      toast({
        title: "Error al subir archivo",
        description: "Ocurrió un error al intentar subir el archivo de prueba.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Obtener la configuración de Firebase
  const getFirebaseConfig = async () => {
    try {
      setLoading(true)
      
      // Importar la configuración de Firebase
      const firebaseConfigModule = await import('@/app/firebaseConfig')
      
      // Obtener la configuración
      const config = {
        initialized: !!firebaseConfigModule.storage,
        storageBucket: firebaseConfigModule.storage?.app?.options?.storageBucket || "No disponible",
      }
      
      setFirebaseConfig(config)
    } catch (error) {
      console.error("Error al obtener configuración:", error)
      setFirebaseConfig({
        error: error instanceof Error ? error.message : "Error desconocido",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Diagnóstico del Sistema</h2>
      </div>

      <div className="grid gap-6 mt-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Firebase Storage</CardTitle>
            <CardDescription>Verificar la disponibilidad de Firebase Storage</CardDescription>
          </CardHeader>
          <CardContent>
            {storageStatus && (
              <div className="mb-4 p-4 border rounded-md">
                <div className="flex items-center mb-2">
                  {storageStatus.available ? (
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    {storageStatus.available ? "Disponible" : "No disponible"}
                  </span>
                </div>
                {!storageStatus.available && storageStatus.error && (
                  <div className="mt-2 text-sm text-red-500">
                    <p className="font-medium">Error:</p>
                    <p>{storageStatus.error}</p>
                    {storageStatus.code && <p>Código: {storageStatus.code}</p>}
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={checkStorage} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar Storage"
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prueba de Subida</CardTitle>
            <CardDescription>Probar la subida de un archivo a Firebase Storage</CardDescription>
          </CardHeader>
          <CardContent>
            {fileUploadStatus && (
              <div className="mb-4 p-4 border rounded-md">
                <div className="flex items-center mb-2">
                  {fileUploadStatus.success ? (
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    {fileUploadStatus.success ? "Subida exitosa" : "Error en la subida"}
                  </span>
                </div>
                {fileUploadStatus.success && fileUploadStatus.url && (
                  <div className="mt-2 text-sm">
                    <p className="font-medium">URL del archivo:</p>
                    <p className="break-all">{fileUploadStatus.url}</p>
                  </div>
                )}
                {!fileUploadStatus.success && fileUploadStatus.error && (
                  <div className="mt-2 text-sm text-red-500">
                    <p className="font-medium">Error:</p>
                    <p>{fileUploadStatus.error}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={testFileUpload} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <FileUp className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                "Probar Subida"
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Configuración de Firebase</CardTitle>
            <CardDescription>Información sobre la configuración actual de Firebase</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={getFirebaseConfig} disabled={loading} className="mb-4">
              {loading ? "Cargando..." : "Obtener Configuración"}
            </Button>

            {firebaseConfig && (
              <div className="p-4 border rounded-md">
                <h3 className="text-lg font-medium mb-2">Detalles de la configuración</h3>
                
                {firebaseConfig.error ? (
                  <div className="text-red-500">
                    <p>Error al obtener la configuración: {firebaseConfig.error}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Firebase inicializado:</span>{" "}
                      {firebaseConfig.initialized ? "Sí" : "No"}
                    </div>
                    <div>
                      <span className="font-medium">Storage Bucket:</span>{" "}
                      {firebaseConfig.storageBucket}
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground">
                      <p>
                        Si el Storage Bucket no es correcto, verifica la configuración en el archivo
                        firebaseConfig.js. El formato correcto debería ser:
                        <code className="ml-2 px-2 py-1 bg-muted rounded">
                          proyecto-id.appspot.com
                        </code>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
