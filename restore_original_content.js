// Script to restore original content from migrated_posts.json
// This will revert all posts back to their clean, original migrated state

import { promises as fs } from 'fs';

async function restoreOriginalContent() {
  try {
    console.log('📖 Reading original migrated posts...');
    
    // Read the original migrated posts
    const migratedData = JSON.parse(await fs.readFile('migrated_posts.json', 'utf8'));
    
    console.log(`📊 Found ${migratedData.length} original posts`);
    
    let sqlStatements = [];
    
    // Generate SQL to restore each post to its original content
    migratedData.forEach(post => {
      // Clean up the content - remove WordPress artifacts but keep original text
      let cleanContent = post.content
        // Remove \r\n and replace with proper newlines
        .replace(/\\r\\n/g, '\n')
        .replace(/\r\n/g, '\n')
        // Remove numbered citations that got converted to links incorrectly
        .replace(/(\d+)\./g, '$1.')
        // Remove any stray HTML
        .replace(/<[^>]*>/g, '')
        // Clean up extra whitespace
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      
      // Escape single quotes for SQL
      const escapedContent = cleanContent.replace(/'/g, "''");
      const escapedSlug = post.slug.replace(/'/g, "''");
      
      sqlStatements.push(`
-- Restore: ${post.title}
UPDATE blog_posts 
SET content = '${escapedContent}',
    updated_at = NOW()
WHERE slug = '${escapedSlug}' AND status = 'published';
`);
    });
    
    // Write the restore SQL
    const sqlContent = `-- RESTORE ORIGINAL CONTENT FROM MIGRATION
-- Generated: ${new Date().toISOString()}
-- This restores all posts to their original clean migrated state
-- Removes the broken link formatting from the previous restoration

${sqlStatements.join('\n')}

-- Verification query
SELECT slug, title, 
       LENGTH(content) as content_length,
       (LENGTH(content) - LENGTH(REPLACE(content, '](', ''))) AS link_count
FROM blog_posts 
WHERE status = 'published' 
ORDER BY content_length DESC;
`;
    
    await fs.writeFile('restore_original.sql', sqlContent);
    
    console.log('✅ Generated restore_original.sql');
    console.log('📋 This will restore all posts to their original clean state');
    console.log('🔧 Run this in Supabase SQL Editor to fix the formatting issues');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

restoreOriginalContent();
