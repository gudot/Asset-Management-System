"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Package,
  Building2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import type { Branch } from "@/lib/types";
import { deleteBranch } from "./actions";

interface BranchesTableProps {
  branches: (Branch & { asset_count: number })[];
}

export function BranchesTable({ branches }: BranchesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filteredBranches = branches.filter(
    (branch) =>
      branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.city?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDelete = async (id: string, name: string) => {
    if (
      confirm(
        `Are you sure you want to delete ${name}? This action cannot be undone.`,
      )
    ) {
      setError(null);
      setSuccess(null);
      setIsDeleting(id);
      try {
        const result = await deleteBranch(id);
        if (result?.error) {
          setError(result.error);
        } else {
          setSuccess(`Branch "${name}" deleted successfully`);
          // Refresh the page after a short delay
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred",
        );
      } finally {
        setIsDeleting(null);
      }
    }
  };

  return (
    <>
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
        <CardContent className="p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search branches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{filteredBranches.length} branches</span>
            </div>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Assets</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBranches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          No branches found
                        </p>
                        <Link href="/branches/new">
                          <Button size="sm">Add Branch</Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBranches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                            {branch.code}
                          </div>
                          {branch.is_headquarters && (
                            <Badge variant="secondary" className="text-xs">
                              HQ
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {branch.name}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {branch.city || "N/A"}
                          {branch.address && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {branch.address}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {branch.phone || "N/A"}
                          {branch.email && (
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {branch.email}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {branch.manager_name || "Not assigned"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{branch.asset_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            branch.status === "active" ? "default" : "secondary"
                          }
                        >
                          {branch.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" asChild title="View branch">
                            <Link href={`/branches/${branch.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild title="Edit branch">
                            <Link href={`/branches/${branch.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          {!branch.is_headquarters && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              title="Delete branch"
                              disabled={isDeleting === branch.id}
                              onClick={() => handleDelete(branch.id, branch.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" title="More actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/branches/${branch.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/branches/${branch.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            {!branch.is_headquarters && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  handleDelete(branch.id, branch.name)
                                }
                                disabled={isDeleting === branch.id}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {isDeleting === branch.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
