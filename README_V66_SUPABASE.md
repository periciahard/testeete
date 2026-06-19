# Diagnóstico Pedagógico ETE — V66 Supabase

Esta versão já vem conectada ao projeto Supabase informado:

- URL: https://shqnaeatdkdtnheswggq.supabase.co
- Chave pública: sb_publishable_ByueLBjkkGNOW0Wt2yD7hg_n0YDvMqi

## Antes de testar

No Supabase, abra **SQL Editor** e execute o arquivo:

`supabase_ete_migracao_v66.sql`

Ele cria/complementa as colunas necessárias para salvar avaliações completas, respostas dos alunos e relatórios persistentes.

## Como testar

1. Abra o site.
2. Na tela inicial, entre com o e-mail e senha do usuário criado no Supabase.
3. Importe uma planilha de avaliação.
4. Vá em Configurações → Modo institucional.
5. Selecione “Turma Teste”.
6. Clique em “Salvar avaliação institucional”.
7. Clique em “Listar avaliações visíveis”.
8. Carregue a avaliação salva para confirmar leitura do banco.

## Observação

A criação definitiva de professores, coordenação e turmas pode ser feita depois. Esta versão prioriza testar login real, leitura, gravação e persistência no Supabase.
