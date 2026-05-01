"use client";

import React from "react"

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Tags, Package } from "lucide-react";
import type { AssetCategory } from "@/lib/types";
import { categoryFormSchema, zodErrorMessage } from "@/lib/validation";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<(AssetCategory & { assetCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    depreciation_rate: "20",
    useful_life_years: "5",
  });

  const supabase = createClient() as any;

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const { data: cats } = await supabase
        .from("asset_categories")
        .select("*")
        .order("name");

      // Get asset counts for each category
      const categoriesWithCounts = await Promise.all(
        (cats || []).map(async (cat: AssetCategory) => {
          const { count } = await supabase
            .from("assets")
            .select("*", { count: "exact", head: true })
            .eq("category_id", cat.id);
          return { ...cat, assetCount: count || 0 };
        })
      );

      setCategories(categoriesWithCounts);
    } catch (error) {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  function openAddDialog() {
    setEditingCategory(null);
    setFormData({ name: "", description: "", depreciation_rate: "20", useful_life_years: "5" });
    setDialogOpen(true);
  }

  function openEditDialog(category: AssetCategory) {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      depreciation_rate: category.depreciation_rate?.toString() || "20",
      useful_life_years: category.useful_life_years?.toString() || "5",
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const categoryData = categoryFormSchema.parse({
        name: formData.name,
        description: formData.description || null,
        depreciation_rate: formData.depreciation_rate,
        useful_life_years: formData.useful_life_years,
      });

      if (editingCategory) {
        const { error } = await supabase
          .from("asset_categories")
          .update(categoryData)
          .eq("id", editingCategory.id);
        if (error) throw error;
        await supabase.from("audit_logs").insert({
          entity_type: "category",
          entity_id: editingCategory.id,
          action: "update",
          changes: categoryData,
          performed_by: "System User",
        });
      } else {
        const { data: category, error } = await supabase
          .from("asset_categories")
          .insert(categoryData)
          .select("id")
          .single();
        if (error) throw error;
        if (category?.id) {
          await supabase.from("audit_logs").insert({
            entity_type: "category",
            entity_id: category.id,
            action: "create",
            changes: categoryData,
            performed_by: "System User",
          });
        }
      }

      setDialogOpen(false);
      fetchCategories();
    } catch (error) {
      alert(zodErrorMessage(error));
    }
  }

  async function handleDelete(category: AssetCategory & { assetCount: number }) {
    if (category.assetCount > 0) {
      alert(`Cannot delete category with ${category.assetCount} assigned assets`);
      return;
    }

    if (!confirm(`Delete category "${category.name}"?`)) return;

    try {
      const { error } = await supabase
        .from("asset_categories")
        .delete()
        .eq("id", category.id);

      if (error) throw error;
      await supabase.from("audit_logs").insert({
        entity_type: "category",
        entity_id: category.id,
        action: "delete",
        changes: category,
        performed_by: "System User",
      });
      fetchCategories();
    } catch (error) {
      alert(zodErrorMessage(error));
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Asset Categories
            </h1>
            <p className="text-muted-foreground">
              Manage asset classification and depreciation rates
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Computer Equipment"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description of this category..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depreciation_rate">
                    Annual Depreciation Rate (%)
                  </Label>
                  <Input
                    id="depreciation_rate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.depreciation_rate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        depreciation_rate: e.target.value,
                      })
                    }
                    placeholder="20"
                  />
                  <p className="text-xs text-muted-foreground">
                    Standard straight-line depreciation rate for this category
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="useful_life_years">
                    Useful Life (Years)
                  </Label>
                  <Input
                    id="useful_life_years"
                    type="number"
                    step="1"
                    min="1"
                    max="100"
                    value={formData.useful_life_years}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        useful_life_years: e.target.value,
                      })
                    }
                    placeholder="5"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingCategory ? "Update" : "Create"} Category
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Tags className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Categories
                  </p>
                  <p className="text-2xl font-bold">{categories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Package className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Categorized Assets
                  </p>
                  <p className="text-2xl font-bold">
                    {categories.reduce((sum, c) => sum + c.assetCount, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground">Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2">
                <Tags className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No categories found</p>
                <Button variant="outline" size="sm" onClick={openAddDialog}>
                  Add your first category
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">
                      Depreciation Rate
                    </TableHead>
                    <TableHead className="text-right">Useful Life</TableHead>
                    <TableHead className="text-right">Assets</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-muted-foreground">
                        {category.description || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {category.depreciation_rate}%
                      </TableCell>
                      <TableCell className="text-right">
                        {category.useful_life_years || "-"} years
                      </TableCell>
                      <TableCell className="text-right">
                        {category.assetCount}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(category)}
                            disabled={category.assetCount > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
