'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthField } from '@/components/shared/auth-field';
import { useAuthStore } from '@/stores/auth';
import { ApiError } from '@/lib/api';
import { safeRedirect } from '@/lib/redirect';
import {
  useAcceptBoardInvite,
  useAutoJoinBoardIfAuthed,
  useBoardInvitePreview,
} from '@/hooks/use-board-invites';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="skeleton h-8 w-40" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeRedirect(params.get('next'));
  const boardInvite = params.get('boardInvite') ?? undefined;
  const login = useAuthStore((s) => s.login);
  const acceptBoardInvite = useAcceptBoardInvite();
  const joiningBoard = useAutoJoinBoardIfAuthed(boardInvite);
  const boardPreview = useBoardInvitePreview(boardInvite);
  const isBoardInvite = !!boardInvite;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormData) {
    try {
      await login(values.email, values.password);
      if (boardInvite) {
        const res = await acceptBoardInvite.mutateAsync(boardInvite);
        toast.success(`Welcome to ${res.boardTitle}!`);
        router.push(`/boards/${res.boardId}`);
      } else {
        toast.success('Welcome back!');
        router.push(next);
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Something went wrong';
      toast.error(msg);
    }
  }

  // Already signed in and arrived via a board invite → joining automatically.
  if (joiningBoard) {
    return (
      <div className="animate-fade-up flex flex-col items-center gap-3 py-16 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Joining{boardPreview.data?.boardTitle ? ` ${boardPreview.data.boardTitle}` : ''}…
        </p>
      </div>
    );
  }

  // Invite link that no longer resolves.
  if (isBoardInvite && (boardPreview.isError || boardPreview.data?.valid === false)) {
    return (
      <div className="animate-fade-up space-y-3 text-center">
        <h1 className="text-2xl font-bold tracking-tight">This invite link isn’t valid</h1>
        <p className="text-sm text-muted-foreground">
          It may have expired or been turned off. Ask a board admin for a fresh link.
        </p>
        <Link href="/login" className="inline-block rounded font-semibold text-primary hover:underline">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-8">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          {isBoardInvite ? 'You’re invited' : 'Sign in'}
        </span>
        <h1 className="mt-5 text-3xl font-bold leading-[1.05] tracking-tight [overflow-wrap:anywhere] sm:text-4xl md:text-5xl">
          {isBoardInvite ? (
            <>
              Join <span className="brand-text">{boardPreview.data?.boardTitle ?? 'the board'}</span>.
            </>
          ) : (
            <>
              Welcome <span className="brand-text">back</span>.
            </>
          )}
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          {isBoardInvite
            ? 'Sign in to your account to join this board.'
            : 'Pick up right where you left off.'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <AuthField
          id="email"
          label="Email"
          icon={<Mail className="h-4 w-4" />}
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <AuthField
          id="password"
          label="Password"
          icon={<Lock className="h-4 w-4" />}
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          rightSlot={
            <Link
              href="/forgot-password"
              className="rounded text-xs font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0"
            >
              Forgot?
            </Link>
          }
          {...register('password')}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="group brand-gradient h-12 w-full rounded-xl text-base font-semibold text-primary-foreground shadow-glow transition-all duration-150 hover:shadow-glow-sm hover:brightness-110"
        >
          {isSubmitting ? 'Signing in…' : isBoardInvite ? 'Sign in & join' : 'Sign in'}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New to IndiHive?{' '}
        <Link
          href={
            isBoardInvite
              ? `/signup?boardInvite=${encodeURIComponent(boardInvite)}`
              : next === '/boards'
                ? '/signup'
                : `/signup?next=${encodeURIComponent(next)}`
          }
          className="rounded font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
