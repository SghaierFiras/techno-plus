/*
  # Inventory Management Schema

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `name_fr` (text) - French translation
      - `parent_id` (uuid, foreign key to categories)
      - `description` (text, optional)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)

    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, optional)
      - `product_code` (text, unique)
      - `barcode` (text, optional, unique)
      - `category_id` (uuid, foreign key)
      - `subcategory_id` (uuid, foreign key to categories, optional)
      - `cost_price` (decimal)
      - `selling_price` (decimal)
      - `quantity_in_stock` (integer)
      - `min_stock_level` (integer)
      - `supplier` (text, optional)
      - `image_url` (text, optional)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `product_variants`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `name` (text) - variant type (e.g., "Color", "Size")
      - `value` (text) - variant value (e.g., "Red", "Large")
      - `additional_cost` (decimal, default 0)
      - `quantity_in_stock` (integer)
      - `barcode` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
    - Add policies for reading product data

  3. Indexes
    - Add indexes for frequently queried columns
    - Add full-text search indexes for product names and descriptions
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_fr text NOT NULL,
  parent_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  product_code text UNIQUE NOT NULL,
  barcode text UNIQUE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  subcategory_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  cost_price decimal(10,2) NOT NULL DEFAULT 0,
  selling_price decimal(10,2) NOT NULL DEFAULT 0,
  quantity_in_stock integer NOT NULL DEFAULT 0,
  min_stock_level integer NOT NULL DEFAULT 0,
  supplier text,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  value text NOT NULL,
  additional_cost decimal(10,2) DEFAULT 0,
  quantity_in_stock integer NOT NULL DEFAULT 0,
  barcode text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_quantity_stock ON products(quantity_in_stock);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_barcode ON product_variants(barcode);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Categories are viewable by everyone"
  ON categories
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for products
CREATE POLICY "Products are viewable by everyone"
  ON products
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for product variants
CREATE POLICY "Product variants are viewable by everyone"
  ON product_variants
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage product variants"
  ON product_variants
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for products updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categories (name, name_fr, description) VALUES
  ('Technology', 'Technologie', 'Electronic devices and tech accessories'),
  ('Gadgets', 'Gadgets', 'Small electronic devices and accessories'),
  ('Services', 'Services', 'Technical and repair services')
ON CONFLICT DO NOTHING;

-- Insert subcategories for Technology
INSERT INTO categories (name, name_fr, parent_id, description)
SELECT 
  'Smartphones', 'Téléphones intelligents', c.id, 'Mobile phones and accessories'
FROM categories c WHERE c.name = 'Technology'
ON CONFLICT DO NOTHING;

INSERT INTO categories (name, name_fr, parent_id, description)
SELECT 
  'Laptops', 'Ordinateurs portables', c.id, 'Portable computers and accessories'
FROM categories c WHERE c.name = 'Technology'
ON CONFLICT DO NOTHING;

INSERT INTO categories (name, name_fr, parent_id, description)
SELECT 
  'Tablets', 'Tablettes', c.id, 'Tablet computers and accessories'
FROM categories c WHERE c.name = 'Technology'
ON CONFLICT DO NOTHING;

-- Insert subcategories for Gadgets
INSERT INTO categories (name, name_fr, parent_id, description)
SELECT 
  'Audio', 'Audio', c.id, 'Headphones, speakers, and audio accessories'
FROM categories c WHERE c.name = 'Gadgets'
ON CONFLICT DO NOTHING;

INSERT INTO categories (name, name_fr, parent_id, description)
SELECT 
  'Smart Home', 'Maison intelligente', c.id, 'Smart home devices and IoT products'
FROM categories c WHERE c.name = 'Gadgets'
ON CONFLICT DO NOTHING;

INSERT INTO categories (name, name_fr, parent_id, description)
SELECT 
  'Gaming', 'Jeux', c.id, 'Gaming accessories and peripherals'
FROM categories c WHERE c.name = 'Gadgets'
ON CONFLICT DO NOTHING;

-- Insert subcategories for Services
INSERT INTO categories (name, name_fr, parent_id, description)
SELECT 
  'Repair', 'Réparation', c.id, 'Device repair and maintenance services'
FROM categories c WHERE c.name = 'Services'
ON CONFLICT DO NOTHING;

INSERT INTO categories (name, name_fr, parent_id, description)
SELECT 
  'Installation', 'Installation', c.id, 'Setup and installation services'
FROM categories c WHERE c.name = 'Services'
ON CONFLICT DO NOTHING;

INSERT INTO categories (name, name_fr, parent_id, description)
SELECT 
  'Consultation', 'Consultation', c.id, 'Technical consultation and support'
FROM categories c WHERE c.name = 'Services'
ON CONFLICT DO NOTHING;