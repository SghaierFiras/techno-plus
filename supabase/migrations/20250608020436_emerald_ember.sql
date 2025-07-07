/*
  # Service Ticketing Module Schema

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, optional)
      - `phone` (text)
      - `address` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `technicians`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text)
      - `phone` (text, optional)
      - `specialization` (text, optional)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)

    - `service_tickets`
      - `id` (uuid, primary key)
      - `ticket_number` (text, unique)
      - `type` (text) - 'repair' or 'digital_service'
      - `customer_id` (uuid, foreign key)
      - `technician_id` (uuid, foreign key, optional)
      - `device_info` (jsonb, optional) - for repair tickets
      - `service_details` (jsonb, optional) - for service tickets
      - `status` (text) - new, in_progress, awaiting_parts, completed, delivered, canceled
      - `priority` (text) - low, medium, high, urgent
      - `price_quote` (decimal)
      - `final_price` (decimal, optional)
      - `paid` (boolean, default false)
      - `notes` (text, optional)
      - `files` (jsonb, default '[]') - array of file URLs
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `ticket_status_history`
      - `id` (uuid, primary key)
      - `ticket_id` (uuid, foreign key)
      - `old_status` (text)
      - `new_status` (text)
      - `changed_by` (text, optional)
      - `notes` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Indexes
    - Add indexes for frequently queried columns
    - Add full-text search indexes
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text NOT NULL,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create technicians table
CREATE TABLE IF NOT EXISTS technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  specialization text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create service_tickets table
CREATE TABLE IF NOT EXISTS service_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('repair', 'digital_service')),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  technician_id uuid REFERENCES technicians(id) ON DELETE SET NULL,
  device_info jsonb DEFAULT '{}'::jsonb,
  service_details jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'awaiting_parts', 'completed', 'delivered', 'canceled')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  price_quote decimal(10,2) DEFAULT 0,
  final_price decimal(10,2),
  paid boolean DEFAULT false,
  notes text,
  files jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ticket_status_history table
CREATE TABLE IF NOT EXISTS ticket_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES service_tickets(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_technicians_is_active ON technicians(is_active);
CREATE INDEX IF NOT EXISTS idx_service_tickets_ticket_number ON service_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_service_tickets_type ON service_tickets(type);
CREATE INDEX IF NOT EXISTS idx_service_tickets_status ON service_tickets(status);
CREATE INDEX IF NOT EXISTS idx_service_tickets_customer_id ON service_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_technician_id ON service_tickets(technician_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_created_at ON service_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_status_history_ticket_id ON ticket_status_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_status_history_created_at ON ticket_status_history(created_at);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_customers_search ON customers USING gin(to_tsvector('english', name || ' ' || COALESCE(phone, '') || ' ' || COALESCE(email, '')));
CREATE INDEX IF NOT EXISTS idx_service_tickets_search ON service_tickets USING gin(to_tsvector('english', ticket_number || ' ' || COALESCE(notes, '')));

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_status_history ENABLE ROW LEVEL SECURITY;

-- Create policies for customers
CREATE POLICY "Customers are viewable by everyone"
  ON customers
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for technicians
CREATE POLICY "Technicians are viewable by everyone"
  ON technicians
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage technicians"
  ON technicians
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for service_tickets
CREATE POLICY "Service tickets are viewable by everyone"
  ON service_tickets
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage service tickets"
  ON service_tickets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for ticket_status_history
CREATE POLICY "Ticket status history is viewable by everyone"
  ON ticket_status_history
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage ticket status history"
  ON ticket_status_history
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_tickets_updated_at
  BEFORE UPDATE ON service_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically track status changes
CREATE OR REPLACE FUNCTION track_ticket_status_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO ticket_status_history (
      ticket_id,
      old_status,
      new_status,
      changed_by,
      notes
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      current_user,
      CASE 
        WHEN NEW.notes IS DISTINCT FROM OLD.notes THEN NEW.notes
        ELSE NULL
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to track status changes
CREATE TRIGGER track_service_ticket_status_changes
  AFTER UPDATE ON service_tickets
  FOR EACH ROW
  EXECUTE FUNCTION track_ticket_status_changes();

-- Insert sample technicians
INSERT INTO technicians (name, email, phone, specialization) VALUES
  ('Jean Dubois', 'jean.dubois@techstore.com', '(555) 123-4567', 'Mobile Devices'),
  ('Marie Tremblay', 'marie.tremblay@techstore.com', '(555) 234-5678', 'Laptops & Computers'),
  ('Pierre Gagnon', 'pierre.gagnon@techstore.com', '(555) 345-6789', 'Audio & Gaming'),
  ('Sophie Lavoie', 'sophie.lavoie@techstore.com', '(555) 456-7890', 'Digital Services')
ON CONFLICT DO NOTHING;

-- Insert sample customers
INSERT INTO customers (name, email, phone, address) VALUES
  ('Ahmed Ben Ali', 'ahmed.benali@email.com', '(555) 111-2222', '123 Rue de la Paix, Tunis'),
  ('Fatma Khelifi', 'fatma.khelifi@email.com', '(555) 222-3333', '456 Avenue Habib Bourguiba, Sfax'),
  ('Mohamed Sassi', 'mohamed.sassi@email.com', '(555) 333-4444', '789 Boulevard du 7 Novembre, Sousse')
ON CONFLICT DO NOTHING;