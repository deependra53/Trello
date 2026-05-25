'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving…' : 'Save password'}
      </Button>
      <p className="text-center text-sm">
        <Link href="/login" className="text-muted-foreground hover:underline">
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
