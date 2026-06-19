# Diagnóstico Pedagógico ETE — V65

Versão de refatoração e estabilidade.

## Implementado
- Correção definitiva do `service-worker.js`, incluindo lista `ASSETS` definida.
- Tela **Minhas Turmas** específica para professor.
- Professor por série + disciplina consegue visualizar suas turmas, comparar médias, acompanhar evolução e abrir diagnósticos permitidos.
- Coordenação e administrador mantêm visão geral.
- Usuários de teste ocultados da tela de login.
- Autoria inicial aplicada ao banco de questões local.
- Filtros de turma/disciplina reforçados para professor.
- Cache atualizado para `ete-diagnostico-v65`.

## Observação
O login ainda é local/provisório. Para segurança real e compartilhamento de dados entre professores e coordenação, a próxima etapa deve ser Supabase.
