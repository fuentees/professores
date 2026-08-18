# Portal do Professor

Plataforma de descoberta de recursos pedagógicos para professores: biblioteca
de materiais (atividades, avaliações, planos de aula), objetos de
aprendizagem interativos (quizzes, jogos, simulações), cursos, banco de
questões com gerador de provas, BNCC, fórum e blog. Não é um sistema de
gestão escolar nem usa IA generativa — o valor central é ajudar o professor a
achar o recurso certo em poucos segundos.

## Stack

- **Next.js 16** (App Router, Server Actions, Turbopack)
- **TypeScript**
- **Supabase** (Postgres + Auth + Storage + Row Level Security)
- **Tailwind CSS** + Base UI (`@base-ui/react`) para os componentes de UI
- **Zod** + **react-hook-form** para validação de formulários

Sem microserviços, sem Redux, sem dependências além do necessário — a
segurança real do produto está nas políticas de RLS do Postgres, não em
checagens espalhadas pelo código.

## Como rodar localmente

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Copie `.env.example` para `.env` e preencha com as credenciais do seu
   projeto Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`). As variáveis `DATABASE_URL`/`DIRECT_URL`/
   `SUPABASE_ACCESS_TOKEN` só são necessárias para aplicar migrations.
3. Aplique as migrations em `supabase/migrations/` (em ordem, pelo nome do
   arquivo) no seu projeto Supabase — via `supabase db push` (Supabase CLI)
   se tiver acesso direto ao Postgres, ou via Management API caso a rede
   bloqueie conexões diretas na porta 5432/6543 (veja o script de exemplo em
   "Aplicando migrations sem acesso direto ao Postgres" abaixo).
4. Opcionalmente, aplique `supabase/seed.sql` para popular o banco com
   materiais interativos de exemplo (quiz, verdadeiro/falso, associação,
   memória, completar lacunas, ordenação, flashcards e 3 simulações). Esse
   arquivo é seguro de rodar mais de uma vez (`on conflict do nothing`) e
   nunca é aplicado automaticamente em produção.
5. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Estrutura de rotas

- `src/app/(public)/` — páginas públicas: home, `/materiais`, `/objetos`
  (recursos interativos), `/cursos`, `/bncc`, `/forum`, `/blog`, `/pastas`,
  `/planos`.
- `src/app/(auth)/` — login, cadastro, recuperação de senha.
- `src/app/(teacher)/painel/` — área logada do professor (favoritos,
  downloads, histórico, gerador de provas, assinatura, perfil).
- `src/app/(admin)/admin/` — painel administrativo (cadastro de todo o
  conteúdo: materiais, cursos, objetos interativos, BNCC, questões, etc.).

## Banco de dados

Toda a estrutura vive em `supabase/migrations/`, aplicada de forma
incremental — nunca edite uma migration já aplicada, sempre crie uma nova.
Row Level Security está habilitado em praticamente toda tabela; a regra
central de "quem pode acessar qual recurso" fica em
`src/lib/access/can-access-resource.ts` e é usada tanto pelas páginas quanto
pelas Server Actions que geram links de download.

### Aplicando migrations sem acesso direto ao Postgres

Em redes que bloqueiam conexões diretas na porta 5432/6543 (comum em
ambientes corporativos/sandboxed), use a Supabase Management API com um
Personal Access Token (`SUPABASE_ACCESS_TOKEN`, gerado em Account Settings >
Access Tokens — diferente da anon/service_role key do projeto):

```bash
curl -X POST "https://api.supabase.com/v1/projects/<project-ref>/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$(cat supabase/migrations/arquivo.sql | sed 's/"/\\"/g' | tr '\n' ' ')\"}"
```

(Prefira montar o corpo da requisição em um script, não inline no shell — os
arquivos SQL têm aspas, quebras de linha e acentuação que quebram a
escaping naive do `curl -d`.)

## Objetos interativos

Jogos e simulações não usam uma tabela por tipo — `learning_objects` tem uma
coluna `activity_type` (enum) + `config` (jsonb), validada por uma união
discriminada Zod em `src/lib/validations/interactive-activity.ts`. Os 7
tipos de jogo (quiz, verdadeiro/falso, associação, memória, completar
lacunas, ordenação, flashcards) têm um player React reutilizável em
`src/components/interactive/`, e as simulações são componentes registrados
em `src/components/interactive/simulations/registry.ts` (referenciados pelo
`config.simulationKey`, não por código solto). O admin cria esse conteúdo em
`/admin/objetos/novo` sem escrever JSON manualmente — o formulário monta a
configuração certa por tipo e tem pré-visualização real antes de salvar.

## Banco de questões (importação de acervo Word)

Transforma um acervo de questões em `.docx` num banco pesquisável, sem nunca
perder o arquivo original nem publicar nada sem revisão humana. Fluxo:

1. Admin envia um ou vários `.docx` em `/admin/questoes/importar` (lote:
   uma Server Action por arquivo, um erro não trava os demais).
2. `src/lib/parsing/docx/` (jszip + fast-xml-parser, parser puro, sem I/O)
   descompacta o arquivo e extrai código, disciplina, série, BNCC, Bloom,
   complexidade, itens A/B/C, gabarito e rubrica — por regex de prefixo de
   rótulo sobre a árvore real do OOXML, nunca por posição fixa de
   linha/coluna nem por IA generativa.
3. O original vai pro bucket privado (`question-originals/`), nunca público;
   um rascunho (`questions.publication_status = 'draft'`) é criado na hora,
   com os avisos de divergência/ambiguidade em `question_import_warnings`.
4. Admin revisa em `/admin/questoes/importacoes/[id]` (mesma estrutura de
   dados do cadastro manual) e aprova ou rejeita — só aprovar publica.
5. Professor busca em `/painel/banco-de-questoes`, com gabarito/rubrica só
   visíveis a partir daí (RLS bloqueia leitura direta de `questions` pelo
   professor, igual ao gerador de provas — todo acesso passa por Server
   Action com `createAdminClient()` e filtro explícito em código).

Testado ponta a ponta com os arquivos reais do acervo em
`test/fixtures/docx/` (`npm run test` cobre o parser com esses fixtures).

## Testes

```bash
npm run test
```

Vitest cobre principalmente as regras de autorização (`canAccessResource`), a
validação das atividades interativas e o parser de `.docx` do banco de
questões (com os arquivos reais do acervo como fixtures) — as áreas onde um
bug vira vazamento de conteúdo pago, uma atividade quebrada ou uma questão
mal-importada em produção, não cobertura de UI.
