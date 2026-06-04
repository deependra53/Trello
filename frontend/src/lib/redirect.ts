/**
 * Validate a post-auth `?next=` redirect target. Only same-origin absolute
 * paths are allowed — anything else (external URLs, protocol-relative `//evil`,
 * backslash tricks) falls back to the boards home to avoid open redirects.
 */
export function safeRedirect(next: string | null | undefined, fallback = '/boards'): string {
  if (!next) return fallback;
  // Must be a root-relative path and not a protocol-relative `//host` URL.
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  return next;
}
