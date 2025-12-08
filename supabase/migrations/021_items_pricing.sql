-- Add pricing fields to items table
-- This migration adds unit_price, selling_price, and min_stock_level fields

ALTER TABLE items 
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS selling_price DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS min_stock_level DECIMAL(12, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_stock_level DECIMAL(12, 3),
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS lead_time_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add index for supplier lookup
CREATE INDEX IF NOT EXISTS idx_items_supplier_id ON items(supplier_id);

-- Comment on new columns
COMMENT ON COLUMN items.unit_price IS 'Cost price per unit';
COMMENT ON COLUMN items.selling_price IS 'Selling price per unit (if applicable)';
COMMENT ON COLUMN items.min_stock_level IS 'Minimum stock level before reorder alert';
COMMENT ON COLUMN items.max_stock_level IS 'Maximum stock level to prevent overstocking';
COMMENT ON COLUMN items.supplier_id IS 'Primary supplier for this item';
COMMENT ON COLUMN items.lead_time_days IS 'Average lead time in days for procurement';
COMMENT ON COLUMN items.notes IS 'Additional notes about the item';

