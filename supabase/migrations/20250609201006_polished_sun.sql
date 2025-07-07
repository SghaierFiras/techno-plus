/*
  # Comprehensive System Features Migration

  1. Multi-language Support
    - Translations table for dynamic content
    - Multi-language fields for products and categories

  2. SKU-based Product Identification
    - SKU generation and validation functions
    - Migration of existing products to SKU system

  3. Enhanced Supplier Management
    - Extended supplier information
    - Performance tracking
    - Activity logging

  4. Analytics and Data Visualization
    - Analytics metrics table
    - Automated metric calculation
    - Database views for reporting

  5. Security
    - Enable RLS on all new tables
    - Appropriate policies for data access
*/

-- Create translations table for dynamic multi-language content
CREATE TABLE IF NOT EXISTS translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  field_name text NOT NULL,
  language_code text NOT NULL CHECK (language_code IN ('en', 'fr')),
  translation text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(table_name, record_id, field_name, language_code)
);

-- Create indexes for translations
CREATE INDEX IF NOT EXISTS idx_translations_table_record ON translations(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_translations_language ON translations(language_code);

-- Enable RLS on translations
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

-- Create policies for translations
CREATE POLICY "Allow public read access to translations"
  ON translations
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to manage translations"
  ON translations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add trigger for translations updated_at
CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON translations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update products table for SKU system
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku text UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku_prefix text DEFAULT 'PRD';
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_en text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_fr text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_en text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_fr text;

-- Create index for SKU
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Update categories table for multi-language
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_en text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description_en text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description_fr text;

-- Enhanced supplier management
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tax_id text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS payment_terms text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS lead_time_days integer DEFAULT 7;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS minimum_order_amount decimal(10,2) DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS discount_percentage decimal(5,2) DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS rating decimal(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS preferred_contact_method text DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'both'));

-- Create supplier performance tracking table
CREATE TABLE IF NOT EXISTS supplier_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  metric_type text NOT NULL CHECK (metric_type IN ('delivery_time', 'quality_rating', 'order_accuracy', 'communication')),
  metric_value decimal(10,2) NOT NULL,
  measurement_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for supplier performance
CREATE INDEX IF NOT EXISTS idx_supplier_performance_supplier_id ON supplier_performance(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_performance_date ON supplier_performance(measurement_date);
CREATE INDEX IF NOT EXISTS idx_supplier_performance_type ON supplier_performance(metric_type);

-- Enable RLS on supplier performance
ALTER TABLE supplier_performance ENABLE ROW LEVEL SECURITY;

-- Create policies for supplier performance
CREATE POLICY "Allow public read access to supplier_performance"
  ON supplier_performance
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to manage supplier_performance"
  ON supplier_performance
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create supplier activity log table
CREATE TABLE IF NOT EXISTS supplier_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('order_placed', 'delivery_received', 'payment_made', 'communication', 'rating_updated', 'contract_updated')),
  description text NOT NULL,
  reference_id uuid, -- Can reference orders, payments, etc.
  metadata jsonb DEFAULT '{}',
  created_by text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for supplier activity log
