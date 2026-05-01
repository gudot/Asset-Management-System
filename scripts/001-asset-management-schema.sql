-- First Pack Company Zimbabwe - Asset Management System Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Branches table
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  address TEXT,
  city VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(255),
  manager_name VARCHAR(255),
  is_headquarters BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset categories table
CREATE TABLE IF NOT EXISTS asset_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  depreciation_rate DECIMAL(5,2) DEFAULT 0,
  useful_life_years INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_tag VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES asset_categories(id),
  branch_id UUID REFERENCES branches(id),
  serial_number VARCHAR(255),
  model VARCHAR(255),
  manufacturer VARCHAR(255),
  purchase_date DATE,
  purchase_price DECIMAL(15,2),
  current_value DECIMAL(15,2),
  currency VARCHAR(10) DEFAULT 'USD',
  warranty_expiry DATE,
  status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'in_repair', 'disposed', 'transferred', 'lost', 'stolen')),
  condition VARCHAR(20) DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  location VARCHAR(255),
  assigned_to VARCHAR(255),
  notes TEXT,
  image_url TEXT,
  last_audit_date DATE,
  next_audit_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset transfers table
CREATE TABLE IF NOT EXISTS asset_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  from_branch_id UUID REFERENCES branches(id),
  to_branch_id UUID REFERENCES branches(id),
  transfer_date DATE NOT NULL,
  reason TEXT,
  transferred_by VARCHAR(255),
  received_by VARCHAR(255),
  approved_by VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset maintenance records
CREATE TABLE IF NOT EXISTS asset_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  maintenance_type VARCHAR(50) NOT NULL,
  description TEXT,
  cost DECIMAL(15,2),
  currency VARCHAR(10) DEFAULT 'USD',
  performed_by VARCHAR(255),
  performed_date DATE NOT NULL,
  next_maintenance_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  changes JSONB,
  old_values JSONB,
  new_values JSONB,
  performed_by VARCHAR(255),
  ip_address VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset audits (physical verification)
CREATE TABLE IF NOT EXISTS asset_audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id),
  audit_date DATE NOT NULL,
  auditor_name VARCHAR(255) NOT NULL,
  total_assets INTEGER DEFAULT 0,
  verified_assets INTEGER DEFAULT 0,
  discrepancies INTEGER DEFAULT 0,
  total_assets_checked INTEGER DEFAULT 0,
  assets_found INTEGER DEFAULT 0,
  assets_missing INTEGER DEFAULT 0,
  discrepancy_notes TEXT,
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'reviewed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Audit items (individual asset verification in an audit)
CREATE TABLE IF NOT EXISTS audit_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id UUID REFERENCES asset_audits(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'verified', 'missing', 'damaged', 'discrepancy', 'found', 'relocated')),
  condition VARCHAR(20),
  notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disposals table
CREATE TABLE IF NOT EXISTS asset_disposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID REFERENCES assets(id),
  disposal_date DATE NOT NULL,
  disposal_method VARCHAR(50) NOT NULL CHECK (disposal_method IN ('sold', 'donated', 'scrapped', 'written_off')),
  disposal_value DECIMAL(15,2),
  currency VARCHAR(10) DEFAULT 'USD',
  buyer_info TEXT,
  reason TEXT,
  approved_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compatibility upgrades for databases that were created from older versions of this script.
ALTER TABLE branches ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS manager_name VARCHAR(255);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS is_headquarters BOOLEAN DEFAULT FALSE;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE branches ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE branches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE asset_categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE asset_categories ADD COLUMN IF NOT EXISTS depreciation_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE asset_categories ADD COLUMN IF NOT EXISTS useful_life_years INTEGER DEFAULT 5;
ALTER TABLE asset_categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

WITH category_keepers AS (
  SELECT DISTINCT ON (LOWER(TRIM(name)))
    LOWER(TRIM(name)) AS category_key,
    id AS keep_id
  FROM asset_categories
  ORDER BY LOWER(TRIM(name)), created_at, id::TEXT
),
duplicate_categories AS (
  SELECT c.id, k.keep_id
  FROM asset_categories c
  JOIN category_keepers k ON LOWER(TRIM(c.name)) = k.category_key
  WHERE c.id <> k.keep_id
)
UPDATE assets
SET category_id = duplicate_categories.keep_id
FROM duplicate_categories
WHERE assets.category_id = duplicate_categories.id;

WITH category_keepers AS (
  SELECT DISTINCT ON (LOWER(TRIM(name)))
    LOWER(TRIM(name)) AS category_key,
    id AS keep_id
  FROM asset_categories
  ORDER BY LOWER(TRIM(name)), created_at, id::TEXT
),
duplicate_categories AS (
  SELECT c.id
  FROM asset_categories c
  JOIN category_keepers k ON LOWER(TRIM(c.name)) = k.category_key
  WHERE c.id <> k.keep_id
)
DELETE FROM asset_categories
USING duplicate_categories
WHERE asset_categories.id = duplicate_categories.id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'asset_categories_name_unique'
  ) THEN
    ALTER TABLE asset_categories ADD CONSTRAINT asset_categories_name_unique UNIQUE (name);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS asset_categories_name_lower_unique
ON asset_categories (LOWER(TRIM(name)));

ALTER TABLE assets ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS last_audit_date DATE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS next_audit_date DATE;

