// ============================================================
//  Firebase Imports
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getDatabase, ref, set, get, child, onValue, off, remove, push, query, orderByChild, equalTo
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
    apiKey:            "AIzaSyCCk0w_KHVCswjp16TSkNToRSSOjlPC5kE",
    authDomain:        "data-customer-d722f.firebaseapp.com",
    databaseURL:       "https://data-customer-d722f-default-rtdb.firebaseio.com/",
    projectId:         "data-customer-d722f",
    storageBucket:     "data-customer-d722f.firebasestorage.app",
    messagingSenderId: "398522341614",
    appId:             "1:398522341614:web:99e0f897c61ec960cffbff"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ============================================================
//  Helpers
// ============================================================
function emailKey(email) {
    return email.replace(/\./g, "_").replace(/@/g, "__");
}

function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

function getDeviceInfo() {
    const ua = navigator.userAgent;
    let device = "جهاز غير معروف";
    let icon = "💻";

    if (/iPhone/.test(ua))        { device = "iPhone";       icon = "📱"; }
    else if (/iPad/.test(ua))     { device = "iPad";          icon = "📱"; }
    else if (/Android/.test(ua) && /Mobile/.test(ua)) { device = "Android موبايل"; icon = "📱"; }
    else if (/Android/.test(ua))  { device = "Android تابلت"; icon = "📱"; }
    else if (/Mac/.test(ua))      { device = "Mac";           icon = "💻"; }
    else if (/Windows/.test(ua))  { device = "Windows PC";   icon = "🖥️"; }
    else if (/Linux/.test(ua))    { device = "Linux";         icon = "🖥️"; }

    let browser = "متصفح";
    if (/Chrome/.test(ua) && !/Edg/.test(ua)) browser = "Chrome";
    else if (/Firefox/.test(ua))  browser = "Firefox";
    else if (/Safari/.test(ua))   browser = "Safari";
    else if (/Edg/.test(ua))      browser = "Edge";
    else if (/Opera|OPR/.test(ua)) browser = "Opera";

    return { device, browser, icon };
}

// ============================================================
//  Session Management
// ============================================================
let currentSessionId  = localStorage.getItem("kashmirSessionId");
let sessionListenerRef = null;

async function createSession(email, userData) {
    const sessionId   = generateSessionId();
    const eKey        = emailKey(email);
    const { device, browser, icon } = getDeviceInfo();

    const sessionData = {
        sessionId,
        email,
        device,
        browser,
        icon,
        loginAt:   new Date().toISOString(),
        lastSeen:  Date.now(),
        isActive:  true,
        userAgent: navigator.userAgent.substring(0, 150)
    };

    // حفظ الـ session في Firebase
    await set(ref(db, `sessions/${eKey}/${sessionId}`), sessionData);

    // حفظ محلي
    localStorage.setItem("kashmirSessionId",    sessionId);
    localStorage.setItem("kashmirSessionEmail", email);
    localStorage.setItem("kashmirUser",         JSON.stringify(userData));

    currentSessionId = sessionId;
    return sessionId;
}

async function validateSession() {
    const sessionId = localStorage.getItem("kashmirSessionId");
    const email     = localStorage.getItem("kashmirSessionEmail");
    if (!sessionId || !email) return null;

    try {
        const snap = await get(ref(db, `sessions/${emailKey(email)}/${sessionId}`));
        if (!snap.exists() || !snap.val().isActive) {
            // الـ session اتحذفت أو اتعطّلت من جهاز تاني
            clearLocalSession();
            return null;
        }
        // تحديث lastSeen
        await set(ref(db, `sessions/${emailKey(email)}/${sessionId}/lastSeen`), Date.now());
        return snap.val();
    } catch (e) {
        return null;
    }
}

function clearLocalSession() {
    localStorage.removeItem("kashmirSessionId");
    localStorage.removeItem("kashmirSessionEmail");
    localStorage.removeItem("kashmirUser");
    currentSessionId = null;
}

