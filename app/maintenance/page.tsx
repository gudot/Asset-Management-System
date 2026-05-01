import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Wrench, AlertTriangle, CheckCircle, DollarSign } from "lucide-react"
import Link from "next/link"

async function getMaintenanceRecords() {
  const supabase = await getSupabaseServerClient()
  
  const { data: records } = await supabase
    .from("asset_maintenance")
    .select(`
      *,
      assets(id, name, asset_tag, branches(name))
    `)
    .order("performed_date", { ascending: false })

  const totalCost = records?.reduce((sum, r) => sum + (r.cost || 0), 0) || 0

  return { records: records || [], totalCost }
}

export default async function MaintenancePage() {
  const { records, totalCost } = await getMaintenanceRecords()

  const preventiveCount = records.filter(r => r.maintenance_type === "preventive").length
  const correctiveCount = records.filter(r => r.maintenance_type === "corrective").length
  const emergencyCount = records.filter(r => r.maintenance_type === "emergency").length

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "preventive":
        return <Badge className="bg-green-100 text-green-800">Preventive</Badge>
      case "corrective":
        return <Badge className="bg-yellow-100 text-yellow-800">Corrective</Badge>
      case "emergency":
        return <Badge className="bg-red-100 text-red-800">Emergency</Badge>
      default:
        return <Badge>{type}</Badge>
    }
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return "N/A"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <DashboardLayout
      title="Maintenance Records"
      description="Track asset maintenance and repairs"
      actions={
        <Link href="/maintenance/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Log Maintenance
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{preventiveCount}</p>
                <p className="text-sm text-muted-foreground">Preventive</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-yellow-100 p-3">
                <Wrench className="h-6 w-6 text-yellow-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{correctiveCount}</p>
                <p className="text-sm text-muted-foreground">Corrective</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-red-100 p-3">
                <AlertTriangle className="h-6 w-6 text-red-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{emergencyCount}</p>
                <p className="text-sm text-muted-foreground">Emergency</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-blue-100 p-3">
                <DollarSign className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
                <p className="text-sm text-muted-foreground">Total Cost</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Records List */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance History</CardTitle>
          </CardHeader>
          <CardContent>
            {records.length > 0 ? (
              <div className="space-y-4">
                {records.map((record) => (
                  <div key={record.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-muted p-2 mt-1">
                          <Wrench className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link 
                              href={`/assets/${record.assets?.id}`}
                              className="font-medium hover:underline"
                            >
                              {record.assets?.name}
                            </Link>
                            {getTypeBadge(record.maintenance_type)}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            {record.assets?.asset_tag} - {record.assets?.branches?.name}
                          </p>
                          <p className="mt-2 text-sm">{record.description}</p>
                          {record.performed_by && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Performed by: {record.performed_by}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(record.cost)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(record.performed_date).toLocaleDateString()}
                        </p>
                        {record.next_maintenance_date && (
                          <p className="mt-1 text-xs text-blue-600">
                            Next: {new Date(record.next_maintenance_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    {record.notes && (
                      <div className="mt-3 border-t pt-3">
                        <p className="text-xs text-muted-foreground">{record.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Wrench className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No maintenance records yet</p>
                <Link href="/maintenance/new" className="mt-4">
                  <Button>Log First Maintenance</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
