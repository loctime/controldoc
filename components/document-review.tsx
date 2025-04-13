"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import type { UploadedFile } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle, Download, Eye, Loader2, XCircle } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const rejectFormSchema = z.object({
  notes: z.string().min(1, {
    message: "Please provide a reason for rejection",
  }),
})

interface DocumentReviewProps {
  file: UploadedFile
  onApprove: (fileId: string) => Promise<void>
  onReject: (fileId: string, notes: string) => Promise<void>
  onDownload: (fileId: string) => Promise<void>
}

export function DocumentReview({ file, onApprove, onReject, onDownload }: DocumentReviewProps) {
  const [isLoading, setIsLoading] = useState<"approve" | "reject" | "download" | null>(null)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const form = useForm<z.infer<typeof rejectFormSchema>>({
    resolver: zodResolver(rejectFormSchema),
    defaultValues: {
      notes: "",
    },
  })

  async function handleApprove() {
    try {
      setIsLoading("approve")
      await onApprove(file.id)
      toast({
        title: "Document approved",
        description: "The document has been approved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error approving the document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(null)
    }
  }

  async function handleReject(values: z.infer<typeof rejectFormSchema>) {
    try {
      setIsLoading("reject")
      await onReject(file.id, values.notes)
      setIsRejectDialogOpen(false)
      form.reset()
      toast({
        title: "Document rejected",
        description: "The document has been rejected with your feedback.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error rejecting the document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(null)
    }
  }

  async function handleDownload() {
    try {
      setIsLoading("download")
      await onDownload(file.id)
      toast({
        title: "Download started",
        description: "Your document is being downloaded.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error downloading the document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <Card className="file-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{file.fileName}</CardTitle>
        <CardDescription>Uploaded on {new Date(file.uploadedAt).toLocaleDateString()}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="aspect-video relative bg-muted rounded-md overflow-hidden mb-4">
          {/* This would be a thumbnail of the document in a real app */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button variant="ghost" size="sm" onClick={() => setIsPreviewOpen(true)}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          </div>
        </div>

        <div className="flex items-center text-sm text-muted-foreground">
          <span className="font-medium mr-2">Status:</span>
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              file.status === "pending"
                ? "status-pending"
                : file.status === "approved"
                  ? "status-approved"
                  : "status-rejected"
            }`}
          >
            {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
          </span>
        </div>

        {file.adminNotes && (
          <div className="mt-2 text-sm">
            <span className="font-medium">Notes:</span>
            <p className="text-muted-foreground mt-1">{file.adminNotes}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        {file.status === "pending" ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRejectDialogOpen(true)}
              disabled={isLoading !== null}
            >
              {isLoading === "reject" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Reject
            </Button>
            <Button size="sm" onClick={handleApprove} disabled={isLoading !== null}>
              {isLoading === "approve" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Approve
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={handleDownload} disabled={isLoading !== null}>
            {isLoading === "download" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download
          </Button>
        )}
      </CardFooter>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this document.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleReject)} className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rejection Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why this document is being rejected"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRejectDialogOpen(false)}
                  disabled={isLoading === "reject"}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading === "reject"}>
                  {isLoading === "reject" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    "Reject Document"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          <div className="aspect-[4/3] bg-muted rounded-md overflow-hidden">
            {/* In a real app, this would be an iframe or embedded viewer for the document */}
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">Document preview would appear here</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
