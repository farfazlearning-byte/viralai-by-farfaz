-- ViralAI by FARFAZ — migration 0008: buyer → store contact enquiries
--
-- A recorded message a signed-in buyer sends to a store. This is NOT chat:
-- the seller reads enquiries in the My Store Dashboard. Only the buyer's
-- account name is shown to the seller — no phone/email is exposed here.

CREATE TABLE IF NOT EXISTS store_enquiries (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_store_enquiries_seller ON store_enquiries(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_enquiries_buyer ON store_enquiries(buyer_id, created_at DESC);
