'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

type Tone = 'rose' | 'amber' | 'sky' | 'violet' | 'emerald';
type Card = { id: string; label: string; tone: Tone };
type ChatMsg = { id: string; name: string; initials: string; tone: Tone; text: string; time: string };

type View = 'board' | 'chat';

const COLUMNS: { title: string; cards: Card[] }[] = [
  {
    title: 'To do',
    cards: [
      { id: 'a', label: 'Draft launch post', tone: 'rose' },
      { id: 'b', label: 'Audit onboarding', tone: 'amber' },
    ],
  },
  {
    title: 'Doing',
    cards: [
      { id: 'c', label: 'Polish drag handles', tone: 'violet' },
      { id: 'd', label: 'Wire activity feed', tone: 'sky' },
    ],
  },
  {
    title: 'Done',
    cards: [{ id: 'e', label: 'Ship dark mode', tone: 'emerald' }],
  },
];

const TONE: Record<Tone, string> = {
  rose: 'from-rose-300/90 to-rose-400/90',
  amber: 'from-amber-300/90 to-amber-400/90',
  sky: 'from-sky-300/90 to-sky-400/90',
  violet: 'from-violet-300/90 to-violet-400/90',
  emerald: 'from-emerald-300/90 to-emerald-400/90',
};

const CHAT: ChatMsg[] = [
  {
    id: 'm1',
    name: 'Maya',
    initials: 'MP',
    tone: 'violet',
    text: 'Pushed the dark mode build 🌙 looks 🔥',
    time: '9:41',
  },
  {
    id: 'm2',
    name: 'Dev',
    initials: 'DR',
    tone: 'sky',
    text: 'Drag handles feel buttery now',
    time: '9:42',
  },
  {
    id: 'm3',
    name: 'Sam',
    initials: 'SK',
    tone: 'emerald',
    text: 'Launch post draft is in To-do for review ✦',
    time: '9:43',
  },
];

export function AuthHero() {
  return (
    <div className="brand-gradient relative hidden overflow-hidden p-10 text-primary-foreground md:flex md:flex-col md:justify-between lg:p-14">
      <FloatingOrbs />
      <GridShimmer />

      <Link
        href="/"
        className="group relative z-10 flex items-center gap-2.5 text-lg font-bold tracking-tight"
      >
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/20 text-base font-bold shadow-sm ring-1 ring-white/25 backdrop-blur-sm transition-transform group-hover:scale-105">
          I
        </div>
        IndiHive
      </Link>

      <div className="relative z-10 my-auto flex justify-center py-6">
        <Showcase />
      </div>

      <blockquote className="relative z-10 max-w-xl space-y-3">
        <p className="text-2xl font-medium leading-snug tracking-tight lg:text-3xl">
          “IndiHive is the calmest kanban I&apos;ve used in years.”
        </p>
        <footer className="flex items-center gap-2.5 text-sm opacity-80">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-xs font-semibold ring-1 ring-white/25">
            BT
          </span>
          happy beta tester
        </footer>
      </blockquote>
    </div>
  );
}

function Showcase() {
  const reduce = useReducedMotion();
  const [view, setView] = useState<View>('board');

  useEffect(() => {
    // Auto-advance one feature at a time; resets whenever the view changes
    // (including manual taps), so a tab stays put for a full beat.
    const id = setTimeout(() => {
      setView((v) => (v === 'board' ? 'chat' : 'board'));
    }, 5200);
    return () => clearTimeout(id);
  }, [view]);

  const shift = reduce ? 0 : 10;

  return (
    <div className="w-full max-w-2xl">
      <div className="relative flex min-h-[360px] items-start justify-center lg:min-h-[420px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            style={{ willChange: 'transform' }}
            initial={{ opacity: 0, y: shift }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -shift }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="flex w-full justify-center"
          >
            {view === 'board' ? <KanbanPreview /> : <ChatPreview reduce={!!reduce} />}
          </motion.div>
        </AnimatePresence>
      </div>
      <ShowcaseTabs view={view} onSelect={setView} />
    </div>
  );
}

