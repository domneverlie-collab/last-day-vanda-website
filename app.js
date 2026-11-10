(() => {
  const config = window.PARTY_CONFIG || {};
  const configured = config.SUPABASE_URL && config.SUPABASE_ANON_KEY &&
    !config.SUPABASE_URL.includes("YOUR_") && !config.SUPABASE_ANON_KEY.includes("YOUR_");
  const $ = (id) => document.getElementById(id);
  let db = null, currentMembers = [];

  if (configured && window.supabase) {
    db = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
  }

  function showMessage(id, message, error=false) {
    const el=$(id); el.textContent=message; el.style.color=error?"#ff8585":"#ff9bc9";
  }
  function initials(name) {
    return name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function renderPublic(members) {
    currentMembers=members;
    $("memberCount").textContent=members.length;
    $("memberList").innerHTML=members.length ? members.map((m,i)=>`
      <div class="member-card"><div class="avatar">${escapeHtml(initials(m.name))}</div>
      <div><strong>${escapeHtml(m.name)}</strong><small>Guest #${i+1}</small></div></div>`).join("") :
      '<div class="empty-state">No guests yet. Be the first to join! ✦</div>';
  }
  async function loadPublic() {
    if (!db) {
      $("memberCount").textContent="—";
      $("memberList").innerHTML='<div class="empty-state">Connect your Supabase project to enable online registration and the live guest list. See README.md for setup.</div>';
      return;
    }
    const {data,error}=await db.from("public_party_members").select("id,name,created_at").order("created_at",{ascending:true});
    if(error){$("memberList").innerHTML='<div class="empty-state">Could not load the guest list. Please try again later.</div>';return;}
    renderPublic(data||[]);
  }
  $("joinForm").addEventListener("submit",async e=>{
    e.preventDefault();
    if(!db){showMessage("joinMessage","Website setup is not complete yet. Please try again later.",true);return;}
    const form=new FormData(e.currentTarget);
    const entry={name:String(form.get("name")||"").trim(),email:String(form.get("email")||"").trim()||null,phone:String(form.get("phone")||"").trim()||null};
    if(!entry.name){showMessage("joinMessage","Please enter your name.",true);return;}
    const button=e.currentTarget.querySelector("button[type=submit]");
    button.disabled=true;button.textContent="SAVING…";
    const {error}=await db.from("party_members").insert(entry);
    button.disabled=false;button.innerHTML='CONFIRM MY SPOT <span>→</span>';
    if(error){showMessage("joinMessage",error.code==="23505"?"This email is already registered.":"Registration failed. Please check your details and try again.",true);return;}
    e.currentTarget.reset();showMessage("joinMessage","You're on the guest list! See you at the party. ✦");
    await loadPublic();
  });

  const modal=$("adminModal");
  function openAdmin(){modal.classList.remove("hidden");checkSession();}
  function closeAdmin(){modal.classList.add("hidden");}
  $("adminOpen").addEventListener("click",openAdmin);
  $("adminClose").addEventListener("click",closeAdmin);
  modal.addEventListener("click",e=>{if(e.target===modal)closeAdmin();});
  async function checkSession(){
    if(!db){$("loginView").classList.remove("hidden");$("dashboardView").classList.add("hidden");showMessage("loginMessage","Connect Supabase first (see README.md).",true);return;}
    const {data}=await db.auth.getSession();
    if(data.session) await showDashboard(); else {$("loginView").classList.remove("hidden");$("dashboardView").classList.add("hidden");}
  }
  $("loginForm").addEventListener("submit",async e=>{
    e.preventDefault();if(!db)return;
    const f=new FormData(e.currentTarget);
    const {error}=await db.auth.signInWithPassword({email:f.get("email"),password:f.get("password")});
    if(error){showMessage("loginMessage","Sign-in failed. Check your email and password.",true);return;}
    showMessage("loginMessage","");await showDashboard();
  });
  async function showDashboard(){
    $("loginView").classList.add("hidden");$("dashboardView").classList.remove("hidden");
    const {data,error}=await db.from("party_members").select("id,name,email,phone,created_at").order("created_at",{ascending:false});
    if(error){$("adminRows").innerHTML='<tr><td colspan="4">Unable to load registrations. Confirm this account is an admin.</td></tr>';return;}
    currentMembers=data||[];
    $("dashTotal").textContent=currentMembers.length;
    const today=new Date().toLocaleDateString();
    $("dashToday").textContent=currentMembers.filter(m=>new Date(m.created_at).toLocaleDateString()===today).length;
    $("adminRows").innerHTML=currentMembers.length?currentMembers.map(m=>`<tr><td>${escapeHtml(m.name)}</td><td>${escapeHtml(m.email||"—")}</td><td>${escapeHtml(m.phone||"—")}</td><td>${new Date(m.created_at).toLocaleString()}</td></tr>`).join(""):'<tr><td colspan="4">No registrations yet.</td></tr>';
  }
  $("logoutButton").addEventListener("click",async()=>{await db.auth.signOut();$("dashboardView").classList.add("hidden");$("loginView").classList.remove("hidden");});
  $("exportButton").addEventListener("click",()=>{
    const rows=[["Name","Email","Phone","Joined"],...currentMembers.map(m=>[m.name,m.email||"",m.phone||"",m.created_at])];
    const csv=rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\r\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"}));
    const a=document.createElement("a");a.href=url;a.download="last-day-vanda-guests.csv";a.click();URL.revokeObjectURL(url);
  });
  $("shareButton").addEventListener("click",async()=>{
    const shareData={title:"Last Day Vanda Party",text:"You're invited to Last Day Vanda! Register here:",url:location.href};
    try{if(navigator.share)await navigator.share(shareData);else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(location.href);$("shareButton").textContent="LINK COPIED ✓";}else prompt("Copy this invitation link:",location.href);}
    catch(err){if(err.name!=="AbortError")prompt("Copy this invitation link:",location.href);}
  });
  loadPublic();
})();
