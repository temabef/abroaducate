/**
 * HTML Entity Encoding/Decoding Utilities
 * Handles special characters like $, #, &, etc. for proper display
 */

// HTML entity mapping for encoding
const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '$': '&#36;',
  '#': '&#35;',
  '€': '&#128;',
  '£': '&#163;',
  '¥': '&#165;',
  '©': '&#169;',
  '®': '&#174;',
  '™': '&#8482;',
  '–': '&#8211;',
  '—': '&#8212;',
  '…': '&#8230;',
  '"': '&#8220;',
  '"': '&#8221;',
  ''': '&#8216;',
  ''': '&#8217;'
};

// Reverse mapping for decoding
const reverseHtmlEntities: Record<string, string> = Object.fromEntries(
  Object.entries(htmlEntities).map(([key, value]) => [value, key])
);

/**
 * Encode special characters to HTML entities
 * @param text - The text to encode
 * @returns Encoded text with HTML entities
 */
export function encodeHtmlEntities(text: string | null | undefined): string {
  if (!text) return '';
  
  return text.replace(/[&<>"'$#€£¥©®™–—…""'']/g, (match) => {
    return htmlEntities[match] || match;
  });
}

/**
 * Decode HTML entities back to special characters
 * @param text - The text to decode
 * @returns Decoded text with special characters
 */
export function decodeHtmlEntities(text: string | null | undefined): string {
  if (!text) return '';
  
  return text.replace(/&(?:amp|lt|gt|quot|#39|#36|#35|#128|#163|#165|#169|#174|#8482|#8211|#8212|#8230|#8220|#8221|#8216|#8217);/g, (match) => {
    return reverseHtmlEntities[match] || match;
  });
}

/**
 * Safely encode text for display in HTML
 * @param text - The text to safely encode
 * @returns Safely encoded text
 */
export function safeHtmlEncode(text: string | null | undefined): string {
  if (!text) return '';
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Format currency amounts for display
 * @param amount - The amount string (may contain encoded entities)
 * @returns Formatted amount for display
 */
export function formatCurrencyAmount(amount: string | null | undefined): string {
  if (!amount) return '';
  
  // First decode any HTML entities
  const decoded = decodeHtmlEntities(amount);
  
  // Format common currency patterns
  return decoded
    .replace(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g, '$$$1')
    .replace(/€(\d+(?:,\d{3})*(?:\.\d{2})?)/g, '€$1')
    .replace(/£(\d+(?:,\d{3})*(?:\.\d{2})?)/g, '£$1');
}

/**
 * Clean and format scholarship text for display
 * @param text - The text to clean and format
 * @returns Cleaned and formatted text
 */
export function formatScholarshipText(text: string | null | undefined): string {
  if (!text) return '';
  
  // Decode HTML entities
  let cleaned = decodeHtmlEntities(text);
  
  // Clean up common formatting issues
  cleaned = cleaned
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n\s*\n/g, '\n') // Remove extra line breaks
    .trim();
  
  return cleaned;
} 