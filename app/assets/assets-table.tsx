"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Package, 
  ArrowLeftRight,
  Wrench,
  FileX
} from "lucide-react"
import Link from "next/link"
import type { Asset, Branch, AssetCategory } from "@/lib/types"
import { deleteAsset } from "./actions"

interface AssetsTableProps {
  assets: (Asset & { branches: Pick<Branch, "id" | "name" | "code"> | null; asset_categories: Pick<AssetCategory, "id" | "name"> | null })[]
  branches: Pick<Branch, "id" | "name" | "code">[]
  categories: Pick<AssetCategory, "id" | "name">[]
}

export function AssetsTable({ assets, branches, categories }: AssetsTableProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBranch, setSelectedBranch] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [error, setError] = useState("")
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.asset_tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.serial_number?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesBranch = selectedBranch === "all" || asset.branch_id === selectedBranch
    const matchesCategory = selectedCategory === "all" || asset.category_id === selectedCategory
    const matchesStatus = selectedStatus === "all" || asset.status === selectedStatus

    return matchesSearch && matchesBranch && matchesCategory && matchesStatus
  })

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      setError("")
      setIsDeleting(id)
      const result = await deleteAsset(id)
      setIsDeleting(null)

      if (result?.error) {
        setError(result.error)
        return
      }

      router.refresh()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "in_repair":
        return "bg-yellow-100 text-yellow-800"
      case "disposed":
        return "bg-gray-100 text-gray-800"
      case "transferred":
        return "bg-blue-100 text-blue-800"
      case "lost":
        return "bg-red-100 text-red-800"
      case "stolen":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "excellent":
        return "text-green-600"
      case "good":
        return "text-blue-600"
      case "fair":
        return "text-yellow-600"
      case "poor":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return "N/A"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card>
      <CardContent className="p-6">
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, tag, or serial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Branches" />
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
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="in_repair">In Repair</SelectItem>
              <SelectItem value="transferred">Transferred</SelectItem>
              <SelectItem value="disposed">Disposed</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{filteredAssets.length} assets</span>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Tag</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No assets found</p>
                      <Link href="/assets/new">
                        <Button size="sm">Add Asset</Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        {asset.asset_tag}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Link 
                          href={`/assets/${asset.id}`}
                          className="font-medium hover:underline"
                        >
                          {asset.name}
                        </Link>
                        {asset.serial_number && (
                          <p className="text-xs text-muted-foreground">
                            S/N: {asset.serial_number}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{asset.asset_categories?.name || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
                          {asset.branches?.code || "?"}
                        </span>
                        <span className="text-sm">{asset.branches?.name || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(asset.status)}>
                        {asset.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium capitalize ${getConditionColor(asset.condition)}`}>
                        {asset.condition}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(asset.current_value)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild title="View asset">
                          <Link href={`/assets/${asset.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="Edit asset">
                          <Link href={`/assets/${asset.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          title="Delete asset"
                          disabled={isDeleting === asset.id}
                          onClick={() => handleDelete(asset.id, asset.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" title="More actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/assets/${asset.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/assets/${asset.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/transfers/new?asset=${asset.id}`}>
                              <ArrowLeftRight className="mr-2 h-4 w-4" />
                              Transfer
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/maintenance/new?asset=${asset.id}`}>
                              <Wrench className="mr-2 h-4 w-4" />
                              Log Maintenance
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/disposals/new?asset=${asset.id}`}>
                              <FileX className="mr-2 h-4 w-4" />
                              Dispose
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(asset.id, asset.name)}
                            disabled={isDeleting === asset.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isDeleting === asset.id ? "Deleting..." : "Delete"}
                          </DropdownMenuItem>
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
  )
}
