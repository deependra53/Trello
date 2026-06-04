'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

function VerifyInner() {
  const sp = useSearchParams();
  const token = sp.get('token') ?? '';
  const [state, setState] = useState<'pending' | 'ok' | 'error'>('pending');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState('error');
      setError('Missing verification token.');
      return;
    }
    api('/api/auth/verify-email', { method: 'POST', body: { token } })
      .then(() => setState('ok'))
      .catch((e) => {
        setState('error');
        setError((e as Error).message);
      });
  }, [token]);

  return (
    <div className="animate-fade-up flex flex-col items-center space-y-5 text-center">
      {state === 'pending' && (
        <>
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Loader2 className="h-6 w-6 animate-spin" />
          </span>
          <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            Verifying your email…
          </h1>
          <p className="text-sm text-muted-foreground">This will only take a moment.</p>
        </>
      )}
      {state === 'ok' && (
        <>
          <span className="grid h-12 w-12 animate-scale-in place-items-center rounded-2xl bg-success/10 text-success">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            Email <span className="brand-text">verified</span>.
          </h1>
          <p className="text-sm text-muted-foreground">You can now use all of IndiHive.</p>
          <Button
            asChild
            className="group brand-gradient h-12 w-full rounded-xl text-base font-semibold text-primary-foreground shadow-glow transition-all duration-150 hover:shadow-glow-sm hover:brightness-110"
          >
            <Link href="/boards">
              Go to boards
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </>
      )}
      {state === 'error' && (
        <>
          <span className="grid h-12 w-12 animate-scale-in place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <XCircle className="h-6 w-6" />
          </span>
          <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            Verification failed
          </h1>
          <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{error}</p>
          <Button asChild variant="outline" className="h-12 w-full rounded-xl text-base font-semibold">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyInner />
    </Suspense>
  );
}
