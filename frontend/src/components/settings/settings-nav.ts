import {
  Bell,
  Blocks,
  Building2,
  CreditCard,
  Palette,
  Shield,
  SlidersHorizontal,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type SettingsSectionId =
  | 'profile'
  | 'appearance'
  | 'notifications'
  | 'workspace'
  | 'members'
  | 'security'
  | 'integrations'
  | 'billing'
  | 'advanced';

export interface SettingsNavItem {
  id: SettingsSectionId;
  label: string;
  icon: LucideIcon;
  /** Section only renders when the user has at least one workspace. */
  requiresWorkspace?: boolean;
}

export const SETTINGS_NAV: SettingsNavItem[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'workspace', label: 'Workspace', icon: Building2, requiresWorkspace: true },
  { id: 'members', label: 'Members', icon: Users, requiresWorkspace: true },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'integrations', label: 'Integrations', icon: Blocks },
  { id: 'billing', label: 'Billing', icon: CreditCard, requiresWorkspace: true },
  { id: 'advanced', label: 'Advanced', icon: SlidersHorizontal, requiresWorkspace: true },
];
