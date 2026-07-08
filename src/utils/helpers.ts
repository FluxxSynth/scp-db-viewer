/**
 * Sanitize HTML input to prevent XSS
 */
export function sanitizeHTML(str: string): string {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Escape regex special characters for safe RegExp construction
 */
export function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Convert SCP-XXX format to URL path
 */
export function scpToUrl(query: string): string {
    return `http://scp-wiki.wikidot.com/${query}`;
}

/**
 * SCP number formatting: "SCP-XXX" or just "XXX"
 */
export function formatScpNumber(query: string): string {
    const match = query.match(/^scp[-\s]?(\d{3,4})$/i);
    if (match) return `SCP-${match[1]}`;
    const match2 = query.match(/^(\d{3,4})$/);
    if (match2) return `SCP-${match2[1]}`;
    return query.toUpperCase();
}

/**
 * Strip HTML tags from a string
 */
export function stripHTML(str: string): string {
    return str.replace(/<[^>]*>/g, "");
}

/**
 * Strip Wikidot syntax ([[ tags ]], **, //, etc.)
 */
export function stripWikidot(str: string): string {
    return str
        .replace(/\[\[.*?\]\]/g, "")      // [[wiki tags]]
        .replace(/\*\*(.*?)\*\*/g, "$1")   // **bold**
        .replace(/\/\/(.*?)\/\//g, "$1")   // //italic//
        .replace(/--(.*?)--/g, "$1")       // --strike--
        .replace(/___(.*?)___/g, "$1")     // ___underline___
        .replace(/__(.*?)__/g, "$1")       // __underline__
        .replace(/%%(.*?)%%/g, "$1")       // %%teletype%%
        .replace(/\{\{(.*?)\}\}/g, "$1");  // {{inline}}
}

/**
 * Add a line break to the terminal display
 */
export function wait(ms: number): Promise<void> {
    return new Promise(done => setTimeout(done, ms));
}

/**
 * Get current timestamp for log entries
 */
export function timestamp(): string {
    return new Date().toISOString().replace("T", " ").slice(0, 19);
}