ALTER TABLE asset_transfers ADD COLUMN IF NOT EXISTS transferred_by VARCHAR(255);
ALTER TABLE asset_transfers ADD COLUMN IF NOT EXISTS received_by VARCHAR(255);
ALTER TABLE asset_transfers ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255);
ALTER TABLE asset_transfers ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE asset_maintenance ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS changes JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS old_values JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_values JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE asset_audits ADD COLUMN IF NOT EXISTS total_assets INTEGER DEFAULT 0;
ALTER TABLE asset_audits ADD COLUMN IF NOT EXISTS verified_assets INTEGER DEFAULT 0;
ALTER TABLE asset_audits ADD COLUMN IF NOT EXISTS discrepancies INTEGER DEFAULT 0;
ALTER TABLE asset_audits ADD COLUMN IF NOT EXISTS discrepancy_notes TEXT;
ALTER TABLE asset_audits ADD COLUMN IF NOT EXISTS total_assets_checked INTEGER DEFAULT 0;
ALTER TABLE asset_audits ADD COLUMN IF NOT EXISTS assets_found INTEGER DEFAULT 0;
ALTER TABLE asset_audits ADD COLUMN IF NOT EXISTS assets_missing INTEGER DEFAULT 0;

ALTER TABLE asset_disposals ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';
ALTER TABLE asset_disposals ADD COLUMN IF NOT EXISTS buyer_info TEXT;
ALTER TABLE asset_disposals ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_status_check;
ALTER TABLE assets ADD CONSTRAINT assets_status_check CHECK (status IN ('active', 'in_repair', 'disposed', 'transferred', 'lost', 'stolen'));

ALTER TABLE asset_transfers DROP CONSTRAINT IF EXISTS asset_transfers_status_check;
ALTER TABLE asset_transfers ADD CONSTRAINT asset_transfers_status_check CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled', 'approved', 'rejected'));

ALTER TABLE asset_audits ALTER COLUMN discrepancies TYPE INTEGER USING (
  CASE
    WHEN discrepancies::TEXT ~ '^[0-9]+$' THEN discrepancies::INTEGER
    ELSE 0
  END
);
ALTER TABLE asset_audits DROP CONSTRAINT IF EXISTS asset_audits_status_check;
ALTER TABLE asset_audits ADD CONSTRAINT asset_audits_status_check CHECK (status IN ('planned', 'in_progress', 'completed', 'reviewed'));

ALTER TABLE audit_items DROP CONSTRAINT IF EXISTS audit_items_status_check;
ALTER TABLE audit_items ADD CONSTRAINT audit_items_status_check CHECK (status IN ('pending', 'verified', 'missing', 'damaged', 'discrepancy', 'found', 'relocated'));

DELETE FROM audit_items a
USING audit_items b
WHERE a.audit_id = b.audit_id
  AND a.asset_id = b.asset_id
  AND a.id::TEXT > b.id::TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'audit_items_audit_asset_unique'
  ) THEN
    ALTER TABLE audit_items ADD CONSTRAINT audit_items_audit_asset_unique UNIQUE (audit_id, asset_id);
  END IF;
END $$;

-- Insert default headquarters branch
INSERT INTO branches (name, code, address, city, phone, email, is_headquarters, status)
VALUES ('First Pack HQ', 'FP-HQ', 'Main Street', 'Harare', '+263 242 000 000', 'hq@firstpack.co.zw', TRUE, 'active')
ON CONFLICT DO NOTHING;

-- Insert default asset categories
INSERT INTO asset_categories (name, description, depreciation_rate, useful_life_years) VALUES
  ('IT Equipment', 'Computers, laptops, servers, networking equipment', 25.00, 4),
  ('Office Furniture', 'Desks, chairs, cabinets, shelving', 10.00, 10),
  ('Vehicles', 'Company cars, trucks, delivery vehicles', 20.00, 5),
  ('Machinery', 'Production and packaging machinery', 15.00, 7),
  ('Office Equipment', 'Printers, copiers, phones, projectors', 20.00, 5),
  ('Building & Infrastructure', 'Buildings, land improvements, fixtures', 5.00, 20),
  ('Tools & Equipment', 'Hand tools, power tools, testing equipment', 15.00, 7)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  depreciation_rate = EXCLUDED.depreciation_rate,
  useful_life_years = EXCLUDED.useful_life_years;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_assets_branch ON assets(branch_id);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_tag ON assets(asset_tag);
CREATE INDEX IF NOT EXISTS idx_transfers_asset ON asset_transfers(asset_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_asset_audits_branch ON asset_audits(branch_id);

-- Enable Row Level Security
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_disposals ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo - in production, restrict to authenticated users)
DROP POLICY IF EXISTS "Allow all access to branches" ON branches;
DROP POLICY IF EXISTS "Allow all access to assets" ON assets;
DROP POLICY IF EXISTS "Allow all access to asset_categories" ON asset_categories;
DROP POLICY IF EXISTS "Allow all access to asset_transfers" ON asset_transfers;
DROP POLICY IF EXISTS "Allow all access to asset_maintenance" ON asset_maintenance;
DROP POLICY IF EXISTS "Allow all access to audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow all access to asset_audits" ON asset_audits;
DROP POLICY IF EXISTS "Allow all access to audit_items" ON audit_items;
DROP POLICY IF EXISTS "Allow all access to asset_disposals" ON asset_disposals;

CREATE POLICY "Allow all access to branches" ON branches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to assets" ON assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to asset_categories" ON asset_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to asset_transfers" ON asset_transfers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to asset_maintenance" ON asset_maintenance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to asset_audits" ON asset_audits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to audit_items" ON audit_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to asset_disposals" ON asset_disposals FOR ALL USING (true) WITH CHECK (true);
