# Diagnóstico Pedagógico ETE — V60.7

Versão focada na correção das exportações institucionais.

## Correções principais
- PowerPoint corrigido: usa `PptxGenJS`, que é o objeto real carregado pela biblioteca.
- Correção do PDF em branco: geração passa a usar html2pdf quando disponível.
- Botões de PDF passam a gerar conteúdo real a partir da prévia/documento.
- Word institucional: cabeçalho no modelo enviado pelo professor.
- Remoção do sombreamento dos enunciados/textos-base.
- Ajustes de exportação em lote.
- Verificação de sintaxe JavaScript sem erros.

## Observação
O modelo Word foi reproduzido no gerador institucional da plataforma, com campos de estudante, turma, série, curso, data, disciplina, professor e nome da atividade.
