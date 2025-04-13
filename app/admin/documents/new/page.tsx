"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { useSelectedCompany } from "@/contexts/selected-company-context"
import { zodResolver } from "@hookform/resolvers/zod"
import { FileUp, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Document name must be at least 2 characters",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters",
  }),
  deadlineType: z.enum(["monthly", "biannual", "custom"]),
  day: z.coerce.number().min(1).max(31).optional(),
  months: z.array(z.coerce.number()).optional(),
  date: z.string().optional(),
  allowedFileTypes: z.string(),
  exampleFile: z.instanceof(File).optional(),
})

// Create a wrapper component that will use the context
function NewDocumentForm() {
  const { selectedCompanyId } = useSelectedCompany()
  const [isLoading, setIsLoading] = useState(false)
  const [exampleFilePreview, setExampleFilePreview] = useState<string | null>(null)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      deadlineType: "monthly",
      day: 1,
      months: [1, 7], // January and July for biannual
      allowedFileTypes: ".pdf,.jpg,.jpeg,.png,.doc,.docx",
    },
  })

  const deadlineType = form.watch("deadlineType")

  useEffect(() => {
    // Reset fields when deadline type changes
    if (deadlineType === "monthly") {
      form.setValue("day", 1)
    } else if (deadlineType === "biannual") {
      form.setValue("months", [1, 7])
    } else if (deadlineType === "custom") {
      const today = new Date()
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
      form.setValue("date", nextMonth.toISOString().split("T")[0])
    }
  }, [deadlineType, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!selectedCompanyId) {
      toast({
        title: "No company selected",
        description: "Please select a company before creating a document.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      // In a real app, this would call your API to create the document
      console.log("Creating document:", values)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Create deadline object based on type
      const deadline: any = {
        type: values.deadlineType,
      }

      if (values.deadlineType === "monthly" && values.day) {
        deadline.day = values.day
      } else if (values.deadlineType === "biannual" && values.months) {
        deadline.months = values.months
      } else if (values.deadlineType === "custom" && values.date) {
        deadline.date = new Date(values.date)
      }

      // Create a new document
      const document = {
        id: `doc_${Date.now()}`,
        name: values.name,
        description: values.description,
        companyId: selectedCompanyId,
        deadline,
        allowedFileTypes: values.allowedFileTypes.split(",").map((type) => type.trim()),
        createdAt: new Date(),
        exampleFileUrl: exampleFilePreview,
      }

      // Store document in localStorage
      const documents = JSON.parse(localStorage.getItem("documents") || "[]")
      documents.push(document)
      localStorage.setItem("documents", JSON.stringify(documents))

      toast({
        title: "Document created",
        description: "The required document has been created successfully.",
      })

      // Redirect to documents page
      router.push("/admin/documents")
    } catch (error) {
      console.error("Document creation error:", error)
      toast({
        title: "Error",
        description: "There was an error creating the document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExampleFileChange = (file: File | null) => {
    if (!file) {
      setExampleFilePreview(null)
      return
    }

    // Create a preview URL for the file
    const reader = new FileReader()
    reader.onload = (e) => {
      setExampleFilePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  if (!selectedCompanyId) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-between space-y-2 mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Create Required Document</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>No Company Selected</CardTitle>
            <CardDescription>Please select a company from the dropdown above to create a document.</CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Create Required Document</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
          <CardDescription>Define the document that employees need to upload</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Name</FormLabel>
                    <FormControl>
                      <Input placeholder="ID Card" {...field} />
                    </FormControl>
                    <FormDescription>The name of the document employees need to upload</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please upload a clear scan of your ID card (front and back)"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Detailed instructions for employees about what to upload</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadlineType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a deadline type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="biannual">Biannual</SelectItem>
                        <SelectItem value="custom">Custom Date</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>How often this document needs to be submitted</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {deadlineType === "monthly" && (
                <FormField
                  control={form.control}
                  name="day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Month</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={31} {...field} />
                      </FormControl>
                      <FormDescription>The day of each month when this document is due</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {deadlineType === "biannual" && (
                <FormField
                  control={form.control}
                  name="months"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Months</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: 1, label: "January" },
                            { value: 2, label: "February" },
                            { value: 3, label: "March" },
                            { value: 4, label: "April" },
                            { value: 5, label: "May" },
                            { value: 6, label: "June" },
                            { value: 7, label: "July" },
                            { value: 8, label: "August" },
                            { value: 9, label: "September" },
                            { value: 10, label: "October" },
                            { value: 11, label: "November" },
                            { value: 12, label: "December" },
                          ].map((month) => (
                            <Button
                              key={month.value}
                              type="button"
                              variant={field.value?.includes(month.value) ? "default" : "outline"}
                              onClick={() => {
                                const currentMonths = field.value || []
                                if (currentMonths.includes(month.value)) {
                                  field.onChange(currentMonths.filter((m) => m !== month.value))
                                } else {
                                  field.onChange([...currentMonths, month.value])
                                }
                              }}
                              className="h-8"
                            >
                              {month.label}
                            </Button>
                          ))}
                        </div>
                      </FormControl>
                      <FormDescription>The months when this document is due</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {deadlineType === "custom" && (
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>The specific date when this document is due</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="allowedFileTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allowed File Types</FormLabel>
                    <FormControl>
                      <Input placeholder=".pdf,.jpg,.jpeg,.png" {...field} />
                    </FormControl>
                    <FormDescription>Comma-separated list of allowed file extensions (e.g., .pdf,.jpg)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exampleFile"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Example File (Optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input
                          {...fieldProps}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null
                            onChange(file)
                            handleExampleFileChange(file)
                          }}
                        />
                        {exampleFilePreview && (
                          <div className="mt-2">
                            <p className="text-sm font-medium mb-1">Preview:</p>
                            {exampleFilePreview.startsWith("data:image") ? (
                              <img
                                src={exampleFilePreview || "/placeholder.svg"}
                                alt="Example file preview"
                                className="max-w-xs max-h-40 object-contain border rounded"
                              />
                            ) : (
                              <div className="p-4 border rounded bg-muted flex items-center justify-center">
                                <p className="text-sm">File uploaded (not previewable)</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>Upload an example file to show employees what they need to submit</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FileUp className="mr-2 h-4 w-4" />
                    Create Document
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

// Main page component
export default function NewDocumentPage() {
  return (
    <DashboardLayout role="admin">
      <NewDocumentForm />
    </DashboardLayout>
  )
}
