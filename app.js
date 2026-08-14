/* Replace these two values with your Supabase project values. */
const SUPABASE_URL = "https://xqhlqqqdihyliqfxutxd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__YLfxP5KuFw_-L6X5TE-JA_6AJw-RQ7";
const sb = (window.supabase && SUPABASE_URL.startsWith("http"))
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const fallbackSites = [
 {id:"demo-1",title:"Luxe Hair Studio",category:"Salon",description:"Elegant salon website with services, booking CTA and a premium visual style.",image_url:"https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80",demo_url:"#",tags:["salon","beauty"]},
 {id:"demo-2",title:"Urban Plate",category:"Restaurant",description:"Modern restaurant showcase with menu, location and reservation-focused layout.",image_url:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80",demo_url:"#",tags:["restaurant","food"]},
 {id:"demo-3",title:"CarePlus Clinic",category:"Doctor",description:"Trust-focused clinic landing page with services, contact and appointment sections.",image_url:"https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1000&q=80",demo_url:"#",tags:["doctor","clinic"]}
];
const defaultSettings={whatsapp:"919999999999",about_text:"I create clean, responsive and conversion-focused websites for local businesses and personal brands.",about_image:"",theme:"cream"};

async function getSettings(){
  if(!sb)return JSON.parse(localStorage.getItem("dws_settings")||JSON.stringify(defaultSettings));
  const {data}=await sb.from("settings").select("*").eq("id",1).maybeSingle();
  return data||defaultSettings;
}
async function getSites(){
  if(!sb)return JSON.parse(localStorage.getItem("dws_sites")||JSON.stringify(fallbackSites));
  const {data,error}=await sb.from("websites").select("*").order("created_at",{ascending:false});
  return error?fallbackSites:data||[];
}
function waUrl(num,text="Hi, I want to build a website."){
  const n=(num||"").replace(/\D/g,""); return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}
function applySettings(s){
  document.body.className=(document.body.className||"").replace(/theme-\w+/g,"").trim()+` theme-${s.theme||"cream"}`;
  const photo=document.getElementById("aboutPhoto"); if(photo&&s.about_image)photo.style.backgroundImage=`url("${s.about_image}")`;
  const about=document.getElementById("aboutText"); if(about)about.textContent=s.about_text||defaultSettings.about_text;
  ["floatingWhatsApp","buildWhatsApp"].forEach(id=>{const e=document.getElementById(id);if(e)e.href=waUrl(s.whatsapp);});
}
function renderSites(sites){
  const grid=document.getElementById("demoGrid"), empty=document.getElementById("empty"); if(!grid)return;
  const q=(document.getElementById("search")?.value||"").toLowerCase().trim();
  const cat=window.activeCategory||"All";
  const list=sites.filter(x=>(cat==="All"||x.category===cat)&&(!q||`${x.title} ${x.category} ${(x.tags||[]).join(" ")} ${x.description}`.toLowerCase().includes(q)));
  grid.innerHTML=list.map(x=>`<article class="demo-card"><div class="demo-image" style="background-image:url('${x.image_url||""}')"><span class="tag">${x.category}</span></div><div class="demo-body"><h3>${x.title}</h3><p>${x.description||""}</p><div class="demo-meta"><span>${(x.tags||[]).slice(0,2).map(t=>`#${t}`).join(" ")}</span><a class="demo-link" href="${x.demo_url}" target="_blank" rel="noopener">Live Demo ↗</a></div></div></article>`).join("");
  empty?.classList.toggle("hidden",list.length>0);
}
function renderCategories(sites){
  const bar=document.getElementById("categoryBar");if(!bar)return;
  const cats=["All",...new Set(sites.map(x=>x.category).filter(Boolean))];
  bar.innerHTML=cats.map(c=>`<button class="chip ${c==="All"?"active":""}" data-cat="${c}">${c}</button>`).join("");
  bar.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{window.activeCategory=b.dataset.cat;bar.querySelectorAll(".chip").forEach(x=>x.classList.toggle("active",x===b));renderSites(window.allSites)});
}
async function renderFeedback(){
  const grid=document.getElementById("feedbackGrid");if(!grid)return;
  let data=[];
  if(sb){const r=await sb.from("feedback").select("*").eq("approved",true).order("created_at",{ascending:false});data=r.data||[]}
  else data=JSON.parse(localStorage.getItem("dws_feedback")||"[]").filter(x=>x.approved!==false);
  grid.innerHTML=data.length?data.slice(0,9).map(f=>`<div class="feedback-card"><div class="stars">${"★".repeat(Number(f.rating||5))}${"☆".repeat(5-Number(f.rating||5))}</div><p>“${String(f.message).replace(/[<>]/g,"")}”</p><small>${String(f.name).replace(/[<>]/g,"")}</small></div>`).join(""):`<div class="feedback-card"><div class="stars">★★★★★</div><p>Be the first to leave feedback.</p><small>Your feedback can appear here after approval.</small></div>`;
}
async function initPublic(){
  const s=await getSettings();applySettings(s);window.allSites=await getSites();renderCategories(window.allSites);renderSites(window.allSites);renderFeedback();
  document.getElementById("search")?.addEventListener("input",()=>renderSites(window.allSites));
  document.getElementById("feedbackForm")?.addEventListener("submit",async e=>{
    e.preventDefault();const fd=new FormData(e.target), payload={name:fd.get("name"),rating:Number(fd.get("rating")),message:fd.get("message"),approved:false};
    if(sb){const r=await sb.from("feedback").insert(payload);document.getElementById("feedbackMsg").textContent=r.error?"Could not send.":"Thanks! Your feedback is awaiting approval."}
    else{const a=JSON.parse(localStorage.getItem("dws_feedback")||"[]");a.unshift({...payload,id:Date.now()});localStorage.setItem("dws_feedback",JSON.stringify(a));document.getElementById("feedbackMsg").textContent="Thanks! Demo feedback saved locally."}
    e.target.reset();renderFeedback();
  });
  const y=document.getElementById("year");if(y)y.textContent=new Date().getFullYear();
}
if(document.getElementById("demoGrid"))initPublic();
