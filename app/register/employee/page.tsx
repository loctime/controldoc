"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const formSchema = z
  .object({
    name: z.string().min(2, {
      message: "Name must be at least 2 characters",
    }),
    email: z.string().email({
      message: "Please enter a valid email address",
    }),
    password: z.string().min(8, {
      message: "Password must be at least 8 characters",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export default function EmployeeRegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [companyColor, setCompanyColor] = useState<string | null>(null)
  const [adminName, setAdminName] = useState<string | null>(null)
  const [isValidInvite, setIsValidInvite] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const companyId = searchParams.get("companyId")
  const adminId = searchParams.get("adminId")

  useEffect(() => {
    // Validate the invitation link
    if (companyId && adminId) {
      // Get company name and color directly from URL if available
      const companyNameFromUrl = searchParams.get("companyName")
      const companyColorFromUrl = searchParams.get("companyColor")
      
      if (companyNameFromUrl && companyColorFromUrl) {
        setCompanyName(companyNameFromUrl)
        setCompanyColor(companyColorFromUrl)
        setIsValidInvite(true)
        
        // Still try to get admin name if possible
        const users = JSON.parse(localStorage.getItem("users") || "[]")
        const admin = users.find((u: any) => u.id === adminId)
        
        if (admin) {
          setAdminName(admin.name)
        } else {
          setAdminName("your administrator")
        }
      } else {
        // Fallback to localStorage validation if URL params aren't available
        const companies = JSON.parse(localStorage.getItem("companies") || "[]")
        const company = companies.find((c: any) => c.id === companyId && c.adminId === adminId)
        
        if (company) {
          setCompanyName(company.name)
          setCompanyColor(company.color || "#5C7AEA")
          
          // Get admin name
          const users = JSON.parse(localStorage.getItem("users") || "[]")
          const admin = users.find((u: any) => u.id === adminId)
          
          if (admin) {
            setAdminName(admin.name)
            setIsValidInvite(true)
          }
        }
      }
    }
  }, [companyId, adminId, searchParams])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isValidInvite || !companyId || !adminId) {
      toast({
        title: "Invalid invitation",
        description: "This invitation link is not valid.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      // In a real app, this would call your authentication API to register the user
      console.log("Registering employee account:", values)
  
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
  
      // Check if user already exists
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      let user = users.find((u: any) => u.email === values.email)
  
      if (!user) {
        // Create new user
        user = {
          id: `employee_${Date.now()}`,
          name: values.name,
          email: values.email,
          password: values.password, // En una app real, esto debería estar hasheado
          role: "employee",
          companies: [{ companyId, adminId }],
          createdAt: new Date(),
        }
        users.push(user)
      } else {
        // Asegurarse de que el usuario tiene un array de companies
        if (!user.companies) {
          user.companies = []
        }
        
        // Add company to existing user
        if (!user.companies.some((c: any) => c.companyId === companyId)) {
          user.companies.push({ companyId, adminId })
        }
      }
  
      localStorage.setItem("users", JSON.stringify(users))
      localStorage.setItem("currentUser", JSON.stringify(user))
  
      // Update company users
      const companies = JSON.parse(localStorage.getItem("companies") || "[]")
      const companyIndex = companies.findIndex((c: any) => c.id === companyId)
  
      if (companyIndex !== -1) {
        // Asegurarse de que la compañía tiene un array de users
        if (!companies[companyIndex].users) {
          companies[companyIndex].users = []
        }
        
        if (!companies[companyIndex].users.includes(user.id)) {
          companies[companyIndex].users.push(user.id)
          localStorage.setItem("companies", JSON.stringify(companies))
        }
      } else {
        console.error("Company not found:", companyId)
        // Si la compañía no existe, podríamos crearla con la información del URL
        if (companyName && companyColor) {
          const newCompany = {
            id: companyId,
            name: companyName,
            color: companyColor,
            adminId: adminId,
            createdAt: new Date(),
            users: [user.id],
          }
          companies.push(newCompany)
          localStorage.setItem("companies", JSON.stringify(companies))
        }
      }
  
      toast({
        title: "Registration successful",
        description: "Your account has been created and linked to the company.",
      })
  
      // Redirect to the employee dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        title: "Registration failed",
        description: "There was an error creating your account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!companyId || !adminId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Invalid Invitation</CardTitle>
            <CardDescription>This invitation link is not valid or has expired.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/" className="w-full">
              <Button className="w-full">Return to Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!isValidInvite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Validating Invitation</CardTitle>
            <CardDescription>Please wait while we validate your invitation...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        {companyColor && <div className="h-2" style={{ backgroundColor: companyColor }} />}
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Join {companyName}</CardTitle>
          <CardDescription>
            You've been invited by {adminName} to join {companyName}. Create your account to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Register"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
