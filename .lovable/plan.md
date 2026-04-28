## Objetivo

Tornar as categorias mais úteis e bonitas:
1. Adicionar **10 novas categorias padrão** com ícones e cores próprias.
2. Quando o usuário escolher uma categoria/subcategoria ao adicionar conta, **o título da conta é preenchido automaticamente** com esse nome (continua editável).
3. Redesenhar a exibição de categorias com **ícones grandes, cards coloridos e gradientes suaves** em vez de só um quadradinho de cor.

## 1. Banco de dados (migração)

Adicionar via migração:

- **10 novas categorias padrão** para todos os usuários existentes (sem duplicar quem já tenha):
  Educação, Pets, Vestuário, Beleza, Investimentos, Cartão, Impostos, Assinaturas, Presentes, Trabalho.
- Atualizar o **trigger `handle_new_user`** para já criar essas 15 categorias + "Outros" para novos cadastros.
- Corrigir nomes de ícones das categorias antigas (garantir que batem com os ícones do Lucide).

Cada categoria tem nome, ícone (nome Lucide), cor e subcategorias sugeridas (ex.: Pets → Ração, Veterinário, Petshop).

## 2. Mapa de ícones (`src/lib/categoryIcons.ts`)

Novo arquivo que mapeia o nome do ícone salvo no banco (string) para o componente Lucide correspondente. Função `getCategoryIcon(name)` retorna o ícone certo, com fallback para `Tag`.

## 3. ContasPage — auto-título e categorias bonitas

- **Auto-título**: ao clicar numa categoria, se o campo "Descrição" estiver vazio, preenche com o nome da categoria. Ao clicar numa subcategoria, atualiza para `"Categoria · Subcategoria"`. Se o usuário já tiver digitado algo, **não sobrescreve**.
- **Grid de categorias** no formulário: cards quadrados com ícone Lucide grande no topo, fundo com tom da cor da categoria (ex.: `style={{ background: color + '15' }}`), borda colorida quando selecionado, animação `active:scale-95`.
- **Lista de contas**: substituir o `●` pelo ícone real da categoria num círculo colorido (ex.: 28px com fundo `cor+20%`).

## 4. AjustesPage — gerenciamento bonito de categorias

- Lista de categorias vira **grid 2 colunas** com cards mostrando:
  ícone grande colorido + nome + contagem de subcategorias + botão remover.
- No formulário "Nova categoria", adicionar **seletor visual de ícone** (grid clicável com os 17 ícones disponíveis) além do seletor de cor.

## 5. Dashboard

Mostrar o ícone da categoria ao lado do nome no bloco "Despesas por categoria" para manter a identidade visual consistente.

## Arquivos afetados

- **Nova migração** (banco de dados)
- **Novo**: `src/lib/categoryIcons.ts`
- **Editado**: `src/pages/ContasPage.tsx` (auto-título + grid bonito + ícones na lista)
- **Editado**: `src/pages/AjustesPage.tsx` (cards + seletor de ícone)
- **Editado**: `src/pages/Dashboard.tsx` (ícones nas barras de categoria)