async function destroySession(email, sessionId) {
    try {
        await remove(ref(db, `sessions/${emailKey(email)}/${sessionId}`));
    } catch (e) { /* ignore */ }
}

// ============================================================
//  مراقبة الـ Session (لو اتحذفت من جهاز تاني → سجّل خروج)
// ============================================================
function watchSession(email, sessionId) {
    const path = `sessions/${emailKey(email)}/${sessionId}`;
    if (sessionListenerRef) off(ref(db, sessionListenerRef));
    sessionListenerRef = path;

    onValue(ref(db, path), (snap) => {
        if (!snap.exists() || !snap.val().isActive) {
            // تم تسجيل الخروج من جهاز آخر
            clearLocalSession();
            showForcedLogoutAlert();
        }
    });
}

function showForcedLogoutAlert() {
    // شاشة إشعار بتسجيل الخروج القسري
    const overlay = document.createElement("div");
    overlay.id = "forced-logout-overlay";
    overlay.style.cssText = `
        position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:99999;
        display:flex; align-items:center; justify-content:center; direction:rtl;
    `;
    overlay.innerHTML = `
        <div style="background:#1a1a1a; border:1px solid #c8a96e; border-radius:16px; padding:40px;
                    text-align:center; max-width:380px; color:#fff; font-family:'Almarai',sans-serif;">
            <div style="font-size:56px; margin-bottom:16px;">🔒</div>
            <h3 style="color:#c8a96e; font-size:20px; margin-bottom:12px;">تم تسجيل الخروج</h3>
            <p style="color:#aaa; font-size:15px; line-height:1.7; margin-bottom:24px;">
                تم تسجيل دخول من جهاز آخر، لذلك تم تسجيل خروجك تلقائياً من هذا الجهاز.
            </p>
            <button onclick="location.reload()" style="
                background:#c8a96e; color:#000; border:none; border-radius:8px;
                padding:12px 32px; font-size:15px; cursor:pointer; font-family:'Almarai',sans-serif; font-weight:700;
            ">تسجيل الدخول مجدداً</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

// ============================================================
//  عرض الأجهزة المتصلة في صفحة الحساب
// ============================================================
async function renderDevices(email) {
    const container = document.getElementById("devices-list");
    if (!container) return;

    container.innerHTML = `<p style="color:#888; text-align:center;">جاري التحميل...</p>`;

    const snap = await get(ref(db, `sessions/${emailKey(email)}`));
    if (!snap.exists()) {
        container.innerHTML = `<p style="color:#888; text-align:center;">لا توجد أجهزة متصلة</p>`;
        return;
    }

    const sessions = snap.val();
    const mySession = localStorage.getItem("kashmirSessionId");
    let html = "";

    Object.entries(sessions).forEach(([sid, data]) => {
        const isThis  = sid === mySession;
        const date    = new Date(data.loginAt).toLocaleDateString("ar-EG", {
            year:"numeric", month:"long", day:"numeric", hour:"2-digit", minute:"2-digit"
        });

        html += `
        <div class="device-card ${isThis ? 'device-current' : ''}">
            <div class="device-icon">${data.icon || "💻"}</div>
            <div class="device-info">
                <h4>${data.device} — ${data.browser} ${isThis ? '<span class="device-badge">هذا الجهاز</span>' : ''}</h4>
                <p>تسجيل الدخول: ${date}</p>
            </div>
            ${!isThis ? `
            <button class="device-logout-btn" onclick="logoutDevice('${email}','${sid}')">
                <i class="fa-solid fa-right-from-bracket"></i> إنهاء
            </button>` : ''}
        </div>`;
    });

    container.innerHTML = html;
}

// ============================================================
//  تسجيل الخروج من جهاز محدد (من صفحة الحساب)
// ============================================================
window.logoutDevice = async function(email, sessionId) {
    try {
        await remove(ref(db, `sessions/${emailKey(email)}/${sessionId}`));
        showToastAccount("✅ تم إنهاء الجلسة بنجاح", "success");
        setTimeout(() => renderDevices(email), 800);
    } catch (e) {
        showToastAccount("❌ حدث خطأ", "error");
    }
};

// تسجيل الخروج من كل الأجهزة
window.logoutAllDevices = async function() {
    const email = localStorage.getItem("kashmirSessionEmail");
    if (!email) return;
    try {
        await remove(ref(db, `sessions/${emailKey(email)}`));
        clearLocalSession();
        showToastAccount("✅ تم تسجيل الخروج من كل الأجهزة", "success");
        setTimeout(() => location.reload(), 1500);
    } catch (e) {
        showToastAccount("❌ حدث خطأ", "error");
    }
};

// ============================================================
//  تعبئة بيانات المستخدم في صفحة الحساب
// ============================================================
async function fillAccountPage(email) {
    try {
        const snap = await get(query(ref(db, "users"), orderByChild("email"), equalTo(email)));
        if (!snap.exists()) return;

        let userData = null;
        snap.forEach(child => { userData = child.val(); });

        if (!userData) return;

        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ""; };
        const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || ""; };

        setVal("userEmail",  userData.email);
        setVal("userPhone",  userData.phone);
        setVal("userName",   userData.firstName);
        setVal("userFamily", userData.lastName);
        setTxt("welcomeName",      "مرحبا، " + (userData.firstName || ""));
        setTxt("userEmailDisplay", userData.email);

        if (userData.gender) {
            const radios = document.querySelectorAll('input[name="gender"]');
            radios.forEach(r => { r.checked = (r.value === userData.gender); });
        }

        // عرض الأجهزة
        renderDevices(email);
    } catch (e) {
        console.error("fillAccountPage error:", e);
    }
}

// ============================================================
//  تحديث اسم المستخدم
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {

    // --- تفعيل زر التحديث ---
    const nameInput   = document.getElementById("userName");
    const familyInput = document.getElementById("userFamily");
    const updateBtn   = document.getElementById("updateNamesBtn");

    if (nameInput && familyInput && updateBtn) {
        const enableUpdate = () => { updateBtn.disabled = false; };
        nameInput.addEventListener("input",   enableUpdate);
        familyInput.addEventListener("input", enableUpdate);

        const genderRadios = document.querySelectorAll('input[name="gender"]');
        genderRadios.forEach(r => r.addEventListener("change", enableUpdate));
    }

    if (updateBtn) {
        updateBtn.addEventListener("click", async () => {
            const email = localStorage.getItem("kashmirSessionEmail");
            if (!email) return;

            const firstName = document.getElementById("userName")?.value.trim();
            const lastName  = document.getElementById("userFamily")?.value.trim();
            const gender    = document.querySelector('input[name="gender"]:checked')?.value || "";

            if (!firstName || !lastName) {
                showToastAccount("❌ أدخل الاسم الأول والأخير", "error"); return;
            }

            updateBtn.disabled   = true;
            updateBtn.textContent = "جاري التحديث...";

            try {
                const snap = await get(query(ref(db, "users"), orderByChild("email"), equalTo(email)));
                if (snap.exists()) {
                    let userKey = null;
                    snap.forEach(c => { userKey = c.key; });
                    if (userKey) {
                        await set(ref(db, `users/${userKey}/firstName`), firstName);
                        await set(ref(db, `users/${userKey}/lastName`),  lastName);
                        if (gender) await set(ref(db, `users/${userKey}/gender`), gender);

                        const saved = JSON.parse(localStorage.getItem("kashmirUser") || "{}");
                        saved.firstName = firstName;
                        saved.lastName  = lastName;
                        if (gender) saved.gender = gender;
                        localStorage.setItem("kashmirUser", JSON.stringify(saved));

                        showToastAccount("✅ تم تحديث البيانات بنجاح", "success");
                    }
                }
            } catch (e) {
                showToastAccount("❌ " + e.message, "error");
            } finally {
                updateBtn.textContent = "تحديث الحساب";
                updateBtn.disabled    = true;
            }
        });
    }

    // --- صورة البروفايل ---
    const iconPerson   = document.getElementById("icon_person");
    const fileInput    = document.getElementById("fileInput");
    const profileImage = document.getElementById("profileImage");

    if (iconPerson && fileInput && profileImage) {
        const savedImg = localStorage.getItem("kashmirProfileImg");
        if (savedImg) { profileImage.src = savedImg; profileImage.style.display = "block"; iconPerson.style.display = "none"; }

        iconPerson.addEventListener("click", () => fileInput.click());
        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const dataUrl = ev.target.result;
                profileImage.src     = dataUrl;
                profileImage.style.display = "block";
                iconPerson.style.display   = "none";
                localStorage.setItem("kashmirProfileImg", dataUrl);
            };
            reader.readAsDataURL(file);
        });
    }

    // --- تسجيل الخروج (الزر الموجود في الصفحة) ---
    const logoutLink = document.getElementById("logoutLink");
    if (logoutLink) {
        logoutLink.addEventListener("click", (e) => {
            e.preventDefault();
            document.getElementById("accountDeletionModal")?.style && (document.getElementById("accountDeletionModal").style.display = "flex");
        });
    }

    const cancelBtn = document.getElementById("cancelAccountDeletion");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            const modal = document.getElementById("accountDeletionModal");
            if (modal) modal.style.display = "none";
        });
    }

    const confirmBtn = document.getElementById("confirmAccountDeletion");
    if (confirmBtn) {
        confirmBtn.addEventListener("click", async () => {
            const input = document.getElementById("accountDeletionEmailInput")?.value.trim();
            const email = localStorage.getItem("kashmirSessionEmail");
            const errEl = document.getElementById("deletionErrorMsg");

            if (!input) { if (errEl) errEl.textContent = "أدخل بريدك الإلكتروني"; return; }
            if (input !== email) { if (errEl) errEl.textContent = "❌ البريد غير مطابق"; return; }

            // تسجيل خروج من الجهاز الحالي فقط
            const sessionId = localStorage.getItem("kashmirSessionId");
            if (sessionId && email) await destroySession(email, sessionId);

            clearLocalSession();
            localStorage.removeItem("kashmirProfileImg");

            const modal = document.getElementById("accountDeletionModal");
            if (modal) modal.style.display = "none";

            showToastAccount("👋 تم تسجيل الخروج بنجاح", "success");
            setTimeout(() => location.href = "../index.html", 1500);
        });
    }

    // --- التحقق من الجلسة وملء البيانات ---
    const session = await validateSession();
    if (session) {
        const email = localStorage.getItem("kashmirSessionEmail");
        watchSession(email, session.sessionId);
        fillAccountPage(email);
    }
});

// ============================================================
//  Toast للحساب
// ============================================================
function showToastAccount(msg, type = "info") {
    let t = document.getElementById("toast-account");
    if (!t) {
        t = document.createElement("div");
        t.id = "toast-account";
        t.style.cssText = `
            position:fixed; bottom:24px; left:50%; transform:translateX(-50%) translateY(60px);
            background:#1a1a1a; color:#fff; padding:14px 28px; border-radius:12px;
            font-family:'Almarai',sans-serif; font-size:14px; z-index:9999;
            transition:transform .3s ease, opacity .3s ease; opacity:0;
            border:1px solid #333; direction:rtl;
        `;
        document.body.appendChild(t);
    }
    if (type === "success") t.style.borderColor = "#4caf50";
    else if (type === "error") t.style.borderColor = "#f44336";
    else t.style.borderColor = "#c8a96e";

    t.textContent = msg;
    t.style.transform = "translateX(-50%) translateY(0)";
    t.style.opacity   = "1";
    setTimeout(() => {
        t.style.transform = "translateX(-50%) translateY(60px)";
        t.style.opacity   = "0";
    }, 3000);
}

// ============================================================
//  تصدير للاستخدام في ملفات أخرى (login2.js / script.js)
// ============================================================
export { createSession, validateSession, watchSession, clearLocalSession, emailKey };
