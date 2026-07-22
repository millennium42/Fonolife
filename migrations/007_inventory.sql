CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  price_cents bigint NOT NULL CHECK (price_cents > 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  movement_type text NOT NULL CHECK (movement_type IN ('entry', 'sale_deduction', 'adjustment')),
  quantity integer NOT NULL CHECK (quantity <> 0),
  notes text NOT NULL DEFAULT '',
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_movements_product_idx ON inventory_movements(product_id);

CREATE OR REPLACE FUNCTION prevent_inventory_movement_modification()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Registros de movimentação de estoque são imutáveis e append-only.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_inventory_movement_modification ON inventory_movements;
CREATE TRIGGER trg_prevent_inventory_movement_modification
BEFORE UPDATE OR DELETE ON inventory_movements
FOR EACH ROW EXECUTE FUNCTION prevent_inventory_movement_modification();
