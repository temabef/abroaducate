-- Fix HTML entity encoding: stop encoding '#' to avoid corrupting numeric entities like '&#36;'
-- Also maintain safe encoding for &, <, >, ", ', and common currency/special symbols

-- Recreate encode_html_entities without '#' mapping
CREATE OR REPLACE FUNCTION encode_html_entities(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    t TEXT;
BEGIN
    IF input_text IS NULL THEN
        RETURN NULL;
    END IF;

    t := input_text;
    -- Do not encode '#', to preserve numeric entities
    t := replace(t, '&', '&amp;');
    t := replace(t, '<', '&lt;');
    t := replace(t, '>', '&gt;');
    t := replace(t, '"', '&quot;');
    t := replace(t, E'\'', '&#39;');
    t := replace(t, '$', '&#36;');
    t := replace(t, '€', '&#128;');
    t := replace(t, '£', '&#163;');
    t := replace(t, '¥', '&#165;');
    t := replace(t, '©', '&#169;');
    t := replace(t, '®', '&#174;');
    t := replace(t, '™', '&#8482;');
    t := replace(t, '–', '&#8211;');
    t := replace(t, '—', '&#8212;');
    t := replace(t, '…', '&#8230;');
    RETURN t;
END;
$$;

-- Recreate decode_html_entities accordingly
CREATE OR REPLACE FUNCTION decode_html_entities(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    t TEXT;
BEGIN
    IF input_text IS NULL THEN
        RETURN NULL;
    END IF;

    t := input_text;
    t := replace(t, '&amp;', '&');
    t := replace(t, '&lt;', '<');
    t := replace(t, '&gt;', '>');
    t := replace(t, '&quot;', '"');
    t := replace(t, '&#39;', E'\'');
    t := replace(t, '&#36;', '$');
    t := replace(t, '&#128;', '€');
    t := replace(t, '&#163;', '£');
    t := replace(t, '&#165;', '¥');
    t := replace(t, '&#169;', '©');
    t := replace(t, '&#174;', '®');
    t := replace(t, '&#8482;', '™');
    t := replace(t, '&#8211;', '–');
    t := replace(t, '&#8212;', '—');
    t := replace(t, '&#8230;', '…');
    RETURN t;
END;
$$;

-- Note: no change needed to callers. This migration should be applied in Supabase to correct future inserts/updates.

