
(function(){
 'use strict';
 const $=s=>document.querySelector(s);
 function check(){
   const A=window.ETE;
   const out=$('#systemCheckOutput');
   if(!out)return;
   const modules=[
    ['Núcleo',!!A],
    ['Importação',!!window.Importacao],
    ['Diagnóstico',!!window.Diagnostico],
    ['Evolução',!!window.Evolucao],
    ['Turmas',!!window.TurmasETE],
    ['Banco de Questões',!!window.BancoQuestoes],
    ['Fichas',!!window.Fichas],
    ['Intervenções',!!window.Intervencoes],
    ['Impressão',!!window.Impressao],
    ['Exportação',!!window.Exportacao],
    ['Excel',!!window.XLSX]
   ];
   const a=A?.state?.assessment||{};
   const checks=[
    ['Avaliação salva',!!(a.id&&A.state.activeAssessmentId)],
    ['Questões importadas',(a.questions||[]).length>0],
    ['Descritores importados',(a.descriptors||[]).length>0],
    ['Gabarito importado',(a.key||[]).length>0],
    ['Alunos importados',(a.students||[]).length>0]
   ];
   const html='<h4>Verificação do sistema</h4><ul>'+
     modules.map(([n,ok])=>`<li>${ok?'✅':'❌'} ${n}</li>`).join('')+
     '</ul><h4>Avaliação atual</h4><ul>'+
     checks.map(([n,ok])=>`<li>${ok?'✅':'⚠️'} ${n}</li>`).join('')+
     '</ul>';
   out.className='statusbox '+(modules.every(x=>x[1])?'status-ok':'status-error');
   out.innerHTML=html;
 }
 async function clearCache(){
   try{
    if('serviceWorker' in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      for(const r of regs) await r.unregister();
    }
    if(window.caches){
      const names=await caches.keys();
      for(const n of names) await caches.delete(n);
    }
    alert('Cache limpo. A página será recarregada.');
    location.reload();
   }catch(e){alert('Não foi possível limpar cache automaticamente: '+e.message);}
 }
 function bind(){
   $('#runSystemCheck')&&($('#runSystemCheck').onclick=check);
   $('#clearPageCache')&&($('#clearPageCache').onclick=clearCache);
   const footer=document.querySelector('footer');
   if(footer)footer.textContent='ETE Professor José Luiz de Mendonça • Criado por Felipe Camargo • Versão 60.6';
   const box=$('#changelogBox');
   if(box)box.innerHTML='<h3>Versão 60.6 estável</h3><p class="hint">Código limpo, remoção da TRI, módulos consolidados, verificação do sistema e foco no fluxo principal: avaliação → diagnóstico → evolução → intervenção → ficha → impressão.</p>';
 }
 document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,100));
 window.SistemaETE={check,clearCache};
})();
