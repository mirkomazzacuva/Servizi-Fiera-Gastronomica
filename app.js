const cfg=window.FIERA_CONFIG||{};
const $=s=>document.querySelector(s);
const sb=(window.supabase&&cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY)?supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
const DRAFT_KEY='fiera_disponibilita_draft_v2';
let eventDates=[];
const selections={};
let finalVisible=false;

const fmt=d=>new Intl.DateTimeFormat('it-IT',{weekday:'long',day:'numeric',month:'long'}).format(new Date(d+'T12:00:00'));
const shortFmt=d=>new Intl.DateTimeFormat('it-IT',{day:'numeric',month:'short'}).format(new Date(d+'T12:00:00'));
const cap=s=>s?s.charAt(0).toUpperCase()+s.slice(1):s;
function notice(t,type='info'){const el=$('#message');el.innerHTML=`<div class="inline-notice ${type}">${t}</div>`}
function selectedCount(){return Object.keys(selections).length}
function missingRoles(){return Object.entries(selections).filter(([,role])=>!role).map(([id])=>Number(id))}
function eventById(id){return eventDates.find(x=>Number(x.id)===Number(id))}

function saveDraft(){
  try{
    localStorage.setItem(DRAFT_KEY,JSON.stringify({
      fullName:$('#fullName')?.value||'',phone:$('#phone')?.value||'',groupName:$('#groupName')?.value||'',notes:$('#notes')?.value||'',selections
    }));
  }catch(_e){}
}
function clearDraft(){try{localStorage.removeItem(DRAFT_KEY)}catch(_e){};$('#draftNotice').hidden=true}
function readDraft(){try{return JSON.parse(localStorage.getItem(DRAFT_KEY)||'null')}catch(_e){return null}}
function restoreDraft(){
  const d=readDraft(); if(!d)return;
  if($('#fullName'))$('#fullName').value=d.fullName||'';
  if($('#phone'))$('#phone').value=d.phone||'';
  if($('#groupName'))$('#groupName').value=d.groupName||'';
  if($('#notes'))$('#notes').value=d.notes||'';
  Object.entries(d.selections||{}).forEach(([id,role])=>{if(eventById(id))selections[id]=role||null});
  applySelectionsToUI();
  if(d.fullName||d.phone||Object.keys(d.selections||{}).length)$('#draftNotice').hidden=false;
}
function applySelectionsToUI(){
  eventDates.forEach(x=>{
    const row=document.querySelector(`.availability-row[data-id="${x.id}"]`); if(!row)return;
    const chosen=Object.prototype.hasOwnProperty.call(selections,x.id);
    row.classList.toggle('selected',chosen);
    row.classList.toggle('needs-role',chosen&&!selections[x.id]);
    const toggle=row.querySelector('.date-toggle');
    toggle.setAttribute('aria-pressed',chosen?'true':'false');
    toggle.setAttribute('aria-expanded',chosen?'true':'false');
    row.querySelectorAll('.role-picker button').forEach(b=>b.classList.toggle('active',chosen&&selections[x.id]===b.dataset.role));
  });
  updateUI();
}
function updateUI(){
  const n=selectedCount(), missing=missingRoles();
  $('#dateCount').textContent=n; $('#dateCount').classList.toggle('active',n>0);
  const bar=$('#mobileAction'),mc=$('#mobileCount'),label=$('#mobileActionLabel');
  if(bar){bar.hidden=n===0;if(mc)mc.textContent=n;if(label)label.textContent=missing.length?'Completa le scelte →':(finalVisible?'Invia →':'Continua →')}
  renderSummary(); saveDraft();
}
function renderSummary(){
  const box=$('#selectionSummary'); if(!box)return;
  const items=Object.entries(selections).map(([id,role])=>{const d=eventById(id);if(!d)return'';return `<span class="summary-chip ${role?'':'pending'}"><b>${cap(shortFmt(d.event_date))}</b>${role||'Scegli il ruolo'}</span>`}).filter(Boolean);
  box.innerHTML=items.length?items.join(''):'<span class="summary-empty">Nessuna serata selezionata.</span>';
}
function renderDates(){
  const wrap=$('#dates');wrap.innerHTML='';
  if(!eventDates.length){wrap.innerHTML='<div class="empty-state">Le date non sono ancora state configurate.</div>';return}
  eventDates.forEach(x=>{
    const row=document.createElement('article');row.className='availability-row';row.dataset.id=x.id;
    row.innerHTML=`<button type="button" class="date-toggle" aria-pressed="false" aria-expanded="false"><span class="date-badge"><b>${new Date(x.event_date+'T12:00:00').getDate()}</b><small>${new Intl.DateTimeFormat('it-IT',{month:'short'}).format(new Date(x.event_date+'T12:00:00'))}</small></span><span class="date-copy"><strong>${cap(new Intl.DateTimeFormat('it-IT',{weekday:'long'}).format(new Date(x.event_date+'T12:00:00')))}</strong><small>${x.label||cap(fmt(x.event_date))}</small></span><span class="checkmark">✓</span></button><div class="role-picker"><div class="role-hint">Cosa puoi fare?</div><button type="button" data-role="Cucina">Cucina</button><button type="button" data-role="Servizio">Servizio</button><button type="button" data-role="Entrambi">Entrambi</button></div>`;
    const t=row.querySelector('.date-toggle'),picker=row.querySelector('.role-picker');
    t.onclick=()=>{
      const selected=!Object.prototype.hasOwnProperty.call(selections,x.id);
      if(selected)selections[x.id]=null;else delete selections[x.id];
      row.classList.toggle('selected',selected);row.classList.toggle('needs-role',selected);
      t.setAttribute('aria-pressed',selected?'true':'false');t.setAttribute('aria-expanded',selected?'true':'false');
      if(!selected)picker.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
      updateUI();
    };
    picker.querySelectorAll('button[data-role]').forEach(b=>b.onclick=()=>{
      if(!Object.prototype.hasOwnProperty.call(selections,x.id)){selections[x.id]=null;row.classList.add('selected');t.setAttribute('aria-pressed','true');t.setAttribute('aria-expanded','true')}
      selections[x.id]=b.dataset.role;row.classList.remove('needs-role');picker.querySelectorAll('button[data-role]').forEach(z=>z.classList.toggle('active',z===b));updateUI();
    });
    wrap.appendChild(row);
  });
  restoreDraft(); updateUI();
}
async function loadConfig(){
  if(!sb){notice('Configurazione Supabase mancante o non valida.','danger');$('#dates').innerHTML='<div class="empty-state">Configurazione non disponibile.</div>';return}
  const {data,error}=await sb.rpc('public_fiera_config');
  if(error){notice('Impossibile caricare le date: '+error.message,'danger');return}
  document.title=(data?.name||cfg.APP_NAME||'Fiera')+' · Disponibilità';$('#brand').textContent=data?.name||cfg.APP_NAME||'Fiera Gastronomica';
  eventDates=(data?.dates||[]).filter(x=>x.active);
  const years=[...new Set(eventDates.map(x=>new Date(x.event_date+'T12:00:00').getFullYear()))];
  if($('#heroEdition'))$('#heroEdition').textContent=(data?.name||'Fiera Gastronomica')+(years.length===1?' '+years[0]:'');
  if($('#heroMeta'))$('#heroMeta').textContent=eventDates.length?`${eventDates.length} serate · meno di 30 secondi`:'Meno di 30 secondi.';
  renderDates();
}

