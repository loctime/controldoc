"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building, Copy, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Company name must be at least 2 characters",
  }),
  description: z.string().optional(),
  color: z.string().default("#5C7AEA"),
})

export default function NewCompanyPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#5C7AEA",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)

      // In a real app, this would call your API to create the company
      console.log("Creating company:", values)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Get current user from localStorage
      const storedUser = localStorage.getItem("currentUser")
      if (!storedUser) {
        throw new Error("User not found")
      }

      const user = JSON.parse(storedUser)

      // Create a new company
      const company = {
        id: `company_${Date.now()}`,
        name: values.name,
        description: values.description || "",
        color: values.color,
        adminId: user.id,
        createdAt: new Date(),
        users: [],
      }

      // Store company in localStorage
      const companies = JSON.parse(localStorage.getItem("companies") || "[]")
      companies.push(company)
      localStorage.setItem("companies", JSON.stringify(companies))

      // Store companies in users array too
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      const currentUserIndex = users.findIndex((u: any) => u.id === user.id)
      
      if (currentUserIndex >= 0) {
        if (!users[currentUserIndex].companies) {
          users[currentUserIndex].companies = []
        }
        users[currentUserIndex].companies.push({ companyId: company.id })
        localStorage.setItem("users", JSON.stringify(users))
      }

      // Update current user
      if (!user.companies) {
        user.companies = []
      }
      user.companies.push({ companyId: company.id })
      localStorage.setItem("currentUser", JSON.stringify(user))

      // Generate invitation link with company data embedded in URL
      // This makes it work across browsers and incognito mode
      const inviteUrl = `${window.location.origin}/register/employee?companyId=${company.id}&adminId=${user.id}&companyName=${encodeURIComponent(company.name)}&companyColor=${encodeURIComponent(company.color)}`
      setInviteLink(inviteUrl)

      toast({
        title: "Company created",
        description: "Your company has been created successfully.",
      })
    } catch (error) {
      console.error("Company creation error:", error)
      toast({
        title: "Error",
        description: "There was an error creating the company. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  function copyInviteLink() {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      toast({
        title: "Copied to clipboard",
        description: "The invitation link has been copied to your clipboard.",
      })
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Create New Company</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
            <CardDescription>Enter the details for your new company</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Brief description of the company" className="resize-none" {...field} />
                      </FormControl>
                      <FormDescription>
                        This will help employees identify the company when they have multiple.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Color</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input type="color" {...field} className="w-12 h-10 p-1" />
                          <Input
                            type="text"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        This color will be used to identify the company throughout the system.
                      </FormDescription>
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
                      <Building className="mr-2 h-4 w-4" />
                      Create Company
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {inviteLink && (
          <Card>
            <CardHeader>
              <CardTitle>Invitation Link</CardTitle>
              <CardDescription>Share this link with employees to join your company</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-3 rounded-md break-all">
                <code className="text-sm">{inviteLink}</code>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={copyInviteLink} className="w-full">
                <Copy className="mr-2 h-4 w-4" />
                Copy Invitation Link
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
