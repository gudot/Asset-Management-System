"use client";

import React from "react"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Asset } from "@/lib/types";
import { disposalFormSchema, zodErrorMessage } from "@/lib/validation";

export default function NewDisposalPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    asset_id: "",
    disposal_date: new Date().toISOString().split("T")[0],
    disposal_method: "",
    disposal_value: "",
    reason: "",
    approved_by: "",
  });

  const supabase = createClient() as any;

  useEffect(() => {
    fetchAssets();
  }, []);

  async function fetchAssets() {
    const { data } = await supabase
      .from("assets")
      .select("*, branches(name)")
      .neq("status", "disposed")
      .order("asset_tag");

    setAssets(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const values = disposalFormSchema.parse(formData);

      // Create disposal record
      const { data: disposal, error: disposalError } = await supabase
        .from("asset_disposals")
        .insert(values)
        .select("id")
        .single();

      if (disposalError) throw disposalError;

      // Update asset status to disposed
      const { error: assetError } = await supabase
        .from("assets")
        .update({ status: "disposed", updated_at: new Date().toISOString() })
        .eq("id", values.asset_id);

      if (assetError) throw assetError;

      // Log the action
      await supabase.from("audit_logs").insert({
        entity_type: "asset",
        entity_id: values.asset_id,
        action: "dispose",
        changes: { ...values, disposal_id: disposal?.id },
        performed_by: "System User",
      });

      router.push("/disposals");
    } catch (error) {
      console.error("Error creating disposal:", error);
      alert(zodErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  const selectedAsset = assets.find((a) => a.id === formData.asset_id);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/disposals">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Record Asset Disposal
            </h1>
            <p className="text-muted-foreground">
              Document the disposal or retirement of an asset
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Disposal Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="asset">Select Asset *</Label>
                <Select
                  value={formData.asset_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, asset_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an asset to dispose" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        <span className="font-mono">{asset.asset_tag}</span> -{" "}
                        {asset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAsset && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Current Location:
                        </span>
                        <span>{(selectedAsset as any).branches?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="capitalize">{selectedAsset.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Purchase Price:
                        </span>
                        <span>
                          ${selectedAsset.purchase_price?.toFixed(2) || "N/A"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="disposal_date">Disposal Date *</Label>
                  <Input
                    id="disposal_date"
                    type="date"
                    value={formData.disposal_date}
                    onChange={(e) =>
                      setFormData({ ...formData, disposal_date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="disposal_method">Disposal Method *</Label>
                  <Select
                    value={formData.disposal_method}
                    onValueChange={(value) =>
                      setFormData({ ...formData, disposal_method: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="donated">Donated</SelectItem>
                      <SelectItem value="scrapped">Scrapped</SelectItem>
                      <SelectItem value="written_off">Written Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="disposal_value">
                    Disposal/Recovery Value (USD)
                  </Label>
                  <Input
                    id="disposal_value"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.disposal_value}
                    onChange={(e) =>
                      setFormData({ ...formData, disposal_value: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="approved_by">Approved By</Label>
                  <Input
                    id="approved_by"
                    placeholder="Name of approving officer"
                    value={formData.approved_by}
                    onChange={(e) =>
                      setFormData({ ...formData, approved_by: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Disposal *</Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why this asset is being disposed..."
                  rows={4}
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  required
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  className="flex-1"
                  disabled={
                    loading ||
                    !formData.asset_id ||
                    !formData.disposal_method ||
                    !formData.reason
                  }
                >
                  {loading ? "Recording..." : "Record Disposal"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
