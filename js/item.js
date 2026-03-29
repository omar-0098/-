// ============================================================
//  item.js — كشمير هوم
//  الكومنتس + صورة البروفايل + Firebase Realtime Database
// ============================================================

import { initializeApp }          from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL }
                                   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import {
  getDatabase, ref, push, set, get, onValue, query,
  orderByChild, equalTo, limitToLast
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ─── Firebase Config (نفس الـ config بتاعتك) ────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyCCk0w_KHVCswjp16TSkNToRSSOjlPC5kE",
  authDomain:        "data-customer-d722f.firebaseapp.com",
  databaseURL:       "https://data-customer-d722f-default-rtdb.firebaseio.com/",
  projectId:         "data-customer-d722f",
  storageBucket:     "data-customer-d722f.firebasestorage.app",
  messagingSenderId: "398522341614",
  appId:             "1:398522341614:web:99e0f897c61ec960cffbff"
};

const app     = initializeApp(firebaseConfig);
const db      = getDatabase(app);
const storage = getStorage(app);

// ============================================================
//  ① صورة البروفايل — رفع على Storage وحفظ URL في Database
// ============================================================

// جيب الصورة الحالية من localStorage (نفس طريقة account.js)
function getCurrentUserPhoto() {
  return localStorage.getItem("kashmirProfileImg") || "";
}

// جيب email المستخدم الحالي
function getCurrentUserEmail() {
  return localStorage.getItem("kashmirSessionEmail") || "";
}

// جيب اسم المستخدم من kashmirUser
function getCurrentUserName() {
  try {
    const u = JSON.parse(localStorage.getItem("kashmirUser") || "{}");
    return (u.firstName || "") + (u.lastName ? " " + u.lastName : "") || "زائر";
  } catch { return "زائر"; }
}

// حوّل email لـ key آمن (نفس طريقة account.js)
function emailKey(email) {
  return email.replace(/\./g, "_").replace(/@/g, "__");
}

