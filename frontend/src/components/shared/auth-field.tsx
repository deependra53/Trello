'use client';
import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AuthFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: React.ReactNode;
  error?: string;
  rightSlot?: React.ReactNode;
};

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { label, icon, error, rightSlot, id, ...props },
  ref,
) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {label}
        </Label>
        {rightSlot}
      </div>
      <div className="group relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
          {icon}
        </span>
        <Input
          id={id}
          ref={ref}
          className="h-12 rounded-xl border-border/60 bg-card pl-10 text-[15px] shadow-sm transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0"
          {...props}
        />
      </div>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
});