function ShowcaseTabs({ view, onSelect }: { view: View; onSelect: (v: View) => void }) {
  const tabs: { id: View; label: string }[] = [
    { id: 'board', label: 'Boards' },
    { id: 'chat', label: 'Chat' },
  ];
  return (
    <div className="mt-5 flex items-center justify-center gap-1.5 rounded-full bg-white/10 p-1 ring-1 ring-white/15 mx-auto w-fit">
      {tabs.map((tab) => {
        const active = tab.id === view;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            aria-pressed={active}
            className="relative rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-colors"
          >
            {active && (
              <motion.span
                layoutId="showcase-tab"
                className="absolute inset-0 rounded-full bg-white/25 ring-1 ring-white/30"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className={`relative ${active ? 'opacity-100' : 'opacity-70'}`}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ChatPreview({ reduce }: { reduce: boolean }) {
  return (
    <motion.div
      style={{ willChange: 'transform' }}
      animate={reduce ? undefined : { y: [0, -6, 0] }}
      transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      className="flex w-full max-w-md flex-col rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 lg:p-5"
    >
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <span className="opacity-60">#</span>
          <span>launch-team</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] opacity-80">
          <motion.span
            style={{ willChange: 'opacity' }}
            animate={reduce ? undefined : { opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400/60"
          />
          5 online
        </div>
      </div>

      <div className="flex-1 space-y-3.5">
        {CHAT.map((msg, idx) => (
          <ChatBubble key={msg.id} msg={msg} delay={0.15 + idx * 0.18} />
        ))}
        <TypingRow reduce={reduce} />
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 ring-1 ring-white/15">
        <span className="flex-1 truncate text-xs text-white/55">Message #launch-team…</span>
        <span className="grid h-6 w-6 place-items-center rounded-full bg-white/25 ring-1 ring-white/30">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white">
            <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l11 2-11 2z" />
          </svg>
        </span>
      </div>
    </motion.div>
  );
}

function ChatBubble({ msg, delay }: { msg: ChatMsg; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex items-start gap-2.5"
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br ${TONE[msg.tone]} text-[11px] font-bold text-slate-900 shadow-sm`}
      >
        {msg.initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold">{msg.name}</span>
          <span className="text-[10px] opacity-60">{msg.time}</span>
        </div>
        <div className="mt-1 inline-block rounded-2xl rounded-tl-sm bg-white/12 px-3 py-1.5 text-[13px] leading-snug ring-1 ring-white/10">
          {msg.text}
        </div>
      </div>
    </motion.div>
  );
}

function TypingRow({ reduce }: { reduce: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.7 }}
      className="flex items-center gap-2.5"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-300/90 to-amber-400/90 text-[11px] font-bold text-slate-900 shadow-sm">
        AR
      </span>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white/12 px-3 py-2.5 ring-1 ring-white/10">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            style={{ willChange: 'transform' }}
            className="h-1.5 w-1.5 rounded-full bg-white/70"
            animate={reduce ? undefined : { opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.18 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function FloatingOrbs() {
  const reduce = useReducedMotion();
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        style={{ willChange: 'transform' }}
        className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/20 blur-3xl"
        animate={reduce ? undefined : { x: [0, 60, -20, 0], y: [0, 40, 80, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{ willChange: 'transform' }}
        className="absolute -bottom-32 -right-20 h-[28rem] w-[28rem] rounded-full bg-fuchsia-400/25 blur-3xl"
        animate={reduce ? undefined : { x: [0, -50, 30, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function GridShimmer() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.07]"
      style={{
        backgroundImage:
          'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
      }}
    />
  );
}

function KanbanPreview() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="grid w-full max-w-2xl grid-cols-3 gap-4 lg:gap-5"
    >
      {COLUMNS.map((col, colIdx) => (
        <motion.div
          key={col.title}
          style={{ willChange: 'transform' }}
          animate={reduce ? undefined : { y: [0, -6, 0] }}
          transition={{
            duration: 5 + colIdx * 0.4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: colIdx * 0.5,
          }}
          className="flex min-h-[340px] flex-col rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 lg:min-h-[400px] lg:p-5"
        >
          <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wider opacity-90">
            <span>{col.title}</span>
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white/15 px-1.5 text-[11px]">
              {col.cards.length}
            </span>
          </div>
          <div className="space-y-3">
            {col.cards.map((card, cardIdx) => (
              <MiniCard
                key={card.id}
                card={card}
                delay={colIdx * 0.5 + cardIdx * 0.3}
                reduce={!!reduce}
              />
            ))}
            {colIdx === 0 && <GhostCard reduce={!!reduce} />}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function MiniCard({ card, delay, reduce }: { card: Card; delay: number; reduce: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 + delay * 0.08 }}
      className={`rounded-xl bg-gradient-to-br ${TONE[card.tone]} p-3.5 text-sm font-medium text-slate-900 shadow-sm lg:p-4`}
    >
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-slate-900/40" />
        <span className="truncate">{card.label}</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-900/15">
          <motion.div
            style={{ willChange: 'transform', transformOrigin: 'left', width: '100%' }}
            className="h-full bg-slate-900/40"
            animate={reduce ? { scaleX: 0.5 } : { scaleX: [0.2, 0.85, 0.2] }}
            transition={{ duration: 6, repeat: Infinity, delay, ease: 'easeInOut' }}
          />
        </div>
        <div className="flex -space-x-1">
          <div className="h-3.5 w-3.5 rounded-full bg-slate-900/30 ring-2 ring-white/40" />
          <div className="h-3.5 w-3.5 rounded-full bg-slate-900/20 ring-2 ring-white/40" />
        </div>
      </div>
    </motion.div>
  );
}

function GhostCard({ reduce }: { reduce: boolean }) {
  return (
    <motion.div
      animate={reduce ? undefined : { opacity: [0.45, 0.85, 0.45] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      className="flex h-11 items-center justify-center rounded-xl border border-dashed border-white/30 text-sm font-medium text-white/70"
    >
      + Add a card
    </motion.div>
  );
}
