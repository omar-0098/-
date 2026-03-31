import{initializeApp}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import{getDatabase,ref,set,get,onValue,off,remove,query,orderByChild,equalTo}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
const cfg={apiKey:"AIzaSyCCk0w_KHVCswjp16TSkNToRSSOjlPC5kE",authDomain:"data-customer-d722f.firebaseapp.com",databaseURL:"https://data-customer-d722f-default-rtdb.firebaseio.com/",projectId:"data-customer-d722f",storageBucket:"data-customer-d722f.firebasestorage.app",messagingSenderId:"398522341614",appId:"1:398522341614:web:99e0f897c61ec960cffbff"};
const db=getDatabase(initializeApp(cfg));
const eKey=e=>e.replace(/\./g,"_").replace(/@/g,"__");
let _start=Date.now(),_iv=null,_lp=null;

// toast
function toast(msg,type="info"){
  let t=document.getElementById("toast-acc");
  if(!t){t=document.createElement("div");t.id="toast-acc";document.body.appendChild(t);}
  t.style.borderColor={success:"#2e7d32",error:"#e53935",info:"#c8a96e"}[type]||"#c8a96e";
  t.textContent=msg;
  requestAnimationFrame(()=>{t.style.opacity="1";t.style.transform="translateX(-50%) translateY(0)";});
  clearTimeout(t._t);t._t=setTimeout(()=>{t.style.opacity="0";t.style.transform="translateX(-50%) translateY(70px)";},3200);
}

