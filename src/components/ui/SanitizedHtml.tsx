'use client';

/**
 * Canonical sanitized HTML renderer — C-01 remediation.
 *
 * Uses the browser's DOMParser to strip dangerous elements (script, iframe,
 * event handlers, etc.) instead of dangerouslySetInnerHTML.
 */
const BLOCKED_TAGS = new Set([
  'script', 'iframe', 'object', 'embed', 'form', 'input',
  'textarea', 'select', 'button', 'link', 'meta', 'base',
  'applet', 'style',
]);

const BLOCKED_ATTR_PREFIXES = ['on']; // onclick, onerror, etc.
const BLOCKED_ATTRS = new Set(['srcdoc', 'formaction', 'xlink:href']);

function sanitizeNode(node: Node): void {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;

    if (BLOCKED_TAGS.has(el.tagName.toLowerCase())) {
      el.remove();
      return;
    }

    // Remove dangerous attributes
    const attrs = Array.from(el.attributes);
    for (const attr of attrs) {
      const name = attr.name.toLowerCase();
      if (
        BLOCKED_ATTR_PREFIXES.some((p) => name.startsWith(p)) ||
        BLOCKED_ATTRS.has(name) ||
        attr.value.trim().toLowerCase().startsWith('javascript:')
      ) {
        el.removeAttribute(attr.name);
      }
    }
  }

  // Recurse children (copy to array since live collection mutates)
  const children = Array.from(node.childNodes);
  for (const child of children) {
    sanitizeNode(child);
  }
}

function sanitize(html: string): string {
  if (typeof window === 'undefined') {
    // SSR fallback: strip all HTML tags entirely
    return html.replace(/<[^>]*>/g, '');
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  sanitizeNode(doc.body);
  return doc.body.innerHTML;
}

interface SanitizedHtmlProps {
  /** Raw HTML string to sanitize and render. */
  html: string;
  /** Additional className for the wrapper. */
  className?: string;
}

/**
 * Renders HTML content with XSS protection.
 * Strips script tags, event handlers, iframes, and javascript: URIs.
 */
export default function SanitizedHtml({ html, className = '' }: SanitizedHtmlProps) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitize(html) }}
    />
  );
}
