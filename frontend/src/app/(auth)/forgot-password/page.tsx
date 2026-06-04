'use client';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowRight, Mail, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthField } from '@/components/shared/auth-field';
import { api } from '@/lib/api';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormData) {
    try {
      await api('/api/auth/forgot-password', { method: 'POST', body: values });
      toast.success('If that email is registered, a reset link is on its way.');
    } catch {
      toast.error('Something went wrong, please try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="animate-fade-up space-y-8">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          Account recovery
        </span>
        <h1 className="mt-5 text-3xl font-bold leading-[1.05] tracking-tight [overflow-wrap:anywhere] sm:text-4xl md:text-5xl">
          Reset your <span className="brand-text">password</span>.
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <div className="space-y-5">
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
        <Button
          type="submit"
          disabled={isSubmitting}
          className="group brand-gradient h-12 w-full rounded-xl text-base font-semibold text-primary-foreground shadow-glow transition-all duration-150 hover:shadow-glow-sm hover:brightness-110"
        >
          {isSubmitting ? 'Sending…' : 'Send reset link'}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
        {isSubmitSuccessful && (
          <div className="flex animate-scale-in items-start gap-3 rounded-xl border border-border/60 bg-card p-4 text-sm shadow-sm">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <MailCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="font-medium text-foreground">Check your inbox</p>
              <p className="text-xs text-muted-foreground">
                If that email is registered, a reset link is on its way. It expires in 1 hour.
              </p>
            </div>
          </div>
        )}
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
