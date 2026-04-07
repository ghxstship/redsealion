-- Normalize organizations.language from bare codes to BCP-47
-- This ensures the i18n system can resolve dictionaries correctly.

-- Normalize bare language codes to standard BCP-47 locales
UPDATE organizations SET language = 'en-US' WHERE language = 'en';
UPDATE organizations SET language = 'es-ES' WHERE language = 'es';
UPDATE organizations SET language = 'fr-FR' WHERE language = 'fr';
UPDATE organizations SET language = 'de-DE' WHERE language = 'de';
UPDATE organizations SET language = 'en-US' WHERE language = 'ja'; -- No Japanese dict yet
UPDATE organizations SET language = 'en-US' WHERE language = 'pt'; -- No Portuguese dict yet

-- Set default for any NULL language values
UPDATE organizations SET language = 'en-US' WHERE language IS NULL;

-- Add a comment noting the expected format
COMMENT ON COLUMN organizations.language IS 'BCP-47 locale code (e.g. en-US, fr-FR, de-DE). Used by the i18n system to load translation dictionaries.';
