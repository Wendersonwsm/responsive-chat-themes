## Visão geral

Quatro frentes de melhoria, todas mantendo o estilo fintech atual (gradient hero, glass, hover-lift) e responsivas mobile-first.

---

## 1. Indicador de progresso ao criar parcelas

Em `src/pages/ContasPage.tsx`, ao salvar uma conta parcelada (N parcelas), substituir o toast simples por um **modal de progresso** elegante:

- Componente novo `src/components/InstallmentProgressDialog.tsx` (baseado em `Dialog`).
- Mostra: contador "X de N parcelas criadas", quantidade restante, barra `Progress` animada, percentual.
- Card com ícone pulsante enquanto processa.
- Cria as parcelas em loop sequencial (uma inserção por vez) para que o progresso seja real, atualizando estado a cada `await`.
- Ao terminar: troca para estado de sucesso com ícone `CheckCircle2` animado (`animate-scale-in`), mensagem "N parcelas criadas com sucesso" e auto-fecha em ~1.5s.
- Em caso de erro no meio: mostra quantas foram criadas e botão "Tentar novamente" para as restantes.

---

## 2. Dashboard com gráficos interativos

Reformular `src/pages/Dashboard.tsx` mantendo o hero/saldo, ações rápidas e adicionando uma **seção "Análises"**:

- Usar **Recharts** (instalar `recharts`).
- Novo componente `src/components/dashboard/ChartsSection.tsx` com abas/chips para alternar entre gráficos.
- Componente `src/components/dashboard/ChartPicker.tsx` (sheet/popover) para o usuário escolher quais gráficos mostrar; seleção persistida em `localStorage` (`finwise-charts`).
- Gráficos disponíveis (cada um em seu próprio arquivo em `src/components/dashboard/charts/`):
  - **EntradasVsSaidasChart** — BarChart agrupado do mês atual.
  - **GastosPorCategoriaChart** — PieChart/donut com cores das categorias.
  - **EvolucaoSaldoChart** — LineChart com últimos 6 meses (consultando `useAllMonths` + agregando bills/incomes).
  - **DesempenhoMensalChart** — BarChart 6 meses (renda vs despesa).
  - **ReceitasVsDespesasChart** — ComposedChart (linha + barra).
  - **HistoricoFinanceiroChart** — AreaChart cumulativo.
- Habilitados por padrão: Entradas vs Saídas, Gastos por categoria, Evolução do saldo.
- Hook novo `src/hooks/useMonthlyAggregates.ts` para buscar e agregar dados dos últimos N meses (uma única query por tabela filtrando por `month_id IN (...)`).
- Animações: `animate-fade-in` escalonado, transições suaves nas séries (Recharts `isAnimationActive`).
- Layout responsivo: `ResponsiveContainer`, altura 240px mobile / 320px desktop, grid 1 coluna mobile / 2 colunas desktop.

---

## 3. Sistema de perfil destacado

- No `AppLayout` (header mobile e sidebar desktop), substituir o botão de iniciais simples por um **PerfilButton** mais visível:
  - Avatar circular com gradient + iniciais, ring sutil, badge de status verde (online/conta ativa).
  - Nome do usuário ao lado (oculto em telas muito pequenas).
  - Hover/tap effects: `hover-lift`, `tap-scale`, leve glow.
- Reformular `src/pages/AjustesPage.tsx` em `src/pages/PerfilPage.tsx` (rota `/perfil`, mantendo `/ajustes` como alias) com seções:
  - **Cabeçalho**: avatar grande gerado por iniciais (`bg-gradient-hero`), nome editável inline, e-mail, status da conta ("Conta verificada").
  - **Configurações rápidas**: tema (claro/escuro), ocultar valores, notificações — toggles em cards glass.
  - **Segurança**: alterar senha, sessões ativas (lista do Supabase), botão sair com confirmação.
  - **Sobre**: versão do app, política, suporte.
- Componente `src/components/Avatar.tsx` (wrapper do shadcn `Avatar`) gerando cor de fundo determinística pelo nome.

---

