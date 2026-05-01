"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { zodErrorMessage } from "@/lib/validation";
import {
  History,
  Search,
  Filter,
  Plus,
  Pencil,
  Trash2,
  ArrowLeftRight,
  Eye,
  CheckCircle,
} from "lucide-react";
import { Suspense } from "react";

interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  changes: Record<string, any> | null;
  performed_by: string | null;
  created_at: string;
}

const Loading = () => null;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterEntity, setFilterEntity] = useState<string>("all");
  const [error, setError] = useState("");

  const supabase = createClient() as any;

  useEffect(() => {
    fetchLogs();
  }, [filterAction, filterEntity]);

  async function fetchLogs() {
    setLoading(true);
    setError("");
    try {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (filterAction !== "all") {
        query = query.eq("action", filterAction);
      }
      if (filterEntity !== "all") {
        query = query.eq("entity_type", filterEntity);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs((data || []).map((log: any) => ({
        id: log.id,
        entity_type: log.entity_type || log.table_name || "system",
        entity_id: log.entity_id || log.record_id || log.id,
        action: log.action || "activity",
        changes: log.changes || log.new_values || log.old_values || null,
        performed_by: log.performed_by || null,
        created_at: log.created_at || log.performed_at || new Date().toISOString(),
      })));
    } catch (error) {
      setLogs([]);
      setError(zodErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter(
    (log) =>
      log.performed_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create":
        return <Plus className="h-4 w-4" />;
      case "update":
        return <Pencil className="h-4 w-4" />;
      case "delete":
        return <Trash2 className="h-4 w-4" />;
      case "transfer":
        return <ArrowLeftRight className="h-4 w-4" />;
      case "view":
        return <Eye className="h-4 w-4" />;
      case "audit":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (action) {
      case "create":
        return "default";
      case "update":
        return "secondary";
      case "delete":
        return "destructive";
      case "transfer":
        return "outline";
      default:
        return "secondary";
    }
  };

  const formatChanges = (changes: Record<string, any> | null) => {
    if (!changes) return "-";
    const entries = Object.entries(changes).slice(0, 3);
    return entries.map(([key, value]) => `${key}: ${value}`).join(", ");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all system activities and changes
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="flex flex-wrap items-end gap-4 p-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by user or entity..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-40">
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="dispose">Dispose</SelectItem>
                  <SelectItem value="audit">Audit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Select value={filterEntity} onValueChange={setFilterEntity}>
                <SelectTrigger>
                  <SelectValue placeholder="Entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="auth">Auth</SelectItem>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="branch">Branch</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="audit">Audit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={fetchLogs}>
              Refresh
            </Button>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Activity Log ({filteredLogs.length} entries)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Loading />}>
              {error && (
                <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              {loading ? (
                <div className="flex h-32 items-center justify-center">
                  <p className="text-muted-foreground">Loading audit logs...</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center gap-2">
                  <History className="h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">No audit logs found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity Type</TableHead>
                        <TableHead>Entity ID</TableHead>
                        <TableHead>Changes</TableHead>
                        <TableHead>Performed By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getActionBadgeVariant(log.action)}
                              className="flex w-fit items-center gap-1"
                            >
                              {getActionIcon(log.action)}
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">
                            {log.entity_type}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.entity_id.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                            {formatChanges(log.changes)}
                          </TableCell>
                          <TableCell>{log.performed_by || "System"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
