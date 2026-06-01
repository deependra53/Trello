'use client';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';

type Card = { id: string; label: string; tone: 'rose' | 'amber' | 'sky' | 'violet' | 'emerald' };

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

const TONE: Record<Card['tone'], string> = {
  rose: 'from-rose-300/90 to-rose-400/90',
  amber: 'from-amber-300/90 to-amber-400/90',
  sky: 'from-sky-300/90 to-sky-400/90',
  violet: 'from-violet-300/90 to-violet-400/90',
  emerald: 'from-emerald-300/90 to-emerald-400/90',
};

export function AuthHero() {
  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-indigo-600 to-blue-700 p-10 text-primary-foreground md:flex md:flex-col md:justify-between lg:p-14">
      <FloatingOrbs />
      <GridShimmer />

      <Link href="/" className="relative z-10 flex items-center gap-2 text-lg font-bold">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/20 backdrop-blur-sm">
          T
        </div>
        TrelloX
      </Link>

      <div className="relative z-10 my-auto flex justify-center py-6">
        <KanbanPreview />
      </div>

      <blockquote className="relative z-10 max-w-xl space-y-2">
        <p className="text-2xl font-medium leading-snug lg:text-3xl">
          “TrelloX is the calmest kanban I&apos;ve used in years.”
        </p>
        <footer className="text-sm opacity-80">— happy beta tester</footer>
      </blockquote>
    </div>
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
          className="flex min-h-[340px] flex-col rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-md lg:min-h-[400px] lg:p-5"
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
