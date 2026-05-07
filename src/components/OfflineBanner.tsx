import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      setJustReconnected(true);
      setTimeout(() => setJustReconnected(false), 2500);
    };
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (online && !justReconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-semibold shadow-elevated border backdrop-blur-md animate-fade-in flex items-center gap-2',
        online
          ? 'bg-success/15 text-success border-success/30'
          : 'bg-destructive/15 text-destructive border-destructive/30'
      )}
    >
      <span className={cn('size-2 rounded-full', online ? 'bg-success' : 'bg-destructive animate-pulse')} />
      {online ? (
        <span>Conexão restabelecida</span>
      ) : (
        <span className="flex items-center gap-1.5"><WifiOff className="size-3.5" /> Você está offline</span>
      )}
    </div>
  );
}
