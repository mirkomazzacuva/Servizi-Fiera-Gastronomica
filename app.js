const cfg=window.FIERA_CONFIG; const $=s=>document.querySelector(s);
function configured(){return cfg&&cfg.SUPABASE_URL&&!cfg.SUPABASE_URL.startsWith('INCOLLA')&&cfg.SUPABASE_ANON_KEY&&!cfg.SUPABASE_ANON_KEY.startsWith('INCOLLA')}
const sb=configured()?supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
let eventDates=[]; const selections={};
const fmt=d=>new Intl.DateTimeFormat('it-IT',{weekday:'short',day:'numeric',month:'long'}).format(new Date(d+'T12:00:00'));
function setMessage(text,type='notice'){ $('#message').innerHTML=`<div class="notice ${type}">${text}</div>` }
async function loadConfig(){
 if(!sb){setMessage('App non ancora collegata a Supabase. Completa config.js seguendo il README.','danger');return}
 const {data,error}=await sb.rpc('public_fiera_config');
 if(error){setMessage('Impossibile caricare le date: '+error.message,'danger');return}
 document.title=(data?.name||cfg.APP_NAME)+' - Disponibilità'; $('#brand').textContent=data?.name||cfg.APP_NAME;
 eventDates=(data?.dates||[]).filter(x=>x.active); renderDates();
}
function renderDates(){const wrap=$('#dates'); wrap.innerHTML=''; if(!eventDates.length){wrap.innerHTML='<div class="empty">Le date non sono ancora state configurate.</div>';return}
 eventDates.forEach(x=>{const el=document.createElement('div');el.className='date-card';el.innerHTML=`<div class="date-head"><div><div class="date-title">${fmt(x.event_date)}</div>${x.label?`<div class="tiny muted">${x.label}</div>`:''}</div><input type="checkbox" aria-label="Seleziona ${fmt(x.event_date)}"></div><div class="seg" style="display:none"><button type="button" data-role="Cucina">Cucina</button><button type="button" data-role="Servizio">Servizio</button><button type="button" data-role="Entrambi">Entrambi</button></div>`;
 const ck=el.querySelector('input'); const seg=el.querySelector('.seg'); ck.onchange=()=>{if(ck.checked){selections[x.id]='Entrambi';seg.style.display='grid';seg.querySelector('[data-role="Entrambi"]').classList.add('active')}else{delete selections[x.id];seg.style.display='none';seg.querySelectorAll('button').forEach(b=>b.classList.remove('active'))} updateCount()};
 seg.querySelectorAll('button').forEach(b=>b.onclick=()=>{selections[x.id]=b.dataset.role;seg.querySelectorAll('button').forEach(z=>z.classList.toggle('active',z===b))}); wrap.appendChild(el)}); updateCount()}
function updateCount(){const n=Object.keys(selections).length;$('#dateCount').textContent=`${n} selezionat${n===1?'a':'e'}`}
$('#availabilityForm').addEventListener('submit',async e=>{e.preventDefault();if(!sb)return;if(!Object.keys(selections).length){setMessage('Seleziona almeno una serata.','danger');return}
 const btn=$('#submitBtn');btn.disabled=true;btn.textContent='Invio…';
 const payload={p_full_name:$('#fullName').value.trim(),p_phone:$('#phone').value.trim(),p_group_name:$('#groupName').value.trim(),p_notes:$('#notes').value.trim(),p_availability:Object.entries(selections).map(([date_id,role])=>({date_id:Number(date_id),role}))};
 const {data,error}=await sb.rpc('submit_availability',payload); btn.disabled=false;btn.textContent='Invia disponibilità';
 if(error){setMessage('Errore: '+error.message,'danger')}else{setMessage('Disponibilità registrata. Grazie! Se ricompili con lo stesso telefono, la risposta verrà aggiornata.','success');window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})}
});
loadConfig();
