# Status do Projeto Fênix SaaS

Atualizado em 2026-07-22 (America/Sao_Paulo).

## Estado atual

- Branch atual: `rescue-saas-20260722`.
- Último commit local: `d457b6a fix(superadmin): correct users response and admin logo context`.
- Árvore de trabalho limpa no momento desta atualização.
- Nenhum push ou deploy foi feito nesta etapa.

## Correção mais recente: /admin/usuarios

Ao abrir `/admin/usuarios?companyId=...`, o Preview apresentava:

- `Uncaught TypeError: z.map is not a function`;
- duas respostas `401` para `/api/data/companyInfo`.

### Causa do erro de listagem

`getSuperAdminCompanyUsers()` já retorna o contrato:

```ts
{ users: SuperAdminCompanyUser[]; roles: SuperAdminCompanyRole[] }
```

Porém, a rota `GET /api/internal/superadmin/users` envolvia esse resultado novamente em `{ users }`. A resposta real ficava assim:

```ts
{ users: { users: [...], roles: [...] } }
```

`admin-users-page.tsx` esperava `result.users` como array e executava `users.map(...)`; portanto recebia um objeto. `result.roles` também ficava indefinido.

### Correções aplicadas

- `src/app/api/internal/superadmin/users/route.ts`
  - Retorna diretamente o contrato `{ users, roles }`, sem envelope duplicado.

- `src/components/admin/admin-users-page.tsx`
  - Valida `result.users` e `result.roles` com `Array.isArray` antes de atualizar o estado.
  - Renderiza apenas coleções confirmadas como arrays.
  - Preserva a mensagem de erro quando a API devolver um contrato inválido.

- `src/components/admin/admin-shell.tsx`
- `src/components/logo.tsx`
  - O logo usado pelo Super Admin não consulta informações de empresa.
  - O comportamento do logo no sistema de tenant e na tela de login permanece inalterado.

### Causa dos 401 de companyInfo

O `AdminShell` utilizava o componente compartilhado `Logo`. Ao montar, ele chamava `getEffectiveCompanyInfo()`, que tentava buscar `/api/data/companyInfo` quando não havia contexto de tenant. Como o Super Admin não depende de uma empresa, a rota respondia `401`.

O shell administrativo agora instrui o logo a não carregar dados de empresa, removendo essa dependência indevida.

## Validação

- `npm.cmd run build` executado com sucesso após as correções.
- Next.js compilou, validou tipos e gerou as 70 rotas/páginas sem erro.

## Próximo passo

No Preview/Vercel, validar com uma sessão de Super Admin:

1. Abrir `/admin/usuarios?companyId=<id-da-empresa>`.
2. Confirmar que a lista de usuários e as roles são exibidas sem erro no console.
3. Confirmar que não há chamadas a `/api/data/companyInfo` nessa página.
4. Testar edição, alteração de status e redefinição de senha de um usuário de empresa.

Não executar push ou deploy sem nova solicitação.
