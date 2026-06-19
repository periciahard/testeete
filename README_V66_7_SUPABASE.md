# V66.7 – Consolidação Definitiva

Foco da versão:
- Redução de duplicação lógica de avaliações.
- Busca mais agressiva por avaliação existente antes de inserir.
- Atualização de avaliação existente com limpeza/regravação de respostas e resultados.
- Histórico/Evolução com deduplicação visual por turma + disciplina + título + data.
- Cache atualizado para V66.7.

Arquivo SQL incluído:
- `supabase_ete_consolidacao_v66_7.sql`

Recomendação:
1. Subir os arquivos da V66.7 no GitHub Pages.
2. Executar o SQL no Supabase para limpar duplicações antigas e criar índice único lógico.
3. Testar: salvar duas vezes a mesma avaliação e verificar se `avaliacoes` não aumenta.
