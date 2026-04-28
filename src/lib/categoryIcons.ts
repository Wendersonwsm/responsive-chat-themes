import {
  Home, UtensilsCrossed, Car, HeartPulse, Gamepad2, GraduationCap, PawPrint,
  Shirt, Sparkles, TrendingUp, CreditCard, Landmark, Tv, Gift, Briefcase,
  MoreHorizontal, Tag, type LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  Home, UtensilsCrossed, Car, HeartPulse, Gamepad2, GraduationCap, PawPrint,
  Shirt, Sparkles, TrendingUp, CreditCard, Landmark, Tv, Gift, Briefcase,
  MoreHorizontal, Tag,
};

export function getCategoryIcon(name?: string | null): LucideIcon {
  if (!name) return Tag;
  return ICON_MAP[name] || Tag;
}

export const ICON_OPTIONS = Object.keys(ICON_MAP);
