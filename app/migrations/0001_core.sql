CREATE TABLE companies (
  id TEXT PRIMARY KEY CHECK (length(id) = 36),
  legal_name TEXT NOT NULL CHECK (length(legal_name) BETWEEN 1 AND 240),
  aliases_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(aliases_json)),
  country TEXT CHECK (country IS NULL OR length(country) = 2),
  sector TEXT,
  website TEXT,
  identifiers_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(identifiers_json)),
  created_at TEXT NOT NULL
);

CREATE TABLE listings (
  id TEXT PRIMARY KEY CHECK (length(id) = 36),
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL CHECK (length(symbol) BETWEEN 1 AND 40),
  mic TEXT NOT NULL CHECK (length(mic) = 4),
  currency TEXT NOT NULL CHECK (length(currency) = 3),
  instrument TEXT NOT NULL CHECK (instrument IN ('ordinary','preferred','adr','gdr','fund','other')),
  share_class TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('active','suspended','delisted','unknown')),
  time_zone TEXT,
  UNIQUE (mic, symbol, instrument, share_class)
);
CREATE INDEX listings_company_idx ON listings(company_id);

CREATE TABLE provider_mappings (
  id TEXT PRIMARY KEY CHECK (length(id) = 36),
  provider TEXT NOT NULL,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  listing_id TEXT REFERENCES listings(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  verified_at TEXT,
  CHECK ((company_id IS NULL) <> (listing_id IS NULL)),
  UNIQUE (provider, external_id),
  UNIQUE (provider, company_id),
  UNIQUE (provider, listing_id)
);

CREATE TABLE cache_entries (
  cache_key TEXT PRIMARY KEY CHECK (length(cache_key) BETWEEN 1 AND 512),
  body_json TEXT NOT NULL CHECK (json_valid(body_json) AND length(body_json) <= 131072),
  provenance_json TEXT NOT NULL CHECK (json_valid(provenance_json)),
  methodology_version TEXT NOT NULL,
  checked_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  CHECK (expires_at >= created_at)
);
CREATE INDEX cache_expiry_idx ON cache_entries(expires_at);

CREATE TABLE provider_budgets (
  provider TEXT NOT NULL,
  scope TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  window_seconds INTEGER NOT NULL CHECK (window_seconds > 0),
  cap INTEGER NOT NULL CHECK (cap > 0),
  used INTEGER NOT NULL CHECK (used >= 0 AND used <= cap),
  PRIMARY KEY (provider, scope, window_start, window_seconds)
);

CREATE TABLE refresh_leases (
  cache_key TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX lease_expiry_idx ON refresh_leases(expires_at);

CREATE TABLE preferences (
  owner_id TEXT PRIMARY KEY CHECK (length(owner_id) = 36),
  version INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0),
  data_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(data_json))
);

CREATE TABLE provider_status (
  provider TEXT NOT NULL,
  capability TEXT NOT NULL,
  failure_count INTEGER NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  open_until INTEGER,
  capability_version TEXT,
  last_error_code TEXT,
  PRIMARY KEY (provider, capability)
);
