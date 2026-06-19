# Auditoria V68.7.1 — Hotfix Auth, Senha e Usuários

## Itens corrigidos

- Logout revisado com encerramento explícito da sessão Supabase e limpeza de tokens locais.
- Botões de troca de senha adicionados no topo e na lateral.
- Modal de troca de senha implementado.
- Troca obrigatória de senha no primeiro login quando `perfis.senha_temporaria = true`.
- Menus e telas `Usuários` e `Configurações` ocultados para professor e coordenação; apenas admin visualiza.
- Área administrativa criada para gerenciar perfis e vínculos professor-turma dentro do VETOR.
- Vínculos professor-turma passam a ser considerados no carregamento de turmas do professor.
- SQL de hotfix incluído para colunas de senha temporária, políticas RLS e tabela `professor_turmas`.
- Cache atualizado para V68.7.1.
- Scripts JavaScript validados com `node --check` sem erro de sintaxe.

## Observação de segurança

O navegador não pode alterar diretamente a senha de outro usuário do Supabase Auth usando apenas a chave pública. Isso exigiria Service Role em backend seguro ou ação manual no painel do Supabase. Por isso, o VETOR oferece:

1. troca da própria senha pelo usuário logado;
2. envio de link de redefinição quando o e-mail for real e o SMTP estiver configurado;
3. instrução para reset manual no Supabase quando forem usados e-mails institucionais fictícios, como `@vetor.edu`.
