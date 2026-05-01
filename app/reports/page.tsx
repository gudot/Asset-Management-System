"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
import {
  FileText,
  Download,
  Building2,
  Package,
  TrendingUp,
  AlertTriangle,
  Wrench,
  ArrowLeftRight,
} from "lucide-react";
import type { Branch, AssetCategory } from "@/lib/types";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import * as XLSX from "xlsx";

type ReportType =
  | "asset-register"
  | "branch-summary"
  | "depreciation"
  | "maintenance"
  | "transfers"
  | "disposal";

type ReportRow = Record<string, string | number>;

const reportTypes = [
  { value: "asset-register", label: "Asset Register", icon: Package, description: "Complete list of all assets" },
  { value: "branch-summary", label: "Branch Summary", icon: Building2, description: "Assets by branch location" },
  { value: "depreciation", label: "Depreciation Report", icon: TrendingUp, description: "Asset values and depreciation" },
  { value: "maintenance", label: "Maintenance History", icon: Wrench, description: "Maintenance records" },
  { value: "transfers", label: "Transfer History", icon: ArrowLeftRight, description: "Asset movement between branches" },
  { value: "disposal", label: "Disposal Report", icon: AlertTriangle, description: "Disposed assets" },
] as const;

const columnHelper = createColumnHelper<ReportRow>();

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

