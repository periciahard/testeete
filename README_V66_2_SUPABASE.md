# Diagnóstico Pedagógico ETE — V66.2 Supabase

Correções principais:

- Botão visível **Salvar diagnóstico na nuvem** na tela **Análises**.
- Salvamento automático na nuvem após confirmar/importar avaliação, quando houver login Supabase ativo.
- Persistência das avaliações na tabela `avaliacoes`.
- Persistência dos resultados por aluno na tabela `resultados_alunos`.
- Persistência item a item na tabela `respostas`.
- Busca automática da turma pelo nome da avaliação; se a turma não existir no Supabase, ela é criada automaticamente com série "Não informada".

Para testar:
1. Faça login.
2. Importe e confirme uma planilha.
3. Veja no Supabase as tabelas `avaliacoes`, `resultados_alunos` e `respostas`.
4. Também é possível clicar em **Análises → Salvar diagnóstico na nuvem**.
