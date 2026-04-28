
# Plano — FinWise (versão React, completa e responsiva)

Vamos reconstruir o FinWise como app React moderno dentro do Lovable, mantendo a identidade visual atual (tipografia Plus Jakarta Sans, cards arredondados, paleta atual) e o fluxo já validado no app original — porém **sem a área de Metas** e **sem o Tutorial/Onboarding**, com mais temas e foco total em mobile.

## O que entra no app

### Telas principais (bottom nav no mobile, sidebar no desktop)
1. **Dashboard** — saldo do mês, renda total, despesas totais, poupança acumulada, barra de progresso do mês, resumo por categoria.
2. **Contas / Despesas** — lista de contas do mês ativo, adicionar/editar/excluir, marcar como paga, filtro (atuais, atrasadas, pagas, todas), categorias e subcategorias com ícones.
3. **Renda** — renda principal do mês + rendas extras (lista editável).
4. **Poupança** — saldo total, adicionar/retirar, contribuição do mês, histórico.
5. **Histórico** — navegação por mês (anteriores e futuros), com o mesmo resumo.
6. **Ajustes** — tema, categorias personalizadas, exportar/importar, sair.

> Removidos: aba **Metas** e fluxo de **Tutorial/Onboarding**.

### Funcionalidades extras (confirmadas)
- **Categorias personalizáveis**: usuário cria/edita/exclui categorias e subcategorias, escolhe ícone e cor.
- **Despesas recorrentes e parceladas**:
  - Recorrente: replica automaticamente a cada novo mês até ser cancelada.
  - Parcelada: ex.: "12x R$ 200" → cria 12 entradas, uma por mês, com indicador "3/12".
- **Exportar / Importar dados**: download em **JSON** (backup completo) e **CSV** (lançamentos); importação por upload de JSON com confirmação de sobrescrita.

### Login e dados na nuvem (Lovable Cloud)
- E-mail/senha + Google.
- Cada usuário tem seus próprios meses, despesas, renda, poupança e categorias.
- Sincronização automática entre dispositivos.

### Temas (4 no total)
- **Claro** (padrão do FinWise atual)
- **Escuro** (padrão do FinWise atual)
- **Azul Oceano** (novo)
- **Roxo / Midnight** (novo)

Seletor de tema em Ajustes, com preview e persistência por usuário.

### Responsividade mobile-first
- Layout 100% mobile-first usando Tailwind.
- **Mobile**: bottom navigation fixa, cards full-width, modais como bottom-sheets, áreas de toque ≥44px, suporte a safe-area (notch/Dynamic Island).
- **Tablet/Desktop**: sidebar lateral, grid de 2-3 colunas no dashboard.
- Testado nos breakpoints 360, 390, 414, 768, 1024, 1440.

## Estrutura de dados (técnico)

Tabelas no Lovable Cloud:
- `profiles` (id → auth.users, nome, tema preferido)
- `categories` (user_id, nome, ícone, cor, subcategorias jsonb)
- `months` (user_id, year_month, renda_principal, poupança_contrib)
- `incomes_extra` (month_id, descrição, valor)
- `bills` (month_id, categoria, subcategoria, descrição, valor, dia_vencimento, paga, recorrente, parcela_atual, parcela_total, parent_id)
- `savings_log` (user_id, tipo add/withdraw, valor, data)

Todas com **RLS** restringindo acesso ao próprio `user_id`.

## Stack técnica
- React + Vite + TypeScript + Tailwind (já no projeto)
- shadcn/ui para componentes base
- Lovable Cloud (auth + Postgres + RLS)
- Tema via CSS variables HSL no `index.css` + classe no `<html>`
- Ícones do upload (`icons.zip`) copiados para `public/icons/` e usados no PWA manifest

## Fora de escopo nesta primeira entrega
- PWA / Service Worker (podemos adicionar depois)
- Notificações push
- Gráficos avançados (podemos adicionar em iteração seguinte se quiser)

Após sua aprovação, eu construo tudo isso.
