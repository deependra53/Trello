import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function getInitials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Absolute, shareable deep-link to a single card. The board page reads the
 * `?card=` param on load and opens the card modal directly, so this is all the
 * recipient needs — no dedicated share route or backend resolver.
 */
export function cardShareUrl(boardId: string, cardId: string): string {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return `${origin}/boards/${boardId}?card=${cardId}`;
}

/**
 * If `href` points back into this app (same origin, or a root-relative path),
 * return the internal `pathname + search` so the caller can do client-side
 * navigation instead of a full page load. Returns null for external links.
 */
export function parseInternalCardPath(href: string | undefined): string | null {
  if (!href || typeof window === 'undefined') return null;
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}
