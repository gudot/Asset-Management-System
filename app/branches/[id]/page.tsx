import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Package, 
  Calendar,
  Edit,
  ArrowLeft 
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

async function getBranchDetails(id: string) {
  const supabase = await getSupabaseServerClient()

  const [branchResult, assetsResult] = await Promise.all([
    supabase.from("branches").select("*").eq("id", id).single(),
    supabase
      .from("assets")
      .select("*, asset_categories(name)")
      .eq("branch_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  if (branchResult.error || !branchResult.data) return null

  const { count: totalAssets } = await supabase
    .from("assets")
    .select("*", { count: "exact", head: true })
    .eq("branch_id", id)

  const { data: valueData } = await supabase
    .from("assets")
    .select("current_value")
    .eq("branch_id", id)

  const totalValue = valueData?.reduce((sum, a) => sum + (a.current_value || 0), 0) || 0

  return {
    branch: branchResult.data,
    assets: assetsResult.data || [],
    totalAssets: totalAssets || 0,
    totalValue,
  }
}

export default async function BranchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  // Prevent this route from handling /branches/new
  if (id === "new") {
    notFound()
  }
  
  const data = await getBranchDetails(id)

  if (!data) {
    notFound()
  }

  const { branch, assets, totalAssets, totalValue } = data

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value)
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

  return (
    <DashboardLayout
      title={branch.name}
      description={`Branch details and asset inventory`}
      actions={
        <Link href={`/branches/${branch.id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Branch
          </Button>
        </Link>
      }
    >
      <Link
        href="/branches"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Branches
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Branch Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Branch Information</CardTitle>
              {branch.is_headquarters && (
                <Badge>Headquarters</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
                {branch.code}
              </div>
              <div>
                <p className="font-medium">{branch.name}</p>
                <Badge variant={branch.status === "active" ? "default" : "secondary"}>
                  {branch.status === "active" ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              {branch.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm">{branch.address}</p>
                    {branch.city && (
                      <p className="text-sm text-muted-foreground">{branch.city}</p>
                    )}
                  </div>
                </div>
              )}

              {branch.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{branch.phone}</p>
                </div>
              )}

              {branch.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{branch.email}</p>
                </div>
              )}

              {branch.manager_name && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm">{branch.manager_name}</p>
                    <p className="text-xs text-muted-foreground">Branch Manager</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm">
                    {new Date(branch.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Date Registered</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center p-3 rounded-lg bg-muted">
                <Package className="mx-auto mb-1 h-5 w-5 text-primary" />
                <p className="text-2xl font-bold">{totalAssets}</p>
                <p className="text-xs text-muted-foreground">Total Assets</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <Building2 className="mx-auto mb-1 h-5 w-5 text-green-600" />
                <p className="text-lg font-bold">{formatCurrency(totalValue)}</p>
                <p className="text-xs text-muted-foreground">Asset Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branch Assets */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Branch Assets</CardTitle>
            <Link href={`/assets?branch=${branch.id}`}>
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {assets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Asset Tag</th>
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Category</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {assets.map((asset: { id: string; asset_tag: string; name: string; asset_categories: { name: string } | null; status: string; current_value: number | null }) => (
                      <tr key={asset.id} className="border-b last:border-0">
                        <td className="py-3 font-mono text-xs">{asset.asset_tag}</td>
                        <td className="py-3">
                          <Link 
                            href={`/assets/${asset.id}`}
                            className="font-medium hover:underline"
                          >
                            {asset.name}
                          </Link>
                        </td>
                        <td className="py-3">{asset.asset_categories?.name || "N/A"}</td>
                        <td className="py-3">
                          <Badge className={getStatusColor(asset.status)}>
                            {asset.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          {asset.current_value ? formatCurrency(asset.current_value) : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="mb-2 h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">No assets assigned to this branch</p>
                <Link href="/assets/new" className="mt-3">
                  <Button size="sm">Add Asset</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
