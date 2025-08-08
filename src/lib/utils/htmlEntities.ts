/**
 * HTML Entity Encoding/Decoding Utilities
 * Handles special characters like $, #, &, etc. for proper display
 */

// HTML entity mapping for encoding (basic HTML5-safe set + common currency/symbols)
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
};

// Reverse mapping for decoding
const reverseHtmlEntities: Record<string, string> = Object.fromEntries(
  Object.entries(htmlEntities).map(([key, value]) => [value, key])
);

/**
 * Encode special characters to HTML entities
 */
export function encodeHtmlEntities(text: string | null | undefined): string {
  if (text == null) return '';
  return text.replace(/[&<>"'\$#€£¥©®™–—…]/g, (match) => htmlEntities[match] || match);
}

/**
 * Decode a subset of numeric/named HTML entities back to characters
 */
export function decodeHtmlEntities(text: string | null | undefined): string {
  if (text == null) return '';
  return text.replace(/&(amp|lt|gt|quot|#39|#36|#35|#128|#163|#165|#169|#174|#8482|#8211|#8212|#8230);/g, (match) => reverseHtmlEntities[match] || match);
}

/**
 * Safely encode text for display in HTML
 */
export function safeHtmlEncode(text: string | null | undefined): string {
  if (text == null) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Format currency amounts for display
 */
export function formatCurrencyAmount(amount: string | null | undefined): string {
  if (amount == null) return '';
  const decoded = decodeHtmlEntities(amount);
  return decoded
    .replace(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g, '$$$1')
    .replace(/€(\d+(?:,\d{3})*(?:\.\d{2})?)/g, '€$1')
    .replace(/£(\d+(?:,\d{3})*(?:\.\d{2})?)/g, '£$1');
}

/**
 * Clean and format scholarship text for display
 */
export function formatScholarshipText(text: string | null | undefined): string {
  if (text == null) return '';
  const decoded = decodeHtmlEntities(text);
  return decoded
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}