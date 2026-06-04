'use client';
import { useEffect, useState } from 'react';

/** Nearest actually-scrollable ancestor of `el` (or null → the viewport). */
function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    if (/(auto|scroll|overlay)/.test(overflowY) && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/**
 * Tracks which of the given section ids is nearest the top of the scroll
 * container, so the settings left-nav can highlight the active panel as the
 * user scrolls. The settings content scrolls inside an ancestor <main>, so we
 * observe against THAT element (not the viewport) and add a bottom-of-scroll
 * fallback — otherwise the final sections, which can't scroll far enough to
 * reach the activation band, would never light up their nav item.
 */
export function useScrollSpy(ids: string[], topOffset = 100): string {
  const [active, setActive] = useState(ids[0] ?? '');
  const key = ids.join('|');

  useEffect(() => {
    if (ids.length === 0) return;
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const container = getScrollParent(els[0]);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { root: container, rootMargin: `-${topOffset}px 0px -55% 0px`, threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));

    // When the container is scrolled to the bottom, the last panels can't reach
    // the top activation band — force the final id active so the nav matches.
    const target: EventTarget = container ?? window;
    const onScroll = () => {
      const atBottom = container
        ? container.scrollTop + container.clientHeight >= container.scrollHeight - 4
        : window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) setActive(ids[ids.length - 1]!);
    };
    target.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      target.removeEventListener('scroll', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, topOffset]);

  return active;
}
