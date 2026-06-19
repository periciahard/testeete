# Diagnóstico Pedagógico ETE — V66.3 Supabase

Correções desta versão:

- Remove consulta quebrada entre `avaliacoes` e `perfis` no Supabase.
- Lista avaliações da nuvem usando `professor_id` e busca os perfis separadamente.
- Elimina o erro: `Could not find a relationship between avaliacoes and perfis in the schema cache`.
- Mantém gravação em `avaliacoes`, `respostas` e `resultados_alunos`.
- Atualiza versão visual e cache do service worker para V66.3.
