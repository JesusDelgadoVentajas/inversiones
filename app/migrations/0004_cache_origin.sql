ALTER TABLE cache_entries ADD COLUMN provider TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE cache_entries ADD COLUMN capability TEXT NOT NULL DEFAULT 'legacy';
CREATE INDEX cache_provider_idx ON cache_entries(provider, capability);
