/*
  # Sales and Transactions Schema

  1. New Tables
    - `transactions`
      - `id` (uuid, primary key)
      - `transaction_number` (text, unique)
      - `items` (jsonb) - cart items with product details
      - `subtotal` (decimal)
      - `discount_amount` (decimal)
      - `tax_amount` (decimal)
      - `total` (decimal)
      - `payment_method` (jsonb) - payment details
      - `customer_id` (uuid, foreign key, optional)
      - `cashier_id` (uuid, foreign key, optional)
      - `notes` (text, optional)
      - `status` (text) - completed, pending, cancelled, refunded
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `transaction_items` (normalized version for reporting)
      - `id` (uuid, primary key)
      - `transaction_id` (uuid, foreign key)
      - `product_id` (uuid, foreign key)
      - `variant_id` (uuid, foreign key, optional)
      - `quantity` (integer)
      - `unit_price` (decimal)
      - `discount_amount` (decimal)
      - `total_price` (decimal)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Indexes
    - Add indexes for frequently queried columns
    - Add indexes for reporting queries
*/

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number text UNIQUE NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal decimal(10,2) NOT NULL DEFAULT 0,
  discount_amount decimal(10,2) NOT NULL DEFAULT 0,
  tax_amount decimal(10,2) NOT NULL DEFAULT 0,
  total decimal(10,2) NOT NULL DEFAULT 0,
  payment_method jsonb NOT NULL DEFAULT '{}'::jsonb,
  customer_id uuid,
  cashier_id uuid,
  notes text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled', 'refunded')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transaction_items table for normalized reporting
CREATE TABLE IF NOT EXISTS transaction_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price decimal(10,2) NOT NULL DEFAULT 0,
  discount_amount decimal(10,2) NOT NULL DEFAULT 0,
  total_price decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_number ON transactions(transaction_number);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_cashier_id ON transactions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product_id ON transaction_items(product_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_variant_id ON transaction_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_created_at ON transaction_items(created_at);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- Create policies for transactions
CREATE POLICY "Transactions are viewable by everyone"
  ON transactions
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for transaction items
CREATE POLICY "Transaction items are viewable by everyone"
  ON transaction_items
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage transaction items"
  ON transaction_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger for transactions updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically populate transaction_items from jsonb
CREATE OR REPLACE FUNCTION populate_transaction_items()
RETURNS TRIGGER AS $$
DECLARE
  item jsonb;
BEGIN
  -- Clear existing items for this transaction
  DELETE FROM transaction_items WHERE transaction_id = NEW.id;
  
  -- Insert new items from jsonb
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    INSERT INTO transaction_items (
      transaction_id,
      product_id,
      variant_id,
      quantity,
      unit_price,
      discount_amount,
      total_price
    ) VALUES (
      NEW.id,
      (item->>'product_id')::uuid,
      CASE WHEN item->>'variant_id' != '' THEN (item->>'variant_id')::uuid ELSE NULL END,
      (item->>'quantity')::integer,
      (item->>'price')::decimal,
      (item->>'discount_amount')::decimal,
      (item->>'subtotal')::decimal
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to populate transaction_items
CREATE TRIGGER populate_transaction_items_trigger
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION populate_transaction_items();