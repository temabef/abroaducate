/**
 * HTML Entity Encoding/Decoding Utilities
 * Handles special characters like $, #, &, etc. for proper display
 */

// ── Named entity map (common ones found in scholarship data) ─────────────────
const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00A0',
  copy: '©',
  reg: '®',
  trade: '™',
  euro: '€',
  pound: '£',
  yen: '¥',
  cent: '¢',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  laquo: '«',
  raquo: '»',
  ldquo: '\u201C',
  rdquo: '\u201D',
  lsquo: '\u2018',
  rsquo: '\u2019',
  bull: '•',
  middot: '·',
  times: '×',
  divide: '÷',
  frac12: '½',
  frac14: '¼',
  frac34: '¾',
};

/**
 * Decode ALL HTML entities in a string — both numeric (&#NNN; &#xHHH;) and
 * named (&amp; &euro; etc.).  Works in SSR and browser.
 *
 * Special case: &#128; was historically misused to mean € in some scrapers.
 * We remap it to € before the generic decode so it renders correctly.
 */
export function decodeHtmlEntities(text: string | null | undefined): string {
  if (text == null) return '';
  // &#128; is a C1 control char but was widely misused to mean €
  const preFixed = text.replace(/&#128;/g, '€');
  return preFixed.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    // Numeric decimal: &#8211;
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      const code = parseInt(entity.slice(2), 16);
      return isNaN(code) ? match : String.fromCodePoint(code);
    }
    if (entity.startsWith('#')) {
      const code = parseInt(entity.slice(1), 10);
      // Remap Windows-1252 range (128-159) that was stored as numeric entities
      // The most common one is 128 → € (already handled above, but catch any
      // that slip through the pre-fix step)
      if (code === 128) return '€';
      if (code === 163) return '£';  // &#163; = £ (also valid Unicode)
      return isNaN(code) ? match : String.fromCodePoint(code);
    }
    // Named entity
    return NAMED[entity] ?? match;
  });
}

/**
 * Encode special characters to HTML entities (for writing to DB / HTML attrs).
 */
export function encodeHtmlEntities(text: string | null | undefined): string {
  if (text == null) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Safely encode text for use inside HTML attributes.
 */
export function safeHtmlEncode(text: string | null | undefined): string {
  return encodeHtmlEntities(text);
}

/**
 * Format currency amounts for display — decodes entities, cleans up pipe
 * separators the scraper uses (e.g. "Full Scholarship | €1400 Monthly Stipend")
 * into a readable short form.
 */
export function formatCurrencyAmount(amount: string | null | undefined): string {
  if (amount == null) return '';
  const decoded = decodeHtmlEntities(amount).trim();
  // If the amount has pipe separators, take the most informative part:
  // prefer the segment that contains a currency symbol or "full", otherwise
  // join with a bullet for readability.
  if (decoded.includes('|')) {
    const parts = decoded.split('|').map((p) => p.trim()).filter(Boolean);
    // Find the part with a currency amount (€, $, £, ¥, or digits)
    const currencyPart = parts.find((p) => /[€$£¥][\d,]|[\d,]+\s*(EUR|USD|GBP|PLN|SEK|CZK)/i.test(p));
    if (currencyPart) {
      // Return "Full Scholarship · €1,400/month" style if there's a "full" part
      const fullPart = parts.find((p) => /full/i.test(p));
      return fullPart && fullPart !== currencyPart
        ? `${fullPart} · ${currencyPart}`
        : currencyPart;
    }
    // No currency found — join with · for readability
    return parts.join(' · ');
  }
  return decoded;
}

/**
 * Clean and format scholarship text for display — decodes entities, collapses
 * excess whitespace, trims.
 */
export function formatScholarshipText(text: string | null | undefined): string {
  if (text == null) return '';
  return decodeHtmlEntities(text)
    .replace(/\s+/g, ' ')
    .replace(/ \n/g, '\n')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}
