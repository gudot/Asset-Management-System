import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft, 
  ClipboardCheck, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Package
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AuditItemActions } from "./audit-item-actions"

async function getAuditDetails(id: string) {
  const supabase = await getSupabaseServerClient()

  const [auditResult, itemsResult] = await Promise.all([
    supabase
      .from("asset_audits")
      .select("*, branches(id, name, code)")
      .eq("id", id)
      .single(),
    supabase
      .from("audit_items")
      .select("*, assets(id, name, asset_tag, serial_number, location)")
      .eq("audit_id", id)
      .order("verified_at"),
  ])

  if (auditResult.error || !auditResult.data) return null

  return {
    audit: auditResult.data,
    items: itemsResult.data || [],
  }
}

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  // Prevent this route from handling /audits/new
  if (id === "new") {
    notFound()
  }
  
  const data = await getAuditDetails(id)

  if (!data) {
    notFound()
  }

  const { audit, items } = data
  const progress = audit.total_assets > 0 
    ? Math.round((audit.verified_assets / audit.total_assets) * 100)
    : 0

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>
      case "pending":
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
      case "missing":
        return <Badge className="bg-red-100 text-red-800">Missing</Badge>
      case "damaged":
        return <Badge className="bg-yellow-100 text-yellow-800">Damaged</Badge>
      case "discrepancy":
        return <Badge className="bg-orange-100 text-orange-800">Discrepancy</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "pending":
        return <Package className="h-5 w-5 text-muted-foreground" />
      case "missing":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "damaged":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "discrepancy":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
      default:
        return <Package className="h-5 w-5 text-muted-foreground" />
    }
  }

  const verifiedCount = items.filter(i => i.status === "verified").length
  const missingCount = items.filter(i => i.status === "missing").length
  const damagedCount = items.filter(i => i.status === "damaged").length
  const discrepancyCount = items.filter(i => i.status === "discrepancy").length

  return (
    <DashboardLayout
      title={`${audit.branches?.name} Audit`}
      description={`Audit conducted by ${audit.auditor_name} on ${new Date(audit.audit_date).toLocaleDateString()}`}
    >
      <Link
        href="/audits"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Audits
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Audit Summary */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Audit Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge 
                className={`mt-1 ${
                  audit.status === "completed" 
                    ? "bg-green-100 text-green-800" 
                    : audit.status === "in_progress"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {audit.status.replace("_", " ")}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Progress</p>
              <div className="mt-2 space-y-2">
                <Progress value={progress} className="h-3" />
                <p className="text-sm font-medium">
                  {audit.verified_assets} / {audit.total_assets} assets verified ({progress}%)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <CheckCircle className="mx-auto h-5 w-5 text-green-600" />
                <p className="mt-1 text-xl font-bold text-green-700">{verifiedCount}</p>
                <p className="text-xs text-green-600">Verified</p>
              </div>
              <div className="rounded-lg bg-red-50 p-3 text-center">
                <XCircle className="mx-auto h-5 w-5 text-red-600" />
                <p className="mt-1 text-xl font-bold text-red-700">{missingCount}</p>
                <p className="text-xs text-red-600">Missing</p>
              </div>
              <div className="rounded-lg bg-yellow-50 p-3 text-center">
                <AlertTriangle className="mx-auto h-5 w-5 text-yellow-600" />
                <p className="mt-1 text-xl font-bold text-yellow-700">{damagedCount}</p>
                <p className="text-xs text-yellow-600">Damaged</p>
              </div>
              <div className="rounded-lg bg-orange-50 p-3 text-center">
                <ClipboardCheck className="mx-auto h-5 w-5 text-orange-600" />
                <p className="mt-1 text-xl font-bold text-orange-700">{discrepancyCount}</p>
                <p className="text-xs text-orange-600">Discrepancy</p>
              </div>
            </div>

            {audit.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="mt-1 text-sm">{audit.notes}</p>
              </div>
            )}

            {audit.completed_at && (
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="mt-1 text-sm font-medium">
                  {new Date(audit.completed_at).toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Asset Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length > 0 ? (
              <div className="space-y-3">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(item.status)}
                      <div>
                        <Link 
                          href={`/assets/${item.assets?.id}`}
                          className="font-medium hover:underline"
                        >
                          {item.assets?.name}
                        </Link>
                        <p className="text-xs text-muted-foreground font-mono">
                          {item.assets?.asset_tag}
                          {item.assets?.serial_number && ` | S/N: ${item.assets.serial_number}`}
                        </p>
                        {item.assets?.location && (
                          <p className="text-xs text-muted-foreground">
                            Location: {item.assets.location}
                          </p>
                        )}
                        {item.notes && (
                          <p className="mt-1 text-xs text-orange-600">{item.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(item.status)}
                      {audit.status === "in_progress" && (
                        <AuditItemActions 
                          auditId={audit.id} 
                          item={item}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Package className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No assets to audit</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
