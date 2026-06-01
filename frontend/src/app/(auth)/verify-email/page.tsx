'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
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
    <div className="space-y-5 text-center">
      {state === 'pending' && (
        <>
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <h1 className="text-4xl font-bold leading-tight tracking-tight">Verifying your email…</h1>
        </>
      )}
      {state === 'ok' && (
        <>
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
          <h1 className="text-4xl font-bold leading-tight tracking-tight">Email verified</h1>
          <p className="text-sm text-muted-foreground">You can now use all of TrelloX.</p>
          <Button asChild className="w-full">
            <Link href="/boards">Go to boards</Link>
          </Button>
        </>
      )}
      {state === 'error' && (
        <>
          <XCircle className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="text-4xl font-bold leading-tight tracking-tight">Verification failed</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button asChild variant="outline" className="w-full">
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
