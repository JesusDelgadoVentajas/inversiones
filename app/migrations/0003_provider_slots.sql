CREATE TABLE provider_slots (
  provider TEXT NOT NULL,
  slot INTEGER NOT NULL CHECK (slot BETWEEN 0 AND 2),
  owner_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (provider, slot)
);
CREATE INDEX provider_slots_expiry_idx ON provider_slots(expires_at);
