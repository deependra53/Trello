'use client';
import { useAuthStore } from '@/stores/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  return (
    <main className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <section className="mt-8 space-y-4 rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">{getInitials(user?.fullName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="space-y-1">
              <Label>Full name</Label>
              <Input value={user?.fullName ?? ''} readOnly />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={user?.email ?? ''} readOnly />
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Editing profile, avatar upload, and password change come in Phase 7.
        </p>
      </section>
    </main>
  );
}
