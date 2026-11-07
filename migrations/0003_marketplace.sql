-- ViralAI by FARFAZ — migration 0003: stores, products, orders, delivery partners

CREATE TABLE IF NOT EXISTS stores (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id BIGINT,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  about_en TEXT NOT NULL DEFAULT '',
  about_ta TEXT NOT NULL DEFAULT '',
  logo_media_id BIGINT REFERENCES media(id) ON DELETE SET NULL,
  payment_link TEXT NOT NULL DEFAULT '',       -- store's OWN payment link / UPI-style address
  cod_enabled BOOLEAN NOT NULL DEFAULT false,
  delivery_fee_minor BIGINT NOT NULL DEFAULT 0, -- store-set standard delivery fee
  currency TEXT NOT NULL DEFAULT 'INR',
  suspended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stores_user ON stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_place ON stores(country, city);

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_minor BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  photo_media_id BIGINT REFERENCES media(id) ON DELETE SET NULL,
  scene TEXT NOT NULL DEFAULT '',              -- built-in scene key when no photo
  description_en TEXT NOT NULL DEFAULT '',
  description_ta TEXT NOT NULL DEFAULT '',
  stock INTEGER NOT NULL DEFAULT 0,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  category TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_key TEXT NOT NULL,                    -- duplicate guard: idempotency key from the client
  items JSONB NOT NULL DEFAULT '[]'::jsonb,    -- [{productId,name,priceMinor,qty}]
  total_minor BIGINT NOT NULL DEFAULT 0,       -- recomputed server-side at placement
  currency TEXT NOT NULL DEFAULT 'INR',
  buyer_name TEXT NOT NULL DEFAULT '',
  buyer_phone TEXT NOT NULL DEFAULT '',
  buyer_address TEXT NOT NULL DEFAULT '',
  pay_method TEXT NOT NULL DEFAULT 'cod',      -- link | cod
  buyer_marked_paid BOOLEAN NOT NULL DEFAULT false,
  seller_confirmed_payment BOOLEAN NOT NULL DEFAULT false,
  delivery_fee_minor BIGINT NOT NULL DEFAULT 0,
  delivery_partner_id BIGINT,                  -- -> delivery_partners(id), wired below
  status TEXT NOT NULL DEFAULT 'placed',       -- placed|confirmed|packed|shipped|out_for_delivery|delivered|cancelled
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (buyer_id, client_key)
);
CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS store_reports (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  reporter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS delivery_partners (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'individual',     -- individual | courier
  country TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  areas TEXT NOT NULL DEFAULT '',
  vehicle TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',              -- shown only to store/buyer on an ASSIGNED order
  suspended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE orders ADD CONSTRAINT fk_orders_partner
  FOREIGN KEY (delivery_partner_id) REFERENCES delivery_partners(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS delivery_partner_reports (
  id BIGSERIAL PRIMARY KEY,
  partner_id BIGINT NOT NULL REFERENCES delivery_partners(id) ON DELETE CASCADE,
  reporter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
