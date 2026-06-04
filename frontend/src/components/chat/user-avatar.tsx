'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { avatarColor, initials } from '@/lib/chat-utils';
import type { UserProfile } from '@/types/api';

export function UserAvatar({
  user,
  id,
  name,
  avatarUrl,
  className,
}: {
  user?: UserProfile;
  id?: string;
  name?: string;
  avatarUrl?: string;
  className?: string;
}) {
  const uid = user?._id ?? id ?? '?';
  const uname = user?.fullName ?? name;
  const url = user?.avatarUrl ?? avatarUrl;
  return (
    <Avatar className={cn('h-9 w-9 rounded-lg ring-1 ring-border/60', className)}>
      {url && <AvatarImage src={url} alt={uname ?? ''} />}
      <AvatarFallback className={cn('rounded-lg text-xs font-semibold text-white', avatarColor(uid))}>
        {initials(uname)}
      </AvatarFallback>
    </Avatar>
  );
}
