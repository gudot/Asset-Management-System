import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AssetForm } from "../asset-form"

async function getFormData() {
  const supabase = await getSupabaseServerClient()

  const [branchesResult, categoriesResult] = await Promise.all([
    supabase.from("branches").select("id, name, code").order("name"),
    supabase.from("asset_categories").select("id, name").order("name"),
  ])

  return {
    branches: branchesResult.data || [],
    categories: categoriesResult.data || [],
  }
}

export default async function NewAssetPage() {
  const { branches, categories } = await getFormData()

  return (
    <DashboardLayout
      title="Register New Asset"
      description="Add a new asset to the First Pack Company registry"
    >
      <AssetForm branches={branches} categories={categories} />
    </DashboardLayout>
  )
}
