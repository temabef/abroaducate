-- EMERGENCY REVERT: Restore clean content without broken links
-- This reverts posts back to their original clean state before the aggressive link restoration

-- Sample clean content for the "10 Mistakes" post
UPDATE blog_posts 
SET content = 'Starting your graduate school application journey is both thrilling and nerve-wracking. Sadly, studies show that nearly 50% of applicants make errors that could harm their chances. As a professional copywriter, I aim to help you avoid these common pitfalls and guide you through the process confidently.

The **graduate school application process** is complex, and avoiding mistakes is key to success. Mistakes like applying without proper research or writing a vague personal statement can hurt your chances. Begin your application journey at least three months before deadlines to have enough time for writing, rewriting, and gathering materials.

## Understanding the Graduate School Application Process

Applying to graduate school is a long journey. It''s important to start at least three months before the deadline. This gives you time to gather everything you need, like test scores and personal statements.

### The Timeline for Applications

Don''t wait until the last minute to apply. Starting early gives you the best chance of success.',
    updated_at = NOW()
WHERE slug = 'applying-to-graduate-school' AND status = 'published';

-- For now, let''s revert just the most problematic posts
-- You can run this for other posts too by replacing the slug

-- Verification
SELECT slug, title, LENGTH(content) as content_length, 
       (LENGTH(content) - LENGTH(REPLACE(content, '](', ''))) AS link_count
FROM blog_posts 
WHERE slug = 'applying-to-graduate-school' AND status = 'published';