// رفع صورة على Storage وتحديث URL في Database
async function uploadProfilePhoto(file) {
  const email = getCurrentUserEmail();
  if (!email) return null;

  try {
    // رفع الصورة على Storage في مسار: profilePhotos/{emailKey}
    const storageRef = sRef(storage, `profilePhotos/${emailKey(email)}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    // حفظ الـ URL في Database عشان أي حد يقدر يشوفها
    await set(ref(db, `userPhotos/${emailKey(email)}`), url);

    // تحديث localStorage كمان (عشان يكون سريع في التحميل)
    localStorage.setItem("kashmirProfileImg", url);

    return url;
  } catch (err) {
    console.error("خطأ في رفع الصورة:", err);
    return null;
  }
}

// جيب صورة المستخدم من Database (للناس التانية تشوف الصورة)
async function fetchUserPhoto(email) {
  if (!email) return "";
  try {
    const snap = await get(ref(db, `userPhotos/${emailKey(email)}`));
    return snap.exists() ? snap.val() : "";
  } catch { return ""; }
}

// ─── ربط fileInput بالـ upload ────────────────────────────────
// لو عندك input في صفحة البروفايل بس — ده للـ item page مش محتاجه
// بس لو المستخدم فتح الصفحة وعنده صورة قديمة في localStorage هيتحفظ تلقائياً في Storage
(async function syncPhotoToStorage() {
  const email      = getCurrentUserEmail();
  const localPhoto = getCurrentUserPhoto();
  if (!email || !localPhoto || localPhoto.startsWith("https://")) return;

  // لو الصورة base64 (محفوظة قديمة) — ارفعها على Storage
  try {
    const res  = await fetch(localPhoto);
    const blob = await res.blob();
    const storageRef = sRef(storage, `profilePhotos/${emailKey(email)}`);
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    await set(ref(db, `userPhotos/${emailKey(email)}`), url);
    localStorage.setItem("kashmirProfileImg", url);
    console.log("✅ صورة البروفايل اترفعت على Storage تلقائياً");
  } catch (err) {
    console.warn("تعذّر رفع الصورة القديمة:", err);
  }
})();

// ============================================================
//  ② نظام التقييم بالنجوم
// ============================================================

let selectedRating = 0;

document.querySelectorAll(".star").forEach((star) => {
  star.addEventListener("click", () => {
    selectedRating = parseInt(star.dataset.star);
    updateStarUI(selectedRating);
  });

  star.addEventListener("mouseover", () => {
    updateStarUI(parseInt(star.dataset.star));
  });

  star.addEventListener("mouseout", () => {
    updateStarUI(selectedRating);
  });
});

function updateStarUI(rating) {
  document.querySelectorAll(".star").forEach((s) => {
    s.classList.toggle("selected", parseInt(s.dataset.star) <= rating);
  });
  const display = document.getElementById("ratingDisplay");
  if (display) display.textContent = rating > 0 ? `التقييم: ${rating} نجوم` : "التقييم: 0 نجوم";
}

// ============================================================
//  ③ جيب itemId من الـ URL
// ============================================================

// الـ URL المفروض يكون: item.html?id=ITEM_KEY
// لو بتستخدم اسم تاني غير "id" غيّره هنا
const urlParams = new URLSearchParams(window.location.search);
const ITEM_ID   = urlParams.get("id") || window.location.pathname; // fallback لـ path لو مفيش id

// ============================================================
//  ④ إضافة كومنت جديد
// ============================================================

let isPosting = false;

window.postComment = async function () {
  if (isPosting) return;

  const commentInput = document.getElementById("commentInput");
  const submitBtn    = document.getElementById("button");
  const text         = commentInput?.value?.trim();

  if (!text) {
    showItemToast("اكتب تعليقك الأول ✍️", "info");
    commentInput?.focus();
    return;
  }

  if (selectedRating === 0) {
    showItemToast("اختر تقييماً بالنجوم أولاً ⭐", "info");
    return;
  }

  if (text.length > 500) {
    showItemToast("التعليق طويل جداً (500 حرف كحد أقصى)", "error");
    return;
  }

  isPosting = true;
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "جاري النشر..."; }

  const email    = getCurrentUserEmail();
  const userName = getCurrentUserName();

  // جيب صورة المستخدم — من localStorage أولاً (أسرع)، وإلا من Database
  let userPhoto = getCurrentUserPhoto();
  if (!userPhoto && email) {
    userPhoto = await fetchUserPhoto(email);
  }

  try {
    await push(ref(db, `comments/${ITEM_ID}`), {
      text,
      rating:    selectedRating,
      userName,
      userEmail: email || "",
      userPhoto: userPhoto || "",          // ← الصورة محفوظة مع الكومنت
      createdAt: Date.now()
    });

    commentInput.value = "";
    selectedRating = 0;
    updateStarUI(0);
    showItemToast("✅ تم نشر تعليقك!", "success");

  } catch (err) {
    console.error("خطأ في إضافة الكومنت:", err);
    showItemToast("❌ حصل خطأ، حاول مرة تانية", "error");
  } finally {
    isPosting = false;
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "نشر"; }
  }
};

// ============================================================
//  ⑤ تحميل الكومنتس Real-Time
//     أي حد من أي تليفون يشوف التحديثات فوراً
// ============================================================

const COMMENTS_PER_PAGE = 10;
let   allComments       = [];
let   displayedCount    = COMMENTS_PER_PAGE;

function loadComments() {
  const commentsRef = query(
    ref(db, `comments/${ITEM_ID}`),
    orderByChild("createdAt")
  );

  // onValue = real-time listener — بيشتغل تلقائياً لما يُضاف أي كومنت
  onValue(commentsRef, (snapshot) => {
    allComments = [];
    snapshot.forEach((child) => {
      allComments.push({ id: child.key, ...child.val() });
    });

    // الأحدث أول
    allComments.reverse();

    displayedCount = COMMENTS_PER_PAGE;
    renderComments();
    updateStats();
  });
}

function renderComments() {
  const container = document.getElementById("commentsContainer");
  const loadMore  = document.getElementById("loadMoreBtn");
  if (!container) return;

  const toShow = allComments.slice(0, displayedCount);

  if (toShow.length === 0) {
    container.innerHTML = `
      <p style="text-align:center;color:#999;padding:30px 0;direction:rtl;font-family:'Readex Pro',sans-serif;">
        لا يوجد تعليقات بعد — كن أول من يقيّم! 🌟
      </p>`;
    if (loadMore) loadMore.style.display = "none";
    return;
  }

  container.innerHTML = toShow.map(buildCommentHTML).join("");

  if (loadMore) {
    loadMore.style.display = allComments.length > displayedCount ? "block" : "none";
  }
}

// عرض المزيد
window.loadMoreComments = function () {
  displayedCount += COMMENTS_PER_PAGE;
  renderComments();
};

// ============================================================
//  ⑥ بناء HTML كارت الكومنت
// ============================================================

function buildCommentHTML(c) {
  const stars   = "★".repeat(c.rating || 0) + "☆".repeat(5 - (c.rating || 0));
  const dateStr = c.createdAt
    ? new Date(c.createdAt).toLocaleDateString("ar-EG", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit"
      })
    : "";

  // الأفاتار: صورة لو موجودة، أو دائرة ملوّنة بأول حرف
  const initial    = (c.userName || "م")[0];
  const colorIndex = initial.charCodeAt(0) % AVATAR_COLORS.length;
  const avatarHTML = c.userPhoto
    ? `<img
         src="${escapeHtml(c.userPhoto)}"
         alt="صورة ${escapeHtml(c.userName || '')}"
         style="
           width:48px;height:48px;border-radius:50%;
           object-fit:cover;flex-shrink:0;
           border:2.5px solid #c8a96e;
           box-shadow:0 2px 8px rgba(0,0,0,.12);
         "
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
       />
       <div class="avatar" style="
         display:none;background:${AVATAR_COLORS[colorIndex]};
       ">${initial}</div>`
    : `<div class="avatar" style="background:${AVATAR_COLORS[colorIndex]};">${initial}</div>`;

  return `
    <div class="comment" style="margin-bottom:30px;">
      <div style="display:flex;align-items:flex-start;gap:12px;direction:rtl;">
        <div style="display:flex;flex-shrink:0;">
          ${avatarHTML}
        </div>
        <div class="comment-content" style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:3px;">
            <span class="comment-name">${escapeHtml(c.userName || "مجهول")}</span>
            <span class="comment-date">${dateStr}</span>
          </div>
          <div class="comment-stars" style="color:#e4650f;font-size:16px;margin:4px 0;">${stars}</div>
          <p id="text" style="margin:0;">${escapeHtml(c.text || "")}</p>
        </div>
      </div>
      <hr style="margin:16px 0 0;border:none;height:1px;background:#eee;">
    </div>
  `;
}

// ألوان الأفاتار للناس اللي معندهومش صورة
const AVATAR_COLORS = [
  "linear-gradient(135deg,#1d6fc4,#0f1b35)",
  "linear-gradient(135deg,#c8a96e,#a8893e)",
  "linear-gradient(135deg,#16a085,#0d6b57)",
  "linear-gradient(135deg,#8e44ad,#5b2c6f)",
  "linear-gradient(135deg,#e74c3c,#922b21)",
  "linear-gradient(135deg,#e67e22,#935116)",
];

// ============================================================
//  ⑦ إحصائيات التقييم (stars stats)
// ============================================================

function updateStats() {
  const totalEl = document.getElementById("totalComments");
  if (totalEl) totalEl.textContent = `عدد التقييمات: ${allComments.length}`;

  if (!allComments.length) return;

  // حساب متوسط التقييم وتوزيع النجوم
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let   total  = 0;
  allComments.forEach((c) => {
    if (c.rating >= 1 && c.rating <= 5) {
      counts[c.rating]++;
      total += c.rating;
    }
  });

  const avg      = (total / allComments.length).toFixed(1);
  const statsEl  = document.getElementById("starsStats");
  if (!statsEl) return;

  statsEl.innerHTML = `
    <div style="text-align:end;margin-bottom:10px;direction:rtl;">
      <span style="font-size:38px;font-weight:900;font-family:'Rubik',sans-serif;color:#e4650f;">${avg}</span>
      <span style="font-size:18px;color:#e4650f;"> / 5 ⭐</span>
    </div>
    ${[5,4,3,2,1].map(n => {
      const pct = allComments.length ? Math.round((counts[n] / allComments.length) * 100) : 0;
      return `
        <div class="rating-bar">
          <span class="label">${n}</span>
          <span id="star" class="fa-solid fa-star" style="font-size:14px;margin:0 4px;"></span>
          <div class="progress">
            <div class="progress-inner" style="width:${pct}%"></div>
          </div>
          <span class="count">${counts[n]}</span>
        </div>`;
    }).join("")}
  `;
}

// ============================================================
//  ⑧ Toast رسائل مؤقتة
// ============================================================

function showItemToast(msg, type = "info") {
  let t = document.getElementById("toast-item");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast-item";
    t.style.cssText = `
      position:fixed;bottom:30px;left:50%;transform:translateX(-50%) translateY(70px);
      background:#1a1a2e;color:#fff;padding:12px 24px;border-radius:10px;
      font-family:'Readex Pro',sans-serif;font-size:14px;
      box-shadow:0 4px 20px rgba(0,0,0,.25);z-index:9999;
      opacity:0;transition:opacity .3s,transform .3s;
      border-right:4px solid #c8a96e;direction:rtl;white-space:nowrap;
    `;
    document.body.appendChild(t);
  }
  const colors = { success: "#2e7d32", error: "#e53935", info: "#c8a96e" };
  t.style.borderRightColor = colors[type] || "#c8a96e";
  t.textContent = msg;
  requestAnimationFrame(() => {
    t.style.opacity   = "1";
    t.style.transform = "translateX(-50%) translateY(0)";
  });
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity   = "0";
    t.style.transform = "translateX(-50%) translateY(70px)";
  }, 3000);
}

