# Redesign mobile-first (banco digital) + PWA instalável

## Visão geral
Transformar o FinWise em uma experiência tipo Nubank/Inter/C6: hero card de saldo com gradiente premium, ações rápidas em pílulas, navegação inferior flutuante com microinterações, glassmorphism leve, tipografia hierárquica, animações suaves. Tornar o app instalável (PWA) com manifest + service worker mínimo (offline básico do shell), respeitando as regras do preview do Lovable (SW só em produção, nunca em iframe).

## 1. Design system (src/index.css + tailwind.config.ts)
- Adicionar tokens semânticos extras: `--gradient-hero`, `--gradient-card`, `--shadow-soft`, `--shadow-elevated`, `--surface-glass`.
- Refinar tema claro/escuro com cores mais suaves (banco digital): primary mais vibrante mas com soft variant para fundos.
- Tailwind: registrar keyframes `fade-in`, `scale-in`, `slide-up`, `shimmer`, `pulse-soft` + animações correspondentes; classes utilitárias `.glass`, `.hover-lift`, `.tap-scale` (active:scale-95).
- Tipografia: manter Plus Jakarta Sans, ajustar pesos (700/800 em headings, 500 em body).

## 2. Layout / navegação (src/components/AppLayout.tsx)
- Bottom nav redesenhada: flutuante (mx-3 mb-3, rounded-2xl, shadow-elevated, backdrop-blur), item ativo com pílula de fundo `primary-soft` e ícone preenchido + leve scale, transição suave.
- Header mobile fixo translúcido (glass) com saudação + avatar/iniciais (link para Ajustes) e ícone de notificações/tema.
- Safe areas iOS já tratadas; reforçar `pb-safe`.

## 3. Dashboard (src/pages/Dashboard.tsx)
- Hero card de saldo: gradiente, botão "olho" para ocultar valores (estado local + persistência localStorage), chips de Renda/Despesas/Poupança.
- Linha de **ações rápidas** (Quick Actions) — 4 botões circulares: Nova conta, Nova renda, Poupar, Histórico (navega para rotas existentes, prefill via query param simples).
- Cards com `hover-lift` + `tap-scale` e `animate-fade-in` em cascata (delay incremental).
- Seção "Próximas contas" (top 3 não pagas, ordenadas por vencimento) com tap para marcar paga.
- Skeletons shimmer em loading.

## 4. Páginas internas (Contas, Renda, Poupança, Histórico, Ajustes)
- Aplicar mesma linguagem: header de página com título + subtítulo, botão primário FAB-like fixo no canto inferior direito (acima da bottom nav) para "Adicionar".
- Listas com cards arredondados, divisores sutis, swipe-to-action mantido se já existir (sem refatorar lógica).
- Forms: inputs `h-12`, agrupados em cards, foco visível com ring primário, botões grandes full-width.
- Apenas mudanças visuais/estruturais; nenhuma lógica de dados é alterada.

## 5. PWA instalável
- Instalar `vite-plugin-pwa`.
- `vite.config.ts`: registrar VitePWA com `registerType: 'autoUpdate'`, `devOptions.enabled: false`, `navigateFallbackDenylist: [/^\/~oauth/]`, runtime caching `NetworkFirst` para navegações HTML.
- Manifest: nome "FinWise", short_name "FinWise", `display: standalone`, `theme_color #2563eb`, `background_color` conforme tema, ícones já existentes em `/public/icons/` (192, 384, 512 com `purpose: any maskable`).
- `src/main.tsx`: guarda anti-iframe/preview — desregistra SWs quando hostname inclui `lovableproject.com`/`id-preview--` ou em iframe; só registra em produção fora do preview.
- Página `/install` opcional: card explicando como instalar (Android: prompt nativo via `beforeinstallprompt`; iOS: instruções "Compartilhar → Adicionar à Tela de Início"). Link discreto em Ajustes.
- Avisar o usuário no chat: PWA só funciona de verdade na URL publicada, não no preview do editor.

## 6. Microinterações
- Botões: `active:scale-95 transition-transform`.
- Cards: `hover:-translate-y-0.5 hover:shadow-lg transition-all`.
- Entrada de listas: `animate-fade-in` com `style={{ animationDelay }}`.
- Toggle de saldo oculto: troca suave com `transition-opacity`.
- Toasts (sonner) já configurados; manter.

## Arquivos
- Novos: `public/manifest.webmanifest` (gerado pelo plugin), `src/pages/InstallPage.tsx` (opcional).
- Editados: `src/index.css`, `tailwind.config.ts`, `src/components/AppLayout.tsx`, `src/pages/Dashboard.tsx`, `src/pages/ContasPage.tsx`, `src/pages/RendaPage.tsx`, `src/pages/PoupancaPage.tsx`, `src/pages/HistoricoPage.tsx`, `src/pages/AjustesPage.tsx`, `src/main.tsx`, `vite.config.ts`, `index.html` (link manifest + meta theme-color por tema).
- Dependência: `vite-plugin-pwa`.

## Fora do escopo
- Nenhuma mudança de schema ou lógica de negócio.
- Sem push notifications (apenas instalabilidade + cache shell).
