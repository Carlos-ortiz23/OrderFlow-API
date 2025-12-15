-- Migration: Bot Checkout Improvements
-- Description: Adds address column to clients table and other improvements for the checkout process

-- 1. Add shipping_address column to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS shipping_address TEXT;

-- 2. Add index on client_id in orders table for faster lookups
-- This helps when checking if a client has previous orders with addresses
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);

-- 3. Add default values for payment methods to ensure they're always available
-- First check if they already exist to avoid duplicates
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE code = 'cash') THEN
        INSERT INTO payment_methods (code, label) VALUES ('cash', 'Efectivo');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE code = 'transfer') THEN
        INSERT INTO payment_methods (code, label) VALUES ('transfer', 'Transferencia Bancaria');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE code = 'nequi') THEN
        INSERT INTO payment_methods (code, label) VALUES ('nequi', 'Nequi');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE code = 'daviplata') THEN
        INSERT INTO payment_methods (code, label) VALUES ('daviplata', 'Daviplata');
    END IF;
END $$;

-- 4. Add a function to get the latest shipping address for a client
CREATE OR REPLACE FUNCTION get_client_latest_address(client_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    latest_address TEXT;
BEGIN
    -- First try to get address from client profile
    SELECT shipping_address INTO latest_address
    FROM clients
    WHERE id = client_uuid;
    
    -- If no address in profile, try to get from latest order
    IF latest_address IS NULL THEN
        SELECT shipping_address INTO latest_address
        FROM orders
        WHERE client_id = client_uuid
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;
    
    RETURN latest_address;
END;
$$;

-- 5. Add comments to explain the purpose of these columns
COMMENT ON COLUMN clients.shipping_address IS 'Default shipping address for the client';
COMMENT ON COLUMN orders.shipping_address IS 'Shipping address for this specific order';
COMMENT ON COLUMN orders.payment_method_id IS 'Reference to the payment method used for this order';
COMMENT ON COLUMN orders.ai_summary IS 'Special instructions or notes for the order, collected during checkout';
