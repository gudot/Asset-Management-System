import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuditForm } from "./audit-form"

async function getBranches() {
  const supabase = await getSupabaseServerClient()

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name, code")
    .eq("status", "active")
    .order("name")

  return branches || []
}

export default async function NewAuditPage() {
  const branches = await getBranches()

  return (
    <DashboardLayout
      title="Schedule Audit"
      description="Plan a new asset verification audit"
    >
      <AuditForm branches={branches} />
    </DashboardLayout>
  )
}
