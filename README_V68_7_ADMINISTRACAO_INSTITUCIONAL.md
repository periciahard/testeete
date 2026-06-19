# V68.7 – Administração Institucional

Foco da versão:
- Correção final do logout no topo e no menu lateral.
- Troca de senha do próprio usuário.
- Troca obrigatória de senha no primeiro login via `perfis.senha_temporaria`.
- Ocultação de Usuários e Configurações para professor e coordenação.
- Painel administrativo com perfis, vínculos professor-turma, permissões e reset de senha.
- Suporte opcional a Edge Function para criação real de usuários do Supabase Auth pelo próprio site.

Observação importante:
- Por segurança, o navegador não deve carregar Service Role Key.
- Criar usuário confirmado e resetar senha de outro usuário exige Supabase Admin API, que deve rodar em Edge Function/backend.
- Incluído exemplo: `supabase_edge_function_vetor_admin_user.ts`.

Após subir no GitHub:
1. Execute `supabase_vetor_v68_7_admin_institucional.sql` no Supabase.
2. Abra o site com `?v=687`.
3. Teste logout, troca de senha e painel de usuários com perfil admin.
