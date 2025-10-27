-- Add missing columns if not exist
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS name        TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS category    TEXT NOT NULL DEFAULT 'misc',
  ADD COLUMN IF NOT EXISTS price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS image_url   TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP NOT NULL DEFAULT NOW();

-- Ensure unique index on id for UPSERT
CREATE UNIQUE INDEX IF NOT EXISTS products_id_unique ON products(id);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_name     ON products(name);
