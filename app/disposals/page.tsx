"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, FileText } from "lucide-react";
import Link from "next/link";

interface DisposalRecord {
  id: string;
  asset_id: string;
  disposal_date: string;
  disposal_method: string;
  disposal_value: number | null;
  reason: string;
  approved_by: string | null;
  created_at: string;
  assets: {
    asset_tag: string;
    name: string;
    purchase_price: number | null;
    branches: { name: string } | null;
  } | null;
}

export default function DisposalsPage() {
  const [disposals, setDisposals] = useState<DisposalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDisposed: 0,
    totalValue: 0,
    thisMonth: 0,
  });

  const supabase = createClient() as any;

  useEffect(() => {
    fetchDisposals();
  }, []);

  async function fetchDisposals() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("asset_disposals")
        .select(
          `
          *,
          assets(asset_tag, name, purchase_price, branches(name))
        `
        )
        .order("disposal_date", { ascending: false });

      if (error) throw error;
      setDisposals((data || []).map((disposal: any) => ({
        ...disposal,
        assets: disposal.assets
          ? {
              ...disposal.assets,
              branches: Array.isArray(disposal.assets.branches)
                ? disposal.assets.branches[0] || null
                : disposal.assets.branches,
            }
          : null,
      })));

      // Calculate stats
      const totalValue =
        data?.reduce((sum: number, d: DisposalRecord) => sum + (d.disposal_value || 0), 0) || 0;
      const thisMonth =
        data?.filter((d: DisposalRecord) => {
          const disposalDate = new Date(d.disposal_date);
          const now = new Date();
          return (
            disposalDate.getMonth() === now.getMonth() &&
            disposalDate.getFullYear() === now.getFullYear()
          );
        }).length || 0;

      setStats({
        totalDisposed: data?.length || 0,
        totalValue,
        thisMonth,
      });
    } catch (error) {
      console.error("Error fetching disposals:", error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getMethodBadge = (method: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      sold: "default",
      donated: "secondary",
      scrapped: "destructive",
      recycled: "outline",
    };
    return <Badge variant={variants[method] || "secondary"}>{method}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Asset Disposals
            </h1>
            <p className="text-muted-foreground">
              Track disposed and retired assets
            </p>
          </div>
          <Button asChild>
            <Link href="/disposals/new">
              <Plus className="mr-2 h-4 w-4" />
              Record Disposal
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Disposed
                  </p>
                  <p className="text-2xl font-bold">{stats.totalDisposed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Recovery Value
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.totalValue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <Trash2 className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">{stats.thisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Disposals Table */}
        <Card>
          <CardHeader>
            <CardTitle>Disposal Records</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground">Loading disposals...</p>
              </div>
            ) : disposals.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2">
                <Trash2 className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No disposal records found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Original Location</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">
                        Original Cost
                      </TableHead>
                      <TableHead className="text-right">
                        Disposal Value
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disposals.map((disposal) => (
                      <TableRow key={disposal.id}>
                        <TableCell>
                          <div>
                            <span className="font-mono text-sm">
                              {disposal.assets?.asset_tag}
                            </span>
                            <p className="text-sm text-muted-foreground">
                              {disposal.assets?.name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {disposal.assets?.branches?.name || "-"}
                        </TableCell>
                        <TableCell>
                          {getMethodBadge(disposal.disposal_method)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {disposal.reason}
                        </TableCell>
                        <TableCell>
                          {new Date(disposal.disposal_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            disposal.assets?.purchase_price || 0
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(disposal.disposal_value || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
