'use client';
import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import {
  Bold,
  CaseSensitive,
  Code,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Paperclip,
  PlusCircle,
  Quote,
  Send,
  Smile,
  SquareCode,
  Strikethrough,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { emitTyping } from '@/lib/socket';
import { uploadChatFile, useSendMessage } from '@/hooks/use-chat';
import { REACTION_EMOJIS } from '@/lib/chat-utils';
import { UserAvatar } from './user-avatar';
import type { ChatAttachment, OrgMember } from '@/types/api';

interface PendingAttachment {
  id: string;
  name: string;
  isImage: boolean;
  previewUrl?: string; // local object URL for instant preview
  status: 'uploading' | 'done' | 'error';
  uploaded?: ChatAttachment;
}

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function Composer({
  channelId,
  members,
  parentId,
  placeholder,
  autoFocus,
}: {
  channelId: string;
  members: OrgMember[];
  parentId?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [showFormatting, setShowFormatting] = useState(true);
  const [hasText, setHasText] = useState(false);
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const [mentionedIds, setMentionedIds] = useState<string[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const lastTyping = useRef(0);
  const send = useSendMessage(channelId);

  const isUploading = pending.some((p) => p.status === 'uploading');
  const readyCount = pending.filter((p) => p.status === 'done').length;
  const canSend = (hasText || readyCount > 0) && !isUploading;

  const mentionMatches =
    mentionQuery === null
      ? []
      : members
          .filter((m) =>
            (m.profile?.fullName ?? '').toLowerCase().includes(mentionQuery.toLowerCase()),
          )
          .slice(0, 6);

  // handleKeyDown / Enter logic runs from a closure captured once by Tiptap, so we
  // funnel the live values it needs through a ref to avoid stale state.
  const liveRef = useRef({
    mentionMatches,
    mentionIndex,
    inList: false,
    canSend,
    applyMention: (_m: OrgMember) => {},
    moveMention: (_delta: number) => {},
    closeMention: () => {},
    submit: () => {},
  });

  const editor = useEditor({
    immediatelyRender: false,
    autofocus: autoFocus ? 'end' : false,
    extensions: [
      StarterKit.configure({
        // We render via react-markdown downstream; keep messages simple.
        heading: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
      }),
      Placeholder.configure({ placeholder: placeholder ?? 'Write a message…' }),
      Markdown.configure({ html: false, transformPastedText: true, transformCopiedText: true }),
    ],
    editorProps: {
      attributes: {
        class: 'max-h-40 min-h-[1.5rem] overflow-y-auto px-3 py-2.5 text-sm outline-none scrollbar-thin',
        'aria-label': placeholder ?? 'Write a message',
      },
      handleKeyDown: (_view, event) => {
        const s = liveRef.current;
        // Mention autocomplete owns the arrows / enter / escape while open.
        if (s.mentionMatches.length > 0) {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            s.moveMention(1);
            return true;
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            s.moveMention(-1);
            return true;
          }
          if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault();
            s.applyMention(s.mentionMatches[s.mentionIndex] ?? s.mentionMatches[0]!);
            return true;
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            s.closeMention();
            return true;
          }
        }
        if (event.key === 'Enter') {
          if (event.shiftKey) return false; // hard break (new line within the message)
          if (event.metaKey || event.ctrlKey) {
            // Force-send escape hatch (e.g. while inside a list).
            if (s.canSend) s.submit();
            return true;
          }
          // Inside a list, Enter continues / exits the list instead of sending.
          if (s.inList) return false;
          if (s.canSend) s.submit();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const now = Date.now();
      if (now - lastTyping.current > 1500) {
        lastTyping.current = now;
        emitTyping(channelId);
      }
      setHasText(editor.getText().trim().length > 0);
      syncMention(editor);
    },
    onSelectionUpdate: ({ editor }) => syncMention(editor),
  });

  // Detect an in-progress "@mention" immediately before the caret so we can show
  // the people picker. Matched at a word boundary so emails (a@b.com) don't trigger.
  function syncMention(ed: NonNullable<typeof editor>) {
    const { from, empty } = ed.state.selection;
    if (!empty) {
      setMentionQuery(null);
      return;
    }
    const before = ed.state.doc.textBetween(Math.max(0, from - 40), from, '\n', '\n');
    const match = /(^|\s)@(\w*)$/.exec(before);
    setMentionQuery(match ? (match[2] ?? '') : null);
  }

  function applyMention(member: OrgMember) {
    if (!editor) return;
    const { from } = editor.state.selection;
    const before = editor.state.doc.textBetween(Math.max(0, from - 40), from, '\n', '\n');
    const match = /(^|\s)@(\w*)$/.exec(before);
    const queryLen = match ? (match[2]?.length ?? 0) : 0;
    // Strip to ASCII word-chars so the handle matches the caret-detection and the
    // renderer's mention regex (\w) — e.g. "Mary-Jane" → "MaryJane".
    const name = (member.profile?.fullName ?? '').replace(/[^\w]/g, '');
    editor
      .chain()
      .focus()
      .deleteRange({ from: from - queryLen - 1, to: from }) // drop the "@query"
      .insertContent(`@${name} `)
      .run();
    setMentionedIds((prev) => [...new Set([...prev, member.userId])]);
    setMentionQuery(null);
  }

  function insertEmoji(emoji: string) {
    editor?.chain().focus().insertContent(emoji).run();
  }

  // Keep the keyboard-handler ref pointed at the latest values every render.
  liveRef.current = {
    mentionMatches,
    mentionIndex,
    inList: !!editor && (editor.isActive('bulletList') || editor.isActive('orderedList')),
    canSend,
    applyMention,
    moveMention: (delta: number) =>
      setMentionIndex((i) => {
        const len = mentionMatches.length;
        return len === 0 ? 0 : (i + delta + len) % len;
      }),
    closeMention: () => setMentionQuery(null),
    submit,
  };

  // Reset the highlighted person whenever the query changes.
  useEffect(() => setMentionIndex(0), [mentionQuery]);

  // Revoke object URLs when the composer unmounts (avoid leaks).
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  useEffect(() => {
    return () => {
      pendingRef.current.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  function removePending(id: string) {
    setPending((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${file.name}-${file.size}-${file.lastModified}`;
      const isImage = file.type.startsWith('image/');
      const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
      setPending((prev) => [
        ...prev,
        { id, name: file.name, isImage, previewUrl, status: 'uploading' },
      ]);

      uploadChatFile(channelId, file)
        .then((att) =>
          setPending((prev) =>
            prev.map((p) => (p.id === id ? { ...p, status: 'done', uploaded: att } : p)),
          ),
        )
        .catch(() => {
          toast.error(`Couldn’t upload ${file.name}`);
          setPending((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'error' } : p)));
        });
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  async function submit() {
    if (!editor || isUploading) return;
    const body = editor.storage.markdown.getMarkdown().trim();
    // Read attachments from the ref (live), not `pending` state, so the clear
    // below takes effect synchronously for the re-entrancy check.
    const attachments = pendingRef.current
      .filter((p) => p.status === 'done' && p.uploaded)
      .map((p) => p.uploaded as ChatAttachment);
    if (!body && attachments.length === 0) return;

    const mentions = collectMentions(body);
    const clientId = makeId();
    // Snapshot for restore-on-failure, then clear the composer *synchronously*.
    // This is the fix for duplicate sends: the message leaves the input the
    // instant it's sent, so a rapid second Enter (or click) — which fires before
    // the network resolves — finds an empty composer and submits nothing. The
    // optimistic bubble (see useSendMessage) makes the send feel instant.
    const draft = editor.getJSON();
    const sentPending = pendingRef.current;
    pendingRef.current = [];
    editor.commands.clearContent(true);
    setHasText(false);
    setMentionedIds([]);
    setMentionQuery(null);
    setPending([]);

    try {
      await send.mutateAsync({ body, mentions, attachments, parentId, clientId });
      // Sent — release the local preview URLs for the attachments we just sent.
      sentPending.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
    } catch {
      // Restore the draft so nothing is lost — unless the user already started a
      // new message in the meantime (don't clobber fresh typing).
      if (editor.isEmpty) {
        editor.commands.setContent(draft);
        setHasText(editor.getText().trim().length > 0);
        pendingRef.current = sentPending;
        setPending(sentPending);
      } else {
        sentPending.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
      }
      toast.error('Could not send — your message was restored');
    }
  }

  function collectMentions(body: string): string[] {
    return mentionedIds.filter((id) => {
      const m = members.find((mm) => mm.userId === id);
      const name = (m?.profile?.fullName ?? '').replace(/[^\w]/g, '');
      return name && body.includes(`@${name}`);
    });
  }

  // ---- Link popover -----------------------------------------------------------

  function openLinkPopover() {
    if (!editor) return;
    setLinkUrl((editor.getAttributes('link').href as string | undefined) ?? '');
    setLinkOpen(true);
  }

  function applyLink() {
    if (!editor) return;
    const raw = linkUrl.trim();
    if (!raw) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setLinkOpen(false);
      return;
    }
    const href = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`;
    const { empty } = editor.state.selection;
    if (empty && !editor.isActive('link')) {
      // No selection — drop the URL in as its own linked text.
      editor
        .chain()
        .focus()
        .insertContent({ type: 'text', text: raw, marks: [{ type: 'link', attrs: { href } }] })
        .insertContent(' ')
        .run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    setLinkOpen(false);
  }

  // ---- Toolbar ----------------------------------------------------------------

  const actions = editor
    ? [
        { key: 'bold', title: 'Bold (⌘B)', icon: Bold, active: editor.isActive('bold'), run: () => editor.chain().focus().toggleBold().run() },
        { key: 'italic', title: 'Italic (⌘I)', icon: Italic, active: editor.isActive('italic'), run: () => editor.chain().focus().toggleItalic().run() },
        { key: 'strike', title: 'Strikethrough', icon: Strikethrough, active: editor.isActive('strike'), run: () => editor.chain().focus().toggleStrike().run() },
        { key: 'ol', title: 'Numbered list', icon: ListOrdered, active: editor.isActive('orderedList'), run: () => editor.chain().focus().toggleOrderedList().run() },
        { key: 'ul', title: 'Bulleted list', icon: List, active: editor.isActive('bulletList'), run: () => editor.chain().focus().toggleBulletList().run() },
        { key: 'quote', title: 'Blockquote', icon: Quote, active: editor.isActive('blockquote'), run: () => editor.chain().focus().toggleBlockquote().run() },
        { key: 'code', title: 'Inline code', icon: Code, active: editor.isActive('code'), run: () => editor.chain().focus().toggleCode().run() },
        { key: 'codeblock', title: 'Code block', icon: SquareCode, active: editor.isActive('codeBlock'), run: () => editor.chain().focus().toggleCodeBlock().run() },
      ]
    : [];

  return (
    <div className="relative px-4 pb-4 pt-1">
      {mentionMatches.length > 0 && (
        <div className="absolute bottom-full left-4 z-20 mb-2 w-64 animate-scale-in overflow-hidden rounded-xl border border-border/60 bg-popover p-1 shadow-lg">
          <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            People
          </p>
          {mentionMatches.map((m, i) => (
            <button
              key={m.userId}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyMention(m)}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
                i === mentionIndex ? 'bg-muted' : 'hover:bg-muted',
              )}
            >
              <UserAvatar user={m.profile} id={m.userId} className="h-6 w-6" />
              <span className="truncate font-medium">{m.profile?.fullName}</span>
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border/60 bg-card shadow-sm transition-colors focus-within:border-primary/60 focus-within:shadow-glow-sm">
        {/* Formatting toolbar — toggled by the "Aa" button below. */}
        {showFormatting && editor && (
          <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 px-2 py-1">
            {/* bold / italic / strike */}
            {actions.slice(0, 3).map(({ key, ...a }) => (
              <ToolbarButton key={key} {...a} />
            ))}
            <span className="mx-1 h-4 w-px bg-border/60" />
            {/* link (opens a small URL popover) */}
            <Popover open={linkOpen} onOpenChange={(o) => (o ? openLinkPopover() : setLinkOpen(false))}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  title="Link"
                  aria-label="Link"
                  onMouseDown={(e) => e.preventDefault()}
                  className={cn(
                    'grid h-7 w-7 place-items-center rounded-md transition-colors',
                    editor.isActive('link')
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Link2 className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-2 shadow-lg" align="start">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    applyLink();
                  }}
                  className="flex items-center gap-2"
                >
                  {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
                  <input
                    autoFocus
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="h-8 w-full rounded-md border border-border/60 bg-background px-2 text-sm outline-none focus:border-primary/60"
                  />
                  <button
                    type="submit"
                    className="h-8 shrink-0 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {linkUrl.trim() ? 'Apply' : 'Remove'}
                  </button>
                </form>
              </PopoverContent>
            </Popover>
            <span className="mx-1 h-4 w-px bg-border/60" />
            {/* ol / ul / quote */}
            {actions.slice(3, 6).map(({ key, ...a }) => (
              <ToolbarButton key={key} {...a} />
            ))}
            <span className="mx-1 h-4 w-px bg-border/60" />
            {/* code / code block */}
            {actions.slice(6).map(({ key, ...a }) => (
              <ToolbarButton key={key} {...a} />
            ))}
          </div>
        )}

        {pending.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-border/60 p-2">
            {pending.map((p) => (
              <div
                key={p.id}
                className="group relative h-[72px] w-[72px] overflow-hidden rounded-lg border border-border/60 bg-muted/50 shadow-xs"
                title={p.name}
              >
                {p.isImage && p.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.previewUrl}
                    alt={p.name}
                    className={cn(
                      'h-full w-full object-cover transition-[filter,transform] duration-300',
                      p.status === 'uploading'
                        ? 'scale-105 blur-[3px] brightness-75'
                        : 'blur-0 brightness-100',
                    )}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-center">
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                    <span className="line-clamp-1 text-[9px] text-muted-foreground">{p.name}</span>
                  </div>
                )}

                {p.status === 'uploading' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span className="text-[10px] font-medium text-white">Uploading</span>
                  </div>
                )}
                {p.status === 'error' && (
                  <div className="absolute inset-0 grid place-items-center bg-destructive/30 text-[10px] font-semibold text-white">
                    Failed
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => removePending(p.id)}
                  className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                  title="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <EditorContent editor={editor} className="tiptap-composer" />

        <div className="flex items-center justify-between gap-2 px-2 pb-2">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              title="Attach a file"
            >
              <PlusCircle className="h-[18px] w-[18px]" />
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              hidden
              onChange={(e) => onFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => setShowFormatting((v) => !v)}
              aria-pressed={showFormatting}
              className={cn(
                'grid h-8 w-8 place-items-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                showFormatting
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              title={showFormatting ? 'Hide formatting' : 'Show formatting'}
            >
              <CaseSensitive className="h-[18px] w-[18px]" />
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  title="Emoji"
                >
                  <Smile className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 shadow-lg" align="start">
                <div className="grid grid-cols-4 gap-1">
                  {REACTION_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => insertEmoji(e)}
                      className="grid h-9 w-9 place-items-center rounded-lg text-lg transition-colors hover:bg-muted"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            className={cn(
              'grid h-8 w-8 place-items-center rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
              canSend
                ? 'bg-primary text-primary-foreground shadow-glow-sm hover:bg-primary/90'
                : 'bg-muted text-muted-foreground',
            )}
            title="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  title,
  icon: Icon,
  active,
  run,
}: {
  title: string;
  icon: typeof Bold;
  active: boolean;
  run: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={run}
      className={cn(
        'grid h-7 w-7 place-items-center rounded-md transition-colors',
        active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
