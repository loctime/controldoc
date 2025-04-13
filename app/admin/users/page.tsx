"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Copy, Mail } from "lucide-react"
import { useEffect, useState } from "react"

interface Company {
  id: string
  name: string
  color: string
  description?: string
  adminId: string
  createdAt: Date
  users: string[]
}

interface CompanyAssociation {
  companyId: string
  adminId: string
}

interface User {
  id: string
  name: string
  email: string
  role: "admin" | "employee"
  companies: CompanyAssociation[]
  createdAt: Date
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    // In a real app, this would be an API call
    const loadData = () => {
      try {
        // Load current user
        const storedUser = localStorage.getItem("currentUser")
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser))
        }

        // Load all companies
        const allCompanies = JSON.parse(localStorage.getItem("companies") || "[]")
        setCompanies(allCompanies)

        // Load all users
        const allUsers = JSON.parse(localStorage.getItem("users") || "[]")

        // Add the current admin user if not in the list
        const adminUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
        if (adminUser && adminUser.id && !allUsers.some((u: User) => u.id === adminUser.id)) {
          allUsers.push(adminUser)
        }

        setUsers(allUsers)
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "Could not load users data. Please refresh the page.",
          variant: "destructive",
        })
      }
      setLoading(false)
    }

    loadData()
  }, [])

  function getCompanyById(companyId: string): Company | undefined {
    return companies.find((company) => company.id === companyId)
  }

  function getUserCompanies(user: User) {
    return user.companies
      .map((association) => {
        const company = getCompanyById(association.companyId)
        return company ? company : null
      })
      .filter(Boolean) as Company[]
  }

  function generateInviteLink(companyId: string) {
    if (!currentUser) return

    const inviteUrl = `${window.location.origin}/register/employee?companyId=${companyId}&adminId=${currentUser.id}`
    navigator.clipboard.writeText(inviteUrl)

    toast({
      title: "Copied to clipboard",
      description: "The invitation link has been copied to your clipboard.",
    })
  }

  function sendInviteEmail(email: string, companyId: string) {
    // In a real app, this would send an email with the invitation link
    const company = getCompanyById(companyId)

    toast({
      title: "Invitation sent",
      description: `An invitation to join ${company?.name} has been sent to ${email}.`,
    })
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
      </div>

      {loading ? (
        <div className="mt-6">Loading users...</div>
      ) : (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Manage all users across your companies</CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Companies</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const userCompanies = getUserCompanies(user)
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : "outline"}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {userCompanies.map((company) => (
                              <Badge
                                key={company.id}
                                style={{
                                  backgroundColor: company.color,
                                  color: isLightColor(company.color) ? "black" : "white",
                                }}
                              >
                                {company.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => sendInviteEmail(user.email, companies[0]?.id)}
                              disabled={companies.length === 0}
                              title="Send invitation email"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {companies.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Invite New Users</CardTitle>
            <CardDescription>Generate invitation links for your companies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => (
                <Card key={company.id} className="overflow-hidden">
                  <div className="h-2" style={{ backgroundColor: company.color }} />
                  <CardHeader>
                    <CardTitle>{company.name}</CardTitle>
                    <CardDescription>{company.description || "No description"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" onClick={() => generateInviteLink(company.id)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Invitation Link
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  )
}

// Helper function to determine if a color is light or dark
function isLightColor(color: string) {
  // Convert hex to RGB
  let r, g, b
  if (color.startsWith("#")) {
    const hex = color.substring(1)
    r = Number.parseInt(hex.substring(0, 2), 16)
    g = Number.parseInt(hex.substring(2, 4), 16)
    b = Number.parseInt(hex.substring(4, 6), 16)
  } else {
    return true // Default to light for non-hex colors
  }

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}
