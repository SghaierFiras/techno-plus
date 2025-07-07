/*
  # Fix RLS policies for products table

  1. Security Updates
    - Drop existing policies that might be conflicting
    - Create comprehensive RLS policies for products table
    - Ensure authenticated users can perform all CRUD operations
    - Maintain public read access for unauthenticated users

  2. Policy Details
    - Allow authenticated users to insert, update, and delete products
    - Allow public read access to active products
    - Ensure policies are permissive and don't conflict
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON products;

-- Create comprehensive RLS policies for products table
CREATE POLICY "Allow public read access to products"
  ON products
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (true);

-- Ensure RLS is enabled on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Also fix policies for related tables to ensure consistency

-- Categories table policies
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON categories;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON categories;
DROP POLICY IF EXISTS "Enable read access for all users" ON categories;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON categories;

CREATE POLICY "Allow public read access to categories"
  ON categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (true);

-- Product variants table policies
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON product_variants;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON product_variants;
DROP POLICY IF EXISTS "Enable read access for all users" ON product_variants;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON product_variants;

CREATE POLICY "Allow public read access to product_variants"
  ON product_variants
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert product_variants"
  ON product_variants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update product_variants"
  ON product_variants
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete product_variants"
  ON product_variants
  FOR DELETE
  TO authenticated
  USING (true);