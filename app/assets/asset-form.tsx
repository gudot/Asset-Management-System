"use client";

import { useState, useTransition } from "react";
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
import {
  ArrowLeft,
  Loader2,
  Save,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import type { Asset, Branch, AssetCategory } from "@/lib/types";
import { createAsset, updateAsset } from "./actions";

interface AssetFormProps {
  asset?: Asset;
  branches: Pick<Branch, "id" | "name" | "code">[];
  categories: Pick<AssetCategory, "id" | "name">[];
}

export function AssetForm({ asset, branches, categories }: AssetFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const isEditing = !!asset;

  const handleSubmit = (formData: FormData) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        let result;
        if (isEditing) {
          result = await updateAsset(asset.id, formData);
        } else {
          result = await createAsset(formData);
        }

        if (result?.error) {
          setError(result.error);
        } else {
          setSuccess(
            isEditing
              ? "Asset updated successfully"
              : "Asset created successfully",
          );
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred",
        );
      }
    });
  };

  return (
    <div className="max-w-3xl">
      <Link
        href="/assets"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Assets
      </Link>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-800 mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="flex items-start gap-3 pt-6">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">Success</h3>
              <p className="text-sm text-green-800 mt-1">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <form action={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Asset Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Dell Latitude 5520 Laptop"
                  defaultValue={asset?.name}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category_id">Category *</Label>
                <Select
                  name="category_id"
                  defaultValue={asset?.category_id}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch_id">Branch Location *</Label>
                <Select
                  name="branch_id"
                  defaultValue={asset?.branch_id}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} ({branch.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Brief description of the asset"
                  defaultValue={asset?.description || ""}
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="serial_number">Serial Number</Label>
                <Input
                  id="serial_number"
                  name="serial_number"
                  placeholder="Manufacturer serial number"
                  defaultValue={asset?.serial_number || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  name="model"
                  placeholder="Model number/name"
                  defaultValue={asset?.model || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  name="manufacturer"
                  placeholder="e.g., Dell, HP, Toyota"
                  defaultValue={asset?.manufacturer || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="e.g., Room 205, Floor 2"
                  defaultValue={asset?.location || ""}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Details */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <Input
                  id="purchase_date"
                  name="purchase_date"
                  type="date"
                  defaultValue={asset?.purchase_date || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
                <Input
                  id="warranty_expiry"
                  name="warranty_expiry"
                  type="date"
                  defaultValue={asset?.warranty_expiry || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase_price">Purchase Price (USD)</Label>
                <Input
                  id="purchase_price"
                  name="purchase_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  defaultValue={asset?.purchase_price || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_value">Current Value (USD)</Label>
                <Input
                  id="current_value"
                  name="current_value"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  defaultValue={asset?.current_value || ""}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status & Condition */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Condition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    name="status"
                    defaultValue={asset?.status || "active"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="active">Active</SelectItem>
                       <SelectItem value="in_repair">In Repair</SelectItem>
                       <SelectItem value="transferred">Transferred</SelectItem>
                       <SelectItem value="disposed">Disposed</SelectItem>
                       <SelectItem value="lost">Lost</SelectItem>
                       <SelectItem value="stolen">Stolen</SelectItem>
                     </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select
                  name="condition"
                  defaultValue={asset?.condition || "good"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Additional notes about this asset"
                  defaultValue={asset?.notes || ""}
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isEditing ? "Update Asset" : "Register Asset"}
          </Button>
          <Link href="/assets">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
