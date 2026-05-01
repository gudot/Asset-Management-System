import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AssetsTable } from "./assets-table"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import Link from "next/link"

async function getAssets() {
  const supabase = await getSupabaseServerClient()
  
  const [assetsResult, branchesResult, categoriesResult] = await Promise.all([
    supabase
      .from("assets")
      .select("*, branches(id, name, code), asset_categories(id, name)")
      .order("created_at", { ascending: false }),
    supabase.from("branches").select("id, name, code").eq("status", "active").order("name"),
    supabase.from("asset_categories").select("id, name").order("name"),
  ])

  return {
    assets: assetsResult.data || [],
    branches: branchesResult.data || [],
    categories: categoriesResult.data || [],
  }
}

export default async function AssetsPage() {
  const { assets, branches, categories } = await getAssets()

  return (
    <DashboardLayout
      title="Asset Register"
      description="Complete inventory of all First Pack Company assets"
      actions={
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Link href="/assets/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </Link>
        </div>
      }
    >
      <AssetsTable assets={assets} branches={branches} categories={categories} />
    </DashboardLayout>
  )
}
