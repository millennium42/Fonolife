ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_cents bigint NOT NULL DEFAULT 0 CHECK (cost_cents >= 0);

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) >= 2),
  description text NOT NULL DEFAULT '',
  price_cents bigint NOT NULL CHECK (price_cents >= 0),
  cmv_cents bigint NOT NULL CHECK (cmv_cents >= 0),
  execution_time_minutes integer NOT NULL CHECK (execution_time_minutes >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_products (
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  PRIMARY KEY (service_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
CREATE INDEX IF NOT EXISTS idx_service_products_service ON service_products(service_id);
