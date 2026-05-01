"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { MoreHorizontal, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react"
import { updateAuditItem } from "../actions"

interface AuditItem {
  id: string
  status: string
  notes: string | null
  assets: {
    id: string
    name: string
  } | null
}

interface AuditItemActionsProps {
  auditId: string
  item: AuditItem
}

export function AuditItemActions({ auditId, item }: AuditItemActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [showNotesDialog, setShowNotesDialog] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [notes, setNotes] = useState("")

  const handleStatusChange = (status: "verified" | "missing" | "damaged" | "discrepancy") => {
    if (status === "verified") {
      startTransition(async () => {
        await updateAuditItem(auditId, item.id, status)
      })
    } else {
      setPendingStatus(status)
      setShowNotesDialog(true)
    }
  }

  const handleSubmitWithNotes = () => {
    if (pendingStatus) {
      startTransition(async () => {
        await updateAuditItem(
          auditId, 
          item.id, 
          pendingStatus as "verified" | "missing" | "damaged" | "discrepancy",
          notes
        )
        setShowNotesDialog(false)
        setNotes("")
        setPendingStatus(null)
      })
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleStatusChange("verified")}>
            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
            Mark Verified
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatusChange("missing")}>
            <XCircle className="mr-2 h-4 w-4 text-red-600" />
            Mark Missing
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatusChange("damaged")}>
            <AlertTriangle className="mr-2 h-4 w-4 text-yellow-600" />
            Mark Damaged
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatusChange("discrepancy")}>
            <AlertTriangle className="mr-2 h-4 w-4 text-orange-600" />
            Report Discrepancy
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Notes for {item.assets?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Describe the issue..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitWithNotes} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
