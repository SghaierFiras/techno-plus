/*
  # Fix Products Table RLS Policy

  1. Security Updates
    - Update RLS policies for products table to allow proper access
    - Ensure authenticated users can create, read, update products
    - Allow public read access for products
    - Fix policy conditions to work with current authentication state

  2. Changes
    - Drop existing restrictive policies
    - Create new policies with proper conditions
    - Ensure INSERT operations work for authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can manage products" ON products;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;

-- Create new policies with proper conditions
CREATE POLICY "Enable read access for all users"
  ON products
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON products
  FOR DELETE
  TO authenticated
  USING (true);

-- Also fix related tables that might have similar issues
-- Categories table
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;

CREATE POLICY "Enable read access for all users"
  ON categories
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON categories
  FOR DELETE
  TO authenticated
  USING (true);

-- Product variants table
DROP POLICY IF EXISTS "Authenticated users can manage product variants" ON product_variants;
DROP POLICY IF EXISTS "Product variants are viewable by everyone" ON product_variants;

CREATE POLICY "Enable read access for all users"
  ON product_variants
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON product_variants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON product_variants
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON product_variants
  FOR DELETE
  TO authenticated
  USING (true);