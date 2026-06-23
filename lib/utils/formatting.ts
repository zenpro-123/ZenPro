/** Format a price for display, scaling decimals based on magnitude. INR uses the
 *  Indian (lakh/crore) digit grouping; everything else uses Western grouping. */
export function formatPrice(value: number, currency = "USD"): string {
  const maximumFractionDigits = value < 1 ? 4 : value < 100 ? 2 : 0;
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(value);
}

/** Format a percentage change with a leading sign, e.g. "+1.24%" / "-0.83%". */
export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/** Format large numbers with K/M/B suffixes, e.g. 12_400 -> "12.4K". */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    value
  );
}

/** Relative time string, e.g. "3h ago", "2d ago". */
export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Truncate text to a max length on a word boundary, appending an ellipsis. */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`;
}

/** Strip HTML tags and collapse whitespace, e.g. for job/article descriptions. */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Matches `<script>`/`<style>` blocks including their inner text. */
const SCRIPT_STYLE_BLOCK = /<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi;
/** Leftover inline JS config assignments, e.g. `window.HYPE_DESK_CONFIG = { … };`,
 *  which survive when tags are stripped before the script body is removed. */
const INLINE_JS_CONFIG = /\b(?:window|self|globalThis|document)\.[\w$.]+\s*=\s*\{[\s\S]*?\}\s*;?/g;

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#039;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&hellip;": "…",
  "&mdash;": "—",
  "&ndash;": "–",
};

function decodeEntities(text: string): string {
  return text.replace(/&[#\w]+;/g, (m) => HTML_ENTITIES[m.toLowerCase()] ?? m);
}

/**
 * Clean an RSS/HTML snippet into a display-safe plain-text summary. Removes
 * `<script>`/`<style>` blocks (and any inline JS config that leaks through
 * pre-stripped feeds like The Verge), decodes common entities, collapses
 * whitespace, and truncates on a word boundary.
 */
export function cleanSummary(input: string, maxLength = 320): string {
  const text = decodeEntities(
    input.replace(SCRIPT_STYLE_BLOCK, " ").replace(/<[^>]*>/g, " ")
  )
    .replace(INLINE_JS_CONFIG, " ")
    .replace(/\s+/g, " ")
    .trim();
  return truncate(text, maxLength);
}
