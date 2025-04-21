"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useSelectedCompany } from "@/contexts/selected-company-context";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, FileUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { auth, db } from '@/app/firebaseConfig';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadFile } from '@/app/firebaseConfig';

const formSchema = z.object({
  requiredDocumentId: z.string().min(1, "Please select a document"),
  file: z.instanceof(File, { message: "Please upload a file" })
});

export default function UploadDocumentPage() {
  const { selectedCompanyId } = useSelectedCompany();
  const [requiredDocuments, setRequiredDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requiredDocumentId: "",
    },
  });

  const currentFile = form.watch("file");

  useEffect(() => {
    const loadRequiredDocuments = async () => {
      if (!selectedCompanyId) return;
      try {
        const q = query(collection(db, "requiredDocuments"), where("companyId", "==", selectedCompanyId));
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRequiredDocuments(docs);
      } catch (error) {
        console.error("Error loading required documents:", error);
      }
    };

    loadRequiredDocuments();
  }, [selectedCompanyId]);

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

      // Importar las funciones de Firebase
      const { uploadFile } = await import('@/app/firebaseConfig');
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/app/firebaseConfig');
      
      console.log("Creating document:", values)

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
      
      // Subir archivo de ejemplo si existe
      let exampleFileUrl = null;
      if (values.exampleFile) {
        try {
          console.log("Intentando subir archivo de ejemplo:", values.exampleFile.name);
          exampleFileUrl = await uploadFile(values.exampleFile);
          
          if (!exampleFileUrl) {
            console.warn("No se pudo subir el archivo a Firebase Storage, continuando sin archivo de ejemplo");
            toast({
              title: "Advertencia",
              description: "No se pudo subir el archivo de ejemplo, pero el documento se creará sin él.",
              variant: "warning",
            });
          }
        } catch (uploadError) {
          console.error("Error al subir archivo:", uploadError);
          toast({
            title: "Error al subir archivo",
            description: "No se pudo subir el archivo de ejemplo, pero el documento se creará sin él.",
            variant: "warning",
          });
        }
      }

      // Crear documento en Firestore
      const documentData = {
        name: values.name,
        description: values.description,
        companyId: selectedCompanyId,
        deadline,
        allowedFileTypes: values.allowedFileTypes.split(",").map((type) => type.trim()),
        createdAt: serverTimestamp(),
        exampleFileUrl: exampleFileUrl || exampleFilePreview,
      }
      
      // Guardar en Firestore directamente
      await addDoc(collection(db, "uploadedDocuments"), {
        userId: auth.currentUser.uid,
        companyId: selectedCompanyId,
        requiredDocumentId: values.requiredDocumentId,
        fileUrl: await uploadFile(values.file),
        status: "pending",
        uploadedAt: serverTimestamp(),
      });

      toast({
        title: "Success",
        description: "Document uploaded successfully. Pending review.",
      });

      router.push("/employee/documents");
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload document.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <DashboardLayout role="employee">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Upload Document</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit Your Document</CardTitle>
          <CardDescription>Select a required document and upload your file.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="requiredDocumentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {requiredDocuments.map(doc => (
                          <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="file"
                render={({ field: { onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Upload File</FormLabel>
                    <FormControl>
                      <Input
                        {...fieldProps}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          onChange(file);
                        }}
                      />
                    </FormControl>
                    {currentFile && <p className="text-xs text-muted-foreground mt-1">Selected: {currentFile.name}</p>}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <FileUp className="mr-2 h-4 w-4" /> Upload Document
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}