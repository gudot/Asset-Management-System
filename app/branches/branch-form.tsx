"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Loader2,
  Save,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import type { Branch } from "@/lib/types";
import { createBranch, updateBranch } from "./actions";

interface BranchFormProps {
  branch?: Branch;
}

export function BranchForm({ branch }: BranchFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const isEditing = !!branch;

  const handleSubmit = (formData: FormData) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        let result;
        if (isEditing) {
          result = await updateBranch(branch.id, formData);
        } else {
          result = await createBranch(formData);
        }

        if (result?.error) {
          setError(result.error);
        } else {
          setSuccess(
            isEditing
              ? "Branch updated successfully"
              : "Branch created successfully",
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
    <div className="max-w-2xl">
      <Link
        href="/branches"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Branches
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

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Branch" : "Branch Details"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Branch Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Harare Central"
                  defaultValue={branch?.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Branch Code *</Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="e.g., HAR"
                  maxLength={10}
                  defaultValue={branch?.code}
                  className="uppercase"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Short code for asset tagging (max 10 chars)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Textarea
                id="address"
                name="address"
                placeholder="Enter full street address"
                defaultValue={branch?.address || ""}
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="e.g., Harare"
                  defaultValue={branch?.city || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="e.g., +263 242 123 456"
                  defaultValue={branch?.phone || ""}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="branch@firstpack.co.zw"
                  defaultValue={branch?.email || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager_name">Branch Manager</Label>
                <Input
                  id="manager_name"
                  name="manager_name"
                  placeholder="Manager's full name"
                  defaultValue={branch?.manager_name || ""}
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="status">Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Inactive branches cannot receive new assets
                  </p>
                </div>
                <Switch
                  id="status"
                  name="status"
                  defaultChecked={branch?.status === "active"}
                  value="true"
                />
              </div>
            )}

            {!isEditing && (
              <input type="hidden" name="is_headquarters" value="false" />
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isEditing ? "Update Branch" : "Create Branch"}
              </Button>
              <Link href="/branches">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
