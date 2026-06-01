'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthField } from '@/components/shared/auth-field';
import { useAuthStore } from '@/stores/auth';
import { ApiError } from '@/lib/api';

const schema = z.object({
  fullName: z.string().min(1, 'Full name required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});
type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const signup = useAuthStore((s) => s.signup);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormData) {
    try {
      await signup(values.email, values.password, values.fullName);
      toast.success('Account created — check your email to verify.');
      router.push('/boards');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Something went wrong';
      toast.error(msg);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          Get started
        </span>
        <h1 className="mt-5 text-5xl font-bold leading-[1.05] tracking-tight">
          Create your{' '}
          <span className="bg-gradient-to-r from-primary via-indigo-500 to-blue-600 bg-clip-text text-transparent">
            account
          </span>
          .
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Start planning in under a minute. No credit card required.
        </p>
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
          className="group h-12 w-full rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-base font-semibold shadow-glow transition-all hover:from-primary hover:to-indigo-500 hover:shadow-lg"
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-foreground hover:text-primary">
          Sign in
        </Link>
      </p>
    </div>
  );
}
