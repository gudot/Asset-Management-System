import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Plus, ClipboardCheck, AlertTriangle, CheckCircle, Clock, Play } from "lucide-react"
import Link from "next/link"
import { startAudit, completeAudit } from "./actions"

async function getAudits() {
  const supabase = await getSupabaseServerClient()
  
  const { data: audits } = await supabase
    .from("asset_audits")
    .select(`
      *,
      branches(id, name, code)
    `)
    .order("audit_date", { ascending: false })

  return audits || []
}

export default async function AuditsPage() {
  const audits = await getAudits()

  const plannedCount = audits.filter(a => a.status === "planned").length
  const inProgressCount = audits.filter(a => a.status === "in_progress").length
  const completedCount = audits.filter(a => a.status === "completed").length
  const totalDiscrepancies = audits.reduce((sum, a) => sum + (a.discrepancies || 0), 0)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "planned":
        return <Badge className="bg-blue-100 text-blue-800">Planned</Badge>
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <DashboardLayout
      title="Asset Audits"
      description="Plan and conduct asset verification audits"
      actions={
        <Link href="/audits/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Audit
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-blue-100 p-3">
                <Clock className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{plannedCount}</p>
                <p className="text-sm text-muted-foreground">Planned</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-yellow-100 p-3">
                <Play className="h-6 w-6 text-yellow-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressCount}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-red-100 p-3">
                <AlertTriangle className="h-6 w-6 text-red-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalDiscrepancies}</p>
                <p className="text-sm text-muted-foreground">Discrepancies</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audits List */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Records</CardTitle>
          </CardHeader>
          <CardContent>
            {audits.length > 0 ? (
              <div className="space-y-4">
                {audits.map((audit) => {
                  const progress = audit.total_assets > 0 
                    ? Math.round((audit.verified_assets / audit.total_assets) * 100)
                    : 0

                  return (
                    <div key={audit.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="rounded-full bg-muted p-2 mt-1">
                            <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{audit.branches?.name} Audit</span>
                              {getStatusBadge(audit.status)}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Auditor: {audit.auditor_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Scheduled: {new Date(audit.audit_date).toLocaleDateString()}
                            </p>

                            {audit.status !== "planned" && (
                              <div className="mt-3 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span>Progress</span>
                                  <span className="font-medium">{audit.verified_assets} / {audit.total_assets} verified</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                              </div>
                            )}

                            {audit.discrepancies > 0 && (
                              <div className="mt-2 flex items-center gap-1 text-sm text-red-600">
                                <AlertTriangle className="h-4 w-4" />
                                <span>{audit.discrepancies} discrepancies found</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {audit.status === "planned" && (
                            <form action={startAudit.bind(null, audit.id)}>
                              <Button type="submit" size="sm">
                                <Play className="mr-1 h-3 w-3" />
                                Start
                              </Button>
                            </form>
                          )}
                          {audit.status === "in_progress" && (
                            <>
                              <Link href={`/audits/${audit.id}`}>
                                <Button size="sm" variant="outline">
                                  Continue
                                </Button>
                              </Link>
                              <form action={completeAudit.bind(null, audit.id)}>
                                <Button type="submit" size="sm">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Complete
                                </Button>
                              </form>
                            </>
                          )}
                          {audit.status === "completed" && (
                            <Link href={`/audits/${audit.id}`}>
                              <Button size="sm" variant="outline">
                                View Report
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                      {audit.notes && (
                        <div className="mt-3 border-t pt-3">
                          <p className="text-xs text-muted-foreground">{audit.notes}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <ClipboardCheck className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No audits scheduled yet</p>
                <Link href="/audits/new" className="mt-4">
                  <Button>Schedule First Audit</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
