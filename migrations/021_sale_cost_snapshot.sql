-- Snapshot imutável do custo no momento da venda para CMV e margem histórica.
ALTER TABLE sales ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES products(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES services(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cost_amount_cents bigint CHECK (cost_amount_cents >= 0);

UPDATE sales s
SET product_id = p.id,
    cost_amount_cents = p.cost_cents * s.quantity
FROM products p
WHERE s.product_id IS NULL
  AND s.service_id IS NULL
  AND s.product LIKE p.name || '%';

UPDATE sales s
SET service_id = service.id,
    cost_amount_cents = service.cmv_cents * s.quantity
FROM services service
WHERE s.product_id IS NULL
  AND s.service_id IS NULL
  AND s.product = service.name;

UPDATE sales SET cost_amount_cents = 0 WHERE cost_amount_cents IS NULL;
ALTER TABLE sales ALTER COLUMN cost_amount_cents SET NOT NULL;
ALTER TABLE sales ALTER COLUMN cost_amount_cents SET DEFAULT 0;
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_single_catalog_source;
ALTER TABLE sales ADD CONSTRAINT sales_single_catalog_source CHECK (product_id IS NULL OR service_id IS NULL);
