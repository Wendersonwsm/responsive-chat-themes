import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Loader2, Sparkles } from 'lucide-react';
import { useCreateInvestment } from '@/hooks/useInvestments';
import { FREQ_LABEL, INVESTMENT_TYPES, projectedProfit, YieldFrequency } from '@/lib/investments';
import { fmtMoney } from '@/lib/format';
import { toast } from 'sonner';

export default function NovoInvestimentoPage() {
  const navigate = useNavigate();
  const create = useCreateInvestment();
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('CDB');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [rate, setRate] = useState('');
  const [freq, setFreq] = useState<YieldFrequency>('monthly');
  const [notes, setNotes] = useState('');

  const amountN = Number(amount) || 0;
  const rateN = Number(rate) || 0;
  const previewInput = { amount_invested: amountN, yield_rate: rateN, yield_frequency: freq };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || amountN <= 0) {
      toast.error('Preencha nome e valor');
      return;
    }
    try {
      await create.mutateAsync({
        name: name.trim(), type, amount_invested: amountN,
        start_date: startDate, yield_rate: rateN, yield_frequency: freq,
        notes: notes.trim() || null,
      });
      navigate('/investimentos');
    } catch {}
  };

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-2xl mx-auto space-y-4 pb-24">
      <div className="flex items-center gap-2">
        <Link to="/investimentos" className="size-9 rounded-full bg-muted grid place-items-center tap-scale"><ChevronLeft className="size-5" /></Link>
        <h1 className="text-xl md:text-2xl font-bold">Novo investimento</h1>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Card className="p-4 space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="h-11 text-base" required placeholder="Ex: Tesouro Selic 2029" />
          </div>
          <div>
            <Label>Tipo</Label>
            <div className="grid grid-cols-3 gap-1.5 mt-1.5">
              {INVESTMENT_TYPES.map(t => (
                <button type="button" key={t} onClick={() => setType(t)}
                  className={`text-xs px-2 py-2 rounded-xl border transition active:scale-95 ${type === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-transparent'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor investido</Label>
              <Input type="number" inputMode="decimal" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="h-11 text-base" required placeholder="0,00" />
            </div>
            <div>
              <Label>Data de início</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-11 text-base" required />
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h2 className="font-semibold text-sm">Rendimento</h2>
          <div>
            <Label>Taxa (%)</Label>
            <Input type="number" inputMode="decimal" step="0.01" value={rate} onChange={e => setRate(e.target.value)} className="h-11 text-base" placeholder="Ex: 1.05" />
          </div>
          <div>
            <Label>Frequência</Label>
            <div className="grid grid-cols-4 gap-1.5 mt-1.5">
              {(Object.keys(FREQ_LABEL) as YieldFrequency[]).map(f => (
                <button type="button" key={f} onClick={() => setFreq(f)}
                  className={`text-xs px-2 py-2 rounded-xl border transition active:scale-95 ${freq === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-transparent'}`}>{FREQ_LABEL[f]}</button>
              ))}
            </div>
          </div>
          <div>
            <Label>Observações (opcional)</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} className="h-11 text-base" placeholder="Anotações..." />
          </div>
        </Card>

        {/* Live preview */}
        <Card className="p-4 bg-gradient-hero text-primary-foreground border-0 shadow-elevated">
          <p className="text-sm opacity-90 flex items-center gap-1.5"><Sparkles className="size-4" /> Projeção de lucro</p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[1, 6, 12].map(m => (
              <div key={m} className="rounded-xl bg-white/10 p-2.5 text-center">
                <p className="text-[10px] opacity-80">{m} {m === 1 ? 'mês' : 'meses'}</p>
                <p className="font-semibold text-sm mt-0.5 tabular-nums">{fmtMoney(projectedProfit(previewInput, m))}</p>
              </div>
            ))}
          </div>
        </Card>

        <Button type="submit" disabled={create.isPending} className="w-full h-12 text-base font-semibold">
          {create.isPending ? (<><Loader2 className="size-4 mr-2 animate-spin" />Salvando...</>) : 'Criar investimento'}
        </Button>
      </form>
    </div>
  );
}
