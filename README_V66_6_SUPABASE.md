# V66.6 – Consolidação Final Supabase

## O que foi alterado

### 1. Salvar avaliação: insert vs update
A lógica de salvamento foi alterada em `js/supabase-sync.js`.

Agora o sistema:
- usa `cloud_avaliacao_id` quando a avaliação já foi salva;
- se não houver ID, procura uma avaliação com a mesma assinatura:
  - turma
  - disciplina
  - tipo
  - título
  - data
- se encontrar, faz `update`;
- se não encontrar, faz `insert`;
- antes de reinserir resultados/respostas de uma avaliação atualizada, limpa os registros antigos daquela avaliação.

Isso evita criar várias “Avaliação atual” iguais quando o botão é clicado mais de uma vez.

### 2. Histórico e evolução
A tela de evolução agora mostra variação em pontos percentuais em relação à avaliação anterior da mesma turma/disciplina.

### 3. Dashboard institucional
A leitura institucional permanece baseada em Supabase, usando as tabelas:
- `avaliacoes`
- `resultados_alunos`
- `respostas`
- `turmas`
- `alunos`

### 4. Auditoria de duplicidades
Incluído o SQL `supabase_ete_consolidacao_v66_6.sql`, que cria a visão:

`v666_avaliacoes_possiveis_duplicadas`

Ela permite identificar avaliações duplicadas já existentes sem apagar nenhum dado.

## Teste recomendado

1. Faça login.
2. Importe uma avaliação.
3. Salve na nuvem.
4. Salve a mesma avaliação novamente.
5. Confira no Supabase:
   - deve continuar existindo apenas uma linha correspondente em `avaliacoes`;
   - `resultados_alunos` e `respostas` devem ser atualizados, não duplicados.
6. Abra Evolução e confira o campo “Δ anterior”.
