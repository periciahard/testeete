# V68.7.1 — Hotfix Auth, Senha e Usuários

Correções principais:
- Botão **Sair** corrigido com `supabase.auth.signOut()` e limpeza de tokens locais.
- Botão **Trocar senha** no topo e na lateral.
- Modal de troca obrigatória de senha quando `perfis.senha_temporaria = true`.
- Menus **Usuários** e **Configurações** ficam visíveis apenas para `admin`.
- Tela de administração de usuários no próprio site para gerenciar perfis e vínculos professor-turma.
- Admin pode remover perfis e vincular professores às turmas.
- Reset de senha: por segurança, o navegador não altera senha de outro usuário diretamente. Há botão para enviar link de redefinição quando o e-mail for real e instrução para reset manual no Supabase.

Execute no Supabase:
`supabase_vetor_v68_6_1_hotfix_auth.sql`
