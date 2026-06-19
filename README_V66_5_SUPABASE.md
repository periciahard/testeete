# V66.5 – Consolidação Supabase

Versão de consolidação após auditoria da V66.4.

## Ajustes principais

- Mantida a remoção do relacionamento automático quebrado `avaliacoes -> perfis`.
- Histórico e Evolução priorizam leitura direta do Supabase quando o usuário está logado.
- Painel institucional em Gestão usa dados das tabelas `avaliacoes` e `resultados_alunos`.
- Atualização de cache para V66.5, evitando carregamento de versões antigas no GitHub Pages.
- Inclusão da migração `supabase_ete_consolidacao_v66_5.sql`, compatível com o banco já criado durante a implantação.

## Tabelas usadas na nuvem

- `perfis`
- `turmas`
- `alunos`
- `avaliacoes`
- `respostas`
- `resultados_alunos`
- `descritores`
- `questoes`

## Observação técnica

O sistema ainda mantém `localStorage` como modo de segurança/offline e para telas antigas. Após login no Supabase, os módulos centrais de turmas, alunos, avaliações, respostas, resultados, histórico e evolução usam a nuvem.
