import { DashboardLayout } from "@/components/dashboard-layout"
import { BranchForm } from "../branch-form"

export default function NewBranchPage() {
  return (
    <DashboardLayout
      title="Add New Branch"
      description="Register a new branch location for First Pack Company"
    >
      <BranchForm />
    </DashboardLayout>
  )
}
