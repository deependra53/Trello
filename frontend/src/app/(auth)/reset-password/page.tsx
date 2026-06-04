'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthField } from '@/components/shared/auth-field';
import { api } from '@/lib/api';

const schema = z.object({ password: z.string().min(8, 'At least 8 characters') });
type FormData = z.infer<typeof schema>;

function ResetPasswordInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get('token') ?? '';
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormData) {
    if (!token) {
      toast.error('Missing token. Open the link from your email.');
      return;
    }
    try {
      await api('/api/auth/reset-password', {
        method: 'POST',
        body: { token, password: values.password },
      });
      toast.success('Password updated — please sign in.');
      router.push('/login');
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="animate-fade-up space-y-8">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          New password
        </span>
        <h1 className="mt-5 text-3xl font-bold leading-[1.05] tracking-tight [overflow-wrap:anywhere] sm:text-4xl md:text-5xl">
          Set a new <span className="brand-text">password</span>.
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Choose a strong password to secure your account.
        </p>
      </div>

      <div className="space-y-5">
        <AuthField
          id="password"
          label="New password"
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
          {isSubmitting ? 'Saving…' : 'Save password'}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="rounded font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}
