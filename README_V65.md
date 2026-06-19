# Diagnóstico Pedagógico ETE - V65

## Entrega principal
- Nova tela **Administração → Usuários** exclusiva para o administrador.
- CRUD local de usuários sem edição de código.
- Criação de professores, coordenação e administradores.
- Definição de série, disciplina, perfil e status ativo/bloqueado.
- Alteração de senha ao editar usuário.
- Redefinição rápida de senha para `ete2026`.
- Exportação `usuarios-permissoes-v65-supabase.json`, alinhada às tabelas futuras `profiles` e `user_permissions`.

## Observação técnica
A gestão ainda é local, via `localStorage`, mantendo compatibilidade com GitHub Pages. A estrutura foi preparada para migração futura ao Supabase Auth + PostgreSQL + RLS.
