import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Package, 
  Building2, 
  Calendar,
  Edit,
  ArrowLeft,
  DollarSign,
  Wrench,
  ArrowLeftRight,
  FileText,
  AlertTriangle,
  CheckCircle,
  Shield
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

async function getAssetDetails(id: string) {
  const supabase = await getSupabaseServerClient()

  const [assetResult, transfersResult, maintenanceResult] = await Promise.all([
    supabase
      .from("assets")
      .select("*, branches(id, name, code), asset_categories(id, name, depreciation_rate, useful_life_years)")
      .eq("id", id)
      .single(),
    supabase
      .from("asset_transfers")
      .select("*, from_branch:branches!asset_transfers_from_branch_id_fkey(name), to_branch:branches!asset_transfers_to_branch_id_fkey(name)")
      .eq("asset_id", id)
      .order("transfer_date", { ascending: false })
      .limit(5),
    supabase
      .from("asset_maintenance")
      .select("*")
      .eq("asset_id", id)
      .order("performed_date", { ascending: false })
      .limit(5),
  ])

  if (assetResult.error || !assetResult.data) return null

  return {
    asset: assetResult.data,
    transfers: transfersResult.data || [],
    maintenance: maintenanceResult.data || [],
  }
}

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  // Prevent this route from handling /assets/new
  if (id === "new") {
    notFound()
  }
  
  const data = await getAssetDetails(id)

  if (!data) {
    notFound()
  }

  const { asset, transfers, maintenance } = data

  const formatCurrency = (value: number | null) => {
    if (!value) return "N/A"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (date: string | null) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-ZW", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "in_repair":
        return "bg-yellow-100 text-yellow-800"
      case "disposed":
        return "bg-gray-100 text-gray-800"
      case "transferred":
        return "bg-blue-100 text-blue-800"
      case "lost":
        return "bg-red-100 text-red-800"
      case "stolen":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case "excellent":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "good":
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case "fair":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "poor":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const warrantyStatus = () => {
    if (!asset.warranty_expiry) return { status: "none", text: "No warranty" }
    const expiryDate = new Date(asset.warranty_expiry)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 0) return { status: "expired", text: "Warranty expired" }
    if (daysUntilExpiry < 30) return { status: "expiring", text: `Expires in ${daysUntilExpiry} days` }
    return { status: "active", text: `Valid until ${formatDate(asset.warranty_expiry)}` }
  }

  const warranty = warrantyStatus()

  return (
    <DashboardLayout
      title={asset.name}
      description={`Asset Tag: ${asset.asset_tag}`}
      actions={
        <div className="flex gap-2">
          <Link href={`/transfers/new?asset=${asset.id}`}>
            <Button variant="outline">
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Transfer
            </Button>
          </Link>
          <Link href={`/maintenance/new?asset=${asset.id}`}>
            <Button variant="outline">
              <Wrench className="mr-2 h-4 w-4" />
              Maintenance
            </Button>
          </Link>
          <Link href={`/assets/${asset.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      }
    >
      <Link
        href="/assets"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Assets
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Asset Information</CardTitle>
              <Badge className={getStatusColor(asset.status)}>{asset.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Asset Tag</p>
                  <p className="font-mono text-lg font-semibold">{asset.asset_tag}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{asset.asset_categories?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Manufacturer</p>
                  <p className="font-medium">{asset.manufacturer || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-medium">{asset.model || "N/A"}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Serial Number</p>
                  <p className="font-mono font-medium">{asset.serial_number || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Condition</p>
                  <div className="flex items-center gap-2">
                    {getConditionIcon(asset.condition)}
                    <span className="font-medium capitalize">{asset.condition}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{asset.location_details || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Branch</p>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                      {asset.branches?.code || "?"}
                    </span>
                    <span className="font-medium">{asset.branches?.name || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>

            {asset.description && (
              <div className="mt-6 border-t pt-4">
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="mt-1">{asset.description}</p>
              </div>
            )}

            {asset.notes && (
              <div className="mt-4 border-t pt-4">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="mt-1 text-sm">{asset.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Financial Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purchase Price</span>
                <span className="font-semibold">{formatCurrency(asset.purchase_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Value</span>
                <span className="font-semibold text-green-600">{formatCurrency(asset.current_value)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Depreciation</span>
                <span className="font-medium">{asset.asset_categories?.depreciation_rate || 0}% / year</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchase Date</span>
                  <span className="font-medium">{formatDate(asset.purchase_date)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warranty */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5" />
                Warranty Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`rounded-lg p-3 ${
                warranty.status === "active" ? "bg-green-50 text-green-800" :
                warranty.status === "expiring" ? "bg-yellow-50 text-yellow-800" :
                warranty.status === "expired" ? "bg-red-50 text-red-800" :
                "bg-gray-50 text-gray-800"
              }`}>
                <p className="text-sm font-medium">{warranty.text}</p>
                {asset.warranty_expiry && (
                  <p className="mt-1 text-xs">Expiry: {formatDate(asset.warranty_expiry)}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted">
                  <ArrowLeftRight className="mx-auto mb-1 h-5 w-5 text-blue-600" />
                  <p className="text-xl font-bold">{transfers.length}</p>
                  <p className="text-xs text-muted-foreground">Transfers</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <Wrench className="mx-auto mb-1 h-5 w-5 text-yellow-600" />
                  <p className="text-xl font-bold">{maintenance.length}</p>
                  <p className="text-xs text-muted-foreground">Maintenance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transfer History */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Transfer History</CardTitle>
            <Link href={`/transfers?asset=${asset.id}`}>
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {transfers.length > 0 ? (
              <div className="space-y-3">
                {transfers.map((transfer: { id: string; transfer_date: string; from_branch: { name: string } | null; to_branch: { name: string } | null; status: string; reason: string | null }) => (
                  <div key={transfer.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {transfer.from_branch?.name} → {transfer.to_branch?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(transfer.transfer_date)}
                          {transfer.reason && ` - ${transfer.reason}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{transfer.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-6">No transfer history</p>
            )}
          </CardContent>
        </Card>

        {/* Maintenance History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Maintenance Log</CardTitle>
            <Link href={`/maintenance?asset=${asset.id}`}>
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {maintenance.length > 0 ? (
              <div className="space-y-3">
                {maintenance.map((record: { id: string; maintenance_type: string; performed_date: string; description: string; cost: number | null }) => (
                  <div key={record.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="capitalize">{record.maintenance_type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(record.performed_date)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{record.description}</p>
                    {record.cost && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Cost: {formatCurrency(record.cost)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-6">No maintenance records</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
