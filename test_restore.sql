-- Test Query: Check current link status before restoration
-- Run this first to see the current state

SELECT 
    slug, 
    title, 
    LENGTH(content) as content_length,
    (LENGTH(content) - LENGTH(REPLACE(content, '](', ''))) AS current_link_count,
    status,
    published_at
FROM blog_posts 
WHERE status = 'published' 
ORDER BY current_link_count DESC;

-- This will show you how many links each post currently has
-- Most posts should show 0 or very few links (indicating they're lost)
