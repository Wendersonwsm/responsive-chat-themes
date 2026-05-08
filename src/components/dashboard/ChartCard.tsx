import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function ChartCard({ title, subtitle, icon, children, className, delay = 0 }: Props) {
  return (
    <Card className={cn('p-4 animate-fade-in hover-lift overflow-hidden', className)} style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {icon && <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center">{icon}</div>}
      </div>
      <div className="h-[220px] md:h-[260px] -mx-2">{children}</div>
    </Card>
  );
}
