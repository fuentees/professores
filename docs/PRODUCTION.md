# Prontidão para produção

Este documento separa o que o repositório garante do que precisa ser configurado
nas contas externas antes do lançamento.

## Verificações automáticas

O workflow `CI` executa em todo push e pull request para `main`:

1. instalação reproduzível com `npm ci`;
2. ESLint;
3. testes Vitest;
4. build de produção;
5. testes Playwright, incluindo acessibilidade WCAG A/AA.

Cadastre no GitHub Actions os secrets `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.

## Backup e recuperação

O workflow `Database backup` executa diariamente e também pode ser iniciado
manualmente. Cadastre `DATABASE_URL` como secret no GitHub. O dump fica disponível
como artifact privado por 14 dias.

Teste a restauração mensalmente em um projeto Supabase separado:

```bash
pg_restore --clean --if-exists --no-owner --no-acl --dbname "$RESTORE_DATABASE_URL" portal.dump
```

Nunca teste restauração diretamente no banco de produção. O Storage deve ter
política de backup/versionamento configurada separadamente no provedor.

## Configuração obrigatória antes do lançamento

- domínio HTTPS definitivo em `NEXT_PUBLIC_SITE_URL`;
- SMTP de produção e templates de confirmação/recuperação no Supabase;
- e-mail de suporte no painel do proprietário;
- razão social, CNPJ, política de reembolso e canal LGPD nos textos legais;
- secrets do CI e do backup;
- proteção CAPTCHA/Turnstile no Supabase Auth;
- monitoramento externo de `/api/health`;
- fornecedor de pagamentos e secrets de webhook;
- conta de teste exclusiva para os E2E autenticados.

## Incidentes

1. confirmar o impacto pelo health check e logs da hospedagem;
2. interromper deploys e pagamentos se houver risco de dados incorretos;
3. preservar logs e identificar o primeiro commit afetado;
4. fazer rollback do deploy, nunca reescrever migration já aplicada;
5. restaurar banco apenas em projeto isolado e validar antes de qualquer troca;
6. registrar causa, impacto, correção e ação preventiva.

## Integrações ainda dependentes de decisão comercial

Cobrança, monitoramento de erros, analytics e geração automática de capas exigem
contas, chaves e definição do fornecedor. O código não deve conter chaves reais;
elas entram apenas como secrets da hospedagem.
