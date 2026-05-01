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
import { ArrowLeft, Loader2, Save, Package } from "lucide-react"
import Link from "next/link"
import { createMaintenance } from "../actions"

interface Asset {
  id: string
  name: string
  asset_tag: string
  branches: { name: string } | null
}

interface MaintenanceFormProps {
  assets: Asset[]
  selectedAsset: Asset | null
}

export function MaintenanceForm({ assets, selectedAsset }: MaintenanceFormProps) {
  const [isPending, startTransition] = useTransition()
  const [assetId, setAssetId] = useState(selectedAsset?.id || "")

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await createMaintenance(formData)
    })
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/maintenance"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Maintenance
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Details</CardTitle>
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
                  <SelectValue placeholder="Choose asset" />
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maintenance_type">Maintenance Type *</Label>
                <Select name="maintenance_type" defaultValue="corrective" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Preventive</SelectItem>
                    <SelectItem value="corrective">Corrective</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="performed_date">Date Performed *</Label>
                <Input
                  id="performed_date"
                  name="performed_date"
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the maintenance work performed"
                rows={3}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cost">Cost (USD)</Label>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="performed_by">Performed By</Label>
                <Input
                  id="performed_by"
                  name="performed_by"
                  placeholder="Technician or company name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_maintenance_date">Next Maintenance Date</Label>
              <Input
                id="next_maintenance_date"
                name="next_maintenance_date"
                type="date"
              />
              <p className="text-xs text-muted-foreground">
                Schedule the next maintenance if applicable
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Any additional notes or observations"
                rows={2}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isPending || !assetId}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Log Maintenance
              </Button>
              <Link href="/maintenance">
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
