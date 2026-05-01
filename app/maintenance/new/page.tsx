import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { MaintenanceForm } from "./maintenance-form"

async function getData(assetId?: string) {
  const supabase = await getSupabaseServerClient()

  const { data: assets } = await supabase
    .from("assets")
    .select("id, name, asset_tag, branches(name)")
    .in("status", ["active", "in_repair"])
    .order("name")

  let selectedAsset = null
  if (assetId) {
    selectedAsset = assets?.find(a => a.id === assetId) || null
  }

  return {
    assets: (assets || []).map((asset: any) => ({
      ...asset,
      branches: Array.isArray(asset.branches) ? asset.branches[0] || null : asset.branches,
    })),
    selectedAsset: selectedAsset
      ? {
          ...selectedAsset,
          branches: Array.isArray(selectedAsset.branches) ? selectedAsset.branches[0] || null : selectedAsset.branches,
        }
      : null,
  }
}

export default async function NewMaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ asset?: string }>
}) {
  const { asset: assetId } = await searchParams
  const { assets, selectedAsset } = await getData(assetId)

  return (
    <DashboardLayout
      title="Log Maintenance"
      description="Record maintenance activity for an asset"
    >
      <MaintenanceForm assets={assets} selectedAsset={selectedAsset} />
    </DashboardLayout>
  )
}
