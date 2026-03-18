import DOMPurify from 'dompurify';

/**
 * Sanitize an HTML string before injecting it into the DOM via
 * dangerouslySetInnerHTML. Allows SVG elements (needed for badge rendering)
 * but strips scripts, event handlers, and other XSS vectors.
 */
export function sanitizeHTML(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
        USE_PROFILES: { html: true, svg: true, svgFilters: true },
    });
}

/**
 * Sanitize plain text that will be rendered as HTML (e.g. newlines → <br>).
 * Only allows basic formatting tags; no scripts or event handlers.
 */
export function sanitizeTextHTML(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['br', 'b', 'i', 'em', 'strong', 'p', 'span'],
        ALLOWED_ATTR: [],
    });
}
