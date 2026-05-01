import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { BranchesTable } from "./branches-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

async function getBranches() {
  const supabase = await getSupabaseServerClient()
  const { data: branches, error } = await supabase.from("branches").select("*").order("name")

  if (error) {
    return []
  }

  // Get asset counts for each branch
  const branchesWithCounts = await Promise.all(
    (branches || []).map(async (branch: any) => {
      const { count, error: countError } = await supabase
        .from("assets")
        .select("*", { count: "exact", head: true })
        .eq("branch_id", branch.id)

      return {
        ...branch,
        address: branch.address || null,
        city: branch.city || null,
        phone: branch.phone || null,
        email: branch.email || null,
        manager_name: branch.manager_name || null,
        is_headquarters: Boolean(branch.is_headquarters),
        status: branch.status || "active",
        created_at: branch.created_at || "",
        updated_at: branch.updated_at || "",
        asset_count: countError ? 0 : count || 0,
      }
    })
  )

  return branchesWithCounts.sort((a, b) => {
    if (a.is_headquarters !== b.is_headquarters) return a.is_headquarters ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

export default async function BranchesPage() {
  const branches = await getBranches()

  return (
    <DashboardLayout
      title="Branch Management"
      description="Manage all First Pack Company branches and their details"
      actions={
        <Link href="/branches/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Branch
          </Button>
        </Link>
      }
    >
      <BranchesTable branches={branches} />
    </DashboardLayout>
  )
}
