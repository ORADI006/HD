import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/+esm';
import {initSiteEditor} from './site-editor.js';
const SUPABASE_URL='https://cxwlfplkimnqlzmdsajj.supabase.co',KEY='sb_publishable_ISAB6iARgJB_F0n9kr4l-A_4NLPH4_n',ROOT='drivelinkxv76@gmail.com';
const sb=createClient(SUPABASE_URL,KEY,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}}),$=s=>document.querySelector(s),S={user:null,admin:null,media:[],slots:[],content:[],admins:[]};
let loadBuilder=null;
const labels={projet_accueil:'Photo principale',experience_digital:'Vidéo Digital Experience',mc_mariage:'Vidéo MC Mariage'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(t){let e=$('#toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),3500)}
function can(p){return S.admin?.role==='super_admin'||S.admin?.permissions?.[p]===true}
async function log(action,type,id,details={}){await sb.from('hadassa_admin_audit_log').insert({actor_user_id:S.user.id,actor_email:S.user.email,action,entity_type:type,entity_id:String(id||''),details})}
async function start(user){
 S.user=user;let email=(user.email||'').toLowerCase();
 const invite=await sb.from('hadassa_admin_users').select('id,user_id,role,is_active').eq('email',email).maybeSingle();
 if(invite.error)throw invite.error;
 if(!invite.data||!invite.data.is_active)throw Error('Aucun accès administrateur actif n’est associé à cette adresse e-mail.');
 if(invite.data.user_id&&invite.data.user_id!==user.id)throw Error('Ce compte administrateur est déjà lié à un autre compte de connexion.');
 if(!invite.data.user_id){
  const claim=await sb.from('hadassa_admin_users').update({user_id:user.id}).eq('id',invite.data.id).is('user_id',null).select('id').maybeSingle();
  if(claim.error)throw claim.error;
  if(!claim.data)throw Error('Cette invitation n’a pas pu être activée. Vérifiez que cette adresse a bien été ajoutée par le Super Admin.');
 }
 let q=await sb.from('hadassa_admin_users').select('*').eq('user_id',user.id).eq('is_active',true).maybeSingle();if(q.error)throw q.error;if(!q.data)throw Error('Accès administration non autorisé.');
 S.admin=q.data;loadBuilder=initSiteEditor({toast,log,user});$('#login').hidden=true;$('#app').hidden=false;$('#user-email').textContent=user.email;$('#user-role').textContent=q.data.role.toUpperCase();
 if(q.data.role!=='super_admin'){$('#admins-nav').hidden=true;document.querySelectorAll('.super-only').forEach(x=>x.hidden=true)}
 if(!can('media.manage'))document.querySelector('[data-view=media]').hidden=true;
 $('#set-password').hidden=email!==ROOT;
 if(!can('content.manage')){document.querySelector('[data-view=content]').hidden=true;document.querySelector('[data-view=builder]').hidden=true;}
 await overview();
}
async function overview(){
 let [m,s,c,a]=await Promise.all([sb.from('media_assets').select('id',{count:'exact',head:true}),sb.from('media_rotation_slots').select('slot_key',{count:'exact',head:true}),sb.from('hadassa_site_content').select('content_key',{count:'exact',head:true}),S.admin.role==='super_admin'?sb.from('hadassa_admin_users').select('id',{count:'exact',head:true}):Promise.resolve({count:1})]);
 $('#s-media').textContent=m.count??'—';$('#s-slots').textContent=s.count??'—';$('#s-content').textContent=c.count??'—';$('#s-admin').textContent=a.count??'—';
}
function go(v){document.querySelectorAll('.view').forEach(x=>x.hidden=x.id!=='view-'+v);document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===v));$('#heading').textContent=({home:'Vue générale',media:'Médias',content:'Bibliothèque CMS',builder:'Éditeur visuel du site',admins:'Administrateurs'})[v];if(v==='media')loadMedia().catch(err=>toast(err.message));if(v==='content')loadContent().catch(err=>toast(err.message));if(v==='builder'&&loadBuilder)loadBuilder().catch(err=>toast(err.message));if(v==='admins')loadAdmins().catch(err=>toast(err.message))}
function url(m){return m.external_url|| (m.storage_path?sb.storage.from('hadassa-media').getPublicUrl(m.storage_path).data.publicUrl:'')}
async function loadMedia(){
 let [m,s]=await Promise.all([sb.from('media_assets').select('*').order('position'),sb.from('media_rotation_slots').select('*,current_media:media_assets!media_rotation_slots_current_media_fk(*)').order('slot_key')]);if(m.error||s.error)throw m.error||s.error;S.media=m.data||[];S.slots=s.data||[];
 $('#slots').innerHTML=S.slots.map(slot=>{let cur=Array.isArray(slot.current_media)?slot.current_media[0]:slot.current_media,u=cur?url(cur):'',opts=S.media.filter(x=>x.slot_key===slot.slot_key&&x.is_active).map(x=>'<option value="'+x.id+'" '+(x.id===cur?.id?'selected':'')+'>'+esc(x.title)+'</option>').join('');return '<article><p class="eyebrow">'+esc(slot.slot_key)+'</p><h4>'+esc(labels[slot.slot_key]||slot.label)+'</h4>'+(cur?(cur.media_type==='video'?'<video controls muted src="'+esc(u)+'"></video>':'<img src="'+esc(u)+'">'):'<div class="placeholder"></div>')+'<label>Visuel actuel<select data-choice="'+esc(slot.slot_key)+'"><option value="">Choisir…</option>'+opts+'</select></label><button class="primary" data-apply="'+esc(slot.slot_key)+'">Appliquer</button><label>Importer un fichier<input type="file" data-upload="'+esc(slot.slot_key)+'" accept="'+(slot.slot_key==='projet_accueil'?'image/jpeg,image/png,image/webp':'video/mp4,video/webm')+'"></label></article>'}).join('');
 $('#library').innerHTML=S.media.map(m=>'<div class="media-item">'+(m.media_type==='video'?'<video src="'+esc(url(m))+'" muted></video>':'<img src="'+esc(url(m))+'">')+'<div><b>'+esc(m.title)+'</b><small>'+esc(labels[m.slot_key]||m.slot_key)+' · '+(m.is_active?'Actif':'Inactif')+'</small></div></div>').join('')||'<p>Aucun média.</p>';
 $('#s-media').textContent=S.media.length;$('#s-slots').textContent=S.slots.length;
}
async function apply(slot,id){if(!id)throw Error('Sélectionnez un média.');let now=new Date();let r=await sb.from('media_rotation_slots').update({current_media_id:id,rotation_started_at:now.toISOString(),last_rotated_at:now.toISOString(),next_rotation_at:new Date(now.getTime()+4*86400000).toISOString()}).eq('slot_key',slot);if(r.error)throw r.error;await log('change_current_media','media_rotation_slots',slot,{media_id:id});toast('Média appliqué.');await loadMedia()}
async function upload(slot,file){if(!file)return;let image=slot==='projet_accueil';if(image?!file.type.startsWith('image/'):!['video/mp4','video/webm'].includes(file.type))throw Error('Format de fichier non accepté pour cet emplacement.');if(file.size>150*1024*1024)throw Error('Fichier supérieur à 150 Mo.');let name=file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]/g,'-'),path=slot+'/'+Date.now()+'-'+name;let up=await sb.storage.from('hadassa-media').upload(path,file,{upsert:false,contentType:file.type});if(up.error)throw up.error;let ins=await sb.from('media_assets').insert({slot_key:slot,title:file.name,media_type:image?'image':'video',storage_path:path,is_active:true}).select().single();if(ins.error)throw ins.error;await log('upload_media','media_assets',ins.data.id,{slot_key:slot,file:file.name});await apply(slot,ins.data.id)}
async function loadContent(){let r=await sb.from('hadassa_site_content').select('*').order('category').order('content_key');if(r.error)throw r.error;S.content=r.data||[];$('#content-list').innerHTML=S.content.map(x=>'<article><p class="eyebrow">'+esc(x.category)+'</p><h4>'+esc(x.label)+'</h4><small>'+esc(x.content_key)+'</small><pre>'+esc(JSON.stringify(x.content,null,2))+'</pre><button data-edit="'+esc(x.content_key)+'">Modifier</button> <button data-delete="'+esc(x.content_key)+'">Supprimer</button></article>').join('')||'<p>Aucun contenu CMS. Ajoutez un bloc pour commencer.</p>';$('#s-content').textContent=S.content.length}
function edit(x){$('#ckey').value=x?.content_key||'';$('#ckey').readOnly=!!x;$('#clabel').value=x?.label||'';$('#ccat').value=x?.category||'general';$('#cjson').value=JSON.stringify(x?.content||{text:''},null,2);$('#content-dialog').showModal()}
async function saveContent(e){e.preventDefault();let content;try{content=JSON.parse($('#cjson').value)}catch{throw Error('Le JSON est invalide.')}let p={content_key:$('#ckey').value.trim(),label:$('#clabel').value.trim(),category:$('#ccat').value.trim(),content,updated_at:new Date().toISOString(),updated_by:S.user.id};let r=await sb.from('hadassa_site_content').upsert(p,{onConflict:'content_key'});if(r.error)throw r.error;await log('save_content','hadassa_site_content',p.content_key);$('#content-dialog').close();toast('Contenu enregistré.');await loadContent();await overview()}
async function delContent(k){if(!confirm('Supprimer '+k+' ?'))return;let r=await sb.from('hadassa_site_content').delete().eq('content_key',k);if(r.error)throw r.error;await log('delete_content','hadassa_site_content',k);await loadContent();await overview()}
async function loadAdmins(){if(S.admin.role!=='super_admin')return;let r=await sb.from('hadassa_admin_users').select('*').order('created_at');if(r.error)throw r.error;S.admins=r.data||[];$('#admin-list').innerHTML=S.admins.map(a=>'<article><h4>'+esc(a.email)+'</h4><p>'+(a.user_id?'Compte activé':'Invitation en attente')+' · '+(a.is_active?'Actif':'Désactivé')+'</p><select data-role="'+a.id+'" '+(a.role==='super_admin'?'disabled':'')+'><option value="admin" '+(a.role==='admin'?'selected':'')+'>Administrateur</option><option value="editor" '+(a.role==='editor'?'selected':'')+'>Éditeur</option></select><label><input type="checkbox" data-active="'+a.id+'" '+(a.is_active?'checked':'')+' '+(a.role==='super_admin'?'disabled':'')+'> Actif</label><label><input type="checkbox" data-pcontent="'+a.id+'" '+(a.permissions?.['content.manage']?'checked':'')+'> Contenus</label><label><input type="checkbox" data-pmedia="'+a.id+'" '+(a.permissions?.['media.manage']?'checked':'')+'> Médias</label></article>').join('');$('#s-admin').textContent=S.admins.length}
async function patchAdmin(id,patch){let a=S.admins.find(x=>x.id===id);if(!a||a.role==='super_admin')return;let r=await sb.from('hadassa_admin_users').update({...patch,updated_at:new Date().toISOString()}).eq('id',id);if(r.error)throw r.error;await log('update_admin','hadassa_admin_users',id,patch);await loadAdmins()}
async function addAdmin(e){e.preventDefault();let email=$('#aemail').value.trim().toLowerCase();if(email===ROOT)throw Error('Adresse réservée au Super Admin.');let p={'content.manage':$('#pcontent').checked,'media.manage':$('#pmedia').checked};let r=await sb.from('hadassa_admin_users').upsert({email,role:$('#arole').value,permissions:p,is_active:true},{onConflict:'email'});if(r.error)throw r.error;await log('invite_admin','hadassa_admin_users',email,{permissions:p});$('#admin-dialog').close();$('#admin-form').reset();const issued=await sb.functions.invoke('hadassa-admin-code',{body:{action:'issue',email}});
if(issued.error)throw issued.error;
if(!issued.data?.code)throw Error('Invitation créée, mais le code n’a pas pu être généré.');
$('#admin-dialog').close();$('#admin-form').reset();
window.prompt('Code de connexion à transmettre à '+email+' (valable 15 minutes, utilisable une seule fois) :',issued.data.code);
toast('Invitation et code générés. Transmettez le code à l’administrateur.');
await loadAdmins();await overview()}
function err(e){console.error(e);toast(e.message||'Erreur inattendue.')}
const emailInput=$('#auth-email'),rootWrap=$('#root-password-wrap'),rootLogin=$('#password-login'),adminCodeWrap=$('#admin-code-wrap'),rootReset=$('#root-reset');
function updateLoginMode(){
 const isRoot=emailInput.value.trim().toLowerCase()===ROOT;
 rootWrap.hidden=!isRoot;rootLogin.hidden=!isRoot;rootReset.hidden=!isRoot;adminCodeWrap.hidden=isRoot;
}
emailInput.addEventListener('input',updateLoginMode);
updateLoginMode();
$('#email-form').onsubmit=async e=>{
 e.preventDefault();
 const email=emailInput.value.trim().toLowerCase();
 const btn=email===ROOT?rootLogin:$('#admin-code-login');
 btn.disabled=true;
 $('#login-msg').textContent=email===ROOT?'Connexion Super Admin…':'Vérification de votre code…';
 try{
  if(email===ROOT){
   const {error}=await sb.auth.signInWithPassword({email,password:$('#root-password').value});
   if(error)throw error;
  }else{
   const code=$('#admin-access-code').value.trim();
   if(!/^\\d{6}$/.test(code))throw Error('Saisissez le code à 6 chiffres remis par le Super Admin.');
   const {data,error}=await sb.functions.invoke('hadassa-admin-code',{body:{action:'redeem',email,code}});
   if(error)throw error;
   if(!data?.token_hash)throw Error('Code invalide, expiré ou déjà utilisé.');
   const verified=await sb.auth.verifyOtp({token_hash:data.token_hash,type:'magiclink'});
   if(verified.error)throw verified.error;
  }
 }catch(error){$('#login-msg').textContent='Connexion impossible : '+(error.message||'vérifiez vos informations.');}
 finally{btn.disabled=false;}
};
rootReset.onclick=async()=>{
 const email=emailInput.value.trim().toLowerCase();
 rootReset.disabled=true;$('#login-msg').textContent='Envoi du lien de création/réinitialisation…';
 try{
  const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/admin.html'});
  if(error)throw error;
  $('#login-msg').textContent='Un lien sécurisé a été envoyé à '+email+'. Ouvrez-le pour définir votre mot de passe Super Admin.';
 }catch(error){$('#login-msg').textContent='Impossible d’envoyer le lien : '+(error.message||'erreur inconnue');}
 finally{rootReset.disabled=false;}
};
$('#set-password').onclick=async()=>{
 const password=window.prompt('Nouveau mot de passe Super Admin (8 caractères minimum) :');
 if(password===null)return;
 if(password.length<8){toast('Le mot de passe doit contenir au moins 8 caractères.');return;}
 const confirmPassword=window.prompt('Confirmez le nouveau mot de passe :');
 if(password!==confirmPassword){toast('Les deux mots de passe ne correspondent pas.');return;}
 const {error}=await sb.auth.updateUser({password});
 if(error)toast('Impossible de modifier le mot de passe : '+error.message);
 else toast('Mot de passe Super Admin enregistré. Vous pourrez ensuite vous connecter avec votre e-mail et ce mot de passe.');
};
$('#logout').onclick=async()=>{await sb.auth.signOut();location.reload()};
document.querySelectorAll('[data-view],[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.view||b.dataset.go)));
$('#add-content').onclick=()=>edit(null);$('#content-form').onsubmit=e=>saveContent(e).catch(err);$('#add-admin').onclick=()=>$('#admin-dialog').showModal();$('#admin-form').onsubmit=e=>addAdmin(e).catch(err);
document.addEventListener('click',e=>{let a=e.target.closest('[data-apply]');if(a)apply(a.dataset.apply,$('[data-choice="'+a.dataset.apply+'"]').value).catch(err);let ed=e.target.closest('[data-edit]');if(ed)edit(S.content.find(x=>x.content_key===ed.dataset.edit));let d=e.target.closest('[data-delete]');if(d)delContent(d.dataset.delete).catch(err);let c=e.target.closest('[data-close]');if(c)$('#'+c.dataset.close).close()});
document.addEventListener('change',e=>{let u=e.target.closest('[data-upload]');if(u&&u.files[0])upload(u.dataset.upload,u.files[0]).catch(err);let r=e.target.closest('[data-role]');if(r)patchAdmin(r.dataset.role,{role:r.value}).catch(err);let ac=e.target.closest('[data-active]');if(ac)patchAdmin(ac.dataset.active,{is_active:ac.checked}).catch(err);let pc=e.target.closest('[data-pcontent]');if(pc){let a=S.admins.find(x=>x.id===pc.dataset.pcontent);patchAdmin(pc.dataset.pcontent,{permissions:{...a.permissions,'content.manage':pc.checked}}).catch(err)}let pm=e.target.closest('[data-pmedia]');if(pm){let a=S.admins.find(x=>x.id===pm.dataset.pmedia);patchAdmin(pm.dataset.pmedia,{permissions:{...a.permissions,'media.manage':pm.checked}}).catch(err)}});
// IMPORTANT: keep this callback synchronous. Supabase JS can deadlock when
// database/auth calls are awaited inside onAuthStateChange (see Supabase KB).
let handledUserId=null,pendingUserId=null;
function processSession(session){
 if(!session?.user){
  handledUserId=null;
  $('#app').hidden=true;
  $('#login').hidden=false;
  return;
 }
 const user=session.user,id=user.id;
 if(handledUserId===id||pendingUserId===id)return;
 pendingUserId=id;
 // Defer all Supabase queries until after the auth callback has returned.
 setTimeout(async()=>{
  try{
   await start(user);
   handledUserId=id;
  }catch(e){
   console.error('HADASSA admin authentication failed:',e);
   $('#login').hidden=false;
   $('#app').hidden=true;
   $('#login-msg').textContent='Connexion établie, mais chargement du tableau de bord impossible : '+(e.message||'erreur inconnue')+' (ouvre la console F12 pour les détails).';
  }finally{
   if(pendingUserId===id)pendingUserId=null;
  }
 },0);
}
sb.auth.onAuthStateChange((_event,session)=>{
 // React to every auth event; the handler itself only schedules async work.
 processSession(session);
});
// Supabase JS gère automatiquement le retour PKCE dans l’URL.
// getSession() attend la fin de cette initialisation et récupère la session restaurée.
async function restoreAuthSession(){
 const {data,error}=await sb.auth.getSession();
 if(error)throw new Error('Google a confirmé la connexion, mais Supabase n’a pas pu restaurer la session : '+error.message);
 processSession(data.session);
}
restoreAuthSession().catch(error=>{
 console.error('HADASSA OAuth callback failed:',error);
 $('#login').hidden=false;$('#app').hidden=true;
 $('#login-msg').textContent=error.message||'Impossible de restaurer la session Google.';
 $('#google').disabled=false;
});
