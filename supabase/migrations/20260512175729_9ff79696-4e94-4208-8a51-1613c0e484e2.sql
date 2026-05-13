CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_cpf TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_cep TEXT,
  customer_address TEXT,
  customer_number TEXT,
  customer_complement TEXT,
  customer_neighborhood TEXT,
  customer_city TEXT,
  customer_state TEXT,
  items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  pix_copy_paste TEXT,
  qr_code_b64 TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  CONSTRAINT orders_status_check CHECK (status IN ('pending','paid','expired','failed'))
);

CREATE INDEX idx_orders_transaction_id ON public.orders(transaction_id);
CREATE INDEX idx_orders_status ON public.orders(status);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read orders by transaction_id"
ON public.orders
FOR SELECT
USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();