CREATE INDEX IF NOT EXISTS idx_supplier_activity_supplier_id ON supplier_activity_log(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_activity_type ON supplier_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_supplier_activity_date ON supplier_activity_log(created_at);

-- Enable RLS on supplier activity log
ALTER TABLE supplier_activity_log ENABLE ROW LEVEL SECURITY;

-- Create policies for supplier activity log
CREATE POLICY "Allow public read access to supplier_activity_log"
  ON supplier_activity_log
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to manage supplier_activity_log"
  ON supplier_activity_log
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create analytics tables for data visualization
CREATE TABLE IF NOT EXISTS analytics_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  metric_category text NOT NULL CHECK (metric_category IN ('sales', 'inventory', 'customers', 'suppliers', 'tickets')),
  metric_value decimal(15,2) NOT NULL,
  metric_unit text, -- e.g., 'currency', 'count', 'percentage'
  date_recorded date NOT NULL DEFAULT CURRENT_DATE,
  time_period text DEFAULT 'daily' CHECK (time_period IN ('hourly', 'daily', 'weekly', 'monthly', 'yearly')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  -- Add unique constraint for ON CONFLICT to work
  UNIQUE(metric_name, date_recorded, time_period)
);

-- Create indexes for analytics metrics
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_name ON analytics_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_category ON analytics_metrics(metric_category);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_date ON analytics_metrics(date_recorded);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_period ON analytics_metrics(time_period);

-- Enable RLS on analytics metrics
ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics metrics
CREATE POLICY "Allow public read access to analytics_metrics"
  ON analytics_metrics
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to manage analytics_metrics"
  ON analytics_metrics
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to generate SKUs
CREATE OR REPLACE FUNCTION generate_sku(prefix text DEFAULT 'PRD')
RETURNS text AS $$
DECLARE
  new_sku text;
  sku_exists boolean;
  counter integer := 1;
  date_part text;
BEGIN
  -- Generate date part: YYYYMMDD
  date_part := to_char(now(), 'YYYYMMDD');
  
  LOOP
    -- Generate SKU: PREFIX-YYYYMMDD-NNNN
    new_sku := prefix || '-' || date_part || '-' || lpad(counter::text, 4, '0');
    
    -- Check if SKU already exists
    SELECT EXISTS(SELECT 1 FROM products WHERE sku = new_sku) INTO sku_exists;
    
    -- If SKU doesn't exist, return it
    IF NOT sku_exists THEN
      RETURN new_sku;
    END IF;
    
    -- Increment counter and try again
    counter := counter + 1;
    
    -- Safety check to prevent infinite loop
    IF counter > 9999 THEN
      -- Use timestamp for uniqueness
      new_sku := prefix || '-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || lpad(floor(random() * 1000)::text, 3, '0');
      RETURN new_sku;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate SKU format
CREATE OR REPLACE FUNCTION validate_sku(sku_value text)
RETURNS boolean AS $$
BEGIN
  -- SKU format: PREFIX-YYYYMMDD-NNNN or PREFIX-YYYYMMDDHH24MISS-NNN
  RETURN sku_value ~ '^[A-Z]{2,5}-[0-9]{8,14}-[0-9]{3,4}$';
END;
$$ LANGUAGE plpgsql;

-- Create function to get translation
CREATE OR REPLACE FUNCTION get_translation(
  p_table_name text,
  p_record_id uuid,
  p_field_name text,
  p_language_code text DEFAULT 'en'
)
RETURNS text AS $$
DECLARE
  translation_text text;
BEGIN
  SELECT translation INTO translation_text
  FROM translations
  WHERE table_name = p_table_name
    AND record_id = p_record_id
    AND field_name = p_field_name
    AND language_code = p_language_code;
  
  RETURN translation_text;
END;
$$ LANGUAGE plpgsql;

-- Create function to set translation
CREATE OR REPLACE FUNCTION set_translation(
  p_table_name text,
  p_record_id uuid,
  p_field_name text,
  p_language_code text,
  p_translation text
)
RETURNS void AS $$
BEGIN
  INSERT INTO translations (table_name, record_id, field_name, language_code, translation)
  VALUES (p_table_name, p_record_id, p_field_name, p_language_code, p_translation)
  ON CONFLICT (table_name, record_id, field_name, language_code)
  DO UPDATE SET 
    translation = EXCLUDED.translation,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Create view for product analytics
CREATE OR REPLACE VIEW product_analytics AS
SELECT 
  p.id,
  p.sku,
  p.name,
  p.category_id,
  c.name as category_name,
  p.supplier_id,
  s.name as supplier_name,
  p.cost_price,
  p.selling_price,
  p.quantity_in_stock,
  p.min_stock_level,
  (p.selling_price - p.cost_price) as profit_per_unit,
  ((p.selling_price - p.cost_price) / p.selling_price * 100) as profit_margin_percentage,
  (p.quantity_in_stock * p.cost_price) as inventory_value,
  CASE 
    WHEN p.quantity_in_stock = 0 THEN 'out_of_stock'
    WHEN p.quantity_in_stock <= p.min_stock_level THEN 'low_stock'
    ELSE 'in_stock'
  END as stock_status,
  p.created_at,
  p.updated_at
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = true;

-- Create view for supplier analytics
CREATE OR REPLACE VIEW supplier_analytics AS
SELECT 
  s.id,
  s.name,
  s.contact_person,
  s.email,
  s.phone,
  s.rating,
  s.lead_time_days,
  s.minimum_order_amount,
  s.discount_percentage,
  COUNT(p.id) as total_products,
  SUM(p.quantity_in_stock * p.cost_price) as total_inventory_value,
  AVG(p.cost_price) as avg_product_cost,
  COUNT(CASE WHEN p.quantity_in_stock <= p.min_stock_level THEN 1 END) as low_stock_products,
  s.created_at,
  s.updated_at
FROM suppliers s
LEFT JOIN products p ON s.id = p.supplier_id AND p.is_active = true
WHERE s.is_active = true
GROUP BY s.id, s.name, s.contact_person, s.email, s.phone, s.rating, 
         s.lead_time_days, s.minimum_order_amount, s.discount_percentage, 
         s.created_at, s.updated_at;

-- Migrate existing data to new structure
DO $$
DECLARE
  product_record RECORD;
  category_record RECORD;
BEGIN
  -- Migrate product names to multi-language fields
  FOR product_record IN SELECT id, name, description FROM products WHERE name_en IS NULL
  LOOP
    UPDATE products 
    SET 
      name_en = product_record.name,
      name_fr = product_record.name,
      description_en = product_record.description,
      description_fr = product_record.description
    WHERE id = product_record.id;
  END LOOP;
  
  -- Migrate category names to multi-language fields
  FOR category_record IN SELECT id, name, description FROM categories WHERE name_en IS NULL
  LOOP
    UPDATE categories 
    SET 
      name_en = category_record.name,
      description_en = category_record.description,
      description_fr = category_record.description
    WHERE id = category_record.id;
  END LOOP;
  
  -- Generate SKUs for existing products
  FOR product_record IN SELECT id, product_code FROM products WHERE sku IS NULL
  LOOP
    UPDATE products 
    SET sku = generate_sku('PRD')
    WHERE id = product_record.id;
  END LOOP;
END $$;

-- Create function to update analytics metrics
CREATE OR REPLACE FUNCTION update_analytics_metrics()
RETURNS void AS $$
BEGIN
  -- Update inventory metrics
  INSERT INTO analytics_metrics (metric_name, metric_category, metric_value, metric_unit, date_recorded, time_period)
  SELECT 
    'total_products',
    'inventory',
    COUNT(*),
    'count',
    CURRENT_DATE,
    'daily'
  FROM products WHERE is_active = true
  ON CONFLICT (metric_name, date_recorded, time_period) DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    created_at = now();
  
  INSERT INTO analytics_metrics (metric_name, metric_category, metric_value, metric_unit, date_recorded, time_period)
  SELECT 
    'low_stock_items',
    'inventory',
    COUNT(*),
    'count',
    CURRENT_DATE,
    'daily'
  FROM products WHERE is_active = true AND quantity_in_stock <= min_stock_level
  ON CONFLICT (metric_name, date_recorded, time_period) DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    created_at = now();
  
  INSERT INTO analytics_metrics (metric_name, metric_category, metric_value, metric_unit, date_recorded, time_period)
  SELECT 
    'total_inventory_value',
    'inventory',
    COALESCE(SUM(quantity_in_stock * cost_price), 0),
    'currency',
    CURRENT_DATE,
    'daily'
  FROM products WHERE is_active = true
  ON CONFLICT (metric_name, date_recorded, time_period) DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    created_at = now();
  
  -- Update supplier metrics
  INSERT INTO analytics_metrics (metric_name, metric_category, metric_value, metric_unit, date_recorded, time_period)
  SELECT 
    'active_suppliers',
    'suppliers',
    COUNT(*),
    'count',
    CURRENT_DATE,
    'daily'
  FROM suppliers WHERE is_active = true
  ON CONFLICT (metric_name, date_recorded, time_period) DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    created_at = now();
  
  -- Update customer metrics
  INSERT INTO analytics_metrics (metric_name, metric_category, metric_value, metric_unit, date_recorded, time_period)
  SELECT 
    'total_customers',
    'customers',
    COUNT(*),
    'count',
    CURRENT_DATE,
    'daily'
  FROM customers
  ON CONFLICT (metric_name, date_recorded, time_period) DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    created_at = now();
  
  -- Update ticket metrics
  INSERT INTO analytics_metrics (metric_name, metric_category, metric_value, metric_unit, date_recorded, time_period)
  SELECT 
    'open_tickets',
    'tickets',
    COUNT(*),
    'count',
    CURRENT_DATE,
    'daily'
  FROM service_tickets WHERE status NOT IN ('completed', 'delivered', 'canceled')
  ON CONFLICT (metric_name, date_recorded, time_period) DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    created_at = now();
  
  -- Update daily sales from transactions
  INSERT INTO analytics_metrics (metric_name, metric_category, metric_value, metric_unit, date_recorded, time_period)
  SELECT 
    'daily_sales',
    'sales',
    COALESCE(SUM(total), 0),
    'currency',
    CURRENT_DATE,
    'daily'
  FROM transactions 
  WHERE DATE(created_at) = CURRENT_DATE 
    AND status = 'completed'
  ON CONFLICT (metric_name, date_recorded, time_period) DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    created_at = now();
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update analytics when data changes
CREATE OR REPLACE FUNCTION trigger_update_analytics()
RETURNS trigger AS $$
BEGIN
  PERFORM update_analytics_metrics();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add triggers for automatic analytics updates
DROP TRIGGER IF EXISTS update_analytics_on_product_change ON products;
CREATE TRIGGER update_analytics_on_product_change
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_update_analytics();

DROP TRIGGER IF EXISTS update_analytics_on_supplier_change ON suppliers;
CREATE TRIGGER update_analytics_on_supplier_change
  AFTER INSERT OR UPDATE OR DELETE ON suppliers
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_update_analytics();

DROP TRIGGER IF EXISTS update_analytics_on_customer_change ON customers;
CREATE TRIGGER update_analytics_on_customer_change
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_update_analytics();

DROP TRIGGER IF EXISTS update_analytics_on_ticket_change ON service_tickets;
CREATE TRIGGER update_analytics_on_ticket_change
  AFTER INSERT OR UPDATE OR DELETE ON service_tickets
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_update_analytics();

DROP TRIGGER IF EXISTS update_analytics_on_transaction_change ON transactions;
CREATE TRIGGER update_analytics_on_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_update_analytics();

-- Insert initial analytics data
INSERT INTO analytics_metrics (metric_name, metric_category, metric_value, metric_unit, date_recorded, time_period) VALUES
  ('total_products', 'inventory', 0, 'count', CURRENT_DATE, 'daily'),
  ('low_stock_items', 'inventory', 0, 'count', CURRENT_DATE, 'daily'),
  ('total_inventory_value', 'inventory', 0, 'currency', CURRENT_DATE, 'daily'),
  ('daily_sales', 'sales', 0, 'currency', CURRENT_DATE, 'daily'),
  ('total_customers', 'customers', 0, 'count', CURRENT_DATE, 'daily'),
  ('active_suppliers', 'suppliers', 0, 'count', CURRENT_DATE, 'daily'),
  ('open_tickets', 'tickets', 0, 'count', CURRENT_DATE, 'daily')
ON CONFLICT (metric_name, date_recorded, time_period) DO NOTHING;

-- Initial analytics update
SELECT update_analytics_metrics();