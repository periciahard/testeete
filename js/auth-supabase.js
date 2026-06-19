
(function(){
'use strict';
const STORE='vetor_auth_v68_6';
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const safe=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const norm=s=>String(s??'').trim();

function roleFromPerfil(perfil){
  const p=String(perfil||'professor').toLowerCase();
  if(p.includes('admin')) return 'admin';
  if(p.includes('coord')) return 'coord';
  return 'prof';
}
function normalizeProfile(profile){
  if(!profile) return null;
  const role=roleFromPerfil(profile.perfil||profile.role);
  return {
    login: profile.email || profile.login || '',
    nome: profile.nome || profile.email || 'Usuário',
    perfil: profile.perfil || (role==='admin'?'admin':role==='coord'?'coordenação':'professor'),
    role,
    disciplina: profile.disciplina || '',
    anos: Array.isArray(profile.anos)?profile.anos:[],
    disciplinas: profile.disciplina ? [profile.disciplina] : [],
    all: role==='admin'||role==='coord',
    ativo: true
  };
}
function current(){try{return JSON.parse(localStorage.getItem(STORE)||sessionStorage.getItem(STORE)||'null')}catch{return null}}
function saveUser(user,remember=true){
  const u=normalizeProfile(user);
  if(!u)return;
  const target=remember?localStorage:sessionStorage;
  target.setItem(STORE,JSON.stringify(u));
}
function clearUser(){localStorage.removeItem(STORE); sessionStorage.removeItem(STORE);}
function user(){return current();}
function yearOfTurma(turma){
 const t=String(turma||'').toUpperCase();
 const m=t.match(/\b([123])\s*º?/) || t.match(/([123])\s*ANO/) || t.match(/^([123])/);
 return m?m[1]:'';
}
function disciplineOk(u,disc){
 if(!u)return false;
 if(u.all)return true;
 if(!u.disciplinas?.length && !u.disciplina)return true;
 return (u.disciplinas||[]).includes(disc) || u.disciplina===disc;
}
function turmaOk(u,turma){
 if(!u)return false;
 if(u.all)return true;
 if(!u.anos?.length)return true;
 const y=yearOfTurma(turma);
 return !!y && u.anos.includes(y);
}
function assessmentOk(u,a){return !!u && (u.all || (turmaOk(u,a?.turma) && disciplineOk(u,a?.discipline)));}
function questionOk(u,q){
 if(!u)return false;
 if(u.all)return true;
 const disc=q.discipline||q.disciplina||q.Disciplina||q.matéria||q.materia;
 const ano=String(q.ano||q.Ano||q.serie||q.Série||'');
 const discOk=!disc || disciplineOk(u,disc);
 const yearOk=!ano || !u.anos?.length || u.anos.some(y=>ano.includes(y));
 return discOk && yearOk;
}
function lock(){document.body.classList.add('auth-locked'); if($('#loginScreen')) $('#loginScreen').style.display='flex';}
function unlock(u){
 document.body.classList.remove('auth-locked');
 if($('#loginScreen')) $('#loginScreen').style.display='none';
 $('#authUserBadge')&&($('#authUserBadge').innerHTML=`👤 ${safe(u.nome)} <small>${safe(u.perfil)}</small>`);
 $('#sidebarUserBadge')&&($('#sidebarUserBadge').innerHTML=`👤 ${safe(u.nome)} <small>${safe(u.perfil)}</small>`);
 applyPermissions();
 setTimeout(()=>window.VETOR?.renderAll?.(),400);
}
async function login(){
 const loginValue=norm($('#loginUser')?.value);
 const passValue=$('#loginPass')?.value||'';
 const msg=$('#loginMsg');
 if(msg)msg.textContent='Entrando...';
 if(!loginValue.includes('@')){if(msg)msg.textContent='Use o e-mail institucional cadastrado no Supabase.'; return;}
 try{
   const profile=await window.VETORSupabase?.mainLogin?.(loginValue,passValue);
   if(!profile)throw new Error('Perfil não encontrado. Verifique a tabela perfis no Supabase.');
   const u=normalizeProfile(profile);
   saveUser(u,true); unlock(u); if(msg)msg.textContent='';
 }catch(e){if(msg)msg.textContent=e.message||'Falha no login institucional.'; lock();}
}
async function logout(){
 try{await window.VETORSupabase?.logout?.();}catch(e){}
 clearUser(); location.reload();
}
function allowedTurmas(){
 const u=user();
 const all=window.TurmasVetor?.getTurmas?.()||{};
 if(!u)return {};
 if(u.all)return all;
 return Object.fromEntries(Object.entries(all).filter(([t])=>turmaOk(u,t)));
}
function filteredAssessments(){
 const u=user(), all=window.VETOR?.state?.assessments||[];
 if(!u)return [];
 if(u.all)return all;
 return all.filter(a=>assessmentOk(u,a));
}
function patchApp(){
 const app=window.VETOR; if(!app || app.__authPatched)return; app.__authPatched=true;
 const oldRender=app.renderAssessmentManager?.bind(app);
 if(oldRender){app.renderAssessmentManager=function(){oldRender(); filterAssessmentHistory();};}
}
function filterAssessmentHistory(){
 const u=user(); if(!u||u.all)return;
 document.querySelectorAll('#assessmentHistory .assessment-item').forEach(item=>{
   const txt=item.textContent||'';
   if(!turmaOk(u,txt)) item.style.display='none';
 });
}
function permissionsNav(){
 const u=user(); if(!u)return;
 document.querySelectorAll('[data-role-only]').forEach(el=>{
   const roles=String(el.dataset.roleOnly||'').split(',').map(x=>x.trim());
   el.style.display=roles.includes(u.role)?'':'none';
 });
}
function filterTurmaSelects(){
 const u=user(); if(!u)return;
 if(u.all)return;
 const ok=Object.keys(allowedTurmas());
 ['assessmentClass','turmaCadastroSelect','coordClassSelect','coordCompareClassSelect'].forEach(id=>{
   const sel=document.getElementById(id); if(!sel||!sel.options)return;
   Array.from(sel.options).forEach(op=>{if(op.value && !ok.includes(op.value) && !turmaOk(u,op.value)) op.hidden=true;});
 });
}
function filterBankUI(){
 const u=user(); if(!u)return;
 const canEdit=u.role!=='prof';
 document.querySelectorAll('[data-bank-admin]').forEach(el=>el.style.display=canEdit?'':'none');
}
function renderUsersAdmin(){
 const box=$('#adminUsersList');
 if(!box)return;
 const u=user();
 if(!u||u.role!=='admin'){
   box.innerHTML='<p class="hint">Usuários e perfis são administrados no Supabase: Authentication → Users e tabela perfis.</p>';
   return;
 }
 box.innerHTML='<div class="statusbox status-work"><b>Gestão de usuários</b><br>Crie usuários em <b>Supabase → Authentication → Users</b> e registre nome/perfil na tabela <b>perfis</b>. Esta versão removeu o cadastro local de usuários.</div>';
}
function applyPermissions(){
 if(!user())return;
 patchApp(); permissionsNav(); filterTurmaSelects(); filterBankUI(); renderUsersAdmin();
}
function restoreFromSupabase(){
 const cached=user();
 if(cached) unlock(cached); else lock();
 setTimeout(()=>{
   const profile=window.VETORSupabase?.profile;
   if(profile){const u=normalizeProfile(profile); saveUser(u,true); unlock(u);}
 },1400);
}
function bind(){
 $('#loginBtn')&&($('#loginBtn').onclick=login);
 $('#logoutBtn')&&($('#logoutBtn').onclick=logout);
 $('#loginPass')&&($('#loginPass').addEventListener('keydown',e=>{if(e.key==='Enter')login();}));
 $('#loginUser')&&($('#loginUser').addEventListener('keydown',e=>{if(e.key==='Enter')login();}));
 document.addEventListener('click',e=>{if(e.target.closest('#logoutBtn'))logout();});
}
document.addEventListener('DOMContentLoaded',()=>{bind(); restoreFromSupabase();});
window.AuthSupabase={user,get USERS(){return []},assessmentOk,turmaOk,disciplineOk,allowedTurmas,filteredAssessments,applyPermissions};
})();
