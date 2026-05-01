export interface Branch {
  id: string
  name: string
  code: string
  address: string | null
  city: string | null
  phone: string | null
  email: string | null
  manager_name: string | null
  is_headquarters: boolean
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface AssetCategory {
  id: string
  name: string
  description: string | null
  depreciation_rate: number
  useful_life_years: number
  created_at: string
}

export interface Asset {
  id: string
  asset_tag: string
  name: string
  description: string | null
  category_id: string
  branch_id: string
  serial_number: string | null
  model: string | null
  manufacturer: string | null
  purchase_date: string | null
  purchase_price: number | null
  current_value: number | null
  currency: string
  warranty_expiry: string | null
  status: 'active' | 'in_repair' | 'disposed' | 'transferred' | 'lost' | 'stolen'
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  location: string | null
  assigned_to: string | null
  notes: string | null
  image_url: string | null
  last_audit_date: string | null
  next_audit_date: string | null
  created_at: string
  updated_at: string
  category?: AssetCategory
  branch?: Branch
}

export interface AssetTransfer {
  id: string
  asset_id: string
  from_branch_id: string
  to_branch_id: string
  transfer_date: string
  reason: string | null
  transferred_by: string | null
  received_by: string | null
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled'
  notes: string | null
  created_at: string
  asset?: Asset
  from_branch?: Branch
  to_branch?: Branch
}

export interface AssetMaintenance {
  id: string
  asset_id: string
  maintenance_type: 'preventive' | 'corrective' | 'emergency'
  description: string
  cost: number | null
  performed_by: string | null
  performed_date: string
  next_maintenance_date: string | null
  notes: string | null
  created_at: string
  asset?: Asset
}

export interface AssetAudit {
  id: string
  branch_id: string
  audit_date: string
  auditor_name: string
  status: 'planned' | 'in_progress' | 'completed'
  total_assets: number
  verified_assets: number
  discrepancies: number
  notes: string | null
  created_at: string
  completed_at: string | null
  branch?: Branch
}

export interface AuditItem {
  id: string
  audit_id: string
  asset_id: string
  status: 'pending' | 'verified' | 'missing' | 'damaged' | 'discrepancy'
  notes: string | null
  verified_at: string | null
  asset?: Asset
}

export interface AssetDisposal {
  id: string
  asset_id: string
  disposal_date: string
  disposal_method: 'sold' | 'donated' | 'scrapped' | 'written_off'
  disposal_value: number | null
  reason: string
  approved_by: string | null
  notes: string | null
  created_at: string
  asset?: Asset
}

export interface AuditLog {
  id: string
  entity_type: string
  entity_id: string
  action: string
  changes: Record<string, unknown> | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  performed_by: string | null
  created_at: string
  ip_address: string | null
}

export interface DashboardStats {
  totalAssets: number
  totalBranches: number
  totalValue: number
  assetsInMaintenance: number
  pendingTransfers: number
  upcomingAudits: number
  assetsByStatus: { status: string; count: number }[]
  assetsByCategory: { category: string; count: number; value: number }[]
  assetsByBranch: { branch: string; count: number }[]
  recentActivity: AuditLog[]
}
