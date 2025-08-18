import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';

// Initialize Supabase client
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to extract links from WordPress XML content
function extractLinksFromXML(xmlContent) {
  const linkMap = new Map();
  
  // Regular expression to find content blocks with links
  const contentRegex = /<content:encoded><!\[CDATA\[(.*?)\]\]><\/content:encoded>/gs;
  const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/g;
  const slugRegex = /<wp:post_name><!\[CDATA\[(.*?)\]\]><\/wp:post_name>/g;
  
  let match;
  let currentTitle = '';
  let currentSlug = '';
  
  // Parse each post
  const postRegex = /<item>(.*?)<\/item>/gs;
  let postMatch;
  
  while ((postMatch = postRegex.exec(xmlContent)) !== null) {
    const postContent = postMatch[1];
    
    // Extract title
    const titleMatch = titleRegex.exec(postContent);
    if (titleMatch) {
      currentTitle = titleMatch[1];
    }
    
    // Extract slug
    const slugMatch = slugRegex.exec(postContent);
    if (slugMatch) {
      currentSlug = slugMatch[1];
    }
    
    // Extract content with links
    const contentMatch = contentRegex.exec(postContent);
    if (contentMatch && currentSlug) {
      const content = contentMatch[1];
      
      // Only process if content has links
      if (content.includes('<a href=')) {
        linkMap.set(currentSlug, {
          title: currentTitle,
          slug: currentSlug,
          originalContent: content
        });
      }
    }
    
    // Reset regex lastIndex for next iteration
    titleRegex.lastIndex = 0;
    slugRegex.lastIndex = 0;
    contentRegex.lastIndex = 0;
  }
  
  return linkMap;
}

// Function to convert HTML links to Markdown format
function convertHtmlToMarkdown(htmlContent) {
  return htmlContent
    // Convert HTML links to markdown: <a href="url">text</a> -> [text](url)
    .replace(/<a\s+href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    // Remove blockquote tags but keep content
    .replace(/<\/?blockquote>/gi, '')
    // Convert basic HTML formatting
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i>(.*?)<\/i>/gi, '*$1*')
    // Convert headings
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1')
    // Handle lists
    .replace(/<ul[^>]*>/gi, '')
    .replace(/<\/ul>/gi, '')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1')
    // Remove any remaining HTML tags
    .replace(/<[^>]*>/g, '')
    // Clean up extra whitespace
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');
}

// Main function to restore links
async function restoreLinks() {
  try {
    console.log('🔄 Starting link restoration process...');
    
    // Read the WordPress XML file
    console.log('📖 Reading WordPress XML file...');
    const xmlContent = await fs.readFile('abroaducate.WordPress.2025-08-17.xml', 'utf8');
    
    // Extract links from XML
    console.log('🔍 Extracting links from WordPress content...');
    const linkMap = extractLinksFromXML(xmlContent);
    console.log(`📊 Found ${linkMap.size} posts with links to restore`);
    
    // Get current blog posts from database
    console.log('🗄️ Fetching current blog posts from database...');
    const { data: currentPosts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, content')
      .eq('status', 'published');
    
    if (fetchError) {
      throw new Error(`Database fetch error: ${fetchError.message}`);
    }
    
    console.log(`📝 Found ${currentPosts.length} published posts in database`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Process each current post
    for (const post of currentPosts) {
      const originalData = linkMap.get(post.slug);
      
      if (originalData) {
        console.log(`🔧 Processing: ${post.title}`);
        
        // Convert HTML content to Markdown
        const restoredContent = convertHtmlToMarkdown(originalData.originalContent);
        
        // Only update if the content has actually changed
        if (restoredContent !== post.content && restoredContent.length > 100) {
          // Update the post in database (preserving published_at)
          const { error: updateError } = await supabase
            .from('blog_posts')
            .update({ 
              content: restoredContent,
              updated_at: new Date().toISOString()
            })
            .eq('id', post.id);
          
          if (updateError) {
            console.error(`❌ Error updating ${post.title}:`, updateError.message);
          } else {
            console.log(`✅ Updated: ${post.title}`);
            updatedCount++;
          }
        } else {
          console.log(`⏭️ Skipped: ${post.title} (no significant changes)`);
          skippedCount++;
        }
      } else {
        console.log(`❓ No original data found for: ${post.title}`);
        skippedCount++;
      }
    }
    
    // Final report
    console.log('\n🎉 Link restoration complete!');
    console.log(`✅ Updated posts: ${updatedCount}`);
    console.log(`⏭️ Skipped posts: ${skippedCount}`);
    console.log(`📊 Total processed: ${currentPosts.length}`);
    
    if (updatedCount > 0) {
      console.log('\n💡 What happened:');
      console.log('- All original links have been restored as markdown links [text](url)');
      console.log('- Published dates were preserved');
      console.log('- Only content was updated');
      console.log('\n🔗 Your blog posts now have clickable links again!');
    }
    
  } catch (error) {
    console.error('💥 Error during link restoration:', error.message);
    process.exit(1);
  }
}

// Run the restoration
restoreLinks();
