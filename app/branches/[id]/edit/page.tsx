import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { BranchForm } from "../../branch-form"
import { notFound } from "next/navigation"

async function getBranch(id: string) {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !data) return null
  return data
}

export default async function EditBranchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const branch = await getBranch(id)

  if (!branch) {
    notFound()
  }

  return (
    <DashboardLayout
      title={`Edit ${branch.name}`}
      description="Update branch information"
    >
      <BranchForm branch={branch} />
    </DashboardLayout>
  )
}
