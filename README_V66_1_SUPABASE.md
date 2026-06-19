# Diagnóstico Pedagógico ETE — V66.1 Supabase

## Correção principal

Esta versão integra o gerenciamento de alunos ao Supabase.

Agora a tela de turmas realiza operações reais na tabela `alunos`:

- adicionar aluno;
- editar nome do aluno;
- excluir aluno;
- transferir aluno entre turmas;
- importar lista CSV/Excel;
- carregar turmas e alunos salvos na nuvem após login.

## Teste recomendado

1. Fazer login institucional.
2. Criar uma turma de teste.
3. Adicionar um aluno chamado `JOÃO SUPABASE V66.1`.
4. Conferir no Supabase em `Table Editor > alunos`.
5. Atualizar a página e confirmar que o aluno continua aparecendo.

## Observação

O sistema ainda mantém uma cópia local como segurança, mas, quando há login ativo no Supabase, as operações passam a gravar também na nuvem.
