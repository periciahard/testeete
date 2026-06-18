(function(){
 const A=()=>window.ETE;
 const levelsOrder=['Elementar I','Elementar II','Básico','Desejável'];
 function levelBadge(level){
  if(level==='Elementar I')return 'bad level-e1';
  if(level==='Elementar II')return 'warn level-e2';
  if(level==='Básico')return 'warn level-basic';
  return 'ok level-des';
 }
 function descInfo(code, discipline){return window.Descritores?.get?.(discipline||A().state.assessment.discipline,code)||{codigo:code,texto:'Descritor não localizado na matriz selecionada.',topico:'Não identificado',estrategias:'Confirmar se a disciplina selecionada corresponde à matriz usada na prova.'};}
 function compute(assessment){
  const q=assessment.questions||[], desc=assessment.descriptors||[], key=assessment.key||[], students=assessment.students||[];
  const itemCorrect=Array(q.length).fill(0), descMap={};
  const results=students.map((s,idx)=>{
    const answers=s.answers||[];
    const correct=q.map((_,i)=>A().letter(answers[i])&&A().letter(answers[i])===A().letter(key[i])?1:0);
    const total=correct.reduce((a,b)=>a+b,0);
    const percent=A().pct(total,q.length);
    const levelObj=A().performanceLevel(percent,assessment.discipline);
    correct.forEach((c,i)=>{const d=desc[i]||'Sem descritor';itemCorrect[i]+=c;(descMap[d]??={descritor:d,total:0,correct:0,students:[],items:[]});descMap[d].total++;descMap[d].correct+=c;descMap[d].items.push(i);if(!c)descMap[d].students.push(s.name);});
    return {...s,index:idx,correct,total,percent,level:levelObj.label,levelClass:levelObj.cls,levelDescription:levelObj.description};
  });
  const items=q.map((name,i)=>({index:i,question:name||'Q'+(i+1),descriptor:desc[i]||'',key:key[i]||'',correct:itemCorrect[i],percent:A().pct(itemCorrect[i],students.length)}));
  const descriptorStats=Object.values(descMap).map(d=>({...d,percent:A().pct(d.correct,d.total),students:[...new Set(d.students)],items:[...new Set(d.items)]})).sort((a,b)=>a.percent-b.percent);
  const counts={}; results.forEach(s=>counts[s.level]=(counts[s.level]||0)+1);
  return {students:results,items,descriptorStats,summary:{nStudents:students.length,nQuestions:q.length,avg:A().pct(results.reduce((a,s)=>a+s.total,0),students.length*q.length),priority:results.filter(s=>s.level==='Elementar I'||s.level==='Elementar II').length,levels:counts}};
 }

 function assessmentName(a){
  const tipoMap={diagnostica:'Diagnóstica',recuperacao:'Recuperação',bimestral:'Bimestral',personalizada:'Personalizada',...Object.fromEntries(Array.from({length:10},(_,i)=>['simulado'+(i+1),'Simulado '+(i+1)]))};
  return `${a.turma||'Turma?'} • ${a.discipline||'Disciplina?'} • ${tipoMap[a.tipo]||a.tipo||'Tipo?'} • ${a.date||'Data?'}`;
 }
 function validSavedAssessments(){
  const list=(A().state.assessments||[]).filter(x=>(x.students||[]).length && (x.questions||[]).length);
  const cur=A().state.assessment;
  if(cur && cur.id && (cur.students||[]).length && (cur.questions||[]).length && !list.some(x=>x.id===cur.id)) list.unshift(cur);
  return list;
 }
 function renderAssessmentChooser(){
  const select=A().$('#diagnosticAssessmentSelect'), compare=A().$('#diagnosticCompareSelect');
  if(!select||!compare)return;
  const list=validSavedAssessments();
  const active=A().state.activeAssessmentId||A().state.assessment.id||'';
  const opts=list.map(x=>`<option value="${A().safe(x.id)}">${A().safe(assessmentName(x))} • ${(x.students||[]).length} alunos</option>`).join('');
  select.innerHTML=opts||'<option value="">Nenhuma avaliação salva com dados</option>';
  select.value=list.some(x=>x.id===active)?active:(list[0]?.id||'');
  compare.innerHTML='<option value="">Selecione para comparar</option>'+list.filter(x=>x.id!==select.value).map(x=>`<option value="${A().safe(x.id)}">${A().safe(assessmentName(x))} • ${(x.students||[]).length} alunos</option>`).join('');
  const previous=compare.dataset.lastValue||'';
  compare.value=list.some(x=>x.id===previous&&x.id!==select.value)?previous:'';
  select.onchange=()=>{ if(select.value && select.value!==A().state.activeAssessmentId){ A().openAssessment(select.value); } };
  compare.onchange=()=>{ compare.dataset.lastValue=compare.value; renderComparison(); };
  renderComparison();
 }
 function comparisonAdvice(a,b,ra,rb){
  const diff=(rb.summary.avg||0)-(ra.summary.avg||0);
  const worse = diff<0 ? b : a;
  const better = diff<0 ? a : b;
  const critical = (diff<0?rb:ra).descriptorStats.slice(0,3).map(d=>`${d.descritor} (${d.percent}%)`).join(', ');
  if(Math.abs(diff)<5) return `As turmas apresentam desempenho próximo. A coordenação deve observar descritores críticos comuns e propor uma intervenção integrada por disciplina. Descritores de atenção: ${critical||'não identificados'}.`;
  return `${assessmentName(worse)} está ${Math.abs(diff).toFixed(1).replace('.',',')} pontos percentuais abaixo de ${assessmentName(better)}. Recomenda-se revisar planejamento, comparar estratégias de correção, observar frequência/participação e propor reforço focado nos descritores críticos: ${critical||'não identificados'}.`;
 }
 function descriptorComparisonRows(r1,r2){
  const map1=Object.fromEntries((r1.descriptorStats||[]).map(d=>[d.descritor,d.percent]));
  const map2=Object.fromEntries((r2.descriptorStats||[]).map(d=>[d.descritor,d.percent]));
  const all=[...new Set([...Object.keys(map1),...Object.keys(map2)])];
  return all.map(d=>({d,p1:map1[d],p2:map2[d],gap:(map2[d]??0)-(map1[d]??0),min:Math.min(map1[d]??101,map2[d]??101)}))
    .filter(x=>x.p1!=null||x.p2!=null).sort((a,b)=>a.min-b.min||Math.abs(b.gap)-Math.abs(a.gap));
 }
 function renderComparison(){
  const box=A().$('#diagnosticComparison'); if(!box)return;
  const list=validSavedAssessments(); const activeId=A().$('#diagnosticAssessmentSelect')?.value||A().state.activeAssessmentId||A().state.assessment.id;
  const current=list.find(x=>x.id===activeId)||A().state.assessment;
  const otherId=A().$('#diagnosticCompareSelect')?.value;
  const ranking=list.map(a=>({a,r:compute(a)})).sort((x,y)=>y.r.summary.avg-x.r.summary.avg);
  let html='';
  if(otherId){
    const other=list.find(x=>x.id===otherId);
    if(other){
      const r1=compute(current), r2=compute(other);
      const elem1=(r1.summary.levels['Elementar I']||0)+(r1.summary.levels['Elementar II']||0);
      const elem2=(r2.summary.levels['Elementar I']||0)+(r2.summary.levels['Elementar II']||0);
      const drows=descriptorComparisonRows(r1,r2).slice(0,8);
      html+=`<div class="panel mini-panel"><h4>Comparação direta entre turmas/avaliações</h4><div class="comparison-table"><table><thead><tr><th>Indicador</th><th>${A().safe(assessmentName(current))}</th><th>${A().safe(assessmentName(other))}</th></tr></thead><tbody><tr><td>Média</td><td><b>${r1.summary.avg}%</b></td><td><b>${r2.summary.avg}%</b></td></tr><tr><td>Alunos</td><td>${r1.summary.nStudents}</td><td>${r2.summary.nStudents}</td></tr><tr><td>Elementar I/II</td><td>${elem1} aluno(s)</td><td>${elem2} aluno(s)</td></tr><tr><td>Descritores críticos</td><td>${r1.descriptorStats.slice(0,3).map(d=>`${d.descritor} (${d.percent}%)`).join(', ')||'-'}</td><td>${r2.descriptorStats.slice(0,3).map(d=>`${d.descritor} (${d.percent}%)`).join(', ')||'-'}</td></tr></tbody></table></div><h4>Diferença por descritor</h4><div class="comparison-table"><table><thead><tr><th>Descritor</th><th>${A().safe(current.turma||'Turma A')}</th><th>${A().safe(other.turma||'Turma B')}</th><th>Diferença</th></tr></thead><tbody>${drows.map(x=>`<tr><td><b>${A().safe(x.d)}</b></td><td>${x.p1==null?'-':x.p1+'%'}</td><td>${x.p2==null?'-':x.p2+'%'}</td><td>${x.gap>0?'+':''}${Math.round(x.gap*10)/10} p.p.</td></tr>`).join('')}</tbody></table></div><p class="hint"><b>Leitura da coordenação:</b> ${A().safe(comparisonAdvice(current,other,r1,r2))}</p></div>`;
    }
  }
  html+=`<details class="panel mini-panel"><summary><b>Ranking de turmas/avaliações salvas</b></summary><div class="comparison-table"><table><thead><tr><th>Turma/Avaliação</th><th>Disciplina</th><th>Alunos</th><th>Média</th><th>Elementar I/II</th></tr></thead><tbody>${ranking.map(({a,r})=>{const elem=(r.summary.levels['Elementar I']||0)+(r.summary.levels['Elementar II']||0);return `<tr><td>${A().safe(assessmentName(a))}</td><td>${A().safe(a.discipline||'')}</td><td>${r.summary.nStudents}</td><td><b>${r.summary.avg}%</b></td><td>${elem}</td></tr>`;}).join('')||'<tr><td colspan="5">Nenhuma avaliação salva com dados.</td></tr>'}</tbody></table></div></details>`;
  box.innerHTML=html;
 }

 function render(){renderAssessmentChooser();renderSummary();renderClassReport();renderCharts();renderInsights();renderHeatmap();renderStudents();renderTomorrow();A().renderSelects();A().renderWizard?.();}
 function renderSummary(){const r=compute(A().state.assessment);const box=A().$('#summaryCards'); if(!box)return; box.innerHTML=`<div class="card"><span>Alunos</span><b>${r.summary.nStudents}</b></div><div class="card"><span>Questões</span><b>${r.summary.nQuestions}</b></div><div class="card"><span>Média</span><b>${r.summary.avg}%</b></div><div class="card"><span>Elementar I/II</span><b>${r.summary.priority}</b></div><div class="card"><span>Descritores críticos</span><b>${r.descriptorStats.filter(d=>d.percent<40).length}</b></div>`;}
 function renderClassReport(){
  const r=compute(A().state.assessment);const box=A().$('#classReport'); if(!box)return; const valid=A().isAssessmentValid?.();
  if(valid&&!valid.ok&&A().state.assessment.questions?.length){box.innerHTML='<div class="panel statusbox status-error"><b>Análise bloqueada pela validação.</b><p>Volte à Importação e corrija: '+A().safe(valid.issues.join(', '))+'.</p></div>';return;}
  if(!r.summary.nStudents){box.innerHTML='<div class="panel empty">Importe uma avaliação para gerar o diagnóstico.</div>';return;}
  const critical=r.descriptorStats.slice(0,5);
  const strengths=r.descriptorStats.filter(d=>d.percent>=70).slice(-5).reverse();
  const crit=critical.map(d=>{const info=descInfo(d.descritor);return `<li><b>${A().safe(d.descritor)}</b> — ${d.percent}%: ${A().safe(info.texto)} <span class="hint">(${A().safe(info.topico||'tópico não identificado')})</span></li>`;}).join('');
  const lvlCards=levelsOrder.map(l=>`<div class="card"><span>${l}</span><b>${r.summary.levels[l]||0}</b></div>`).join('');
  const strengthHtml=strengths.length?strengths.map(d=>`<span class="pill ok">${A().safe(d.descritor)} • ${d.percent}%</span>`).join(''):'<span class="hint">Ainda não há descritores acima de 70%.</span>';
  const risk=(r.summary.priority/(r.summary.nStudents||1))>=.5?'🔴 Alto':r.summary.avg<60?'🟡 Moderado':'🟢 Controlado';
  box.innerHTML=`<div class="statusbox status-work"><b>Leitura por descritores em primeiro lugar:</b> a média resume a turma, mas a intervenção deve partir dos descritores críticos e dos tópicos da matriz.</div><div class="panel descriptor-first"><h3>Prioridades pedagógicas da turma</h3><ol>${crit}</ol><p><b>Risco pedagógico:</b> ${risk}. <b>Ação imediata:</b> planejar intervenção curta para os 3 primeiros descritores e reavaliar em até 4 semanas.</p><p><b>Pontos fortes:</b> ${strengthHtml}</p></div><div class="cards"><div class="card"><span>Média geral</span><b>${r.summary.avg}%</b></div>${lvlCards}<div class="card"><span>Disciplina</span><b style="font-size:18px">${A().safe(A().state.assessment.discipline)}</b></div></div><div class="statusbox status-work"><b>Escala pedagógica estimada:</b> usa percentual de acertos da avaliação interna e adota Elementar I, Elementar II, Básico e Desejável como referência pedagógica. Não substitui a escala oficial/TRI do SAEPE.</div>`;
 }
 function barRows(data, opts={}){const max=Math.max(1,...data.map(x=>Number(x.value)||0));return `<div class="bar-chart ${opts.compact?'bar-compact':''}">`+data.map(x=>{const val=Number(x.value)||0;const w=Math.max(3,Math.round((val/max)*100));return `<div class="bar-row"><span class="bar-label">${A().safe(x.label)}</span><div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div><span class="bar-value">${A().safe(x.suffix?val+x.suffix:val)}</span></div>`;}).join('')+`</div>`;}
 function pieChart(levels){const total=levelsOrder.reduce((a,l)=>a+(levels[l]||0),0);if(!total)return '<p class="hint">Sem dados para gráfico.</p>';const colors=['#e63242','#f4a62a','#ffd23f','#009b61'];let acc=0;const stops=levelsOrder.map((l,i)=>{const start=acc;acc+=((levels[l]||0)/total)*100;return `${colors[i]} ${start}% ${acc}%`;}).join(',');return `<div class="pie-wrap"><div class="pie" style="background:conic-gradient(${stops})"><span>${total}<small>alunos</small></span></div><div class="legend">${levelsOrder.map((l,i)=>`<span><i style="background:${colors[i]}"></i>${l}: <b>${levels[l]||0}</b></span>`).join('')}</div></div>`;}
 function renderCharts(){const box=A().$('#resultCharts'); if(!box)return; const r=compute(A().state.assessment);if(!r.summary.nStudents){box.innerHTML='';return;}const levelsPie=pieChart(r.summary.levels||{});const descBars=barRows(r.descriptorStats.slice(0,8).map(d=>({label:d.descritor,value:d.percent,suffix:'%'})),{compact:true});const itemBars=barRows([...r.items].sort((a,b)=>a.percent-b.percent).slice(0,8).map(it=>({label:`${it.question} • ${it.descriptor||'sem descritor'}`,value:it.percent,suffix:'%'})),{compact:true});const levelBars=barRows(levelsOrder.map(l=>({label:l,value:r.summary.levels?.[l]||0})),{compact:true});box.innerHTML=`<div class="chart-grid"><div class="panel chart-card"><h3>Distribuição por nível</h3><p class="hint">Classificação pedagógica estimada da turma.</p>${levelsPie}</div><div class="panel chart-card"><h3>Níveis em barras</h3><p class="hint">Quantidade de alunos em cada faixa.</p>${levelBars}</div><div class="panel chart-card"><h3>Descritores críticos</h3><p class="hint">Menores aproveitamentos por descritor.</p>${descBars}</div><div class="panel chart-card"><h3>Questões críticas</h3><p class="hint">Itens com menor percentual de acerto.</p>${itemBars}</div></div>`;}
 function renderInsights(){
  const box=A().$('#teacherInsights'); if(!box)return; const r=compute(A().state.assessment);
  if(!r.summary.nStudents){box.innerHTML='<p class="hint">Importe os dados para receber sugestões pedagógicas.</p>';return;}
  const low=r.descriptorStats.filter(d=>d.percent<40), high=r.descriptorStats.filter(d=>d.percent>=70), topLow=low.slice(0,3), itemLow=[...r.items].sort((a,b)=>a.percent-b.percent).slice(0,5);
  const elem=(r.summary.levels['Elementar I']||0)+(r.summary.levels['Elementar II']||0), elemPct=A().pct(elem,r.summary.nStudents);
  let focus;if(elemPct>=50) focus='A turma exige recomposição estruturada antes de avançar. Há predominância de alunos nos níveis Elementar I/II, indicando necessidade de retomada guiada, exercícios modelados e verificação frequente.';else if(r.summary.avg<60) focus='A turma está em zona intermediária. O trabalho deve alternar revisão objetiva dos descritores críticos, prática semanal e avaliação curta de consolidação.';else focus='A turma apresenta bom desempenho geral. A intervenção deve ser pontual nos descritores críticos e pode incluir desafios para alunos em Básico/Desejável.';
  const groups=topLow.map(d=>{const info=descInfo(d.descritor);return `<li><b>${A().safe(d.descritor)} — ${A().safe(info.topico||'')}</b>: ${d.percent}% de aproveitamento. Habilidade: ${A().safe(info.texto)}. Sugestão: ${A().safe(info.estrategias||info.intervencao)}</li>`;}).join('');
  box.innerHTML=`<div class="insight-grid"><div class="insight"><b>Leitura geral</b><p>${A().safe(focus)}</p></div><div class="insight"><b>Alunos em atenção</b><p>${elem} aluno(s) em Elementar I/II (${elemPct}%). Priorize acompanhamento individual, devolutiva por descritor e Mapa da Mina.</p></div><div class="insight"><b>Pontos fortes</b><p>${high.length?high.slice(0,3).map(d=>`${d.descritor} (${d.percent}%)`).join(', '):'Ainda não há descritores com domínio consolidado acima de 70%.'}</p></div></div><h4>Plano de ação sugerido</h4><ol class="action-list">${groups||'<li>Não há descritores abaixo de 40%. Faça manutenção com questões de revisão e ampliação.</li>'}<li><b>Correção estratégica:</b> retome ${itemLow.length} questões com menor acerto (${itemLow.map(it=>A().safe(it.question)).join(', ')}), explorando comando, alternativa correta, distratores e justificativa do raciocínio.</li><li><b>Reagrupamento flexível:</b> forme grupos temporários por descritor crítico, não por nota geral. Um aluno pode estar bem na média e ainda necessitar intervenção em um descritor específico.</li><li><b>Registro de progresso:</b> salve esta avaliação no histórico e reaplique 3 a 5 itens de verificação por descritor após duas semanas.</li></ol>`;
 }
 function renderHeatmap(){const r=compute(A().state.assessment);const box=A().$('#heatmap'); if(!box)return; box.innerHTML=r.students.map(s=>`<div class="heatrow"><span class="heatname">${A().safe(s.name)}</span>${s.correct.map(c=>`<span class="cell c${c}"></span>`).join('')}</div>`).join('')||'<p class="hint">Sem dados.</p>';}
 function renderStudents(){const r=compute(A().state.assessment);const list=A().$('#studentList'); if(!list)return; const term=A().norm(A().$('#studentSearch')?.value).toLowerCase(); const level=A().$('#studentLevelFilter')?.value||''; const rows=r.students.filter(s=>(!term||s.name.toLowerCase().includes(term))&&(!level||s.level===level)); list.innerHTML=rows.map(s=>`<button data-student="${s.index}"><b>${A().safe(s.name)}</b><br><span class="badge ${levelBadge(s.level)}">${s.level}</span> ${s.total}/${r.summary.nQuestions} (${s.percent}%)</button>`).join('')||'<p class="hint">Nenhum aluno encontrado com o filtro selecionado.</p>'; list.querySelectorAll('button').forEach(b=>b.onclick=()=>renderStudentDetail(Number(b.dataset.student)));}
 function studentDescriptorStats(s){const a=A().state.assessment, map={};s.correct.forEach((c,i)=>{const d=a.descriptors[i]||'Sem descritor';(map[d]??={descriptor:d,total:0,correct:0,errors:0,items:[]});map[d].total++;map[d].correct+=c;map[d].errors+=c?0:1;map[d].items.push({i,ok:c,question:a.questions[i]||'Q'+(i+1)});});return Object.values(map).map(x=>({...x,percent:A().pct(x.correct,x.total)})).sort((a,b)=>a.percent-b.percent||b.errors-a.errors);}
 function masteryText(s,stats){const weak=stats.filter(x=>x.percent<50), partial=stats.filter(x=>x.percent>=50&&x.percent<70), strong=stats.filter(x=>x.percent>=70);let txt;if(s.level==='Elementar I')txt='O estudante apresenta defasagem grave na avaliação aplicada. A prioridade é reduzir a quantidade de habilidades simultâneas, trabalhar leitura do comando, modelar resolução e acompanhar evidências semanais.';else if(s.level==='Elementar II')txt='O estudante reconhece parte das habilidades, mas ainda não sustenta autonomia. Precisa de intervenção focalizada nos descritores prioritários e exercícios graduados com devolutiva rápida.';else if(s.level==='Básico')txt='O estudante alcança o mínimo esperado na avaliação interna, porém ainda precisa consolidar descritores frágeis para ganhar estabilidade e reduzir erros por distração ou procedimento.';else txt='O estudante demonstra desempenho desejável. Recomenda-se manter revisão dos descritores com erro e oferecer desafios de maior complexidade, sem retirar acompanhamento.';return {txt,weak,partial,strong};}
 function renderStudentDetail(i){
  const r=compute(A().state.assessment), s=r.students.find(x=>x.index===i), box=A().$('#studentDetail'); if(!s||!box)return;
  const stats=studentDescriptorStats(s), read=masteryText(s,stats), weak=read.weak, partial=read.partial, strong=read.strong;
  const scoreBars=barRows([{label:'Acertos',value:s.percent,suffix:'%'},{label:'Erros',value:100-s.percent,suffix:'%'}],{compact:true});
  const descBars=barRows(stats.map(d=>({label:`${d.descriptor} (${d.correct}/${d.total})`,value:d.percent,suffix:'%'})),{compact:true});
  const questionStrip=`<div class="student-question-strip">${s.correct.map((c,k)=>`<span class="qdot ${c?'ok':'bad'}" title="${A().safe((A().state.assessment.questions[k]||'Q'+(k+1))+' • '+(A().state.assessment.descriptors[k]||''))}">${k+1}</span>`).join('')}</div>`;
  const weakList=weak.slice(0,5).map(d=>{const info=descInfo(d.descriptor);return `<li><b>${A().safe(d.descriptor)}</b> — ${d.errors} erro(s), ${d.percent}% no descritor. <br><span class="hint">${A().safe(info.texto)} | Intervenção: ${A().safe(info.estrategias||info.intervencao)}</span></li>`;}).join('')||'<li>Nenhum descritor abaixo de 50%.</li>';
  const partialList=partial.slice(0,4).map(d=>`<li>${A().safe(d.descriptor)} — ${d.percent}%: consolidar com treino curto.</li>`).join('')||'<li>Nenhum descritor em zona intermediária.</li>';
  const strongList=strong.slice(-4).reverse().map(d=>`<li>${A().safe(d.descriptor)} — ${d.percent}%: manter e ampliar.</li>`).join('')||'<li>Ainda não há descritores consolidados acima de 70%.</li>';
  const actions=weak.slice(0,3).map((d,idx)=>{const info=descInfo(d.descriptor);return `<li><b>Prioridade ${idx+1}: ${A().safe(d.descriptor)}</b> — aplicar 3 momentos: retomada curta do conceito, 4 itens guiados, 2 itens autônomos. Foco: ${A().safe(info.texto)}</li>`;}).join('')||'<li>Propor desafios de aprofundamento e monitorar manutenção do desempenho.</li>';
  box.innerHTML=`<div class="student-report"><div class="student-head"><div><h3>${A().safe(s.name)}</h3><p><span class="badge ${levelBadge(s.level)}">${s.level}</span> <b>${s.total}/${r.summary.nQuestions}</b> acertos (${s.percent}%)</p></div><div class="mini-score"><b>${s.percent}%</b><span>aproveitamento</span></div></div><p><b>Leitura pedagógica:</b> ${A().safe(read.txt)}</p><div class="student-grid"><div class="panel mini-panel"><h4>Acertos x erros</h4>${scoreBars}</div><div class="panel mini-panel"><h4>Questões</h4>${questionStrip}<p class="hint">Verde = acerto; vermelho = erro.</p></div></div><div class="panel mini-panel"><h4>Desempenho por descritor do aluno</h4>${descBars}</div><div class="student-grid"><div class="panel mini-panel"><h4>Descritores prioritários</h4><ul>${weakList}</ul></div><div class="panel mini-panel"><h4>Descritores em consolidação</h4><ul>${partialList}</ul></div></div><div class="panel mini-panel"><h4>Pontos fortes</h4><ul>${strongList}</ul></div><div class="panel mini-panel"><h4>Ações sugeridas ao professor</h4><ol>${actions}<li>Registrar no Mapa da Mina uma rotina de 4 semanas com 1h de estudo e 1h de exercícios semanais.</li><li>Na devolutiva, pedir que o estudante explique o erro em pelo menos uma questão prioritária antes de refazer itens semelhantes.</li></ol></div><div class="actions compact"><button onclick="ETE.showView('recuperacao');document.querySelector('#mapStudent').value='${i}';document.querySelector('#sheetStudent').value='${i}'">Gerar recuperação</button></div></div>`;
 }
 function renderTomorrow(){const r=compute(A().state.assessment);const box=A().$('#tomorrowPlan'); if(!box)return; const top=r.descriptorStats.slice(0,3); box.innerHTML=top.length?`<ol>${top.map((d,i)=>{const info=descInfo(d.descritor);return `<li><b>Prioridade ${i+1}: ${A().safe(d.descritor)}</b> — ${d.percent}% de aproveitamento. ${A().safe(info.texto)}. Ação: retomar conceito, resolver itens guiados e aplicar verificação curta.</li>`;}).join('')}</ol>`:'<p class="hint">Importe dados para gerar prioridade.</p>';}
 window.Diagnostico={compute,render,renderStudents,renderStudentDetail,levelBadge,barRows,pieChart};
})();
