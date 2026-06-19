(function(){
  'use strict';
  const SUPABASE_URL='https://shqnaeatdkdtnheswggq.supabase.co';
  const SUPABASE_KEY='sb_publishable_ByueLBjkkGNOW0Wt2yD7hg_n0YDvMqi';
  const A=()=>window.ETE;
  const URL_KEY='ete_supabase_url';
  const ANON_KEY='ete_supabase_anon';
  const has=v=>v!==undefined && v!==null && String(v).trim()!=='';
  const Cloud={
    client:null, session:null, profile:null, turmas:[], assessments:[], selectedCloudAssessment:null,
    uiDiscToDb(d){return /mat/i.test(String(d||''))?'matematica':'lingua_portuguesa'},
    dbDiscToUi(d){return d==='matematica'?'Matemática':'Língua Portuguesa'},
    isCoord(){return ['admin','coordenacao','coordenação','coordenador'].includes(String(this.profile?.perfil||'').toLowerCase())},
    getConfig(){
      const st=A()?.state?.settings||{};
      const url=(st.supabaseUrl||localStorage.getItem(URL_KEY)||SUPABASE_URL).trim();
      const anon=(st.supabaseAnonKey||localStorage.getItem(ANON_KEY)||SUPABASE_KEY).trim();
      return {url:url.replace(/\/rest\/v1\/?$/,''),anon};
    },
    setStatus(msg,type='work'){
      if(A()?.status) A().status('#cloudStatus',msg,type);
      const mini=document.querySelector('#cloudStatusMini');
      if(mini){mini.textContent= type==='ok' ? 'Nuvem conectada' : 'Modo local'; mini.className='cloud-mini '+(type==='ok'?'ok':'');}
      const quick=document.querySelector('#cloudQuickStatus');
      if(quick){quick.style.display='block'; quick.className='statusbox '+(type==='ok'?'status-ok':type==='error'?'status-error':'status-work'); quick.textContent=msg;}
    },
    bind(){
      document.querySelector('#saveSupabaseConfig')&&(document.querySelector('#saveSupabaseConfig').onclick=()=>this.saveConfig());
      document.querySelector('#testSupabaseConfig')&&(document.querySelector('#testSupabaseConfig').onclick=()=>this.testConfig());
      document.querySelector('#cloudLogin')&&(document.querySelector('#cloudLogin').onclick=()=>this.login());
      document.querySelector('#cloudLogout')&&(document.querySelector('#cloudLogout').onclick=()=>this.logout());
      document.querySelector('#cloudRefresh')&&(document.querySelector('#cloudRefresh').onclick=()=>this.loadCloudContext());
      document.querySelector('#cloudSaveAssessment')&&(document.querySelector('#cloudSaveAssessment').onclick=()=>this.saveCurrentAssessment());
      document.querySelector('#cloudQuickSave')&&(document.querySelector('#cloudQuickSave').onclick=()=>this.saveCurrentAssessment());
      document.querySelector('#cloudLoadAssessments')&&(document.querySelector('#cloudLoadAssessments').onclick=()=>this.listAssessments());
    },
    init(){
      this.bind();
      const cfg=this.getConfig();
      const u=document.querySelector('#supabaseUrl'), k=document.querySelector('#supabaseAnonKey');
      if(u)u.value=cfg.url; if(k)k.value=cfg.anon;
      if(!this.initClient())return;
      this.restoreSession();
    },
    initClient(){
      const cfg=this.getConfig();
      if(!window.supabase){this.setStatus('Biblioteca Supabase não carregou. O modo local continua funcionando.','error');return false;}
      try{this.client=window.supabase.createClient(cfg.url,cfg.anon);return true;}catch(e){this.setStatus('Erro ao criar cliente Supabase: '+e.message,'error');return false;}
    },
    saveConfig(){
      const url=(document.querySelector('#supabaseUrl')?.value||SUPABASE_URL).trim().replace(/\/rest\/v1\/?$/,'');
      const anon=(document.querySelector('#supabaseAnonKey')?.value||SUPABASE_KEY).trim();
      if(!url||!anon){this.setStatus('Informe URL do Supabase e chave pública.','error');return;}
      if(/secret|service_role/i.test(anon)){this.setStatus('Essa chave parece ser secreta/service role. Não salve chave secreta no site.','error');return;}
      if(A()?.state?.settings){A().state.settings.supabaseUrl=url; A().state.settings.supabaseAnonKey=anon; A().save?.();}
      localStorage.setItem(URL_KEY,url); localStorage.setItem(ANON_KEY,anon);
      this.client=null; this.session=null; this.profile=null; this.initClient();
      this.setStatus('Configuração salva. Faça login institucional.','ok');
    },
    async testConfig(){
      this.saveConfig(); if(!this.client)return;
      try{const {error}=await this.client.from('perfis').select('id').limit(1); if(error)throw error; this.setStatus('Conexão com Supabase funcionando.','ok');}
      catch(e){this.setStatus('Falha no teste: '+e.message,'error');}
    },
    async restoreSession(){
      if(!this.client&&!this.initClient())return;
      try{const {data}=await this.client.auth.getSession(); this.session=data.session||null; if(this.session) await this.loadCloudContext(); else this.setStatus('Supabase configurado. Faça login para sincronizar.','work');}
      catch(e){this.setStatus('Não foi possível verificar sessão: '+e.message,'error');}
    },
    async mainLogin(email,password){
      if(!this.client&&!this.initClient())return null;
      const {data,error}=await this.client.auth.signInWithPassword({email,password});
      if(error)throw error;
      this.session=data.session;
      await this.loadCloudContext();
      return this.profile;
    },
    async login(){
      const email=document.querySelector('#cloudEmail')?.value.trim(); const password=document.querySelector('#cloudPassword')?.value;
      if(!email||!password){this.setStatus('Informe e-mail e senha cadastrados no Supabase.','error');return;}
      try{this.setStatus('Entrando...', 'work'); await this.mainLogin(email,password);}
      catch(e){this.setStatus('Erro no login: '+e.message,'error');}
    },
    async logout(){
      if(this.client)await this.client.auth.signOut();
      this.session=null; this.profile=null; this.turmas=[]; this.assessments=[];
      const turma=document.querySelector('#cloudTurma'); if(turma)turma.innerHTML='<option value="">Faça login para carregar turmas</option>';
      const list=document.querySelector('#cloudAssessmentsList'); if(list)list.innerHTML='';
      const user=document.querySelector('#cloudUserBox'); if(user)user.innerHTML='';
      const dash=document.querySelector('#cloudCoordDashboard'); if(dash)dash.innerHTML='';
      this.setStatus('Saiu da nuvem.','work');
    },
    async loadCloudContext(){
      if(!this.client&&!this.initClient())return;
      if(!this.session){const {data}=await this.client.auth.getSession(); this.session=data.session||null;}
      if(!this.session){this.setStatus('Faça login para carregar dados.','work');return;}
      const uid=this.session.user.id;
      const {data:profile,error:pErr}=await this.client.from('perfis').select('*').eq('id',uid).maybeSingle();
      if(pErr)throw pErr;
      if(!profile)throw new Error('Usuário autenticado, mas sem perfil na tabela perfis.');
      this.profile=profile;
      await this.loadTurmas();
      try{await window.TurmasETE?.syncFromSupabase?.();}catch(e){console.warn('Falha ao sincronizar turmas/alunos',e);}
      this.renderUserBox();
      this.setStatus(`Conectado como ${profile.nome} (${profile.perfil}).`,'ok');
      await this.listAssessments(false);
    },
    async loadTurmas(){
      const {data,error}=await this.client.from('turmas').select('*').order('nome');
      if(error){this.setStatus('Erro ao carregar turmas: '+error.message,'error');this.turmas=[];return;}
      this.turmas=(data||[]).map(t=>({turma:t,disciplina:null,permissao:this.isCoord()?'gerenciar':'editar'}));
      this.renderTurmas();
    },
    renderUserBox(){
      const box=document.querySelector('#cloudUserBox'); if(!box||!this.profile)return;
      const vinc=this.isCoord()?'Acesso de coordenação/admin: visualiza e salva dados institucionais.':`${this.turmas.length} turma(s) disponível(is).`;
      box.innerHTML=`<div class="cloud-card"><b>${A().safe(this.profile.nome)}</b><br><span>${A().safe(this.profile.email)}</span><br><span class="badge ok">${A().safe(this.profile.perfil)}</span><p class="hint">${vinc}</p></div>`;
    },
    renderTurmas(){
      const sel=document.querySelector('#cloudTurma'); if(!sel)return;
      if(!this.turmas.length){sel.innerHTML='<option value="">Nenhuma turma cadastrada ainda</option>';return;}
      sel.innerHTML='<option value="">Selecione a turma</option>'+this.turmas.map((x,i)=>`<option value="${i}">${A().safe(x.turma.nome||'Turma')} ${x.turma.serie?('— '+A().safe(x.turma.serie)):''}</option>`).join('');
    },
    selectedTurmaLink(){
      const sel=document.querySelector('#cloudTurma');
      const raw=sel?.value;
      if(raw!==undefined && raw!==null && raw!=='' && !Number.isNaN(Number(raw))){
        const idx=Number(raw); if(idx>=0 && this.turmas[idx]) return this.turmas[idx];
      }
      const nome=A()?.state?.assessment?.turma||'';
      if(nome){
        const n=A().norm(nome).toLowerCase();
        return this.turmas.find(x=>A().norm(x.turma?.nome||'').toLowerCase()===n)||null;
      }
      return null;
    },
    async ensureTurmaForAssessment(){
      let link=this.selectedTurmaLink();
      if(link)return link;
      const nome=A()?.state?.assessment?.turma||'';
      if(!nome) return null;
      const clean=A().norm(nome)||'Turma sem nome';
      let {data,error}=await this.client.from('turmas').select('*').ilike('nome',clean).maybeSingle();
      if(error && !/multiple/i.test(error.message||'')) throw error;
      if(data){link={turma:data,disciplina:null,permissao:this.isCoord()?'gerenciar':'editar'}; this.turmas.push(link); this.renderTurmas(); return link;}
      const {data:created,error:cErr}=await this.client.from('turmas').insert({nome:clean,serie:'Não informada'}).select('*').single();
      if(cErr) throw cErr;
      link={turma:created,disciplina:null,permissao:this.isCoord()?'gerenciar':'editar'}; this.turmas.push(link); this.renderTurmas(); return link;
    },
    async ensureAluno(nome,turma_id){
      const clean=String(nome||'').trim()||'Aluno sem nome';
      let {data,error}=await this.client.from('alunos').select('id').eq('turma_id',turma_id).eq('nome',clean).maybeSingle();
      if(error)throw error; if(data?.id)return data.id;
      let ins=await this.client.from('alunos').insert({nome:clean,turma_id}).select('id').single();
      if(ins.error)throw ins.error; return ins.data.id;
    },
    async saveCurrentAssessment(opts={}){
      const manual = opts.manual!==false;
      if(!this.profile){this.setStatus('Faça login antes de salvar na nuvem.','error');return null;}
      let link=null;
      try{link=await this.ensureTurmaForAssessment();}
      catch(e){this.setStatus('Erro ao localizar/criar turma no Supabase: '+e.message,'error');return null;}
      if(!link){this.setStatus('Selecione ou informe uma turma antes de salvar.','error');return null;}
      A().syncMetaFromInputs?.(); const a=A().state.assessment;
      if(!a.questions?.length||!a.students?.length){this.setStatus('Importe e analise uma avaliação antes de salvar.','error');return null;}
      const disciplina=this.uiDiscToDb(a.discipline);
      const titulo=(document.querySelector('#cloudAssessmentTitle')?.value||a.title||'Avaliação').trim();
      const tipo=document.querySelector('#cloudAssessmentType')?.value||a.tipo||'diagnostica';
      const data_avaliacao=document.querySelector('#cloudAssessmentDate')?.value||a.date||new Date().toISOString().slice(0,10);
      this.setStatus('Salvando diagnóstico na nuvem...', 'work');
      const payload={nome:titulo,titulo,tipo,disciplina,turma_id:link.turma.id,professor_id:this.profile.id,data_aplicacao:data_avaliacao,data_avaliacao,questoes_json:a.questions,descritores_json:a.descriptors,gabarito_json:a.key};
      const {data:av,error:avErr}=await this.client.from('avaliacoes').insert(payload).select().single();
      if(avErr){this.setStatus('Erro ao salvar avaliação: '+avErr.message,'error');return null;}
      const r=A().getResults();
      const rows=[];
      const respostas=[];
      for(const s of r.students){
        const aluno_id=await this.ensureAluno(s.name,link.turma.id);
        const weak={}; (s.correct||[]).forEach((c,i)=>{if(!c){const d=a.descriptors[i]||'Sem descritor';weak[d]=(weak[d]||0)+1;}});
        const crit=Object.entries(weak).sort((x,y)=>y[1]-x[1]).slice(0,5).map(([d,n])=>({descritor:d,erros:n}));
        rows.push({avaliacao_id:av.id,aluno_id,aluno_nome:s.name,respostas_json:s.answers||[],acertos:s.total,total:r.summary.nQuestions,percentual:s.percent,descritores_criticos:crit,relatorio_individual:window.Relatorios?.individual?.(s.index)||null});
        (s.answers||[]).forEach((resp,i)=>respostas.push({avaliacao_id:av.id,aluno_id,questao_id:null,resposta:resp||null,acertou:!!(s.correct||[])[i]}));
      }
      const {error:resErr}=await this.client.from('resultados_alunos').insert(rows);
      if(resErr){this.setStatus('Avaliação salva, mas houve erro nos resultados: '+resErr.message,'error');return av;}
      if(respostas.length){
        const {error:respErr}=await this.client.from('respostas').insert(respostas);
        if(respErr) console.warn('Erro ao salvar respostas item a item:', respErr.message);
      }
      try{
        A().state.assessment.cloud_avaliacao_id=av.id;
        A().state.assessment.cloud_saved_at=new Date().toISOString();
        A().saveAssessmentRecord?.(false); A().save?.();
      }catch(e){console.warn('Falha ao registrar ID da nuvem no estado local',e);}
      this.setStatus('Diagnóstico salvo na nuvem com sucesso.','ok');
      await this.listAssessments(false);
      return av;
    },
    async autoSaveCurrentAssessment(){
      if(!this.client) this.initClient();
      if(!this.profile){try{await this.restoreSession();}catch(e){return null;}}
      if(!this.profile)return null;
      const a=A().state.assessment||{};
      if(!a.questions?.length||!a.students?.length)return null;
      try{return await this.saveCurrentAssessment({manual:false});}
      catch(e){this.setStatus('Falha no salvamento automático: '+e.message,'error');return null;}
    },
    async listAssessments(showStatus=true){
      if(!this.profile){if(showStatus)this.setStatus('Faça login para listar avaliações.','error');return;}
      if(showStatus)this.setStatus('Carregando avaliações...', 'work');
      const {data,error}=await this.client.from('avaliacoes').select('id,nome,titulo,tipo,disciplina,data_aplicacao,data_avaliacao,criado_em,professor_id,questoes_json,descritores_json,gabarito_json,turmas(nome),perfis(nome,email)').order('criado_em',{ascending:false}).limit(200);
      if(error){this.setStatus('Erro ao listar avaliações: '+error.message,'error');return;}
      this.assessments=data||[]; this.renderAssessments(); this.renderCoordCloudDashboard(); if(showStatus)this.setStatus(`${this.assessments.length} avaliação(ões) carregada(s).`,'ok');
    },
    renderAssessments(){
      const box=document.querySelector('#cloudAssessmentsList'); if(!box)return;
      if(!this.assessments.length){box.innerHTML='<p class="hint">Nenhuma avaliação salva na nuvem.</p>';return;}
      box.innerHTML=this.assessments.map(av=>{const title=av.titulo||av.nome||'Avaliação';return `<div class="cloud-assessment"><div><b>${A().safe(title)}</b><br><small>${A().safe(av.turmas?.nome||'-')} • ${A().safe(this.dbDiscToUi(av.disciplina))} • ${A().safe(av.perfis?.nome||'Professor')}</small><br><small>${A().safe(av.data_avaliacao||av.data_aplicacao||'sem data')} • ${av.criado_em?new Date(av.criado_em).toLocaleString('pt-BR'):''}</small></div><button data-cloud-load="${av.id}">Carregar</button></div>`;}).join('');
      box.querySelectorAll('[data-cloud-load]').forEach(btn=>btn.onclick=()=>this.loadAssessment(btn.dataset.cloudLoad));
    },
    renderCoordCloudDashboard(){
      const box=document.querySelector('#cloudCoordDashboard'); if(!box)return;
      if(!this.profile){box.innerHTML='<h3>Painel institucional</h3><p class="hint">Faça login para visualizar dados salvos na nuvem.</p>';return;}
      const byTurma={}, byDisc={}, byProf={};
      this.assessments.forEach(av=>{const turma=av.turmas?.nome||'Sem turma'; const disc=this.dbDiscToUi(av.disciplina); const prof=av.perfis?.nome||'Professor'; byTurma[turma]=(byTurma[turma]||0)+1; byDisc[disc]=(byDisc[disc]||0)+1; byProf[prof]=(byProf[prof]||0)+1;});
      const list=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<li>${A().safe(k)} — ${v}</li>`).join('')||'<li>Nenhum dado</li>';
      box.innerHTML=`<h3>Painel institucional da nuvem</h3><div class="cards"><div class="card"><span>Avaliações</span><b>${this.assessments.length}</b></div><div class="card"><span>Turmas</span><b>${Object.keys(byTurma).length}</b></div><div class="card"><span>Professores</span><b>${Object.keys(byProf).length}</b></div><div class="card"><span>Disciplinas</span><b>${Object.keys(byDisc).length}</b></div></div><div class="grid3"><div><h4>Turmas</h4><ul>${list(byTurma)}</ul></div><div><h4>Disciplinas</h4><ul>${list(byDisc)}</ul></div><div><h4>Professores</h4><ul>${list(byProf)}</ul></div></div>`;
    },
    async loadAssessment(id){
      const av=this.assessments.find(x=>x.id===id); if(!av){this.setStatus('Avaliação não encontrada.','error');return;}
      this.setStatus('Carregando avaliação da nuvem...', 'work');
      const {data:rows,error}=await this.client.from('resultados_alunos').select('*').eq('avaliacao_id',id).order('aluno_nome');
      if(error){this.setStatus('Erro ao carregar resultados: '+error.message,'error');return;}
      A().setAssessment({title:av.titulo||av.nome,turma:av.turmas?.nome||'',tipo:av.tipo||'diagnostica',date:av.data_avaliacao||av.data_aplicacao||'',discipline:this.dbDiscToUi(av.disciplina),questions:av.questoes_json||[],descriptors:av.descritores_json||[],key:av.gabarito_json||[],students:(rows||[]).map(r=>({name:r.aluno_nome,answers:r.respostas_json||[]}))});
      A().fillMetaInputs?.(); this.selectedCloudAssessment=av;
      this.setStatus('Avaliação carregada da nuvem.','ok'); A().showView('diagnostico');
    }
  };
  window.ETESupabase=Cloud;
  document.addEventListener('DOMContentLoaded',()=>Cloud.init());
})();
