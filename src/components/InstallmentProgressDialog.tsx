import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Loader2, Layers, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type InstallmentStatus = 'idle' | 'running' | 'success' | 'error';

interface Props {
  open: boolean;
  status: InstallmentStatus;
  current: number;
  total: number;
  errorMessage?: string;
  onRetry?: () => void;
  onClose?: () => void;
}

export default function InstallmentProgressDialog({
  open, status, current, total, errorMessage, onRetry, onClose,
}: Props) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const remaining = Math.max(total - current, 0);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && status !== 'running') onClose?.(); }}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {status === 'success' ? (
              <><CheckCircle2 className="size-5 text-success" /> Tudo pronto!</>
            ) : status === 'error' ? (
              <><AlertCircle className="size-5 text-destructive" /> Algo deu errado</>
            ) : (
              <><Layers className="size-5 text-primary" /> Criando parcelas</>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Big visual indicator */}
          <div className="flex items-center justify-center py-2">
            {status === 'success' ? (
              <div className="size-20 rounded-full bg-success/10 grid place-items-center animate-scale-in">
                <CheckCircle2 className="size-10 text-success" strokeWidth={2.5} />
              </div>
            ) : status === 'error' ? (
              <div className="size-20 rounded-full bg-destructive/10 grid place-items-center animate-scale-in">
                <AlertCircle className="size-10 text-destructive" />
              </div>
            ) : (
              <div className="relative size-20 rounded-full bg-gradient-hero grid place-items-center text-primary-foreground shadow-elevated">
                <Loader2 className="size-9 animate-spin" />
                <span className="absolute -bottom-1 right-0 text-[10px] bg-card text-foreground px-1.5 py-0.5 rounded-full border border-border font-bold shadow-soft">
                  {pct}%
                </span>
              </div>
            )}
          </div>

          {/* Counters */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-muted p-2.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Criadas</p>
              <p className="font-bold text-lg text-success tabular-nums">{current}</p>
            </div>
            <div className="rounded-xl bg-muted p-2.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Restantes</p>
              <p className="font-bold text-lg text-primary tabular-nums">{remaining}</p>
            </div>
            <div className="rounded-xl bg-muted p-2.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
              <p className="font-bold text-lg tabular-nums">{total}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Progress value={pct} className="h-2.5" />
            <p className="text-xs text-muted-foreground text-center">
              {status === 'running' && `Processando ${current} de ${total} parcelas…`}
              {status === 'success' && `${total} parcela${total > 1 ? 's' : ''} criada${total > 1 ? 's' : ''} com sucesso 🎉`}
              {status === 'error' && (errorMessage || 'Não foi possível concluir a operação.')}
            </p>
          </div>

          {status === 'error' && (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Fechar</Button>
              {onRetry && <Button className="flex-1" onClick={onRetry}>Tentar novamente</Button>}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
