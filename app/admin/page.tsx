import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, FileCheck, FileWarningIcon as FilePending, Users } from "lucide-react"
import Link from "next/link"
import { ReactNode } from "react"

// Create a wrapper component that can accept the selectedCompanyId prop
function AdminDashboardContent({ selectedCompanyId, children }: { selectedCompanyId?: string | null, children: ReactNode }) {
  return <>{children}</>
}

export default function AdminDashboard() {
  // In a real app, this data would come from your database
  const stats = {
    companies: 3,
    users: 12,
    pendingDocuments: 8,
    approvedDocuments: 24,
    rejectedDocuments: 2,
  }

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
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Documents awaiting your review</CardDescription>
              </CardHeader>
              <CardContent>
                {/* In a real app, this would be a list of pending approvals */}
                <p className="text-sm text-muted-foreground">No pending approvals</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AdminDashboardContent>
    </DashboardLayout>
  )
}
