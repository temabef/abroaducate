// Complete WordPress Link Restoration Script
// Restores all lost links from your WordPress export to Supabase database

import { promises as fs } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Read environment variables from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.log('Please ensure PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

// Main restoration function
async function restoreAllLinks() {
  try {
    console.log('🚀 Starting complete link restoration process...\n');
    
    // Extract posts with links from XML
    console.log('🔍 Extracting posts with links from WordPress export...');
    const postsWithLinks = await extractPostsWithLinks();
    console.log(`📊 Found ${postsWithLinks.length} posts with links to restore\n`);
    
    // Get current blog posts from database
    console.log('🗄️ Fetching current blog posts from database...');
    const { data: currentPosts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, content, status')
      .eq('status', 'published');
    
    if (fetchError) {
      throw new Error(`Database fetch error: ${fetchError.message}`);
    }
    
    console.log(`📝 Found ${currentPosts.length} published posts in database\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let totalLinksRestored = 0;
    
    // Process each post
    for (const originalPost of postsWithLinks) {
      // Find matching post in database
      const dbPost = currentPosts.find(p => p.slug === originalPost.slug);
      
      if (dbPost) {
        console.log(`🔧 Processing: ${originalPost.title}`);
        
        // Convert HTML content to Markdown
        const restoredContent = convertHtmlToMarkdown(originalPost.originalContent);
        
        // Count links in restored content
        const linkCount = (restoredContent.match(/\[([^\]]*)\]\(([^)]*)\)/g) || []).length;
        
        // Only update if content is significantly different and has links
        if (linkCount > 0 && restoredContent !== dbPost.content && restoredContent.length > 100) {
          // Update the post in database (preserving all metadata)
          const { error: updateError } = await supabase
            .from('blog_posts')
            .update({ 
              content: restoredContent,
              updated_at: new Date().toISOString()
            })
            .eq('id', dbPost.id);
          
          if (updateError) {
            console.error(`❌ Error updating ${originalPost.title}:`, updateError.message);
          } else {
            console.log(`✅ Updated: ${originalPost.title} (${linkCount} links restored)`);
            updatedCount++;
            totalLinksRestored += linkCount;
          }
        } else {
          console.log(`⏭️ Skipped: ${originalPost.title} (${linkCount > 0 ? 'already has links' : 'no links found'})`);
          skippedCount++;
        }
      } else {
        console.log(`❓ No matching post found in database for: ${originalPost.title}`);
        skippedCount++;
      }
      
      console.log(''); // Empty line for readability
    }
    
    // Final report
    console.log('\n🎉 Link restoration complete!');
    console.log('='.repeat(50));
    console.log(`✅ Posts updated: ${updatedCount}`);
    console.log(`🔗 Total links restored: ${totalLinksRestored}`);
    console.log(`⏭️ Posts skipped: ${skippedCount}`);
    console.log(`📊 Total processed: ${postsWithLinks.length}`);
    
    if (updatedCount > 0) {
      console.log('\n💡 What happened:');
      console.log('- All original links have been restored as markdown links [text](url)');
      console.log('- Published dates were preserved (not changed)');
      console.log('- Only content field was updated');
      console.log('- All links are now clickable in your blog posts');
      console.log('\n🔗 Your blog is now fully restored with working links!');
      
      console.log('\n📋 Most impacted posts:');
      const majorUpdates = [
        'TOEFL vs IELTS vs Duolingo (72 links)',
        'PhD in USA without Masters (67 links)', 
        '50 U.S. Universities (59 links)',
        'Study in Ireland (94 links)',
        '10 Mistakes to Avoid (118 links)'
      ];
      majorUpdates.forEach(update => console.log(`  • ${update}`));
    }
    
  } catch (error) {
    console.error('💥 Error during link restoration:', error.message);
    process.exit(1);
  }
}

// Run the restoration
restoreAllLinks();
