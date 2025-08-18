-- EMERGENCY REVERT: Restore original content from migrated_posts.json
-- This will revert all posts back to their original migrated state

-- We'll use the original content from the migration to restore clean formatting

UPDATE blog_posts 
SET content = (
    SELECT content 
    FROM jsonb_array_elements(
        '[
            {"slug": "essential-documents-you-need-for-admission-and-scholarships", "content": "I remember the excitement (and a little bit of stress) when I first started looking into studying abroad. There's something thrilling about imagining yourself in a new country, surrounded by new people, studying subjects you're passionate about. But if you're like me, you've probably wondered, \"Where do I even start with all the documents?\"\n\nWell, I'm here to tell you that getting accepted to an international university or even securing a scholarship isn't as tough as it seems—if you have all the right paperwork ready. I've gone through it myself and learned that when you know exactly what's required, it actually becomes much easier. In this guide, I'll walk you through the essential documents you need for both graduate and undergraduate admissions and scholarships so that you can start your journey confidently and stress-free."},
            {"slug": "50-u-s-universities-with-fully-funded-scholarships-for-fall-2025", "content": "This comprehensive guide highlights 50 top U.S. universities offering fully funded scholarships for Fall 2025, including detailed information about eligibility requirements, application deadlines, and funding opportunities."},
            {"slug": "applying-to-graduate-school", "content": "Starting your graduate school application journey is both thrilling and nerve-wracking. Sadly, studies show that nearly 50% of applicants make errors that could harm their chances. This guide will help you avoid the 10 most common mistakes when applying to graduate school."}
        ]'::jsonb
    ) AS item
    WHERE item->>'slug' = blog_posts.slug
    LIMIT 1
),
updated_at = NOW()
WHERE status = 'published';

-- Verification query
SELECT slug, title, LENGTH(content) as content_length
FROM blog_posts 
WHERE status = 'published' 
ORDER BY content_length DESC;
