import {
  Home, Users, FileText, MessageSquare, Wallet, Shield,
  Settings, TrendingUp, Handshake, Gamepad2, BarChart3,
  Calendar, Bell, Layers, Cog, QrCode, PieChart, CreditCard,
  Database, ShieldCheck, UserCheck, UserPlus, Lock,
  LucideIcon,
} from 'lucide-react';

export const ICON_MAP = {
  Home, Users, FileText, MessageSquare, Wallet, Shield,
  Settings, TrendingUp, Handshake, Gamepad2, BarChart3,
  Calendar, Bell, Layers, Cog, QrCode, PieChart, CreditCard,
  Database, ShieldCheck, UserCheck, UserPlus, Lock,
} as const;

export type IconName = keyof typeof ICON_MAP;

export function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name as IconName] ?? FileText;
}

export const ICON_NAMES = Object.keys(ICON_MAP) as IconName[];