/**
 * Simple HTML sanitization helper to mitigate XSS risks.
 * 
 * This is a foundational implementation. For complex production needs,
 * consider integrating a library like dompurify or sanitize-html.
 */
export function sanitizeHtml(html: string): string {
    if (!html || typeof html !== 'string') return html;

    return html
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '') // Remove scripts
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, '')   // Remove styles
        .replace(/on\w+="[^"]*"/gim, '')                        // Remove event handlers (onmouseover, etc.)
        .replace(/on\w+='[^']*'/gim, '')
        .replace(/javascript:[^"']*/gim, '')                  // Remove javascript: links
        .trim();
}

/**
 * Escape HTML special characters.
 */
export function escapeHtml(html: string): string {
    if (!html || typeof html !== 'string') return html;

    return html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
