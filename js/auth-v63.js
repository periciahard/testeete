
(function(){
'use strict';
const STORE='ete_auth_v63';
const USERS_STORE='ete_users_v65';
const DEFAULT_PASSWORD='ete2026';
const DEFAULT_USERS=[
 {login:'admin',senha:'ete2026',nome:'Administrador',perfil:'admin',role:'admin',anos:['1','2','3'],disciplinas:['Língua Portuguesa','Matemática'],all:true},
 {login:'coordenacao',senha:'ete2026',nome:'Coordenação Pedagógica',perfil:'coordenação',role:'coord',anos:['1','2','3'],disciplinas:['Língua Portuguesa','Matemática'],all:true},
 {login:'prof1port',senha:'ete2026',nome:'Professor 1º ano Português',perfil:'professor',role:'prof',anos:['1'],disciplinas:['Língua Portuguesa']},
 {login:'prof1mat',senha:'ete2026',nome:'Professor 1º ano Matemática',perfil:'professor',role:'prof',anos:['1'],disciplinas:['Matemática']},
 {login:'prof2port',senha:'ete2026',nome:'Professor 2º ano Português',perfil:'professor',role:'prof',anos:['2'],disciplinas:['Língua Portuguesa']},
 {login:'prof2mat',senha:'ete2026',nome:'Professor 2º ano Matemática',perfil:'professor',role:'prof',anos:['2'],disciplinas:['Matemática']},
 {login:'prof3port',senha:'ete2026',nome:'Professor 3º ano Português',perfil:'professor',role:'prof',anos:['3'],disciplinas:['Língua Portuguesa']},
 {login:'prof3mat',senha:'ete2026',nome:'Professor 3º ano Matemática',perfil:'professor',role:'prof',anos:['3'],disciplinas:['Matemática']}
];
function perfilFromRole(role){return role==='admin'?'admin':role==='coord'?'coordenação':'professor';}
function normalizeUser(u){
 const role=u.role||u.perfil||'prof';
 const anos=Array.isArray(u.anos)?u.anos:String(u.ano||u.anos||'').split(',').map(x=>x.trim()).filter(Boolean);
 const disciplinas=Array.isArray(u.disciplinas)?u.disciplinas:String(u.disciplina||u.disciplinas||'').split(',').map(x=>x.trim()).filter(Boolean);
 const all=role==='admin'||role==='coord'||u.all===true||anos.length>=3&&disciplinas.length>=2;
 return {login:String(u.login||'').trim(), senha:String(u.senha||DEFAULT_PASSWORD), nome:String(u.nome||u.login||'Usuário'), perfil:perfilFromRole(role), role, anos:all?['1','2','3']:anos, disciplinas:all?['Língua Portuguesa','Matemática']:disciplinas, all, ativo:u.ativo!==false, createdAt:u.createdAt||new Date().toISOString(), updatedAt:u.updatedAt||new Date().toISOString()};
}
function loadUsers(){
 let custom=[]; try{custom=JSON.parse(localStorage.getItem(USERS_STORE)||'[]')||[]}catch{custom=[]}
 const map=new Map(DEFAULT_USERS.map(u=>[u.login.toLowerCase(), normalizeUser(u)]));
 custom.map(normalizeUser).filter(u=>u.login).forEach(u=>map.set(u.login.toLowerCase(),u));
 return Array.from(map.values());
}
function persistCustomUsers(){
 const defaults=new Set(DEFAULT_USERS.map(u=>u.login.toLowerCase()));
 const changed=USERS.filter(u=>!defaults.has(u.login.toLowerCase()) || JSON.stringify(normalizeUser(DEFAULT_USERS.find(d=>d.login.toLowerCase()===u.login.toLowerCase())||{}))!==JSON.stringify(normalizeUser(u)));
 localStorage.setItem(USERS_STORE, JSON.stringify(changed,null,2));
}
let USERS=loadUsers();
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const safe=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const norm=s=>String(s??'').trim();

function yearOfTurma(turma){
 const t=String(turma||'').toUpperCase();
 const m=t.match(/\b([123])\s*º?/) || t.match(/([123])\s*ANO/) || t.match(/^([123])/);
 return m?m[1]:'';
}
function disciplineOk(user,disc){
 return user?.all || !user?.disciplinas?.length || user.disciplinas.includes(disc);
}
function turmaOk(user,turma){
 if(user?.all)return true;
 const y=yearOfTurma(turma);
 return !!y && user.anos.includes(y);
}
function assessmentOk(user,a){
 if(user?.all)return true;
 return turmaOk(user,a?.turma) && disciplineOk(user,a?.discipline);
}
function questionOk(user,q){
 if(user?.all)return true;
 const disc=q.discipline||q.disciplina||q.Disciplina||q.matéria||q.materia;
 const ano=String(q.ano||q.Ano||q.serie||q.Série||'');
 const discOk=!disc || disciplineOk(user,disc);
 const yearOk=!ano || user.anos.some(y=>ano.includes(y));
 return discOk && yearOk;
}
function current(){try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}}
function saveUser(user,remember=true){
 const u={login:user.login,nome:user.nome,perfil:user.perfil,role:user.role,anos:user.anos,disciplinas:user.disciplinas,all:user.all,ativo:user.ativo!==false};
 if(remember)localStorage.setItem(STORE,JSON.stringify(u)); else sessionStorage.setItem(STORE,JSON.stringify(u));
}
function findUser(login,senha){const u=USERS.find(u=>u.login.toLowerCase()===String(login||'').toLowerCase() && u.senha===senha); if(!u || u.ativo===false)return null; return u;}
function lock(){document.body.classList.add('auth-locked'); $('#loginScreen')&&( $('#loginScreen').style.display='flex');}
function unlock(user){
 document.body.classList.remove('auth-locked');
 $('#loginScreen')&&( $('#loginScreen').style.display='none');
 $('#authUserBadge')&&($('#authUserBadge').innerHTML=`👤 ${safe(user.nome)} <small>${safe(user.perfil)}</small>`);
 $('#sidebarUserBadge')&&($('#sidebarUserBadge').innerHTML=`👤 ${safe(user.nome)} <small>${safe(user.perfil)}</small>`);
 applyPermissions();
 setTimeout(()=>window.ETE?.renderAll?.(),400);
}
function login(){
 const user=findUser($('#loginUser')?.value,$('#loginPass')?.value);
 const msg=$('#loginMsg');
 if(!user){ if(msg)msg.textContent='Usuário ou senha inválidos.'; return; }
 saveUser(user,$('#loginRemember')?.checked!==false);
 unlock(user);
}
function logout(){
 if(!confirm('Deseja sair do sistema?')) return;
 localStorage.removeItem(STORE);
 sessionStorage.removeItem(STORE);
 location.reload();
}
function user(){
 return current() || (()=>{try{return JSON.parse(sessionStorage.getItem(STORE)||'null')}catch{return null}})();
}
function allowedTurmas(){
 const u=user();
 const all=window.TurmasETE?.getTurmas?.()||{};
 return Object.keys(all).filter(t=>turmaOk(u,t)).sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true}));
}
function filteredAssessments(){
 const u=user(), all=window.ETE?.state?.assessments||[];
 return all.filter(a=>assessmentOk(u,a));
}
function filterTurmaSelects(){
 const u=user(); if(!u)return;
 const turmas=allowedTurmas();
 ['#assessmentClass','#turmaCadastroSelect','#evoTurma'].forEach(sel=>{
   const el=$(sel); if(!el || el.tagName.toLowerCase()!=='select')return;
   const old=el.value;
   const first=sel==='#evoTurma'?'<option value="">Todas minhas turmas</option>':'<option value="">Selecione a turma</option>';
   el.innerHTML=first+turmas.map(t=>`<option value="${safe(t)}">${safe(t)}</option>`).join('');
   if(turmas.includes(old))el.value=old;
 });
 if(!u.all && $('#assessmentDiscipline')){
   $('#assessmentDiscipline').value=u.disciplinas[0]||'Língua Portuguesa';
   $('#assessmentDiscipline').disabled=true;
 }
 if(!u.all && $('#evoDisc')){
   $('#evoDisc').value=u.disciplinas[0]||'Língua Portuguesa';
   $('#evoDisc').disabled=true;
 }
}
function patchApp(){
 const app=window.ETE; if(!app || app.__authV64)return; app.__authV64=true;
 const oldOpen=app.openAssessment.bind(app);
 app.openAssessment=function(id){
   const rec=this.state.assessments.find(x=>x.id===id);
   if(!assessmentOk(user(),rec)){alert('Você não tem acesso a esta avaliação.');return;}
   return oldOpen(id);
 };
 const oldSaveMeta=app.saveAssessmentMeta.bind(app);
 app.saveAssessmentMeta=function(){
   this.syncMetaFromInputs(false);
   const a=this.state.assessment||{};
   if(!assessmentOk(user(),a)){alert('Seu perfil não permite salvar avaliações desta turma/disciplina.');return;}
   return oldSaveMeta();
 };
 const oldSaveRecord=app.saveAssessmentRecord.bind(app);
 app.saveAssessmentRecord=function(render=true){
   const a=this.state.assessment||{};
   if(!assessmentOk(user(),a)){alert('Seu perfil não permite alterar esta avaliação.');return false;}
   return oldSaveRecord(render);
 };
 const oldRender=app.renderAssessmentManager.bind(app);
 app.renderAssessmentManager=function(){
   oldRender();
   const hist=$('#assessmentHistory');
   if(hist){
     const list=filteredAssessments();
     hist.innerHTML=list.length?list.map(rec=>`<div class="assessment-item ${rec.id===this.state.activeAssessmentId?'active':''}"><div><b>${safe(rec.title||'Avaliação')}</b><br><span>${safe(this.assessmentLabel(rec))}</span><br><small>${(rec.questions||[]).length} questões • ${(rec.students||[]).length} alunos • ${new Date(rec.updatedAt||rec.createdAt||Date.now()).toLocaleString('pt-BR')}</small></div><div class="assessment-actions"><button class="smallBtn" data-open-assessment="${rec.id}">Abrir</button></div></div>`).join(''):'<p class="hint">Nenhuma avaliação disponível para seu perfil.</p>';
     hist.querySelectorAll('[data-open-assessment]').forEach(b=>b.onclick=()=>this.openAssessment(b.dataset.openAssessment));
   }
   filterTurmaSelects();
 };
 const oldRenderAll=app.renderAll.bind(app);
 app.renderAll=function(){oldRenderAll(); applyPermissions();};
}
function renderProfessorPanel(){
 const box=$('#coordV608Resumo');
 if(!box)return;
 const u=user();
 const list=filteredAssessments();
 const turmas=[...new Set(list.map(a=>a.turma).filter(Boolean))];
 const medias=list.map(a=>(window.Diagnostico?.compute(a)?.summary?.avg)||0);
 const media=medias.length?Math.round(medias.reduce((a,b)=>a+b,0)/medias.length*10)/10:0;
 if(u?.role==='prof'){
   box.innerHTML=`<div class="card"><span>Perfil</span><b>${safe(u.nome)}</b></div><div class="card"><span>Minhas turmas</span><b>${turmas.length}</b></div><div class="card"><span>Minha disciplina</span><b>${safe(u.disciplinas.join(', '))}</b></div><div class="card"><span>Avaliações</span><b>${list.length}</b></div><div class="card"><span>Média geral</span><b>${media}%</b></div>`;
 }
}
function patchCoord(){
 const old=window.CoordenacaoV608?.renderPainel;
 if(window.CoordenacaoV608 && !window.CoordenacaoV608.__authV64){
   window.CoordenacaoV608.__authV64=true;
   window.CoordenacaoV608.renderPainel=function(){
     if(user()?.role==='prof'){
       renderProfessorPanel();
       const det=$('#coordV608Detalhes');
       const list=filteredAssessments();
       if(det){
         const rows=list.map(a=>{const r=window.Diagnostico?.compute(a)||{summary:{avg:0,nStudents:0,priority:0}}; return `<div class="preview-row"><span><b>${safe(a.turma||'-')}</b></span><span>${safe(a.discipline||'-')}</span><span>${safe(a.title||a.tipo||'-')}<br>${safe(a.date||'')}</span><span>${r.summary.nStudents||0}</span><span><b>${r.summary.avg||0}%</b></span><span>${r.summary.priority||0}</span></div>`}).join('');
         det.innerHTML=`<div class="panel"><h3>Minhas turmas e avaliações</h3><p class="hint">Comparação permitida para sua série e disciplina.</p><div class="preview-table coord-table"><div class="preview-row"><span>Turma</span><span>Disciplina</span><span>Avaliação</span><span>Alunos</span><span>Média</span><span>Abaixo</span></div>${rows||''}</div></div>`;
       }
       return;
     }
     old?.();
   };
 }
}
function filterBankUI(){
 const u=user(); if(!u || u.all)return;
 const disc=u.disciplinas[0];
 const disciplineFields=['#bankDiscipline','#questionDiscipline','#bqDisciplina'];
 disciplineFields.forEach(id=>{const el=$(id); if(el){el.value=disc; el.disabled=true;}});
}
function permissionsNav(){
 const u=user(); if(!u)return;
 document.body.classList.toggle('role-professor',u.role==='prof');
 document.body.classList.toggle('role-coord',u.role==='coord');
 document.body.classList.toggle('role-admin',u.role==='admin');
 // Professor keeps: avaliações, análises, evolução, banco, intervenções, fichas, impressão, gestão/minhas turmas. Hide admin areas.
 if(u.role==='prof'){
   $$('[data-view="alunos"],[data-view="turmasAlunos"],[data-view="config"],[data-view="usuariosAdmin"]').forEach(e=>e.style.display='none');
   $$('.admin-only').forEach(e=>e.style.display='none');
 }else if(u.role==='coord'){
   $$('.admin-only').forEach(e=>e.style.display='none');
   $$('[data-view="usuariosAdmin"]').forEach(e=>e.style.display='none');
 }else{
   $$('.admin-only').forEach(e=>e.style.display='block');
   $$('[data-view="usuariosAdmin"]').forEach(e=>e.style.display='block');
 }
}
function userRows(){
 return USERS.map(u=>`<div class="preview-row ${u.ativo===false?'blocked':''}"><span><b>${safe(u.login)}</b><br>${safe(u.nome)}</span><span>${safe(u.perfil)}<br><small>${u.ativo===false?'Bloqueado':'Ativo'}</small></span><span>${safe((u.anos||[]).join(', ')||'Todos')}</span><span>${safe((u.disciplinas||[]).join(', ')||'Todas')}</span><span class="row-actions"><button class="smallBtn" data-edit-user="${safe(u.login)}">Editar</button><button class="smallBtn secondary" data-reset-user="${safe(u.login)}">Redefinir senha</button><button class="smallBtn ${u.ativo===false?'':'danger'}" data-block-user="${safe(u.login)}">${u.ativo===false?'Desbloquear':'Bloquear'}</button></span></div>`).join('');
}
function renderUsersAdmin(){
 const box=$('#usuariosV64Lista');
 if(box)box.innerHTML='<div class="preview-table"><div class="preview-row"><span>Usuário</span><span>Perfil</span><span>Anos</span><span>Disciplinas</span></div>'+USERS.map(u=>`<div class="preview-row"><span><b>${safe(u.login)}</b><br>${safe(u.nome)}</span><span>${safe(u.perfil)}</span><span>${safe((u.anos||[]).join(', ')||'Todos')}</span><span>${safe((u.disciplinas||[]).join(', ')||'Todas')}</span></div>`).join('')+'</div>';
 const box65=$('#usuariosV65Lista'); if(!box65)return;
 box65.innerHTML='<div class="preview-table users-admin-table"><div class="preview-row"><span>Usuário</span><span>Status/perfil</span><span>Séries</span><span>Disciplinas</span><span>Ações</span></div>'+userRows()+'</div>';
 box65.querySelectorAll('[data-edit-user]').forEach(b=>b.onclick=()=>fillUserForm(b.dataset.editUser));
 box65.querySelectorAll('[data-reset-user]').forEach(b=>b.onclick=()=>resetUserPassword(b.dataset.resetUser));
 box65.querySelectorAll('[data-block-user]').forEach(b=>b.onclick=()=>toggleUserBlock(b.dataset.blockUser));
}
function fillUserForm(login){
 const u=USERS.find(x=>x.login===login); if(!u)return;
 $('#usuarioAdminTitulo')&&($('#usuarioAdminTitulo').textContent='Editar usuário');
 $('#adminUserNome')&&($('#adminUserNome').value=u.nome||''); $('#adminUserLogin')&&($('#adminUserLogin').value=u.login||''); $('#adminUserLogin')&&($('#adminUserLogin').readOnly=true);
 $('#adminUserSenha')&&($('#adminUserSenha').value=''); $('#adminUserRole')&&($('#adminUserRole').value=u.role||'prof');
 $('#adminUserAno')&&($('#adminUserAno').value=(u.all?'1,2,3':(u.anos||[]).join(','))||'1'); $('#adminUserDisc')&&($('#adminUserDisc').value=(u.all?'Língua Portuguesa,Matemática':(u.disciplinas||[]).join(','))||'Língua Portuguesa');
 $('#adminUserAtivo')&&($('#adminUserAtivo').checked=u.ativo!==false);
}
function clearUserForm(){
 $('#usuarioAdminTitulo')&&($('#usuarioAdminTitulo').textContent='Novo usuário/professor');
 ['#adminUserNome','#adminUserLogin','#adminUserSenha'].forEach(id=>$(id)&&($(id).value=''));
 $('#adminUserLogin')&&($('#adminUserLogin').readOnly=false); $('#adminUserRole')&&($('#adminUserRole').value='prof'); $('#adminUserAno')&&($('#adminUserAno').value='1'); $('#adminUserDisc')&&($('#adminUserDisc').value='Língua Portuguesa'); $('#adminUserAtivo')&&($('#adminUserAtivo').checked=true);
}
function collectUserForm(){
 const login=norm($('#adminUserLogin')?.value).toLowerCase(); const nome=norm($('#adminUserNome')?.value); const senha=$('#adminUserSenha')?.value||''; const role=$('#adminUserRole')?.value||'prof';
 const anos=String($('#adminUserAno')?.value||'1').split(','); const disciplinas=String($('#adminUserDisc')?.value||'Língua Portuguesa').split(',');
 if(!login||!nome)throw new Error('Informe nome e login.'); if(!/^[a-z0-9._-]+$/i.test(login))throw new Error('Use login sem espaços, apenas letras, números, ponto, hífen ou sublinhado.');
 const old=USERS.find(u=>u.login.toLowerCase()===login.toLowerCase());
 if(!old && !senha)throw new Error('Informe uma senha inicial para novo usuário.');
 return normalizeUser({...(old||{}), login, nome, senha:senha||old?.senha||DEFAULT_PASSWORD, role, anos, disciplinas, ativo:$('#adminUserAtivo')?.checked!==false, updatedAt:new Date().toISOString(), createdAt:old?.createdAt||new Date().toISOString()});
}
function saveAdminUser(){
 if(user()?.role!=='admin')return alert('Apenas administrador pode gerenciar usuários.');
 const st=$('#adminUserStatus');
 try{const u=collectUserForm(); const i=USERS.findIndex(x=>x.login.toLowerCase()===u.login.toLowerCase()); if(i>=0)USERS[i]=u; else USERS.push(u); persistCustomUsers(); renderUsersAdmin(); clearUserForm(); if(st)st.textContent='Usuário salvo com sucesso. Alterações ficam no navegador e podem ser exportadas para migração.';}catch(e){if(st)st.textContent=e.message; else alert(e.message);}
}
function resetUserPassword(login){
 if(user()?.role!=='admin')return; const u=USERS.find(x=>x.login===login); if(!u)return; if(!confirm(`Redefinir a senha de ${login} para ${DEFAULT_PASSWORD}?`))return; u.senha=DEFAULT_PASSWORD; u.updatedAt=new Date().toISOString(); persistCustomUsers(); renderUsersAdmin(); const st=$('#adminUserStatus'); if(st)st.textContent=`Senha de ${login} redefinida para ${DEFAULT_PASSWORD}.`;
}
function toggleUserBlock(login){
 if(user()?.role!=='admin')return; if(login==='admin')return alert('O usuário admin principal não pode ser bloqueado.'); const u=USERS.find(x=>x.login===login); if(!u)return; u.ativo=u.ativo===false; u.updatedAt=new Date().toISOString(); persistCustomUsers(); renderUsersAdmin(); bindUsersAdmin();
}
function exportUsersMigration(){
 const data={version:'V65-local-users', exportedAt:new Date().toISOString(), profiles:USERS.map(u=>({login:u.login,nome:u.nome,role:u.role,ativo:u.ativo!==false})), user_permissions:USERS.flatMap(u=>(u.anos||[]).flatMap(ano=>(u.disciplinas||[]).map(disciplina=>({login:u.login,ano,disciplina,can_edit_bank:u.role!=='prof'}))))};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='usuarios-permissoes-v65-supabase.json'; a.click(); URL.revokeObjectURL(a.href);
}
function bindUsersAdmin(){
 $('#adminUserSalvar')&&($('#adminUserSalvar').onclick=saveAdminUser); $('#adminUserNovo')&&($('#adminUserNovo').onclick=clearUserForm); $('#adminUsersExport')&&($('#adminUsersExport').onclick=exportUsersMigration);
}
function applyPermissions(){
 if(!user())return;
 patchApp(); patchCoord(); permissionsNav(); filterTurmaSelects(); filterBankUI(); renderUsersAdmin();
}
function init(){
 $('#loginBtn')&&($('#loginBtn').onclick=login);
 $('#loginPass')&&($('#loginPass').onkeydown=e=>{if(e.key==='Enter')login();});
 $('#logoutBtn')&&($('#logoutBtn').onclick=logout);
 $('#logoutBtnSide')&&($('#logoutBtnSide').onclick=logout);
 const u=user();
 if(u)unlock(u); else lock();
 setInterval(()=>{try{applyPermissions()}catch(e){}},2500);
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(init,500));
window.AuthV64={user,get USERS(){return USERS},assessmentOk,turmaOk,disciplineOk,allowedTurmas,filteredAssessments,applyPermissions};
})();