const dateOnly = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : "-";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("asset-register");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [reportRows, setReportRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [summary, setSummary] = useState({
    totalAssets: 0,
    totalValue: 0,
    activeAssets: 0,
    maintenanceCount: 0,
  });

  const supabase = createClient() as any;

  useEffect(() => {
    async function fetchBranchesAndCategories() {
      const [branchRes, catRes] = await Promise.all([
        supabase.from("branches").select("*").eq("status", "active").order("name"),
        supabase.from("asset_categories").select("*").order("name"),
      ]);

      if (branchRes.data) setBranches(branchRes.data);
      if (catRes.data) setCategories(catRes.data);
    }

    fetchBranchesAndCategories();
  }, [supabase]);

  useEffect(() => {
    generateReport();
  }, [reportType, selectedBranch]);

  async function generateReport() {
    setLoading(true);
    setError("");

    try {
      if (reportType === "asset-register") {
        let query = supabase
          .from("assets")
          .select("*, branches(name), asset_categories(name)")
          .order("asset_tag");

        if (selectedBranch !== "all") query = query.eq("branch_id", selectedBranch);

        const { data, error: queryError } = await query;
        if (queryError) throw queryError;

        const assets = data || [];
        setReportRows(
          assets.map((asset: any) => ({
            "Asset Tag": asset.asset_tag,
            Name: asset.name,
            Category: asset.asset_categories?.name || "-",
            Branch: asset.branches?.name || "-",
            Status: asset.status,
            Condition: asset.condition,
            "Purchase Cost": asset.purchase_price || 0,
            "Current Value": asset.current_value || 0,
          })),
        );
        setSummary({
          totalAssets: assets.length,
          totalValue: assets.reduce((sum: number, asset: any) => sum + (asset.current_value || asset.purchase_price || 0), 0),
          activeAssets: assets.filter((asset: any) => asset.status === "active").length,
          maintenanceCount: assets.filter((asset: any) => asset.status === "in_repair").length,
        });
      }

      if (reportType === "branch-summary") {
        const { data, error: branchError } = await supabase
          .from("branches")
          .select("*")
          .eq("status", "active")
          .order("name");
        if (branchError) throw branchError;

        const summaries = await Promise.all(
          (data || [])
            .filter((branch: any) => selectedBranch === "all" || branch.id === selectedBranch)
            .map(async (branch: any) => {
              const { data: assets } = await supabase
                .from("assets")
                .select("status, current_value, purchase_price")
                .eq("branch_id", branch.id);

              return {
                Branch: branch.name,
                Code: branch.code,
                City: branch.city || "-",
                "Total Assets": assets?.length || 0,
                Active: assets?.filter((asset: any) => asset.status === "active").length || 0,
                "In Repair": assets?.filter((asset: any) => asset.status === "in_repair").length || 0,
                "Total Value": assets?.reduce((sum: number, asset: any) => sum + (asset.current_value || asset.purchase_price || 0), 0) || 0,
              };
            }),
        );
        setReportRows(summaries);
      }

      if (reportType === "depreciation") {
        let query = supabase
          .from("assets")
          .select("*, branches(name), asset_categories(name, depreciation_rate)")
          .not("purchase_price", "is", null);

        if (selectedBranch !== "all") query = query.eq("branch_id", selectedBranch);

        const { data, error: depError } = await query;
        if (depError) throw depError;

        setReportRows(
          (data || []).map((asset: any) => {
            const purchaseDate = asset.purchase_date ? new Date(asset.purchase_date) : new Date();
            const yearsOwned = Math.max((Date.now() - purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000), 0);
            const rate = (asset.asset_categories?.depreciation_rate ?? 20) / 100;
            const depreciation = Math.min((asset.purchase_price || 0) * rate * yearsOwned, asset.purchase_price || 0);
            const currentValue = Math.max((asset.purchase_price || 0) - depreciation, 0);

            return {
              "Asset Tag": asset.asset_tag,
              Name: asset.name,
              Category: asset.asset_categories?.name || "-",
              Branch: asset.branches?.name || "-",
              "Purchase Cost": asset.purchase_price || 0,
              "Years Owned": Number(yearsOwned.toFixed(1)),
              Depreciation: Number(depreciation.toFixed(2)),
              "Current Value": Number(currentValue.toFixed(2)),
            };
          }),
        );
      }

      if (reportType === "maintenance") {
        const { data, error: maintError } = await supabase
          .from("asset_maintenance")
          .select("*, assets(asset_tag, name, branch_id, branches(name))")
          .order("performed_date", { ascending: false });
        if (maintError) throw maintError;

        setReportRows(
          (data || [])
            .filter((record: any) => selectedBranch === "all" || record.assets?.branch_id === selectedBranch)
            .map((record: any) => ({
              Asset: `${record.assets?.asset_tag || "-"} - ${record.assets?.name || "-"}`,
              Branch: record.assets?.branches?.name || "-",
              Type: record.maintenance_type,
              Date: dateOnly(record.performed_date),
              Cost: record.cost || 0,
              "Performed By": record.performed_by || "-",
            })),
        );
      }

      if (reportType === "transfers") {
        const { data, error: transferError } = await supabase
          .from("asset_transfers")
          .select("*, assets(asset_tag, name), from_branch:branches!asset_transfers_from_branch_id_fkey(id, name), to_branch:branches!asset_transfers_to_branch_id_fkey(id, name)")
          .order("transfer_date", { ascending: false });
        if (transferError) throw transferError;

        setReportRows(
          (data || [])
            .filter((transfer: any) => selectedBranch === "all" || transfer.from_branch?.id === selectedBranch || transfer.to_branch?.id === selectedBranch)
            .map((transfer: any) => ({
              Asset: `${transfer.assets?.asset_tag || "-"} - ${transfer.assets?.name || "-"}`,
              "From Branch": transfer.from_branch?.name || "-",
              "To Branch": transfer.to_branch?.name || "-",
              Date: dateOnly(transfer.transfer_date),
              Status: transfer.status,
              Reason: transfer.reason || "-",
            })),
        );
      }

      if (reportType === "disposal") {
        const { data, error: disposalError } = await supabase
          .from("asset_disposals")
          .select("*, assets(asset_tag, name, branch_id, purchase_price, branches(name))")
          .order("disposal_date", { ascending: false });
        if (disposalError) throw disposalError;

        setReportRows(
          (data || [])
            .filter((disposal: any) => selectedBranch === "all" || disposal.assets?.branch_id === selectedBranch)
            .map((disposal: any) => ({
              Asset: `${disposal.assets?.asset_tag || "-"} - ${disposal.assets?.name || "-"}`,
              Branch: disposal.assets?.branches?.name || "-",
              Method: disposal.disposal_method,
              Reason: disposal.reason,
              Date: dateOnly(disposal.disposal_date),
              "Disposal Value": disposal.disposal_value || 0,
              "Purchase Cost": disposal.assets?.purchase_price || 0,
            })),
        );
      }
    } catch (reportError) {
      setReportRows([]);
      setError(reportError instanceof Error ? reportError.message : "Failed to generate report");
    } finally {
      setLoading(false);
    }
  }

  const columns = useMemo(() => {
    const keys = Object.keys(reportRows[0] || {});
    return keys.map((key) =>
      columnHelper.accessor(key, {
        header: key,
        cell: (info) => {
          const value = info.getValue();
          if (key.toLowerCase().includes("value") || key.toLowerCase().includes("cost")) {
            return typeof value === "number" ? money(value) : value;
          }
          if (key === "Status") {
            return <Badge variant={value === "active" || value === "completed" ? "default" : "secondary"}>{String(value)}</Badge>;
          }
          return String(value ?? "-");
        },
      }),
    );
  }, [reportRows]);

  const table = useReactTable({
    data: reportRows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  function exportWorkbook() {
    if (reportRows.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(reportRows);
    const workbook = XLSX.utils.book_new();
    const title = reportTypes.find((type) => type.value === reportType)?.label || "Report";
    XLSX.utils.book_append_sheet(workbook, worksheet, title.slice(0, 31));
    XLSX.writeFile(workbook, `${reportType}-report-${new Date().toISOString().split("T")[0]}.xlsx`);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground">Generate and export asset management reports</p>
          </div>
          <Button onClick={exportWorkbook} disabled={reportRows.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reportTypes.map((type) => (
            <Card
              key={type.value}
              className={`cursor-pointer transition-all hover:shadow-md ${reportType === type.value ? "border-primary ring-2 ring-primary/20" : ""}`}
              onClick={() => setReportType(type.value)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${reportType === type.value ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <type.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{type.label}</p>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="flex flex-wrap items-end gap-4 p-4">
            <div className="w-full sm:w-56">
              <Label>Branch</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generateReport} disabled={loading}>
              <FileText className="mr-2 h-4 w-4" />
              {loading ? "Generating..." : "Generate Report"}
            </Button>
            <div className="text-sm text-muted-foreground">
              {categories.length} categories available
            </div>
          </CardContent>
        </Card>

        {reportType === "asset-register" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Assets</p><p className="text-2xl font-bold">{summary.totalAssets}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Value</p><p className="text-2xl font-bold">{money(summary.totalValue)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Active Assets</p><p className="text-2xl font-bold text-green-600">{summary.activeAssets}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">In Repair</p><p className="text-2xl font-bold text-amber-600">{summary.maintenanceCount}</p></CardContent></Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{reportTypes.find((r) => r.value === reportType)?.label} Results</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground">Generating report...</p>
              </div>
            ) : reportRows.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground">No data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className="whitespace-nowrap"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === "asc" ? " ↑" : header.column.getIsSorted() === "desc" ? " ↓" : ""}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="whitespace-nowrap">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
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
