import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AssetForm } from "../../asset-form"
import { notFound } from "next/navigation"

async function getData(id: string) {
  const supabase = await getSupabaseServerClient()

  const [assetResult, branchesResult, categoriesResult] = await Promise.all([
    supabase.from("assets").select("*").eq("id", id).single(),
    supabase.from("branches").select("id, name, code").eq("status", "active").order("name"),
    supabase.from("asset_categories").select("id, name").order("name"),
  ])

  if (assetResult.error || !assetResult.data) return null

  return {
    asset: assetResult.data,
    branches: branchesResult.data || [],
    categories: categoriesResult.data || [],
  }
}

export default async function EditAssetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getData(id)

  if (!data) {
    notFound()
  }

  return (
    <DashboardLayout
      title={`Edit ${data.asset.name}`}
      description={`Asset Tag: ${data.asset.asset_tag}`}
    >
      <AssetForm
        asset={data.asset}
        branches={data.branches}
        categories={data.categories}
      />
    </DashboardLayout>
  )
}
