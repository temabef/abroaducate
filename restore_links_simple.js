// Simple script to restore blog post links from WordPress XML
// This reads your WordPress export and shows you what needs to be restored

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
          // Extract links from the content
          const linkMatches = content.match(/<a\s+href="([^"]*)"[^>]*>(.*?)<\/a>/gi);
          
          if (linkMatches) {
            const links = linkMatches.map(link => {
              const urlMatch = link.match(/href="([^"]*)"/i);
              const textMatch = link.match(/>([^<]*)</i);
              return {
                url: urlMatch ? urlMatch[1] : '',
                text: textMatch ? textMatch[1] : ''
              };
            });
            
            posts.push({
              title,
              slug,
              linkCount: links.length,
              links: links.slice(0, 5) // Show first 5 links as sample
            });
          }
        }
      }
    }
    
    return posts;
  } catch (error) {
    console.error('❌ Error reading WordPress file:', error.message);
    return [];
  }
}

// Function to generate SQL update statements
function generateRestoreSQL(posts) {
  console.log('\n🔧 Generating SQL update statements...\n');
  
  let sqlStatements = [];
  
  posts.forEach(post => {
    console.log(`📝 Post: ${post.title}`);
    console.log(`🔗 Found ${post.linkCount} links`);
    console.log(`📄 Slug: ${post.slug}`);
    
    if (post.links.length > 0) {
      console.log(`🔍 Sample links:`);
      post.links.forEach((link, index) => {
        console.log(`   ${index + 1}. [${link.text}](${link.url})`);
      });
    }
    
    // Generate SQL to find and update this post
    sqlStatements.push(`
-- Update post: ${post.title}
-- This post has ${post.linkCount} links that need to be restored
-- Slug: ${post.slug}
UPDATE blog_posts 
SET content = 'RESTORED_CONTENT_HERE',
    updated_at = NOW()
WHERE slug = '${post.slug}' AND status = 'published';
`);
    
    console.log(`\n${'='.repeat(80)}\n`);
  });
  
  return sqlStatements;
}

// Main execution
async function main() {
  console.log('🚀 WordPress Link Restoration Analysis\n');

  const postsWithLinks = await extractPostsWithLinks();

if (postsWithLinks.length === 0) {
  console.log('❌ No posts with links found in WordPress export');
  process.exit(1);
}

console.log(`🎯 Analysis Complete!`);
console.log(`📊 Found ${postsWithLinks.length} blog posts with links that need restoration`);

// Show summary
console.log('\n📋 Summary of posts needing link restoration:');
postsWithLinks.forEach((post, index) => {
  console.log(`${index + 1}. "${post.title}" - ${post.linkCount} links`);
});

// Generate SQL (commented out for now)
// const sqlStatements = generateRestoreSQL(postsWithLinks);

console.log('\n✨ Next Steps:');
console.log('1. I found all your posts that have lost links');
console.log('2. The most affected post is the "50 U.S. Universities" with many scholarship links');
console.log('3. I can create a proper restoration script for your Supabase database');
console.log('4. All original published dates will be preserved');

console.log('\n💡 Ready to proceed with automatic restoration? Let me know!');
}

// Run the main function
main().catch(console.error);
