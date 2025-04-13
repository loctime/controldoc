"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { FileUp, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

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

export default function NewUploadPage({ selectedCompanyId }: { selectedCompanyId: string | null }) {
  const [isLoading, setIsLoading] = useState(false)
  const [document, setDocument] = useState<RequiredDocument | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const documentId = searchParams.get("documentId")
  const companyId = searchParams.get("companyId") || selectedCompanyId

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: "",
    },
  })

  useEffect(() => {
    if (documentId && companyId) {
      // Load document details
      const documents = JSON.parse(localStorage.getItem("documents") || "[]")
      const foundDocument = documents.find(
        (doc: RequiredDocument) => doc.id === documentId && doc.companyId === companyId,
      )

      if (foundDocument) {
        setDocument(foundDocument)
      }
    }
  }, [documentId, companyId])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!document || !companyId) {
      toast({
        title: "Error",
        description: "Document or company information is missing.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      // In a real app, this would upload the file to your server/storage
      console.log("Uploading file:", values)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Get current user
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
      if (!currentUser || !currentUser.id) {
        throw new Error("User not found")
      }

      // Create a new upload record
      const upload = {
        id: `upload_${Date.now()}`,
        userId: currentUser.id,
        companyId,
        documentId: document.id,
        status: "pending",
        fileUrl: URL.createObjectURL(values.file),
        fileName: values.file.name,
        fileType: values.file.type,
        fileSize: values.file.size,
        uploadedAt: new Date(),
        notes: values.notes,
        downloaded: false,
        archived: false,
        versions: [
          {
            url: URL.createObjectURL(values.file),
            uploadedAt: new Date(),
            fileType: values.file.type,
          },
        ],
      }

      // Store upload in localStorage
      const uploads = JSON.parse(localStorage.getItem("uploads") || "[]")
      uploads.push(upload)
      localStorage.setItem("uploads", JSON.stringify(uploads))

      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded and is pending approval.",
      })

      // Redirect to uploads page
      router.push("/uploads")
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Error",
        description: "There was an error uploading your document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!document || !companyId) {
    return (
      <DashboardLayout role="employee">
        <div className="flex items-center justify-between space-y-2 mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Upload Document</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Document Not Found</CardTitle>
            <CardDescription>
              The document you're trying to upload could not be found. Please select a document from the Required
              Documents page.
            </CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="employee">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Upload {document.name}</h2>
      </div>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>{document.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {document.exampleFileUrl && (
                <div className="mb-6 p-4 border rounded-md bg-muted/30">
                  <h3 className="text-sm font-medium mb-2">Example Document</h3>
                  {document.exampleFileUrl.startsWith("data:image") ? (
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

              <FormField
                control={form.control}
                name="file"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>File</FormLabel>
                    <FormControl>
                      <Input
                        {...fieldProps}
                        type="file"
                        accept={document.allowedFileTypes.join(",")}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            onChange(file)
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>Upload a file ({document.allowedFileTypes.join(", ")})</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional information about this document"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
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