## 4. Área de Investimentos

Nova seção totalmente separada em `/investimentos`, com sub-rotas:

- `/investimentos` — dashboard de investimentos.
- `/investimentos/novo` — formulário de novo investimento.
- `/investimentos/:id` — detalhe com gráfico de evolução.

Adicionar item "Investir" no NAV (substituir/complementar — confirmar substituição de "Poupança" não; mantém ambos, "Poupança" continua e "Investir" entra como 6º item visível só no menu desktop e em sheet "Mais" no mobile, ou substitui "Histórico" no bottom nav). **Decisão**: manter os 5 itens atuais no bottom nav e adicionar acesso destacado via card no Dashboard + item no menu desktop.

### Banco de dados (migration)

Criar tabela `investments`:

| coluna | tipo |
|---|---|
| name | text |
| type | text (CDB, Tesouro, Ações, Cripto, Fundo, Outros) |
| amount_invested | numeric |
| start_date | date |
| yield_rate | numeric (percentual) |
| yield_frequency | text ('daily','weekly','monthly','yearly') |
| notes | text nullable |

RLS: `auth.uid() = user_id` (ALL).

Tabela `investment_transactions` (opcional para aportes/resgates futuros) — incluir já com mesmas RLS.

### Cálculos (cliente)

`src/lib/investments.ts`:
- `currentValue(inv, today)` usando juros compostos: `amount * (1 + rate/100)^periods`.
- `profit = currentValue - amount_invested`.
- `profitability = profit / amount_invested * 100`.
- Série temporal para gráfico (1 ponto por período até hoje).

### Telas

- **Dashboard de investimentos** (`InvestimentosPage.tsx`):
  - Hero card com total investido, lucro total (verde se positivo, destrutivo se negativo, com seta), rentabilidade %.
  - Cards individuais por investimento, mini-sparkline.
  - Gráfico de evolução do patrimônio (AreaChart somando todos).
  - Histórico (lista cronológica).
- **Novo investimento** (`NovoInvestimentoPage.tsx`): form com todos os campos, preview em tempo real do lucro estimado em 1/6/12 meses.
- **Detalhe** (`InvestimentoDetalhePage.tsx`): gráfico de crescimento, tabela de rendimentos acumulados, botão excluir.

---

## 5. Polimento visual global

- Garantir uso consistente de `glass`, `shadow-elevated`, `bg-gradient-hero` (já existem em `index.css`).
- Adicionar utilitários em `tailwind.config.ts` se faltar: `animate-pulse-soft`, `animate-slide-up`.
- Revisar `pb-bottom-nav` e safe-areas em todas as novas páginas.
- Ícones lucide minimalistas em todos os novos componentes.

---

## Detalhes técnicos

**Arquivos novos:**
- `src/components/InstallmentProgressDialog.tsx`
- `src/components/dashboard/ChartsSection.tsx`
- `src/components/dashboard/ChartPicker.tsx`
- `src/components/dashboard/charts/{EntradasVsSaidas,GastosPorCategoria,EvolucaoSaldo,DesempenhoMensal,ReceitasVsDespesas,HistoricoFinanceiro}Chart.tsx`
- `src/components/Avatar.tsx`
- `src/hooks/useMonthlyAggregates.ts`
- `src/hooks/useInvestments.ts`
- `src/lib/investments.ts`
- `src/pages/PerfilPage.tsx`
- `src/pages/investimentos/{InvestimentosPage,NovoInvestimentoPage,InvestimentoDetalhePage}.tsx`

**Arquivos editados:**
- `src/pages/ContasPage.tsx` (loop sequencial + dialog)
- `src/pages/Dashboard.tsx` (seção Análises + card de acesso a Investimentos)
- `src/components/AppLayout.tsx` (PerfilButton destacado, item Investir no sidebar)
- `src/App.tsx` (novas rotas)
- `tailwind.config.ts` / `src/index.css` (animações extras se necessário)

**Dependências:** `recharts`.

**Migration:** tabela `investments` (e opcional `investment_transactions`) com RLS por `user_id`.