['fullName','phone','groupName','notes'].forEach(id=>$('#'+id)?.addEventListener('input',saveDraft));
$('#clearDraft')?.addEventListener('click',()=>{
  ['fullName','phone','groupName','notes'].forEach(id=>{if($('#'+id))$('#'+id).value=''});Object.keys(selections).forEach(k=>delete selections[k]);clearDraft();applySelectionsToUI();notice('Bozza azzerata.','info');
});

$('#availabilityForm').addEventListener('submit',async e=>{
  e.preventDefault(); if(!sb)return;
  const name=$('#fullName').value.trim(),phone=$('#phone').value.trim();
  if(name.length<3){notice('Inserisci nome e cognome.','danger');$('#fullName').focus();return}
  if(phone.replace(/\D/g,'').length<7){notice('Controlla il numero di telefono.','danger');$('#phone').focus();return}
  if(!selectedCount()){notice('Seleziona almeno una serata.','danger');$('#dates').scrollIntoView({behavior:'smooth',block:'start'});return}
  const missing=missingRoles();
  if(missing.length){
    missing.forEach(id=>document.querySelector(`.availability-row[data-id="${id}"]`)?.classList.add('needs-role'));
    notice('Per ogni serata selezionata indica Cucina, Servizio o Entrambi.','danger');
    document.querySelector(`.availability-row[data-id="${missing[0]}"]`)?.scrollIntoView({behavior:'smooth',block:'center'});return;
  }
  const btn=$('#submitBtn');btn.disabled=true;btn.innerHTML='<span>Invio in corso…</span><b>…</b>';
  const payload={p_full_name:name,p_phone:phone,p_group_name:$('#groupName').value.trim(),p_notes:$('#notes').value.trim(),p_availability:Object.entries(selections).map(([date_id,role])=>({date_id:Number(date_id),role}))};
  const {error}=await sb.rpc('submit_availability',payload);
  btn.disabled=false;btn.innerHTML='<span>Invia disponibilità</span><b>→</b>';
  if(error){notice('Errore: '+error.message,'danger');return}
  clearDraft();
  notice(`<div class="success-mark">✓</div><strong>Disponibilità registrata.</strong><span>Grazie! Se cambiano i programmi, puoi tornare qui e aggiornare tutto usando lo stesso numero.</span>`,'success success-panel');
  if($('#mobileAction'))$('#mobileAction').hidden=true;
  if(navigator.vibrate)navigator.vibrate(35);
  $('#message').scrollIntoView({behavior:'smooth',block:'center'});
});

if('IntersectionObserver'in window){
  const io=new IntersectionObserver(es=>{finalVisible=es.some(x=>x.isIntersecting);updateUI()},{threshold:.25});if($('#sendSection'))io.observe($('#sendSection'));
}
$('#mobileSend')?.addEventListener('click',()=>{
  const missing=missingRoles();
  if(missing.length){document.querySelector(`.availability-row[data-id="${missing[0]}"]`)?.scrollIntoView({behavior:'smooth',block:'center'});return}
  if(finalVisible)$('#availabilityForm').requestSubmit();else $('#sendSection')?.scrollIntoView({behavior:'smooth',block:'start'});
});

loadConfig();
