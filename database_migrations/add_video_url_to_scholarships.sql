-- Add video_url field to scholarships table for YouTube embeds
-- This allows adding video content to scholarship pages

ALTER TABLE scholarships
ADD COLUMN IF NOT EXISTS video_url TEXT;

COMMENT ON COLUMN scholarships.video_url IS 'YouTube video URL or video ID for embedded video content on scholarship page';
