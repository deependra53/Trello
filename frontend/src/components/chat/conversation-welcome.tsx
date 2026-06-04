'use client';
import {
  Hash,
  LayoutGrid,
  Lightbulb,
  MessagesSquare,
  MoreHorizontal,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from './user-avatar';
import type { ChannelDetail } from '@/types/api';

type WelcomeMember = ChannelDetail['members'][number];

/**
 * The empty-state shown when a channel or DM has no messages yet. Built to match
 * the onboarding mock: an illustrated cluster (brand tile + floating teammate
 * avatars, emoji & sparkle chips), a welcome heading, and a row of cards. The
 * "start chatting" / "share ideas" cards focus the composer; channels also get
 * an informative card explaining the space (we don't surface "add members" here
 * since only the channel's creator/admins can add people). Decorations are
 * transform-only animations, so they stay GPU-cheap (see CLAUDE.md perf rules).
 */
export function ConversationWelcome({
  isDm,
  channelName,
  decorMembers,
  onSendMessage,
  onShareIdeas,
}: {
  isDm: boolean;
  channelName?: string;
  /** Up to two members whose avatars decorate the illustration. */
  decorMembers: WelcomeMember[];
  onSendMessage: () => void;
  onShareIdeas: () => void;
}) {
  const cards: Array<{
    icon: typeof MessagesSquare;
    iconWrap: string;
    title: string;
    desc: string;
    /** Cards with an onClick are interactive; without one they're informational. */
    onClick?: () => void;
  }> = [
    {
      icon: MessagesSquare,
      iconWrap: 'bg-primary/10 text-primary',
      title: 'Send a message',
      desc: 'Start the conversation and say hello 👋',
      onClick: onSendMessage,
    },
    // Channels get an informative card here. Adding members is restricted to the
    // creator/admins, so we don't dangle it as an action for everyone.
    ...(!isDm
      ? [
          {
            icon: Zap,
            iconWrap: 'bg-success/10 text-success',
            title: 'Stay in sync',
            desc: 'New messages show up instantly for the whole channel',
          },
        ]
      : []),
    {
      icon: LayoutGrid,
      iconWrap: 'bg-primary/10 text-primary',
      title: 'Turn messages into tasks',
      desc: 'Open any message’s ⋯ menu and pick “Add to board” to make it a card.',
    },
    {
      icon: Lightbulb,
      iconWrap: 'bg-warning/15 text-warning',
      title: 'Share ideas',
      desc: 'Collaborate and make great things happen',
      onClick: onShareIdeas,
    },
  ];

  return (
    <div className="animate-fade-up px-6 py-10 text-center">
      {/* Illustration cluster */}
      <div className="relative mx-auto mb-8 flex h-36 w-full max-w-[320px] items-center justify-center">
        {/* Soft brand halo behind the tile — a flat tint, no blur. */}
        <div aria-hidden className="absolute h-28 w-28 rounded-full bg-primary/10" />

        {/* Central brand tile */}
        <div className="relative z-10 grid h-[88px] w-[88px] animate-scale-in place-items-center rounded-2xl brand-gradient text-primary-foreground shadow-glow">
          {isDm ? <Users className="h-10 w-10" /> : <Hash className="h-10 w-10" />}
        </div>

        {/* Floating teammate avatars (real photos when available). The float
            animation lives on an inner node so its transform doesn't clobber the
            outer -translate-y-1/2 centering. Purely decorative → hidden from AT. */}
        <div aria-hidden className="absolute left-1 top-1/2 z-20 -translate-y-1/2">
          <div className="motion-safe:animate-float" style={{ animationDelay: '0.2s' }}>
            <DecorAvatar member={decorMembers[0]} />
          </div>
        </div>
        <div aria-hidden className="absolute right-1 top-1/2 z-20 -translate-y-1/2">
          <div className="motion-safe:animate-float" style={{ animationDelay: '0.9s' }}>
            <DecorAvatar member={decorMembers[1]} />
          </div>
        </div>

        {/* Waving-hand chip, top-left */}
        <div
          aria-hidden
          className="absolute left-10 top-0 z-20 grid h-9 w-9 place-items-center rounded-xl rounded-br-sm border border-border/60 bg-card text-base shadow-sm motion-safe:animate-float"
          style={{ animationDelay: '0s' }}
        >
          👋
        </div>
        {/* Chat-bubble chip, top-right */}
        <div
          aria-hidden
          className="absolute right-9 top-1 z-20 grid h-8 w-9 place-items-center rounded-xl rounded-bl-sm border border-border/60 bg-card text-muted-foreground shadow-sm motion-safe:animate-float"
          style={{ animationDelay: '0.6s' }}
        >
          <MoreHorizontal className="h-4 w-4" />
        </div>

        {/* Sparkles */}
        <Sparkles
          aria-hidden
          className="absolute bottom-3 left-7 h-4 w-4 text-primary/50 motion-safe:animate-float"
          style={{ animationDelay: '1.1s' }}
        />
        <Sparkles
          aria-hidden
          className="absolute bottom-2 right-11 h-3 w-3 text-warning/70 motion-safe:animate-float"
          style={{ animationDelay: '0.4s' }}
        />
      </div>

      {/* Heading + subtitle */}
      <h3 className="text-2xl font-bold tracking-tight">
        {isDm ? (
          <>This is the start of your conversation</>
        ) : (
          <>
            Welcome to <span className="brand-text">#{channelName}</span>
          </>
        )}
      </h3>
      <div className="mx-auto mt-2 max-w-md space-y-0.5">
        {isDm ? (
          <p className="text-sm text-muted-foreground">
            Say hello — this conversation is just between you two.
          </p>
        ) : (
          <>
            <p className="text-sm text-foreground/70">This is the beginning of the channel.</p>
            <p className="text-sm text-muted-foreground">
              Share updates, ask questions, and collaborate with your team.
            </p>
          </>
        )}
      </div>

      {/* Divider */}
      <div className="mx-auto my-6 h-px w-full max-w-md bg-border/60" />

      {/* Feature / quick-action cards */}
      <div
        className={cn(
          'mx-auto grid gap-3',
          cards.length >= 4
            ? 'max-w-4xl sm:grid-cols-2 lg:grid-cols-4' // channels: one compact row
            : cards.length === 3
              ? 'max-w-2xl sm:grid-cols-3' // DMs: a single row
              : 'max-w-md sm:grid-cols-2',
        )}
      >
        {cards.map((card) => {
          const inner = (
            <>
              <span className={cn('grid h-10 w-10 place-items-center rounded-xl', card.iconWrap)}>
                <card.icon aria-hidden className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-semibold tracking-tight">{card.title}</div>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{card.desc}</p>
              </div>
            </>
          );
          const base =
            'flex flex-col items-start gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-md';
          return card.onClick ? (
            <button
              key={card.title}
              type="button"
              onClick={card.onClick}
              className={cn(
                base,
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
              )}
            >
              {inner}
            </button>
          ) : (
            <div key={card.title} className={base}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** A floating avatar slot — a real teammate photo, or a soft brand placeholder. */
function DecorAvatar({ member }: { member?: WelcomeMember }) {
  if (member) {
    return (
      <UserAvatar
        user={member.profile}
        id={member.userId}
        className="h-11 w-11 shadow-md ring-2 ring-background"
      />
    );
  }
  return (
    <div
      aria-hidden
      className="h-11 w-11 rounded-lg brand-gradient opacity-60 shadow-md ring-2 ring-background"
    />
  );
}
