let currentUser=null;
async function requireAdmin(){
  if(!sb){showDashboard();return}
  const {data}=await sb.auth.getSession();currentUser=data.session?.user||null;
  if(currentUser)showDashboard();else showLogin();
}
function showLogin(){document.getElementById("loginCard")?.classList.remove("hidden");document.getElementById("dashboard")?.classList.add("hidden");document.getElementById("logout")?.classList.add("hidden")}
function showDashboard(){document.getElementById("loginCard")?.classList.add("hidden");document.getElementById("dashboard")?.classList.remove("hidden");document.getElementById("logout")?.classList.remove("hidden");loadSites();loadFeedback();loadSettings()}
async function loadSites(){
  const list=document.getElementById("siteList");if(!list)return;const sites=await getSites();
  list.innerHTML=sites.map(s=>`<div class="admin-item"><div style="display:flex;gap:14px;align-items:center"><img src="${s.image_url||""}"><div><b>${s.title}</b><small style="display:block;color:#888">${s.category}</small></div></div><div class="admin-item-actions"><button class="btn ghost edit-site" data-id="${s.id}">Edit</button><button class="btn ghost delete-site" data-id="${s.id}">Delete</button></div></div>`).join("");
  list.querySelectorAll(".edit-site").forEach(b=>b.onclick=()=>openEditor(b.dataset.id));
  list.querySelectorAll(".delete-site").forEach(b=>b.onclick=()=>deleteSite(b.dataset.id));
}
function openEditor(id=""){const form=document.getElementById("siteForm");form.classList.remove("hidden");const s=(window.allSites||[]).find(x=>String(x.id)===String(id));form.reset();form.elements.id.value=s?.id||"";form.elements.title.value=s?.title||"";form.elements.category.value=s?.category||"";form.elements.image_url.value=s?.image_url||"";form.elements.demo_url.value=s?.demo_url||"";form.elements.description.value=s?.description||"";form.elements.tags.value=(s?.tags||[]).join(", ");document.getElementById("siteFormTitle").textContent=s?"Edit website":"Add website"}
async function saveSite(e){
  e.preventDefault();const f=e.target, p={title:f.elements.title.value,category:f.elements.category.value,image_url:f.elements.image_url.value,demo_url:f.elements.demo_url.value,description:f.elements.description.value,tags:f.elements.tags.value.split(",").map(x=>x.trim()).filter(Boolean)};
  let ok=true;
  if(sb){const id=f.elements.id.value;const r=id?await sb.from("websites").update(p).eq("id",id):await sb.from("websites").insert(p);ok=!r.error;document.getElementById("siteMsg").textContent=r.error?.message||"Saved."}
  else{let a=JSON.parse(localStorage.getItem("dws_sites")||JSON.stringify(fallbackSites));const id=f.elements.id.value;if(id){a=a.map(x=>String(x.id)===String(id)?{...x,...p}:x)}else{a.unshift({...p,id:"site-"+Date.now()})}localStorage.setItem("dws_sites",JSON.stringify(a));document.getElementById("siteMsg").textContent="Saved locally."}
  if(ok){f.classList.add("hidden");window.allSites=await getSites();loadSites()}
}
async function deleteSite(id){
  if(!confirm("Delete this demo?"))return;
  if(sb)await sb.from("websites").delete().eq("id",id);else{let a=JSON.parse(localStorage.getItem("dws_sites")||JSON.stringify(fallbackSites));localStorage.setItem("dws_sites",JSON.stringify(a.filter(x=>String(x.id)!==String(id))))}
  loadSites();
}
async function loadFeedback(){
  const box=document.getElementById("adminFeedback");if(!box)return;let a=[];
  if(sb){const r=await sb.from("feedback").select("*").order("created_at",{ascending:false});a=r.data||[]}else a=JSON.parse(localStorage.getItem("dws_feedback")||"[]");
  box.innerHTML=a.length?a.map(f=>`<div class="admin-item"><div><b>${f.name}</b> · ${f.rating}/5 ${f.approved?"· Published":"· Pending"}<p style="margin:8px 0;color:#666">${f.message}</p></div><div class="admin-item-actions"><button class="btn ghost approve-f" data-id="${f.id}">${f.approved?"Hide":"Approve"}</button><button class="btn ghost delete-f" data-id="${f.id}">Delete</button></div></div>`).join(""):`<div class="card" style="padding:20px;color:#777">No feedback yet.</div>`;
  box.querySelectorAll(".approve-f").forEach(b=>b.onclick=()=>toggleFeedback(b.dataset.id));
  box.querySelectorAll(".delete-f").forEach(b=>b.onclick=()=>deleteFeedback(b.dataset.id));
}
async function toggleFeedback(id){
  if(sb){const {data}=await sb.from("feedback").select("approved").eq("id",id).single();await sb.from("feedback").update({approved:!data.approved}).eq("id",id)}
  else{let a=JSON.parse(localStorage.getItem("dws_feedback")||"[]");a=a.map(x=>String(x.id)===String(id)?{...x,approved:!x.approved}:x);localStorage.setItem("dws_feedback",JSON.stringify(a))}
  loadFeedback();
}
async function deleteFeedback(id){
  if(!confirm("Delete feedback?"))return;
  if(sb)await sb.from("feedback").delete().eq("id",id);else{let a=JSON.parse(localStorage.getItem("dws_feedback")||"[]");localStorage.setItem("dws_feedback",JSON.stringify(a.filter(x=>String(x.id)!==String(id))))}
  loadFeedback();
}
async function loadSettings(){
  const s=await getSettings(),f=document.getElementById("settingsForm");if(!f)return;f.elements.whatsapp.value=s.whatsapp||"";f.elements.about_text.value=s.about_text||"";f.elements.about_image.value=s.about_image||"";f.elements.theme.value=s.theme||"cream";
}
document.getElementById("loginForm")?.addEventListener("submit",async e=>{e.preventDefault();const f=e.target;if(!sb){document.getElementById("loginMsg").textContent="Connect Supabase in app.js first.";return}const r=await sb.auth.signInWithPassword({email:f.elements.email.value,password:f.elements.password.value});if(r.error)document.getElementById("loginMsg").textContent=r.error.message;else requireAdmin()});
document.getElementById("logout")?.addEventListener("click",async()=>{if(sb)await sb.auth.signOut();showLogin()});
document.getElementById("newSite")?.addEventListener("click",()=>openEditor());
document.getElementById("cancelSite")?.addEventListener("click",()=>document.getElementById("siteForm").classList.add("hidden"));
document.getElementById("siteForm")?.addEventListener("submit",saveSite);
document.getElementById("settingsForm")?.addEventListener("submit",async e=>{e.preventDefault();const f=e.target,p={whatsapp:f.elements.whatsapp.value,about_text:f.elements.about_text.value,about_image:f.elements.about_image.value,theme:f.elements.theme.value};if(sb){const r=await sb.from("settings").upsert({id:1,...p});document.getElementById("settingsMsg").textContent=r.error?.message||"Settings saved."}else{localStorage.setItem("dws_settings",JSON.stringify({...defaultSettings,...p}));document.getElementById("settingsMsg").textContent="Settings saved locally."}});
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".tab-panel").forEach(x=>x.classList.add("hidden"));document.getElementById("tab-"+b.dataset.tab).classList.remove("hidden")});
if(document.getElementById
