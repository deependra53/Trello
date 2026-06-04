'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowRight, Building2, Loader2, Lock, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthField } from '@/components/shared/auth-field';
import { useAuthStore } from '@/stores/auth';
import { api, ApiError } from '@/lib/api';
import { safeRedirect } from '@/lib/redirect';
import { useAutoJoinBoardIfAuthed, useBoardInvitePreview } from '@/hooks/use-board-invites';

const schema = z.object({
  fullName: z.string().min(1, 'Full name required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
  organizationName: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface InviteInfo {
  valid: boolean;
  organizationName?: string;
  email?: string;
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="skeleton h-8 w-40" />}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const inviteToken = params.get('invite') ?? undefined;
  const boardInvite = params.get('boardInvite') ?? undefined;
  const next = safeRedirect(params.get('next'));
  const signup = useAuthStore((s) => s.signup);
  const [invite, setInvite] = useState<InviteInfo | null>(null);

  // Board invite: a logged-in visitor is joined automatically; otherwise we theme
  // the form as "Join {board}" and prefill the invited email.
  const joiningBoard = useAutoJoinBoardIfAuthed(boardInvite);
  const boardPreview = useBoardInvitePreview(boardInvite);
  const isBoardInvite = !!boardInvite;
  const isInvite = !!inviteToken || isBoardInvite;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Resolve a workspace invite to show which org they're joining (+ prefill email).
  useEffect(() => {
    if (!inviteToken) return;
    api<InviteInfo>(`/api/auth/invite/${inviteToken}`)
      .then((info) => {
        setInvite(info);
        if (info.email) setValue('email', info.email);
      })
      .catch(() => setInvite({ valid: false }));
  }, [inviteToken, setValue]);

  // Prefill the email a board invite was addressed to.
  useEffect(() => {
    const email = boardPreview.data?.email;
    if (email) setValue('email', email);
  }, [boardPreview.data?.email, setValue]);

  async function onSubmit(values: FormData) {
    if (!isInvite && !values.organizationName?.trim()) {
      toast.error('Please name your organization');
      return;
    }
    try {
      await signup({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        organizationName: isInvite ? undefined : values.organizationName,
        inviteToken,
        boardInviteToken: boardInvite,
      });
      if (isBoardInvite) {
        toast.success('Welcome aboard!');
        router.push(boardPreview.data?.boardId ? `/boards/${boardPreview.data.boardId}` : '/boards');
      } else {
        toast.success(inviteToken ? 'Welcome aboard!' : 'Organization created — welcome!');
        router.push(next);
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Something went wrong';
      toast.error(msg);
    }
  }

  // Logged-in visitor with a board invite: just show a brief joining state.
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

  // Invite link that no longer resolves — don't make them fill the form to fail.
  if (isBoardInvite && (boardPreview.isError || boardPreview.data?.valid === false)) {
    return (
      <div className="animate-fade-up space-y-3 text-center">
        <h1 className="text-2xl font-bold tracking-tight">This invite link isn’t valid</h1>
        <p className="text-sm text-muted-foreground">
          It may have expired or been turned off. Ask a board admin for a fresh link.
        </p>
        <Link
          href="/signup"
          className="inline-block rounded font-semibold text-primary hover:underline"
        >
          Create an account instead
        </Link>
      </div>
    );
  }

  const headline = isBoardInvite ? (
    <>
      Join <span className="brand-text">{boardPreview.data?.boardTitle ?? 'the board'}</span>.
    </>
  ) : invite?.organizationName ? (
    <>
      Join <span className="brand-text">{invite.organizationName}</span>.
    </>
  ) : (
    <>
      Create your <span className="brand-text">organization</span>.
    </>
  );

  const subtitle = isBoardInvite
    ? boardPreview.data?.invitedBy
      ? `${boardPreview.data.invitedBy} invited you to collaborate. Create an account to join.`
      : 'Create an account to join this board.'
    : inviteToken
      ? 'Set up your account to start collaborating.'
      : 'Spin up your workspace and invite your team in under a minute.';

  return (
    <div className="animate-fade-up space-y-8">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          {isInvite ? 'You’re invited' : 'Get started'}
        </span>
        <h1 className="mt-5 text-3xl font-bold leading-[1.05] tracking-tight [overflow-wrap:anywhere] sm:text-4xl md:text-5xl">
          {headline}
        </h1>
        <p className="mt-3 text-base text-muted-foreground">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <AuthField
          id="fullName"
          label="Full name"
          icon={<User className="h-4 w-4" />}
          autoComplete="name"
          placeholder="Ada Lovelace"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        {!isInvite && (
          <AuthField
            id="organizationName"
            label="Organization name"
            icon={<Building2 className="h-4 w-4" />}
            placeholder="Acme Inc."
            error={errors.organizationName?.message}
            {...register('organizationName')}
          />
        )}
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="group brand-gradient h-12 w-full rounded-xl text-base font-semibold text-primary-foreground shadow-glow transition-all duration-150 hover:shadow-glow-sm hover:brightness-110"
        >
          {isSubmitting
            ? 'Creating account…'
            : isBoardInvite
              ? 'Join board'
              : inviteToken
                ? 'Join organization'
                : 'Create account'}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href={
            isBoardInvite
              ? `/login?boardInvite=${encodeURIComponent(boardInvite)}`
              : next === '/boards'
                ? '/login'
                : `/login?next=${encodeURIComponent(next)}`
          }
          className="rounded font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
