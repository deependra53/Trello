'use client';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseInternalCardPath } from '@/lib/utils';

// Keep our internal "mention:" links (react-markdown's default transform would
// strip the unknown scheme); everything else is sanitized as usual (blocks
// javascript:, data:, etc).
function urlTransform(url: string): string {
  return url.startsWith('mention:') ? url : defaultUrlTransform(url);
}

/**
 * Turn "@Name" tokens into mention links so they can be styled as pills without
 * a custom remark plugin. Matched only at a word boundary so emails like
 * a@b.com aren't treated as mentions.
 */
function withMentions(body: string): string {
  return body.replace(/(^|\s)@(\w+)/g, '$1[@$2](mention:$2)');
}

const components: Components = {
  a({ href, children }) {
    if (href?.startsWith('mention:')) {
      return (
        <span className="rounded bg-primary/15 px-1 font-medium text-primary">{children}</span>
      );
    }
    // A link back into our own app (e.g. a shared card link). Navigate in the
    // SAME tab so the recipient lands on the board with the card opened directly
    // (the board page reads ?card= and opens the modal on load).
    //
    // We deliberately use a plain native navigation here rather than a
    // next/navigation router.push: Chat is rendered inside an always-mounted
    // shell whose URL is driven by history.replaceState (see
    // use-workspace-section / chat-app), and a client-side router push from that
    // shell is unreliable — it can silently no-op, which made the link look
    // "unclickable". A native same-origin navigation always works and still
    // opens the card directly.
    const internalPath = parseInternalCardPath(href);
    if (internalPath) {
      return (
        <a
          href={internalPath}
          className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
        >
          {children}
        </a>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
      >
        {children}
      </a>
    );
  },
  p: ({ children }) => <p className="whitespace-pre-wrap break-words">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="line-through opacity-80">{children}</del>,
  ul: ({ children }) => <ul className="my-1 list-disc space-y-0.5 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-1 list-decimal space-y-0.5 pl-5">{children}</ol>,
  li: ({ children }) => <li className="marker:text-muted-foreground">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-1 border-l-2 border-primary/50 pl-3 text-muted-foreground">
      {children}
    </blockquote>
  ),
  pre: ({ children }) => (
    <pre className="my-1.5 overflow-x-auto rounded-lg border border-border/60 bg-muted/70 p-3 text-[0.85em] leading-relaxed">
      {children}
    </pre>
  ),
  code({ className, children }) {
    const text = String(children);
    // Block code (fenced/indented) spans newlines or carries a language class;
    // inline code is single-line. The <pre> above provides the block chrome.
    const isBlock = /\n/.test(text) || /language-/.test(className ?? '');
    return isBlock ? (
      <code className="font-mono">{children}</code>
    ) : (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>
    );
  },
  hr: () => <hr className="my-2 border-border/60" />,
  // Don't embed arbitrary remote images from markdown — show a (sanitized) link.
  img: ({ src, alt }) => {
    const safe = typeof src === 'string' ? urlTransform(src) : '';
    return (
      <a
        href={safe || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2"
      >
        {alt || (typeof src === 'string' ? src : '')}
      </a>
    );
  },
};

export function MessageBody({ body }: { body: string }) {
  return (
    <div className="text-sm leading-relaxed [&_a]:break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={urlTransform}
        components={components}
      >
        {withMentions(body)}
      </ReactMarkdown>
    </div>
  );
}
