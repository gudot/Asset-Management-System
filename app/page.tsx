import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Package,
  Building2,
  DollarSign,
  Wrench,
  ArrowLeftRight,
  ClipboardCheck,
  TrendingUp,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { requireAuth } from "@/lib/auth/server"
import { getUserRole } from "@/lib/auth/roles"

async function getDashboardData() {
  const supabase = await getSupabaseServerClient()

  const [
    { count: totalAssets },
    { count: totalBranches },
    { data: assetValues },
    { count: assetsInMaintenance },
    { count: pendingTransfers },
    { data: upcomingAudits },
    { data: assetsByStatus },
    { data: assetsByCategory },
    { data: recentAssets },
    { data: branches },
  ] = await Promise.all([
    supabase.from("assets").select("*", { count: "exact", head: true }),
    supabase.from("branches").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("assets").select("current_value"),
    supabase.from("assets").select("*", { count: "exact", head: true }).eq("status", "in_repair"),
    supabase.from("asset_transfers").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("asset_audits").select("*").eq("status", "planned").limit(5),
    supabase.from("assets").select("status"),
    supabase.from("assets").select("category_id, current_value, asset_categories(name)"),
    supabase.from("assets").select("*, branches(name), asset_categories(name)").order("created_at", { ascending: false }).limit(5),
    supabase.from("branches").select("id, name, code, is_headquarters").eq("status", "active"),
  ])

  const totalValue = assetValues?.reduce((sum, a) => sum + (a.current_value || 0), 0) || 0

  const statusCounts = (assetsByStatus || []).reduce((acc: Record<string, number>, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {})

  const categoryCounts = (assetsByCategory || []).reduce((acc: Record<string, { count: number; value: number }>, item: any) => {
    const category = Array.isArray(item.asset_categories) ? item.asset_categories[0] : item.asset_categories
    const catName = category?.name || "Uncategorized"
    if (!acc[catName]) acc[catName] = { count: 0, value: 0 }
    acc[catName].count++
    acc[catName].value += item.current_value || 0
    return acc
  }, {})

  return {
    totalAssets: totalAssets || 0,
    totalBranches: totalBranches || 0,
    totalValue,
    assetsInMaintenance: assetsInMaintenance || 0,
    pendingTransfers: pendingTransfers || 0,
    upcomingAudits: upcomingAudits?.length || 0,
    statusCounts,
    categoryCounts,
    recentAssets: recentAssets || [],
    branches: branches || [],
  }
}

export default async function DashboardPage() {
  const user = await requireAuth()
  const role = getUserRole(user)
  const canViewAudits = role === "admin" || role === "auditor"
  const data = await getDashboardData()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
      title="Dashboard"
      description="Overview of First Pack Company asset management across all branches"
      actions={
        <div className="flex gap-2">
          <Link href="/assets/new">
            <Button>
              <Package className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </Link>
          <Link href="/branches/new">
            <Button variant="outline">
              <Building2 className="mr-2 h-4 w-4" />
              Add Branch
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Assets"
            value={data.totalAssets.toLocaleString()}
            change="+12 this month"
            changeType="positive"
            icon={Package}
            iconColor="bg-primary/10 text-primary"
          />
          <StatsCard
            title="Total Branches"
            value={data.totalBranches}
            icon={Building2}
            iconColor="bg-accent/10 text-accent"
          />
          <StatsCard
            title="Total Asset Value"
            value={formatCurrency(data.totalValue)}
            change="+5.2% from last month"
            changeType="positive"
            icon={DollarSign}
            iconColor="bg-green-100 text-green-700"
          />
          <StatsCard
            title="In Maintenance"
            value={data.assetsInMaintenance}
            change={data.assetsInMaintenance > 0 ? "Requires attention" : "All clear"}
            changeType={data.assetsInMaintenance > 0 ? "negative" : "positive"}
            icon={Wrench}
            iconColor="bg-yellow-100 text-yellow-700"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Pending Transfers"
            value={data.pendingTransfers}
            icon={ArrowLeftRight}
            iconColor="bg-blue-100 text-blue-700"
          />
          {canViewAudits && (
            <StatsCard
              title="Upcoming Audits"
              value={data.upcomingAudits}
              icon={ClipboardCheck}
              iconColor="bg-purple-100 text-purple-700"
            />
          )}
          <StatsCard
            title="Asset Utilization"
            value="94%"
            change="+2% from last quarter"
            changeType="positive"
            icon={TrendingUp}
            iconColor="bg-green-100 text-green-700"
          />
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Asset Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Asset Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(data.statusCounts).length > 0 ? (
                  Object.entries(data.statusCounts).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            status === "active"
                              ? "bg-green-500"
                              : status === "in_repair"
                              ? "bg-yellow-500"
                              : status === "disposed"
                              ? "bg-gray-500"
                              : status === "transferred"
                              ? "bg-blue-500"
                              : "bg-red-500"
                          }`}
                        />
                        <span className="text-sm font-medium capitalize">{status}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{count} assets</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No assets registered yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assets by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assets by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(data.categoryCounts).length > 0 ? (
                  Object.entries(data.categoryCounts).slice(0, 5).map(([category, { count, value }]) => (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{category}</span>
                        <span className="text-muted-foreground">{count} assets</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{
                              width: `${Math.min((count / data.totalAssets) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{formatCurrency(value)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No assets registered yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Branch Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Branch Overview</CardTitle>
              <Link href="/branches">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.branches.length > 0 ? (
                  data.branches.slice(0, 5).map((branch) => (
                    <div
                      key={branch.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                          {branch.code}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{branch.name}</p>
                          {branch.is_headquarters && (
                            <span className="text-xs text-muted-foreground">Headquarters</span>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No branches registered yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Assets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recently Added Assets</CardTitle>
            <Link href="/assets">
              <Button variant="ghost" size="sm">View All Assets</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentAssets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Asset Tag</th>
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Category</th>
                      <th className="pb-3 font-medium">Branch</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {data.recentAssets.map((asset: { id: string; asset_tag: string; name: string; asset_categories: { name: string } | null; branches: { name: string } | null; status: string; current_value: number | null }) => (
                      <tr key={asset.id} className="border-b last:border-0">
                        <td className="py-3 font-mono text-xs">{asset.asset_tag}</td>
                        <td className="py-3 font-medium">{asset.name}</td>
                        <td className="py-3">{asset.asset_categories?.name || "N/A"}</td>
                        <td className="py-3">{asset.branches?.name || "N/A"}</td>
                        <td className="py-3">
                          <Badge className={getStatusColor(asset.status)}>{asset.status}</Badge>
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
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertTriangle className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No assets have been added yet</p>
                <Link href="/assets/new" className="mt-2">
                  <Button size="sm">Add Your First Asset</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