// tab switch
window.switchTab=function(name,btn){
  document.querySelectorAll(".tab-panel").forEach(p=>p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
  document.getElementById("tab-"+name).classList.add("active");
  btn.classList.add("active");
  if(name==="devices"){const e=localStorage.getItem("kashmirSessionEmail");if(e)renderDevices(e);}
};

// dark mode
const dmToggle=document.getElementById("darkModeToggle");
function applyDark(on){document.documentElement.setAttribute("data-theme",on?"dark":"light");if(dmToggle)dmToggle.checked=on;}
applyDark(localStorage.getItem("kashmirDarkMode")==="1");
dmToggle?.addEventListener("change",()=>{localStorage.setItem("kashmirDarkMode",dmToggle.checked?"1":"0");applyDark(dmToggle.checked);});

// mute
const muteToggle=document.getElementById("muteToggle");
function applyMute(on){
  document.querySelectorAll("video,audio").forEach(m=>m.muted=on);
  const ico=document.getElementById("muteIcon");
  if(ico)ico.className=on?"fa-solid fa-volume-xmark":"fa-solid fa-volume-high";
  if(muteToggle)muteToggle.checked=on;
}
applyMute(localStorage.getItem("kashmirMuted")==="1");
muteToggle?.addEventListener("change",()=>{localStorage.setItem("kashmirMuted",muteToggle.checked?"1":"0");applyMute(muteToggle.checked);toast(muteToggle.checked?"🔇 تم كتم الأصوات":"🔊 تم تشغيل الأصوات","info");});

// copy coupon
window.copyCoupon=function(el,code){
  navigator.clipboard.writeText(code).then(()=>{const h=el.querySelector("h4"),o=h.textContent;h.textContent="✅ تم النسخ!";setTimeout(()=>h.textContent=o,1800);}).catch(()=>toast("❌ تعذّر النسخ","error"));
};

// tracking
async function trackVisit(email){try{const r=ref(db,`userStats/${eKey(email)}/totalVisits`),s=await get(r);await set(r,(s.exists()?s.val():0)+1);await set(ref(db,`userStats/${eKey(email)}/lastVisit`),new Date().toISOString());}catch(e){}}
async function saveTime(email,mins){if(mins<=0)return;try{const r=ref(db,`userStats/${eKey(email)}/totalMinutes`),s=await get(r);await set(r,(s.exists()?s.val():0)+mins);}catch(e){}}
function startTimer(email){_start=Date.now();clearInterval(_iv);_iv=setInterval(async()=>{const m=Math.round((Date.now()-_start)/60000);if(m>=1){await saveTime(email,m);_start=Date.now();}},2*60*1000);window.addEventListener("beforeunload",()=>{const m=Math.round((Date.now()-_start)/60000);if(m>=1)saveTime(email,m);});}
async function loadStats(email){try{const s=await get(ref(db,`userStats/${eKey(email)}`));const d=s.exists()?s.val():{};animNum(document.getElementById("stat-visits"),d.totalVisits||1,0);animNum(document.getElementById("stat-hours"),((d.totalMinutes||0)/60),1);}catch(e){}}
function animNum(el,target,dec){if(!el)return;const dur=900,t0=Date.now(),id=setInterval(()=>{const p=Math.min((Date.now()-t0)/dur,1),e=1-Math.pow(1-p,3);el.textContent=(e*target).toFixed(dec);if(p>=1){clearInterval(id);el.textContent=target.toFixed(dec);}},16);}

// session
function devInfo(){const ua=navigator.userAgent;let d="جهاز",ic="💻";if(/iPhone/.test(ua)){d="iPhone";ic="📱";}else if(/iPad/.test(ua)){d="iPad";ic="📱";}else if(/Android/.test(ua)&&/Mobile/.test(ua)){d="Android موبايل";ic="📱";}else if(/Android/.test(ua)){d="Android تابلت";ic="📱";}else if(/Mac/.test(ua)){d="Mac";ic="💻";}else if(/Windows/.test(ua)){d="Windows PC";ic="🖥️";}else if(/Linux/.test(ua)){d="Linux";ic="🖥️";}let b="متصفح";if(/Chrome/.test(ua)&&!/Edg/.test(ua))b="Chrome";else if(/Firefox/.test(ua))b="Firefox";else if(/Safari/.test(ua))b="Safari";else if(/Edg/.test(ua))b="Edge";return{device:d,browser:b,icon:ic};}
function clearLocal(){["kashmirSessionId","kashmirSessionEmail","kashmirUser"].forEach(k=>localStorage.removeItem(k));}
async function destroySess(email,sid){try{await remove(ref(db,`sessions/${eKey(email)}/${sid}`));}catch(e){}}
async function validateSession(){const sid=localStorage.getItem("kashmirSessionId"),email=localStorage.getItem("kashmirSessionEmail");if(!sid||!email)return null;try{const sn=await get(ref(db,`sessions/${eKey(email)}/${sid}`));if(!sn.exists()||!sn.val().isActive){clearLocal();return null;}await set(ref(db,`sessions/${eKey(email)}/${sid}/lastSeen`),Date.now());return sn.val();}catch(e){return null;}}
function watchSession(email,sid){const path=`sessions/${eKey(email)}/${sid}`;if(_lp){try{off(ref(db,_lp));}catch(e){}}_lp=path;onValue(ref(db,path),(sn)=>{if(!sn.exists()||!sn.val().isActive){clearLocal();document.getElementById("forcedLogoutOverlay").classList.add("open");}});}

// devices
async function renderDevices(email){
  const c=document.getElementById("devices-list");if(!c)return;
  c.innerHTML=`<p style="color:var(--text-light);text-align:center;padding:20px;font-size:13px">جاري التحميل...</p>`;
  const sn=await get(ref(db,`sessions/${eKey(email)}`));
  if(!sn.exists()){c.innerHTML=`<p style="color:var(--text-light);text-align:center;padding:20px;font-size:13px">لا توجد أجهزة متصلة</p>`;return;}
  const sessions=sn.val(),mySid=localStorage.getItem("kashmirSessionId");
  let html="";
  Object.entries(sessions).sort(([,a],[,b])=>new Date(b.loginAt)-new Date(a.loginAt)).forEach(([sid,d])=>{
    const isMine=sid===mySid,date=new Date(d.loginAt).toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});
    html+=`<div class="device-card ${isMine?"device-current":""}"><div class="device-icon">${d.icon||"💻"}</div><div class="device-info"><h4>${d.device||"جهاز"} — ${d.browser||"متصفح"} ${isMine?'<span class="device-badge">هذا الجهاز</span>':""}</h4><p>آخر دخول: ${date}</p></div>${!isMine?`<button class="device-end-btn" onclick="logoutDevice('${email}','${sid}')"><i class="fa-solid fa-right-from-bracket"></i> إنهاء</button>`:""}</div>`;
  });
  c.innerHTML=html;
}
window.logoutDevice=async function(email,sid){try{await remove(ref(db,`sessions/${eKey(email)}/${sid}`));toast("✅ تم إنهاء الجلسة","success");setTimeout(()=>renderDevices(email),700);}catch(e){toast("❌ حدث خطأ","error");}};
window.logoutAllDevices=async function(){const email=localStorage.getItem("kashmirSessionEmail");if(!email)return;try{await remove(ref(db,`sessions/${eKey(email)}`));clearLocal();toast("✅ تم تسجيل الخروج من كل الأجهزة","success");setTimeout(()=>location.href="../index.html",1500);}catch(e){toast("❌ حدث خطأ","error");}};

