# Ferramentas de IA do professor

## Ativação

1. Aplique as migrations do Supabase, incluindo `20260830190000_ai_teacher_tools.sql`.
2. Adicione `OPENAI_API_KEY` às variáveis locais e do Vercel.
3. Opcionalmente defina `OPENAI_MODEL`; sem isso, o portal usa `gpt-4o-mini`.
4. Faça um novo deploy depois de salvar as variáveis no Vercel.

Nunca use `NEXT_PUBLIC_` no nome da chave da OpenAI. Ela deve ficar somente no servidor.

## Planejamento de aula

- Caminho: `/painel/planejamento`.
- O professor escolhe série, disciplina, tema, duração, contexto e adaptações.
- A IA só pode devolver códigos BNCC que já estejam cadastrados no banco.
- O resultado é salvo como rascunho editável e pode ser baixado em Word ou impresso/salvo em PDF.
- Histórico: `/painel/planejamentos`.

## Corretor

- Caminho: `/painel/corretor`.
- Aceita foto JPG, PNG ou WebP de exercício ou redação.
- A imagem é reduzida no navegador antes do envio e não é salva no portal.
- A análise sempre informa confiança e sinaliza quando precisa da revisão do professor.
- Histórico: `/painel/correcoes`.

## BNCC

O catálogo da BNCC é administrado em `/admin/bncc`. Os códigos e descrições devem vir da planilha oficial do MEC. O sistema não permite que a IA invente códigos: quando não encontra uma habilidade cadastrada para a série e disciplina, gera o plano sem código e avisa implicitamente pela seção vazia.

Antes de liberar a ferramenta para a escola, complete e revise o catálogo BNCC para as disciplinas e séries atendidas.
