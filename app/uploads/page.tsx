import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload } from "lucide-react"
import Link from "next/link"

export default function EmployeeUploadsPage() {
  return (
    <DashboardLayout role="employee">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">My Uploads</h2>
        <div className="flex items-center space-x-2">
          <Link href="/uploads/new">
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4 mt-6">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Documents</CardTitle>
              <CardDescription>All documents you have uploaded</CardDescription>
            </CardHeader>
            <CardContent>
              {/* In a real app, this would be a list of all documents */}
              <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Documents</CardTitle>
              <CardDescription>Documents awaiting approval</CardDescription>
            </CardHeader>
            <CardContent>
              {/* In a real app, this would be a list of pending documents */}
              <p className="text-sm text-muted-foreground">No pending documents</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Documents</CardTitle>
              <CardDescription>Documents that have been approved</CardDescription>
            </CardHeader>
            <CardContent>
              {/* In a real app, this would be a list of approved documents */}
              <p className="text-sm text-muted-foreground">No approved documents</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Documents</CardTitle>
              <CardDescription>Documents that need attention</CardDescription>
            </CardHeader>
            <CardContent>
              {/* In a real app, this would be a list of rejected documents */}
              <p className="text-sm text-muted-foreground">No rejected documents</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
