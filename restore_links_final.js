// Complete WordPress Link Restoration Script
// Restores all lost links from your WordPress export to Supabase database
// Uses existing environment setup

import { promises as fs } from 'fs';

// Function to extract posts with links from WordPress XML
async function extractPostsWithLinks() {
  try {
    console.log('📖 Reading WordPress XML file...');
    const xmlContent = await fs.readFile('abroaducate.WordPress.2025-08-17.xml', 'utf8');
    
    const posts = [];
    
    // Find all post items
    const postRegex = /<item>(.*?)<\/item>/gs;
    let postMatch;
    
    while ((postMatch = postRegex.exec(xmlContent)) !== null) {
      const postContent = postMatch[1];
      
      // Extract post details
      const titleMatch = postContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
      const slugMatch = postContent.match(/<wp:post_name><!\[CDATA\[(.*?)\]\]><\/wp:post_name>/);
      const contentMatch = postContent.match(/<content:encoded><!\[CDATA\[(.*?)\]\]><\/content:encoded>/s);
      
      if (titleMatch && slugMatch && contentMatch) {
        const title = titleMatch[1];
        const slug = slugMatch[1];
        const content = contentMatch[1];
        
        // Only include posts that have HTML links
        if (content.includes('<a href=')) {
          posts.push({
            title,
            slug,
            originalContent: content
          });
        }
      }
    }
    
    return posts;
  } catch (error) {
    console.error('❌ Error reading WordPress file:', error.message);
    return [];
  }
}

// Function to convert HTML content to clean Markdown
function convertHtmlToMarkdown(htmlContent) {
  let markdown = htmlContent;
  
  // Convert HTML links to markdown: <a href="url">text</a> -> [text](url)
  markdown = markdown.replace(/<a\s+href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  
  // Convert basic HTML formatting
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i>(.*?)<\/i>/gi, '*$1*');
  
  // Convert headings
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1');
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1');
  markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1');
  markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1');
  
  // Handle paragraphs
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  
  // Handle line breaks
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
  
  // Handle lists
  markdown = markdown.replace(/<ul[^>]*>/gi, '');
  markdown = markdown.replace(/<\/ul>/gi, '\n');
  markdown = markdown.replace(/<ol[^>]*>/gi, '');
  markdown = markdown.replace(/<\/ol>/gi, '\n');
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  
  // Handle blockquotes
  markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, (match, content) => {
    const lines = content.split('\n');
    return lines.map(line => line.trim() ? `> ${line.trim()}` : '').join('\n') + '\n\n';
  });
  
  // Handle images
  markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)');
  markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![Image]($1)');
  
  // Remove any remaining HTML tags
  markdown = markdown.replace(/<[^>]*>/g, '');
  
  // Clean up whitespace
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  markdown = markdown.replace(/^\s+|\s+$/g, '');
  
  // Fix common WordPress issues
  markdown = markdown.replace(/&nbsp;/g, ' ');
  markdown = markdown.replace(/&amp;/g, '&');
  markdown = markdown.replace(/&lt;/g, '<');
  markdown = markdown.replace(/&gt;/g, '>');
  markdown = markdown.replace(/&quot;/g, '"');
  markdown = markdown.replace(/&#8217;/g, "'");
  markdown = markdown.replace(/&#8220;/g, '"');
  markdown = markdown.replace(/&#8221;/g, '"');
  markdown = markdown.replace(/&#8211;/g, '–');
  markdown = markdown.replace(/&#8212;/g, '—');
  
  return markdown;
}

// Function to generate SQL update statements
async function generateSQLUpdates() {
  try {
    console.log('🚀 Starting link restoration analysis...\n');
    
    // Extract posts with links from XML
    console.log('🔍 Extracting posts with links from WordPress export...');
    const postsWithLinks = await extractPostsWithLinks();
    console.log(`📊 Found ${postsWithLinks.length} posts with links to restore\n`);
    
    let sqlStatements = [];
    let totalLinksFound = 0;
    
    // Process each post
    for (const originalPost of postsWithLinks) {
      console.log(`🔧 Processing: ${originalPost.title}`);
      
      // Convert HTML content to Markdown
      const restoredContent = convertHtmlToMarkdown(originalPost.originalContent);
      
      // Count links in restored content
      const linkCount = (restoredContent.match(/\[([^\]]*)\]\(([^)]*)\)/g) || []).length;
      totalLinksFound += linkCount;
      
      console.log(`🔗 Found ${linkCount} links to restore`);
      
      // Escape single quotes for SQL
      const escapedContent = restoredContent.replace(/'/g, "''");
      const escapedSlug = originalPost.slug.replace(/'/g, "''");
      
      // Generate SQL update statement
      sqlStatements.push(`
-- Update: ${originalPost.title} (${linkCount} links)
UPDATE blog_posts 
SET content = '${escapedContent}',
    updated_at = NOW()
WHERE slug = '${escapedSlug}' AND status = 'published';
`);
      
      console.log('✅ SQL generated\n');
    }
    
    // Write SQL file
    const sqlContent = `-- WordPress Link Restoration SQL
-- Generated: ${new Date().toISOString()}
-- Posts to update: ${postsWithLinks.length}
-- Total links to restore: ${totalLinksFound}

-- IMPORTANT: This preserves all published dates and metadata
-- Only the content field will be updated

${sqlStatements.join('\n')}

-- Verification query (run after updates)
SELECT slug, title, 
       LENGTH(content) as content_length,
       (LENGTH(content) - LENGTH(REPLACE(content, '](', '')) AS link_count
FROM blog_posts 
WHERE status = 'published' 
ORDER BY link_count DESC;
`;
    
    await fs.writeFile('restore_links.sql', sqlContent);
    
    // Final report
    console.log('🎉 SQL generation complete!');
    console.log('='.repeat(50));
    console.log(`📄 SQL file created: restore_links.sql`);
    console.log(`✅ Posts to update: ${postsWithLinks.length}`);
    console.log(`🔗 Total links to restore: ${totalLinksFound}`);
    
    console.log('\n💡 Next steps:');
    console.log('1. Review the generated restore_links.sql file');
    console.log('2. Run it in your Supabase SQL Editor to restore all links');
    console.log('3. All published dates will be preserved');
    console.log('4. Only content will be updated with restored links');
    
    console.log('\n🔗 Major restorations:');
    const majorPosts = postsWithLinks
      .map(p => ({ 
        title: p.title, 
        links: (convertHtmlToMarkdown(p.originalContent).match(/\[([^\]]*)\]\(([^)]*)\)/g) || []).length 
      }))
      .sort((a, b) => b.links - a.links)
      .slice(0, 5);
    
    majorPosts.forEach(post => {
      console.log(`  • ${post.title} - ${post.links} links`);
    });
    
  } catch (error) {
    console.error('💥 Error during SQL generation:', error.message);
    process.exit(1);
  }
}

// Run the generator
generateSQLUpdates();
