CREATE TRIGGER listing_identity_immutable
BEFORE UPDATE OF company_id,symbol,mic,currency,instrument,share_class ON listings
WHEN OLD.company_id IS NOT NEW.company_id OR OLD.symbol IS NOT NEW.symbol OR
     OLD.mic IS NOT NEW.mic OR OLD.currency IS NOT NEW.currency OR
     OLD.instrument IS NOT NEW.instrument OR OLD.share_class IS NOT NEW.share_class
BEGIN
  SELECT RAISE(ABORT, 'IDENTITY_CONFLICT');
END;

CREATE TRIGGER provider_mapping_identity_immutable
BEFORE UPDATE OF provider,company_id,listing_id,external_id ON provider_mappings
WHEN OLD.provider IS NOT NEW.provider OR OLD.company_id IS NOT NEW.company_id OR
     OLD.listing_id IS NOT NEW.listing_id OR OLD.external_id IS NOT NEW.external_id
BEGIN
  SELECT RAISE(ABORT, 'IDENTITY_CONFLICT');
END;
