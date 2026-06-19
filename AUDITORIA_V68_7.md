# Auditoria V68.7 – Administração Institucional

## Implementado
- Botão Sair corrigido no topo e no menu lateral.
- Limpeza de tokens Supabase e cache de autenticação VETOR no logout.
- Modal de troca de senha.
- Bloqueio por senha temporária via campo `perfis.senha_temporaria`.
- Usuários e Configurações restritos a admin.
- Painel completo para administração de perfis.
- Vínculos professor-turma pela interface.
- Reset por e-mail Supabase.
- Reset via Edge Function opcional.
- Modelo de Edge Function incluído para criação/reset com Service Role.
- SQL de perfis, senha temporária e professor_turmas atualizado.

## Limite de segurança
A criação real de usuários do Auth e redefinição direta de senha pelo site não deve usar Service Role no frontend. Para isso, configure a Edge Function incluída.

## Testes recomendados
1. Login admin → Usuários visível.
2. Login professor → Usuários/Configurações ocultos.
3. Botão Sair → volta à tela de login e não restaura sessão.
4. Professor com `senha_temporaria=true` → exige troca de senha.
5. Vínculos professor-turma → salvar e recarregar.
6. Reset de senha → por e-mail real ou via Edge Function.