// fill page
async function fillPage(email){
  const sn=await get(query(ref(db,"users"),orderByChild("email"),equalTo(email)));
  if(!sn.exists())return;let ud=null;sn.forEach(c=>{ud=c.val();});if(!ud)return;
  const sv=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v||"";};
  const st=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v||"";};
  sv("userEmail",ud.email);sv("userPhone",ud.phone);sv("userName",ud.firstName);sv("userFamily",ud.lastName);
  st("welcomeName","مرحباً، "+(ud.firstName||""));st("userEmailDisplay",ud.email);
  if(ud.gender)document.querySelectorAll('input[name="gender"]').forEach(r=>{r.checked=r.value===ud.gender;});
}

// update names
const ni=document.getElementById("userName"),fi=document.getElementById("userFamily"),ub=document.getElementById("updateNamesBtn");
if(ub){
  const en=()=>{ub.disabled=false;};
  ni?.addEventListener("input",en);fi?.addEventListener("input",en);
  document.querySelectorAll('input[name="gender"]').forEach(r=>r.addEventListener("change",en));
  ub.addEventListener("click",async()=>{
    const email=localStorage.getItem("kashmirSessionEmail");if(!email)return;
    const fn=ni?.value.trim(),ln=fi?.value.trim(),g=document.querySelector('input[name="gender"]:checked')?.value||"";
    if(!fn||!ln){toast("❌ أدخل الاسم الأول والأخير","error");return;}
    ub.disabled=true;ub.textContent="جاري التحديث...";
    try{const sn=await get(query(ref(db,"users"),orderByChild("email"),equalTo(email)));if(sn.exists()){let key=null;sn.forEach(c=>{key=c.key;});if(key){await set(ref(db,`users/${key}/firstName`),fn);await set(ref(db,`users/${key}/lastName`),ln);if(g)await set(ref(db,`users/${key}/gender`),g);const s=JSON.parse(localStorage.getItem("kashmirUser")||"{}");Object.assign(s,{firstName:fn,lastName:ln,...(g&&{gender:g})});localStorage.setItem("kashmirUser",JSON.stringify(s));toast("✅ تم تحديث البيانات بنجاح","success");}}}
    catch(e){toast("❌ "+e.message,"error");}finally{ub.textContent="تحديث الحساب";ub.disabled=true;}
  });
}

