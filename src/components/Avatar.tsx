import { cn } from '@/lib/utils';

const PALETTES = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
  'from-purple-500 to-fuchsia-600',
  'from-cyan-500 to-sky-600',
];

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h);
}

export function getInitials(name?: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/[\s@.]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface Props {
  name?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'verified' | null;
  className?: string;
}

const SIZE_MAP = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-base',
  xl: 'size-24 text-2xl',
};

export default function Avatar({ name, size = 'md', status, className }: Props) {
  const palette = PALETTES[hash(name || '?') % PALETTES.length];
  const initials = getInitials(name);
  return (
    <div className={cn('relative', className)}>
      <div className={cn(
        'rounded-full bg-gradient-to-br grid place-items-center font-bold text-white shadow-soft ring-2 ring-background',
        SIZE_MAP[size], palette,
      )}>
        {initials}
      </div>
      {status && (
        <span className={cn(
          'absolute bottom-0 right-0 rounded-full ring-2 ring-background',
          size === 'xl' ? 'size-5' : size === 'lg' ? 'size-3.5' : 'size-2.5',
          status === 'online' || status === 'verified' ? 'bg-success' : 'bg-muted-foreground',
        )} />
      )}
    </div>
  );
}
