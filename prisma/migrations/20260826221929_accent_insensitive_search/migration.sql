-- Make full-text search accent-insensitive: in French, people routinely type
-- "ecran" for "écran" and "resolu" for "résolu".
CREATE EXTENSION IF NOT EXISTS unaccent;

-- unaccent() is only STABLE, because it reads a dictionary that could in theory
-- be changed. A generated column requires an IMMUTABLE expression, so pin the
-- dictionary explicitly and wrap it. This is the documented Postgres recipe.
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE PARALLEL SAFE STRICT
AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;

-- Rebuild the column with the new expression; dropping it also drops its index.
ALTER TABLE "Ticket" DROP COLUMN "searchVector";

ALTER TABLE "Ticket" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('french', immutable_unaccent(coalesce("title", ''))), 'A') ||
    setweight(to_tsvector('french', immutable_unaccent(coalesce("description", ''))), 'B')
  ) STORED;

CREATE INDEX "Ticket_searchVector_idx" ON "Ticket" USING GIN ("searchVector");
