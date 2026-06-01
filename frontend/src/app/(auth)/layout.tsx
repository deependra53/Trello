import { AuthHero } from '@/components/shared/auth-hero';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <AuthHero />
      <main className="flex flex-col items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-[420px]">{children}</div>
      </main>
    </div>
  );
}
