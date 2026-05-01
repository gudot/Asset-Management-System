import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TransferForm } from "./transfer-form"

async function getData(assetId?: string) {
  const supabase = await getSupabaseServerClient()

  const [assetsResult, branchesResult] = await Promise.all([
    supabase
      .from("assets")
      .select("id, name, asset_tag, branch_id, branches(name)")
      .in("status", ["active", "in_repair"])
      .order("name"),
    supabase.from("branches").select("id, name, code").eq("status", "active").order("name"),
  ])

  let selectedAsset = null
  if (assetId) {
    selectedAsset = assetsResult.data?.find(a => a.id === assetId) || null
  }

  return {
    assets: (assetsResult.data || []).map((asset: any) => ({
      ...asset,
      branches: Array.isArray(asset.branches) ? asset.branches[0] || null : asset.branches,
    })),
    branches: branchesResult.data || [],
    selectedAsset: selectedAsset
      ? {
          ...selectedAsset,
          branches: Array.isArray(selectedAsset.branches) ? selectedAsset.branches[0] || null : selectedAsset.branches,
        }
      : null,
  }
}

export default async function NewTransferPage({
  searchParams,
}: {
  searchParams: Promise<{ asset?: string }>
}) {
  const { asset: assetId } = await searchParams
  const { assets, branches, selectedAsset } = await getData(assetId)

  return (
    <DashboardLayout
      title="New Asset Transfer"
      description="Transfer an asset between branches"
    >
      <TransferForm
        assets={assets}
        branches={branches}
        selectedAsset={selectedAsset}
      />
    </DashboardLayout>
  )
}
