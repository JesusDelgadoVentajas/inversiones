ALTER TABLE cache_entries ADD COLUMN last_accessed_at INTEGER NOT NULL DEFAULT 0;
CREATE INDEX cache_access_idx ON cache_entries(last_accessed_at);
CREATE INDEX budget_window_idx ON provider_budgets(window_start);
