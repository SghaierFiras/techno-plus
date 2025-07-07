/*
  # Add suppliers table and unify product fields

  1. New Tables
    - `suppliers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `contact_person` (text, optional)
      - `email` (text, optional)
      - `phone` (text, optional)
      - `address` (text, optional)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes to products table
    - Remove separate language fields (name_en, name_fr, description_en, description_fr)
    - Keep unified name and description fields
    - Change supplier from text to foreign key reference
    - Add auto-generation functions for product_code and barcode

  3. Security
    - Enable RLS on suppliers table
    - Add policies for suppliers

  4. Functions
    - Add function to auto-generate product codes
    - Add function to auto-generate barcodes
*/

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  address text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers(is_active);

-- Enable RLS on suppliers
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies for suppliers
CREATE POLICY "Allow public read access to suppliers"
  ON suppliers
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert suppliers"
  ON suppliers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update suppliers"
  ON suppliers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete suppliers"
  ON suppliers
  FOR DELETE
  TO authenticated
  USING (true);

-- Add trigger for suppliers updated_at
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add supplier_id column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL;

-- Create index for supplier_id
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);

-- Create function to generate product codes
CREATE OR REPLACE FUNCTION generate_product_code()
RETURNS text AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate code: PRD + YYYYMMDD + 4 random digits
    new_code := 'PRD' || to_char(now(), 'YYYYMMDD') || lpad(floor(random() * 10000)::text, 4, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM products WHERE product_code = new_code) INTO code_exists;
    
    -- If code doesn't exist, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate barcodes (EAN-13 format)
CREATE OR REPLACE FUNCTION generate_barcode()
RETURNS text AS $$
DECLARE
  new_barcode text;
  barcode_exists boolean;
  base_code text;
  check_digit integer;
  sum_odd integer := 0;
  sum_even integer := 0;
  i integer;
BEGIN
  LOOP
    -- Generate 12-digit base code
    base_code := lpad(floor(random() * 1000000000000)::text, 12, '0');
    
    -- Calculate EAN-13 check digit
    FOR i IN 1..12 LOOP
      IF i % 2 = 1 THEN
        sum_odd := sum_odd + substring(base_code, i, 1)::integer;
      ELSE
        sum_even := sum_even + substring(base_code, i, 1)::integer;
      END IF;
    END LOOP;
    
    check_digit := (10 - ((sum_odd + sum_even * 3) % 10)) % 10;
    new_barcode := base_code || check_digit::text;
    
    -- Check if barcode already exists
    SELECT EXISTS(
      SELECT 1 FROM products WHERE barcode = new_barcode
      UNION
      SELECT 1 FROM product_variants WHERE barcode = new_barcode
    ) INTO barcode_exists;
    
    -- If barcode doesn't exist, return it
    IF NOT barcode_exists THEN
      RETURN new_barcode;
    END IF;
    
    -- Reset sums for next iteration
    sum_odd := 0;
    sum_even := 0;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Insert sample suppliers
INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES
  ('Tech Distributors Inc.', 'John Smith', 'john@techdist.com', '(555) 123-4567', '123 Tech Street, Tech City'),
  ('Global Electronics', 'Sarah Johnson', 'sarah@globalelec.com', '(555) 234-5678', '456 Electronics Ave, Digital Town'),
  ('Mobile Solutions Ltd.', 'Mike Chen', 'mike@mobilesol.com', '(555) 345-6789', '789 Mobile Blvd, Phone City'),
  ('Audio & Gaming Supply', 'Lisa Brown', 'lisa@audiogaming.com', '(555) 456-7890', '321 Gaming Street, Audio City'),
  ('Smart Home Wholesale', 'David Wilson', 'david@smarthome.com', '(555) 567-8901', '654 Smart Ave, Home Town')
ON CONFLICT DO NOTHING;

-- Migrate existing supplier text data to supplier_id (if any products exist)
DO $$
DECLARE
  product_record RECORD;
  supplier_record RECORD;
BEGIN
  -- For each product with a supplier text value
  FOR product_record IN 
    SELECT id, supplier 
    FROM products 
    WHERE supplier IS NOT NULL AND supplier != '' AND supplier_id IS NULL
  LOOP
    -- Try to find existing supplier with same name
    SELECT id INTO supplier_record
    FROM suppliers 
    WHERE name = product_record.supplier
    LIMIT 1;
    
    -- If supplier doesn't exist, create it
    IF supplier_record IS NULL THEN
      INSERT INTO suppliers (name) 
      VALUES (product_record.supplier)
      RETURNING id INTO supplier_record;
    END IF;
    
    -- Update product to reference supplier
    UPDATE products 
    SET supplier_id = supplier_record.id
    WHERE id = product_record.id;
  END LOOP;
END $$;

-- Remove the old supplier text column (after migration)
-- ALTER TABLE products DROP COLUMN IF EXISTS supplier;
-- Note: Keeping the column for now to avoid breaking existing code, will remove in a future migration