"use client"

import { useTransition, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, ArrowRight, Loader2, Package } from "lucide-react"
import Link from "next/link"
import { createTransfer } from "../actions"

interface Asset {
  id: string
  name: string
  asset_tag: string
  branch_id: string
  branches: { name: string } | null
}

interface Branch {
  id: string
  name: string
  code: string
}

interface TransferFormProps {
  assets: Asset[]
  branches: Branch[]
  selectedAsset: Asset | null
}

export function TransferForm({ assets, branches, selectedAsset }: TransferFormProps) {
  const [isPending, startTransition] = useTransition()
  const [assetId, setAssetId] = useState(selectedAsset?.id || "")

  const currentAsset = assets.find(a => a.id === assetId)
  const availableBranches = branches.filter(b => b.id !== currentAsset?.branch_id)

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await createTransfer(formData)
    })
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/transfers"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Transfers
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Transfer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="asset_id">Select Asset *</Label>
              <Select
                name="asset_id"
                value={assetId}
                onValueChange={setAssetId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose asset to transfer" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>{asset.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({asset.asset_tag})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentAsset && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Location</p>
                    <p className="font-medium">{currentAsset.branches?.name || "Unknown"}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Transfer To</p>
                    <p className="font-medium text-primary">Select destination</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="to_branch_id">Destination Branch *</Label>
              <Select name="to_branch_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination branch" />
                </SelectTrigger>
                <SelectContent>
                  {availableBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name} ({branch.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentAsset && availableBranches.length === 0 && (
                <p className="text-sm text-destructive">
                  No other branches available for transfer
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="transferred_by">Transferred By</Label>
              <Input
                id="transferred_by"
                name="transferred_by"
                placeholder="Name of person initiating transfer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Transfer</Label>
              <Textarea
                id="reason"
                name="reason"
                placeholder="Explain why this asset is being transferred"
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isPending || !assetId}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Initiate Transfer
              </Button>
              <Link href="/transfers">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
