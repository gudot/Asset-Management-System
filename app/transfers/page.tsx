import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeftRight, CheckCircle, Clock, XCircle } from "lucide-react"
import Link from "next/link"
import { completeTransfer, cancelTransfer } from "./actions"

async function getTransfers() {
  const supabase = await getSupabaseServerClient()
  
  const { data: transfers } = await supabase
    .from("asset_transfers")
    .select(`
      *,
      assets(id, name, asset_tag),
      from_branch:branches!asset_transfers_from_branch_id_fkey(id, name, code),
      to_branch:branches!asset_transfers_to_branch_id_fkey(id, name, code)
    `)
    .order("created_at", { ascending: false })

  return transfers || []
}

export default async function TransfersPage() {
  const transfers = await getTransfers()

  const pendingCount = transfers.filter(t => t.status === "pending" || t.status === "in_transit").length
  const completedCount = transfers.filter(t => t.status === "completed").length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "in_transit":
        return <Badge className="bg-blue-100 text-blue-800">In Transit</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <DashboardLayout
      title="Asset Transfers"
      description="Track asset movements between branches"
      actions={
        <Link href="/transfers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Transfer
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-yellow-100 p-3">
                <Clock className="h-6 w-6 text-yellow-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Transfers</p>
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
              <div className="rounded-full bg-blue-100 p-3">
                <ArrowLeftRight className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{transfers.length}</p>
                <p className="text-sm text-muted-foreground">Total Transfers</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transfers List */}
        <Card>
          <CardHeader>
            <CardTitle>Transfer Records</CardTitle>
          </CardHeader>
          <CardContent>
            {transfers.length > 0 ? (
              <div className="space-y-4">
                {transfers.map((transfer) => (
                  <div key={transfer.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-muted p-2">
                        <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <Link 
                          href={`/assets/${transfer.assets?.id}`}
                          className="font-medium hover:underline"
                        >
                          {transfer.assets?.name}
                        </Link>
                        <p className="text-xs text-muted-foreground font-mono">
                          {transfer.assets?.asset_tag}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-sm">
                          <span className="font-medium">{transfer.from_branch?.name}</span>
                          <ArrowLeftRight className="h-3 w-3" />
                          <span className="font-medium">{transfer.to_branch?.name}</span>
                        </div>
                        {transfer.reason && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Reason: {transfer.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {getStatusBadge(transfer.status)}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(transfer.transfer_date).toLocaleDateString()}
                        </p>
                      </div>
                      {(transfer.status === "pending" || transfer.status === "in_transit") && (
                        <div className="flex gap-2">
                          <form action={completeTransfer.bind(null, transfer.id)}>
                            <Button type="submit" size="sm" variant="outline">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Complete
                            </Button>
                          </form>
                          <form action={cancelTransfer.bind(null, transfer.id)}>
                            <Button type="submit" size="sm" variant="ghost">
                              <XCircle className="mr-1 h-3 w-3" />
                              Cancel
                            </Button>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <ArrowLeftRight className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No transfers recorded yet</p>
                <Link href="/transfers/new" className="mt-4">
                  <Button>Create First Transfer</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
