'use client';
import { useRef, useState, type ChangeEvent } from 'react';
import { BadgeCheck, Camera, Loader2, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth';
import { useUpdateProfile, useUploadAvatar } from '@/hooks/use-profile';
import { getInitials } from '@/lib/utils';
import { SectionCard, Field } from './ui';

export function ProfileSection() {
  const user = useAuthStore((s) => s.user);
  const update = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(user?.fullName ?? '');

  const trimmed = fullName.trim();
  const dirty = trimmed.length > 0 && trimmed !== user?.fullName;

  async function save() {
    if (!dirty) return;
    try {
      await update.mutateAsync({ fullName: trimmed });
      toast.success('Profile updated');
    } catch {
      toast.error('Could not update profile');
    }
  }

  async function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    try {
      await uploadAvatar.mutateAsync(file);
      toast.success('Avatar updated');
    } catch {
      toast.error('Could not upload avatar');
    }
  }

  return (
    <SectionCard
      id="profile"
      icon={UserIcon}
      title="Profile"
      description="Update your personal information and profile details."
      action={
        <Button size="sm" onClick={save} disabled={!dirty || update.isPending}>
          {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      }
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="relative w-fit">
          <Avatar className="h-20 w-20 ring-2 ring-primary/15">
            {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.fullName} />}
            <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
              {getInitials(user?.fullName)}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploadAvatar.isPending}
            aria-label="Change avatar"
            className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105 disabled:opacity-60"
          >
            {uploadAvatar.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickFile}
          />
        </div>

        <div className="flex-1 space-y-4">
          <Field label="Full name" htmlFor="profile-name">
            <Input
              id="profile-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={120}
              placeholder="Your name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') save();
              }}
            />
          </Field>
          <Field
            label="Email address"
            htmlFor="profile-email"
            hint={
              user?.emailVerified ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified
                </span>
              ) : (
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  Unverified
                </span>
              )
            }
          >
            <Input
              id="profile-email"
              value={user?.email ?? ''}
              readOnly
              disabled
              className="cursor-not-allowed"
            />
          </Field>
        </div>
      </div>
    </SectionCard>
  );
}