// ============================================================
//  ⑨ حماية من XSS
// ============================================================

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================
//  ⑩ وظائف الصفحة القديمة (صور المنتج + مشاركة + كارت)
// ============================================================

// تغيير صورة المنتج الرئيسية
window.changeItemImage = function (src) {
  const bigImg = document.getElementById("bidImg");
  if (!bigImg) return;

  bigImg.classList.add("slide-out");
  setTimeout(() => {
    bigImg.src = src;
    bigImg.classList.remove("slide-out");
    bigImg.classList.add("slide-in");
    setTimeout(() => bigImg.classList.remove("slide-in"), 400);
  }, 300);
};

// تحميل كل صور المنتج
window.downloadAllImages = function () {
  document.querySelectorAll(".sm_imgs img").forEach((img, i) => {
    const a    = document.createElement("a");
    a.href     = img.src;
    a.download = `kashmir-image-${i + 1}.jpg`;
    a.click();
  });
};

// مشاركة
window.toggleShare = function () {
  const menu = document.getElementById("shareMenu");
  if (menu) menu.style.display = menu.style.display === "block" ? "none" : "block";
};

window.shareWhatsApp = function () {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://wa.me/?text=${url}`, "_blank");
};

window.shareTelegram = function () {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://t.me/share/url?url=${url}`, "_blank");
};

// إغلاق قائمة المشاركة لما يضغط برا
document.addEventListener("click", (e) => {
  const menu    = document.getElementById("shareMenu");
  const shareBtn = document.querySelector(".share-btn");
  if (menu && !menu.contains(e.target) && e.target !== shareBtn && !shareBtn?.contains(e.target)) {
    menu.style.display = "none";
  }
});

// زر المفضلة
window.activateLike = function (btn) {
  btn.classList.toggle("active");
  const isActive = btn.classList.contains("active");
  showItemToast(isActive ? "❤️ تمت الإضافة إلى المفضلة" : "💔 تمت الإزالة من المفضلة", "info");
};

// ============================================================
//  ⑪ تشغيل كل حاجة لما تُحمّل الصفحة
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  loadComments(); // يبدأ الـ real-time listener للكومنتس
});