// logout modal
const logoutModal=document.getElementById("logoutModal"),logoutErrEl=document.getElementById("logoutErrorMsg");
document.getElementById("logoutBtn")?.addEventListener("click",()=>logoutModal.classList.add("open"));
document.getElementById("cancelLogoutBtn")?.addEventListener("click",()=>{logoutModal.classList.remove("open");if(logoutErrEl)logoutErrEl.textContent="";});
logoutModal?.addEventListener("click",(e)=>{if(e.target===logoutModal){logoutModal.classList.remove("open");if(logoutErrEl)logoutErrEl.textContent="";}});
document.getElementById("confirmLogoutBtn")?.addEventListener("click",async()=>{
  const input=document.getElementById("logoutEmailInput")?.value.trim(),email=localStorage.getItem("kashmirSessionEmail");
  if(!input){if(logoutErrEl)logoutErrEl.textContent="أدخل بريدك الإلكتروني";return;}
  if(input!==email){if(logoutErrEl)logoutErrEl.textContent="❌ البريد الإلكتروني غير مطابق";return;}
  const m=Math.round((Date.now()-_start)/60000);if(m>=1)await saveTime(email,m);clearInterval(_iv);
  const sid=localStorage.getItem("kashmirSessionId");if(sid&&email)await destroySess(email,sid);
  clearLocal();localStorage.removeItem("kashmirProfileImg");logoutModal.classList.remove("open");
  toast("👋 تم تسجيل الخروج بنجاح","success");setTimeout(()=>location.href="../index.html",1400);
});

// delete account
document.getElementById("deleteAccountBtn")?.addEventListener("click",()=>toast("⚠️ ميزة حذف الحساب قيد التطوير","info"));

// profile pic
const fileInput=document.getElementById("fileInput"),pi=document.getElementById("profileImage"),ico=document.getElementById("icon_person");

// عرض الصورة الموجودة
function showSavedPhoto(url){if(!url||!pi||!ico)return;pi.src=url;pi.style.display="block";ico.style.display="none";}

// جيب الصورة من Database أولاً، وإلا من localStorage
(async function loadSavedPhoto(){
  const email=localStorage.getItem("kashmirSessionEmail");
  if(email){
    try{
      const snap=await get(ref(db,`userPhotos/${eKey(email)}`));
      if(snap.exists()){
        const url=snap.val();
        localStorage.setItem("kashmirProfileImg",url);
        showSavedPhoto(url);
        return;
      }
    }catch(e){}
  }
  // fallback: localStorage
  const saved=localStorage.getItem("kashmirProfileImg");
  if(saved) showSavedPhoto(saved);
})();

// لما يختار صورة → احفظها في Database كـ base64 مباشرةً (بدون Storage - بدون CORS)
fileInput?.addEventListener("change",(e)=>{
  const file=e.target.files[0];
  if(!file)return;
  // حجم الصورة أقل من 500KB عشان تتحفظ في Database
  if(file.size > 500*1024){toast("❌ الصورة كبيرة جداً — اختر صورة أقل من 500KB","error");return;}
  const r=new FileReader();
  r.onload=async(ev)=>{
    const base64=ev.target.result;
    // عرض فوري
    if(pi){pi.src=base64;pi.style.display="block";}
    if(ico){ico.style.display="none";}
    localStorage.setItem("kashmirProfileImg",base64);
    // حفظ في Database
    const email=localStorage.getItem("kashmirSessionEmail");
    if(email){
      try{
        await set(ref(db,`userPhotos/${eKey(email)}`),base64);
        toast("✅ تم حفظ الصورة","success");
      }catch(err){
        toast("❌ خطأ في حفظ الصورة","error");
        console.error(err);
      }
    }
  };
  r.readAsDataURL(file);
});

// init
// (async function(){
//   const session=await validateSession();
//   if(!session){toast("❌ يجب تسجيل الدخول أولاً","error");setTimeout(()=>location.href="../index.html",2000);return;}
//   const email=localStorage.getItem("kashmirSessionEmail");
//   watchSession(email,session.sessionId);
//   await fillPage(email);
//   await trackVisit(email);
//   startTimer(email);
//   loadStats(email);
// })();
