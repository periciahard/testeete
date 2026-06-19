
(function(){
'use strict';

const LOGOS = ["vetor-logo.png"];
const $ = s => document.querySelector(s);
const A = () => window.VETOR;
const safe = s => String(s ?? '').replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const text = s => String(s ?? '').replace(/\s+/g,' ').trim();

function tipoLabel(t){
  const map={diagnostica:'Diagnóstica',recuperacao:'Recuperação',bimestral:'Bimestral',personalizada:'Personalizada'};
  for(let i=1;i<=10;i++) map['simulado'+i]='Simulado '+i;
  return map[t] || t || 'Avaliação';
}
function avalNome(a){
  if(!a) a = A()?.state?.assessment || {};
  const title = (a.title && a.title !== 'Avaliação' && a.title !== 'Nova avaliação') ? a.title : '';
  return title || tipoLabel(a.tipo) || 'Avaliação';
}
function assessment(){ return A()?.state?.assessment || {}; }
function results(){ return A()?.getResults?.() || {students:[],summary:{},descriptorStats:[]}; }
function compute(a){ return window.Diagnostico?.compute(a) || {students:[],summary:{avg:0,nStudents:0,nQuestions:0,priority:0,levels:{}},descriptorStats:[]}; }
function avaliacoes(){ return (A()?.state?.assessments||[]).filter(x=>(x.students||[]).length&&(x.questions||[]).length); }
function fileSafe(s){ return String(s||'documento').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase() || 'documento'; }

async function fetchArrayBuffer(url){
  const r = await fetch(url);
  if(!r.ok) throw new Error('Falha ao carregar: '+url);
  return await r.arrayBuffer();
}
async function fetchDataUri(url){
  const r = await fetch(url);
  if(!r.ok) return null;
  const blob = await r.blob();
  return await new Promise(resolve=>{
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.readAsDataURL(blob);
  });
}
function inferInfo(turma){
  const t=String(turma||'').toUpperCase();
  const serie = t.includes('3') ? '3º Ano' : t.includes('2') ? '2º Ano' : '1º Ano';
  const curso = t.includes('RED') ? 'Red' : (t.includes('ADM') || t.includes('ADMIN')) ? 'Adm' : '';
  const letra = /\bA\b/.test(t) ? 'A' : /\bB\b/.test(t) ? 'B' : '';
  return {serie, curso, letra};
}
function selectedStudentName(){
  const sels=['#sheetStudent','#v59Student','#mapStudent'];
  for(const s of sels){
    const el=$(s);
    if(el && el.value!==''){
      const st = results().students?.[Number(el.value)];
      if(st?.name || st?.nome) return st.name || st.nome;
    }
  }
  return '_________________________________________________________';
}
function extractQuestions(){
  let html='';
  if(window.Fichas?.render){
    const prev=$('#v57Preview');
    if(!prev || prev.classList.contains('empty') || !prev.textContent.trim()) window.Fichas.render();
    html = $('#v57Preview')?.innerHTML || '';
  }
  if(!html && window.Impressao?.generate){
    window.Impressao.generate();
    html = window.__IMPRESSAO_LAST?.html || $('#v59Preview')?.innerHTML || '';
  }

  const div=document.createElement('div');
  div.innerHTML=html;
  let nodes=[...div.querySelectorAll('.qitem,.print-question,.questao-modelo')];
  if(!nodes.length){
    const a=assessment();
    nodes=(a.questions||[]).map((q,i)=>({textContent:q, querySelector:()=>null, __idx:i}));
  }
  return nodes.map((node,i)=>{
    const idx=i+1;
    const base = node.querySelector?.('.texto-base,.print-textbase')?.textContent?.trim() || '';
    const p = node.querySelector?.('p')?.textContent?.trim() || '';
    const raw = node.textContent ? node.textContent.replace(/\s+/g,' ').trim() : '';
    let enunciado = p || raw || `Texto da questão ${idx}`;
    let alts=[];
    const altContainer=[...node.querySelectorAll?.('div,p,ol')||[]].map(x=>x.textContent.trim()).find(x=>/A\)/.test(x)&&/B\)/.test(x));
    if(altContainer) alts=altContainer.split(/(?=[A-E]\))/).map(x=>x.trim()).filter(Boolean);
    const a=assessment();
    if(!alts.length && a.key?.length){
      alts=['A) ________________________________','B) ________________________________','C) ________________________________','D) ________________________________','E) ________________________________'];
    }
    return {n:idx, base, enunciado, alts};
  }).filter(q=>q.enunciado || q.base);
}
function headerHtml(aluno){
  const a=assessment(), info=inferInfo(a.turma);
  const data=a.date ? a.date.split('-').reverse().join(' / ') : '___ / ___ / 2026';
  const logoHtml = LOGOS.map(l=>`<img src="assets/${l}" />`).join('');
  return `
  <div class="modelo-doc-header">
    <div class="logos">${logoHtml}</div>
    <div class="campos">
      <p><b>Estudante:</b> ${safe(aluno)} <span class="right"><b>Turma:</b> ${info.letra==='A'?'( X )A':'(   )A'} &nbsp; ${info.letra==='B'?'( X )B':'(   )B'}</span></p>
      <p><b>Série:</b> ${info.serie==='1º Ano'?'( X ) 1º Ano':'(    ) 1º Ano'} &nbsp; ${info.serie==='2º Ano'?'( X ) 2º Ano':'(    ) 2º Ano'} &nbsp; ${info.serie==='3º Ano'?'( X ) 3º Ano':'(    ) 3º Ano'} <span class="right"><b>Curso:</b> ${info.curso==='Adm'?'( X ) Adm':'(   ) Adm'} &nbsp; ${info.curso==='Red'?'( X ) Red':'(   ) Red'}</span></p>
      <p><b>Data:</b> ${safe(data)} <span class="disc"><b>Disciplina:</b> ${safe(a.discipline||'')}</span> <span class="prof"><b>Professor:</b> Felipe Camargo</span> <b>${safe(avalNome(a))}</b></p>
    </div>
  </div>`;
}
function docHtml(aluno){
  const qs=extractQuestions();
  const body=qs.length ? qs.map(q=>{
    const comando = q.base ? `<p>${safe(q.base)}</p><p>${safe(q.enunciado)}</p>` : `<p>${safe(q.enunciado)}</p>`;
    const alternativas = q.alts?.length ? `<p class="alts">${q.alts.map(safe).join('<br>')}</p>` : '';
    return `<div class="questao-doc"><p><b>QUESTÃO ${String(q.n).padStart(2,'0')}</b> – ${comando.replace(/^<p>|<\/p>$/g,'')}</p>${alternativas}</div>`;
  }).join('') : '<div class="questao-doc"><p><b>QUESTÃO 01</b> – Texto da questão ..............................................................................................................................................................</p></div>';

  return `<div class="modelo-doc-page">${headerHtml(aluno)}${body}</div>`;
}
function fullDocHtml(aluno){
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @page{size:A4;margin:12mm}
  body{font-family:Arial,Helvetica,sans-serif;color:#111;background:white;font-size:11.5pt;line-height:1.28}
  .modelo-doc-page{width:185mm;margin:0 auto;background:white}
  .modelo-doc-header{border-bottom:1px solid #222;margin-bottom:20px;padding-bottom:8px}
  .modelo-doc-header .logos{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;min-height:45px}
  .modelo-doc-header .logos img{max-height:45px;max-width:180px;object-fit:contain}
  .modelo-doc-header p{margin:5px 0}
  .modelo-doc-header .right{float:right}
  .modelo-doc-header .disc{margin-left:25px}
  .modelo-doc-header .prof{margin-left:30px}
  .questao-doc{margin:16px 0;page-break-inside:avoid}
  .questao-doc p{margin:6px 0}
  .alts{margin-left:14px}
  .texto-base,.qitem{background:transparent!important;border:0!important;padding:0!important}
  </style></head><body>${docHtml(aluno)}</body></html>`;
}
function downloadBlob(name, blob){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=name;
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);
}
async function gerarPdf(){
  const aluno=selectedStudentName();
  const html=fullDocHtml(aluno);
  const holder=document.createElement('div');
  holder.innerHTML=html;
  const page=holder.querySelector('.modelo-doc-page');
  page.style.background='white';
  page.style.width='185mm';
  page.style.minHeight='260mm';
  page.style.padding='0';
  page.style.margin='0 auto';

  const wrap=document.createElement('div');
  wrap.id='pdf-render-institucional';
  wrap.style.background='white';
  wrap.style.position='relative';
  wrap.style.zIndex='999999';
  wrap.style.padding='12mm';
  wrap.style.width='210mm';
  wrap.style.minHeight='297mm';
  wrap.appendChild(page);
  document.body.appendChild(wrap);

  try{
    if(!window.html2pdf){
      alert('Biblioteca de PDF não carregou. Atualize a página e tente novamente.');
      return;
    }
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    await html2pdf().set({
      margin: 0,
      filename: 'ficha-institucional-vetor.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css','legacy'], avoid: ['.questao-doc'] }
    }).from(wrap).save();
  }finally{
    setTimeout(()=>wrap.remove(),500);
  }
}
async function gerarWord(){
  const aluno=selectedStudentName();
  const a=assessment(), info=inferInfo(a.turma);
  const qs=extractQuestions();
  const data=a.date ? a.date.split('-').reverse().join(' / ') : '___ / ___ / 2026';

  if(!window.docx){
    const blob=new Blob([fullDocHtml(aluno)],{type:'application/msword;charset=utf-8'});
    downloadBlob('ficha-institucional-vetor.doc',blob);
    return;
  }

  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, ImageRun, HeadingLevel } = window.docx;
  const children=[];

  // logo VETOR
  if(LOGOS.length){
    const logoRuns=[];
    for(const l of LOGOS.slice(0,3)){
      try{
        const buf=await fetchArrayBuffer('assets/'+l);
        logoRuns.push(new ImageRun({data:buf, transformation:{width:120,height:42}}));
        logoRuns.push(new TextRun({text:'     '}));
      }catch(e){}
    }
    if(logoRuns.length) children.push(new Paragraph({children:logoRuns, alignment:AlignmentType.CENTER, spacing:{after:120}}));
  }

  const cell = (content, width=5000) => new TableCell({width:{size:width,type:WidthType.DXA}, children:Array.isArray(content)?content:[new Paragraph({children:[new TextRun({text:String(content), size:22})]})]});
  children.push(new Table({
    width:{size:100,type:WidthType.PERCENTAGE},
    borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE},insideH:{style:BorderStyle.NONE},insideV:{style:BorderStyle.NONE}},
    rows:[
      new TableRow({children:[
        cell([new Paragraph({children:[new TextRun({text:'Estudante: ',bold:true,size:22}),new TextRun({text:aluno,size:22})]})],7500),
        cell([new Paragraph({children:[new TextRun({text:'Turma: ',bold:true,size:22}),new TextRun({text:`${info.letra==='A'?'( X )A':'(   )A'}   ${info.letra==='B'?'( X )B':'(   )B'}`,size:22})]})],2500)
      ]}),
      new TableRow({children:[
        cell([new Paragraph({children:[new TextRun({text:'Série: ',bold:true,size:22}),new TextRun({text:`${info.serie==='1º Ano'?'( X ) 1º Ano':'(    ) 1º Ano'}   ${info.serie==='2º Ano'?'( X ) 2º Ano':'(    ) 2º Ano'}   ${info.serie==='3º Ano'?'( X ) 3º Ano':'(    ) 3º Ano'}`,size:22})]})],6500),
        cell([new Paragraph({children:[new TextRun({text:'Curso: ',bold:true,size:22}),new TextRun({text:`${info.curso==='Adm'?'( X ) Adm':'(   ) Adm'}   ${info.curso==='Red'?'( X ) Red':'(   ) Red'}`,size:22})]})],3500)
      ]}),
      new TableRow({children:[
        cell([new Paragraph({children:[new TextRun({text:'Data: ',bold:true,size:22}),new TextRun({text:data,size:22}),new TextRun({text:'     Disciplina: ',bold:true,size:22}),new TextRun({text:a.discipline||'',size:22}),new TextRun({text:'     Professor: ',bold:true,size:22}),new TextRun({text:'Felipe Camargo',size:22}),new TextRun({text:'     '+avalNome(a),bold:true,size:22})]})],10000)
      ]})
    ]
  }));
  children.push(new Paragraph({text:'', border:{bottom:{color:'222222',space:1,style:BorderStyle.SINGLE,size:6}}, spacing:{after:220}}));

  qs.forEach(q=>{
    children.push(new Paragraph({children:[new TextRun({text:`QUESTÃO ${String(q.n).padStart(2,'0')} – `,bold:true,size:23}),new TextRun({text:q.base || q.enunciado || '',size:23})], spacing:{before:160,after:80}}));
    if(q.base && q.enunciado) children.push(new Paragraph({children:[new TextRun({text:q.enunciado,size:23})], spacing:{after:80}}));
    (q.alts||[]).forEach(alt=>children.push(new Paragraph({children:[new TextRun({text:alt,size:22})], spacing:{after:35}})));
  });

  const doc=new Document({
    sections:[{properties:{page:{margin:{top:680,right:680,bottom:680,left:680}}},children}]
  });
  const blob=await Packer.toBlob(doc);
  downloadBlob('ficha-institucional-vetor.docx',blob);
}

function avg(values){return values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length*10)/10:0}
function latestByTurma(avals){
  const m={};
  avals.forEach(a=>{if(!m[a.turma] || (a.date||'') >= (m[a.turma].date||''))m[a.turma]=a});
  return Object.values(m);
}
function groupKey(a){return (a.turma||'Turma')+' | '+(a.discipline||'Disciplina')}
function bar(slide,pptx,label,value,x,y,w,color){
  value=Math.max(0,Math.min(100,Number(value)||0));
  slide.addText(label,{x,y,w:4.4,h:0.22,fontSize:9,bold:true,color:'28364A',fit:'shrink'});
  slide.addShape(pptx.ShapeType.roundRect,{x:x+4.6,y:y+0.01,w,h:0.18,rectRadius:0.03,fill:{color:'E9EEF6'},line:{color:'E9EEF6'}});
  slide.addShape(pptx.ShapeType.roundRect,{x:x+4.6,y:y+0.01,w:w*value/100,h:0.18,rectRadius:0.03,fill:{color},line:{color}});
  slide.addText(value+'%',{x:x+4.6+w+0.1,y:y-0.02,w:0.65,h:0.22,fontSize:9,color:'28364A'});
}
async function gerarPptProfissional(){
  if(!window.PptxGenJS){alert('PowerPoint não carregou. Atualize a página.');return;}
  const pptx=new PptxGenJS();
  pptx.layout='LAYOUT_WIDE';
  pptx.author='VETOR';

  const blue='0F2E5F', green='1D6B42', yellow='FFD23F', red='B42318', amber='C98200', gray='64748B', light='F7FAFC';
  const avals=avaliacoes();
  if(!avals.length){alert('Não há avaliações salvas com dados.');return;}

  let logoData=null;
  if(LOGOS[0]) logoData=await fetchDataUri('assets/'+LOGOS[0]);

  function slideBase(title,subtitle=''){
    const slide=pptx.addSlide();
    slide.background={color:'FFFFFF'};
    slide.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.33,h:0.23,fill:{color:yellow},line:{color:yellow}});
    slide.addShape(pptx.ShapeType.rect,{x:0,y:0.23,w:13.33,h:0.06,fill:{color:blue},line:{color:blue}});
    if(logoData) slide.addImage({data:logoData,x:11.55,y:0.38,w:1.25,h:0.55});
    slide.addText(title,{x:0.48,y:0.42,w:10.8,h:0.36,fontSize:22,bold:true,color:blue,margin:0});
    if(subtitle) slide.addText(subtitle,{x:0.5,y:0.83,w:10.9,h:0.25,fontSize:9.5,color:gray,margin:0});
    slide.addText('VETOR',{x:0.5,y:7.04,w:6.5,h:0.2,fontSize:8.5,color:gray});
    return slide;
  }
  function card(slide,title,value,x,y,w=2.8,h=1.05,color=blue){
    slide.addShape(pptx.ShapeType.roundRect,{x,y,w,h,rectRadius:0.09,fill:{color:'FFFFFF'},line:{color:'D7E0ED',width:1}});
    slide.addShape(pptx.ShapeType.rect,{x,y,w:0.08,h,fill:{color},line:{color}});
    slide.addText(title,{x:x+0.18,y:y+0.14,w:w-0.25,h:0.2,fontSize:8.5,color:gray,bold:true,margin:0});
    slide.addText(String(value),{x:x+0.18,y:y+0.45,w:w-0.25,h:0.36,fontSize:18,color:blue,bold:true,fit:'shrink',margin:0});
  }

  // 1 capa
  let slide=pptx.addSlide();
  slide.background={color:blue};
  slide.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.33,h:0.25,fill:{color:yellow},line:{color:yellow}});
  if(logoData) slide.addImage({data:logoData,x:0.8,y:0.65,w:1.6,h:0.75});
  slide.addText('DIAGNÓSTICO\nPEDAGÓGICO', {x:0.8,y:1.85,w:8.5,h:1.25,fontSize:38,bold:true,color:'FFFFFF',breakLine:false,margin:0});
  slide.addText('Resultados, evolução e plano de intervenção', {x:0.84,y:3.28,w:9,h:0.35,fontSize:17,color:yellow,margin:0});
  slide.addText('VETOR', {x:0.84,y:6.4,w:8,h:0.3,fontSize:14,color:'FFFFFF',margin:0});
  slide.addText(new Date().toLocaleDateString('pt-BR'), {x:10.2,y:6.4,w:2.3,h:0.3,fontSize:14,color:'FFFFFF',align:'right',margin:0});

  // dados
  const turmas=[...new Set(avals.map(a=>a.turma).filter(Boolean))];
  const alunos=new Set(); avals.forEach(a=>(a.students||[]).forEach(s=>alunos.add((a.turma||'')+'|'+(s.name||s.nome||''))));
  const medias=avals.map(a=>compute(a).summary.avg||0);
  const latest=latestByTurma(avals).map(a=>({a,r:compute(a)})).sort((x,y)=>y.r.summary.avg-x.r.summary.avg);

  // 2 resumo
  slide=slideBase('Resumo institucional','Panorama geral das avaliações salvas no sistema');
  card(slide,'Avaliações',avals.length,0.7,1.35,2.7,1.05,blue);
  card(slide,'Turmas',turmas.length,3.7,1.35,2.7,1.05,green);
  card(slide,'Alunos mapeados',alunos.size,6.7,1.35,2.7,1.05,amber);
  card(slide,'Média geral',avg(medias)+'%',9.7,1.35,2.7,1.05,red);
  slide.addText('Leitura rápida', {x:0.75,y:3.05,w:4,h:0.3,fontSize:16,bold:true,color:blue});
  const melhor=latest[0], pior=latest[latest.length-1];
  slide.addText(`Melhor desempenho atual: ${melhor?.a?.turma||'-'} (${melhor?.r?.summary?.avg||0}%).\nTurma de maior atenção: ${pior?.a?.turma||'-'} (${pior?.r?.summary?.avg||0}%).\nA média institucional considera todas as avaliações salvas no histórico institucional.`, {x:0.78,y:3.5,w:11.7,h:1.2,fontSize:16,color:'263238',breakLine:false});

  // 3 ranking
  slide=slideBase('Ranking das turmas','Última avaliação registrada por turma');
  latest.slice(0,10).forEach((x,i)=>{
    const y=1.25+i*0.48;
    const col=x.r.summary.avg<50?red:(x.r.summary.avg<70?amber:green);
    slide.addText(`${i+1}. ${x.a.turma||'-'}`,{x:0.75,y,w:4.8,h:0.25,fontSize:11,bold:true,color:'28364A',fit:'shrink'});
    slide.addText(`${x.a.discipline||''} • ${tipoLabel(x.a.tipo)} • ${x.r.summary.priority||0} abaixo`,{x:5.15,y,w:3.0,h:0.25,fontSize:9,color:gray,fit:'shrink'});
    bar(slide,pptx,'',x.r.summary.avg,8.3,y,3.3,col);
  });

  // 4 evolução
  slide=slideBase('Evolução por turma e disciplina','Primeira avaliação × última avaliação');
  const groups={}; avals.forEach(a=>(groups[groupKey(a)]??=[]).push(a));
  Object.values(groups).forEach(arr=>arr.sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(a.tipo||'').localeCompare(b.tipo||'')));
  let y=1.2;
  Object.entries(groups).slice(0,10).forEach(([k,arr])=>{
    const r1=compute(arr[0]).summary.avg||0, r2=compute(arr[arr.length-1]).summary.avg||0, d=Math.round((r2-r1)*10)/10;
    slide.addText(k,{x:0.72,y,w:4.2,h:0.2,fontSize:8.5,bold:true,color:'28364A',fit:'shrink'});
    slide.addText(`${r1}% → ${r2}% (${d>0?'+':''}${d}%)`,{x:4.85,y,w:2.0,h:0.2,fontSize:9,color:d>=0?green:red,bold:true});
    bar(slide,pptx,'',r2,6.65,y,4.0,d>=0?green:red);
    y+=0.46;
  });

  // 5 ativa
  const a=assessment();
  const r=results();
  slide=slideBase('Avaliação ativa',`${a.turma||'-'} • ${a.discipline||'-'} • ${avalNome(a)}`);
  card(slide,'Alunos',r.summary.nStudents||0,0.7,1.3,2.4,0.95,blue);
  card(slide,'Questões',r.summary.nQuestions||0,3.35,1.3,2.4,0.95,green);
  card(slide,'Média',`${r.summary.avg||0}%`,6.0,1.3,2.4,0.95,amber);
  card(slide,'Abaixo da meta',r.summary.priority||0,8.65,1.3,2.8,0.95,red);
  slide.addText('Distribuição pedagógica', {x:0.72,y:2.75,w:5,h:0.3,fontSize:16,bold:true,color:blue});
  const levels=r.summary.levels||{};
  y=3.25;
  ['Elementar I','Elementar II','Básico','Desejável'].forEach(l=>{
    const pct=r.summary.nStudents?Math.round((levels[l]||0)/r.summary.nStudents*100):0;
    bar(slide,pptx,l,pct,0.75,y,6.0,l.includes('Elementar')?red:(l==='Básico'?amber:green));
    y+=0.5;
  });

  // 6 críticos
  slide=slideBase('Descritores críticos','Menores aproveitamentos da avaliação ativa');
  y=1.2;
  (r.descriptorStats||[]).slice(0,10).forEach(d=>{
    const color=d.percent<50?red:(d.percent<70?amber:green);
    bar(slide,pptx,`${d.descritor}`,d.percent,0.8,y,8.5,color);
    y+=0.48;
  });

  // 7 fortes
  slide=slideBase('Descritores fortes','Maiores aproveitamentos da avaliação ativa');
  y=1.2;
  (r.descriptorStats||[]).slice().sort((a,b)=>b.percent-a.percent).slice(0,10).forEach(d=>{
    bar(slide,pptx,`${d.descritor}`,d.percent,0.8,y,8.5,green);
    y+=0.48;
  });

  // 8 evolução descritor
  slide=slideBase('Evolução por descritor','Comparação da primeira e da última avaliação da turma/disciplina ativa');
  const g=groups[groupKey(a)]||[];
  if(g.length>=2){
    const m1=Object.fromEntries((compute(g[0]).descriptorStats||[]).map(d=>[d.descritor,d.percent]));
    const m2=Object.fromEntries((compute(g[g.length-1]).descriptorStats||[]).map(d=>[d.descritor,d.percent]));
    const codes=[...new Set([...Object.keys(m1),...Object.keys(m2)])].sort((x,y)=>x.localeCompare(y,'pt-BR',{numeric:true}));
    y=1.15;
    codes.slice(0,12).forEach(d=>{
      const v1=m1[d]||0, v2=m2[d]||0, delta=Math.round((v2-v1)*10)/10;
      slide.addText(`${d}: ${v1}% → ${v2}% (${delta>0?'+':''}${delta}%)`,{x:0.75,y,w:4.2,h:0.22,fontSize:9,bold:true,color:delta>=0?green:red,fit:'shrink'});
      bar(slide,pptx,'',v2,4.9,y,5.4,delta>=0?green:red);
      y+=0.43;
    });
  } else slide.addText('Ainda não há duas avaliações salvas para esta turma/disciplina.',{x:0.8,y:1.6,w:10,h:0.4,fontSize:18,color:gray});

  // 9 abaixo da meta
  slide=slideBase('Estudantes abaixo da meta','Prioridade para intervenção pedagógica');
  const abaixo=(r.students||[]).filter(s=>(s.percent||0)<60).sort((a,b)=>a.percent-b.percent).slice(0,14);
  y=1.15;
  abaixo.forEach((s,i)=>{
    const color=s.percent<40?red:(s.percent<60?amber:green);
    slide.addText(`${i+1}. ${s.name||s.nome||''}`,{x:0.75,y,w:5.5,h:0.22,fontSize:8.5,bold:true,color:'28364A',fit:'shrink'});
    slide.addText(s.level||'',{x:6.0,y,w:1.4,h:0.22,fontSize:8.5,color:gray});
    bar(slide,pptx,'',s.percent,7.2,y,3.7,color);
    y+=0.4;
  });

  // 10 plano
  slide=slideBase('Plano de intervenção','Encaminhamentos para o próximo ciclo');
  const crit=(r.descriptorStats||[]).slice(0,5);
  y=1.2;
  crit.forEach((d,i)=>{
    slide.addShape(pptx.ShapeType.roundRect,{x:0.8,y:y-0.06,w:11.6,h:0.5,rectRadius:0.05,fill:{color:light},line:{color:'E2E8F0'}});
    slide.addText(`${i+1}. ${d.descritor}`,{x:1.0,y,w:0.8,h:0.25,fontSize:13,bold:true,color:blue});
    slide.addText(`Retomar habilidade, resolver itens guiados e aplicar verificação curta. Aproveitamento: ${d.percent}%.`,{x:1.85,y,w:10.1,h:0.25,fontSize:11,color:'28364A',fit:'shrink'});
    y+=0.65;
  });
  slide.addText('Ações gerais: gerar fichas, organizar grupos por descritor, reaplicar atividade curta e registrar evidências para a coordenação.',{x:0.85,y:5.2,w:11.4,h:0.55,fontSize:15,color:green,bold:true,fit:'shrink'});

  // 11 final
  slide=slideBase('Síntese para decisão pedagógica','Uso dos dados para intervenção e acompanhamento');
  slide.addText('O diagnóstico deve orientar ações objetivas, acompanhar evolução e apoiar o planejamento coletivo da escola.',{x:0.9,y:1.5,w:11.5,h:1.0,fontSize:26,bold:true,color:blue,fit:'shrink'});
  slide.addText('Próximo passo recomendado: intervenção focada nos descritores críticos e nova comparação no próximo simulado.',{x:0.9,y:3.2,w:11.5,h:0.6,fontSize:18,color:green,bold:true});

  await pptx.writeFile({fileName:'vetor-diagnostico-profissional-v68-7.pptx'});
}

function bind(){
  const idsPdf=['#v57Print','#v59Print','#printSheet','#printMap'];
  idsPdf.forEach(id=>{const el=$(id); if(el) el.onclick=gerarPdf;});
  const idsWord=['#v57Doc','#v59Word'];
  idsWord.forEach(id=>{const el=$(id); if(el) el.onclick=gerarWord;});
  const pptButtons=['#generatePptxReport','#coordenacaoPptxBtn','#coordInstitucionalPptx'];
  pptButtons.forEach(id=>{const el=$(id); if(el) el.onclick=gerarPptProfissional;});
  // Corrigir label da avaliação quando estiver genérico.
  setInterval(()=>document.querySelectorAll('*').forEach(el=>{
    if(el.childNodes && el.childNodes.length===1 && el.textContent==='Avaliação: Avaliação') el.textContent='Avaliação: '+avalNome();
  }),2500);
}

document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,900));
window.ExportacoesOffice={gerarPdf,gerarWord,gerarPptProfissional,fullDocHtml,docHtml};
})();
