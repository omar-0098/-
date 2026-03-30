// ============================================================
//  item.js — كشمير هوم
//  شكل الكومنت القديم + Firebase Realtime Database
// ============================================================

import { initializeApp }   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL }
                            from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import {
  getDatabase, ref, push, set, get, onValue, update
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ─── Firebase Config ─────────────────────────────────────────
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
//  🔵 زووم وسحب الصورة (من الملف القديم)
// ============================================================

const img = document.getElementById("bidImg");
let scale = 1, originX = 0, originY = 0;
let lastX = 0, lastY = 0, isDragging = false;
let initialPinchDistance = null, lastScale = 1;

img?.addEventListener("wheel", (e) => {
  e.preventDefault();
  const rect = img.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  const newScale = Math.min(Math.max(0.5, scale + delta), 4);
  originX -= (offsetX / scale - offsetX / newScale);
  originY -= (offsetY / scale - offsetY / newScale);
  scale = newScale;
  updateTransform();
});
img?.addEventListener("mousedown", (e) => {
  isDragging = true; lastX = e.clientX; lastY = e.clientY;
  img.style.cursor = "grabbing"; preventPageScroll(true);
});
window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  originX += (e.clientX - lastX) / scale;
  originY += (e.clientY - lastY) / scale;
  lastX = e.clientX; lastY = e.clientY;
  updateTransform();
});
window.addEventListener("mouseup", () => {
  isDragging = false; if (img) img.style.cursor = "grab"; preventPageScroll(false);
});
img?.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    isDragging = true;
    lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
    preventPageScroll(true);
  }
});
img?.addEventListener("touchmove", (e) => {
  if (e.touches.length === 1 && isDragging) {
    originX += (e.touches[0].clientX - lastX) / scale;
    originY += (e.touches[0].clientY - lastY) / scale;
    lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
    updateTransform();
  }
  if (e.touches.length === 2) {
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const distance = Math.hypot(dx, dy);
    if (initialPinchDistance == null) { initialPinchDistance = distance; lastScale = scale; }
    else { scale = Math.min(Math.max(0.5, lastScale * (distance / initialPinchDistance)), 4); updateTransform(); }
  }
}, { passive: false });
img?.addEventListener("touchend", (e) => {
  if (e.touches.length < 2) { isDragging = false; initialPinchDistance = null; preventPageScroll(false); }
});

function updateTransform() {
  if (img) img.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
}
function preventPageScroll(enable) {
  document.body.style.overflow = enable ? "hidden" : "";
}
window.changeItemImage = function (src) {
  if (!img) return;
  img.style.opacity = 0;
  setTimeout(() => {
    img.src = src; scale = 1; originX = 0; originY = 0;
    updateTransform(); img.style.opacity = 1;
  }, 200);
};
window.downloadAllImages = function () {
  document.querySelectorAll(".sm_imgs img").forEach((im, i) => {
    const a = document.createElement("a");
    a.href = im.src; a.download = `kashmir-image-${i + 1}.jpg`; a.click();
  });
};

// ============================================================
//  🟠 مشاركة + مفضلة
// ============================================================

window.toggleShare = function () {
  const menu = document.getElementById("shareMenu");
  if (menu) menu.style.display = menu.style.display === "block" ? "none" : "block";
};
window.shareWhatsApp = function () {
  window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, "_blank");
};
window.shareTelegram = function () {
  window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}`, "_blank");
};
document.addEventListener("click", (e) => {
  const menu = document.getElementById("shareMenu");
  const shareBtn = document.querySelector(".share-btn");
  if (menu && !menu.contains(e.target) && e.target !== shareBtn && !shareBtn?.contains(e.target))
    menu.style.display = "none";
});
window.activateLike = function (btn) {
  btn.classList.toggle("active");
  showToast(btn.classList.contains("active") ? "❤️ تمت الإضافة للمفضلة" : "💔 تمت الإزالة", "info");
};

// ============================================================
//  🟡 بيانات المستخدم من localStorage
// ============================================================

function getCurrentUserName() {
  try {
    const u = JSON.parse(localStorage.getItem("kashmirUser") || "{}");
    const fn = u.firstName || u.name || "";
    const ln = u.lastName  || u.family || "";
    return (fn + (ln ? " " + ln : "")).trim() || "مستخدم";
  } catch { return "مستخدم"; }
}
function getCurrentUserEmail() {
  return localStorage.getItem("kashmirSessionEmail") || "";
}
function getCurrentUserPhoto() {
  return localStorage.getItem("kashmirProfileImg") || "";
}
function emailKey(email) {
  return email.replace(/\./g, "_").replace(/@/g, "__");
}
async function fetchUserPhoto(email) {
  if (!email) return "";
  try {
    const snap = await get(ref(db, `userPhotos/${emailKey(email)}`));
    return snap.exists() ? snap.val() : "";
  } catch { return ""; }
}

// رفع صورة base64 قديمة على Storage تلقائياً
(async function syncPhotoToStorage() {
  const email      = getCurrentUserEmail();
  const localPhoto = getCurrentUserPhoto();
  if (!email || !localPhoto || localPhoto.startsWith("https://")) return;
  try {
    const blob = await (await fetch(localPhoto)).blob();
    const sr   = sRef(storage, `profilePhotos/${emailKey(email)}`);
    await uploadBytes(sr, blob);
    const url = await getDownloadURL(sr);
    await set(ref(db, `userPhotos/${emailKey(email)}`), url);
    localStorage.setItem("kashmirProfileImg", url);
  } catch { /* silent */ }
})();

// ============================================================
//  🟢 ITEM ID من الـ URL
// ============================================================

const ITEM_ID = (function () {
  const fromQuery = new URLSearchParams(window.location.search).get("id");
  if (fromQuery) return fromQuery;
  const parts = window.location.pathname.split("/").filter(Boolean);
  const name  = parts.length >= 2 ? parts[parts.length - 2] : parts[parts.length - 1] || "item";
  return name.replace(/[.#$[\]]/g, "-");
})();

// ============================================================
//  ⭐ نظام النجوم (شكل الملف القديم)
// ============================================================

let selectedRating = 0;
const colorMap = { 1: "red", 2: "orange", 3: "#f1c40f", 4: "green", 5: "#3498db" };

function updateStarDisplay() {
  document.querySelectorAll(".star").forEach((star) => {
    const num = parseInt(star.getAttribute("data-star"));
    star.classList.toggle("selected", num <= selectedRating);
    star.style.color = num <= selectedRating ? colorMap[selectedRating] : "#ccc";
  });
  const rd = document.getElementById("ratingDisplay");
  if (rd) rd.textContent = selectedRating > 0 ? `التقييم: ${selectedRating} نجمة` : "التقييم: 0 نجوم";
}

document.querySelectorAll(".star").forEach((star) => {
  star.addEventListener("click", () => {
    selectedRating = parseInt(star.getAttribute("data-star"));
    updateStarDisplay();
  });
  star.addEventListener("mouseover", () => {
    const n = parseInt(star.getAttribute("data-star"));
    document.querySelectorAll(".star").forEach((s) => {
      s.style.color = parseInt(s.getAttribute("data-star")) <= n ? colorMap[n] : "#ccc";
    });
  });
  star.addEventListener("mouseout", () => updateStarDisplay());
});

// ============================================================
//  💬 الكومنتس — شكل الملف القديم + Firebase
// ============================================================

const AVATAR_COLORS = ["#e74c3c", "#8e44ad", "#3498db", "#f39c12", "#27ae60", "#e67e22", "#1abc9c"];

function getColorForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDate(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

// نفس createCommentElement القديمة بالضبط
function createCommentElement({ id, userName, text, createdAt, userPhoto, rating, likes = 0, dislikes = 0 }) {
  const commentDiv = document.createElement("div");
  commentDiv.className = "comment";
  commentDiv.dataset.commentId = id;

  // الأفاتار
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  if (userPhoto) {
    avatar.style.backgroundImage    = `url(${userPhoto})`;
    avatar.style.backgroundSize     = "cover";
    avatar.style.backgroundPosition = "center";
  } else {
    avatar.style.backgroundColor = getColorForName(userName || "م");
    avatar.textContent = (userName || "م").charAt(0);
  }

  // المحتوى
  const content = document.createElement("div");
  content.className = "comment-content";
  const starsHtml = '<i class="fa-solid fa-star" id="star"></i>'.repeat(rating || 0);
  content.innerHTML = `
    <div class="comment-name">${escapeHtml(userName || "مجهول")}</div>
    <div class="comment-date comment-stars">${formatDate(createdAt)}</div>
    <div class="comment-text">${starsHtml}</div>
    <div class="comment-text">${escapeHtml(text || "")}</div>
  `;

  // الـ reactions — نفس الـ SVGs القديمة بالضبط
  const reactionDiv = document.createElement("div");
  reactionDiv.className = "comment-reactions";
  reactionDiv.innerHTML = `
    <button class="dislike-btn" data-comment-id="${id}">
<i class="fa-regular fa-thumbs-down"></i>
 ${dislikes}</button>
    <span class="vote-separator"></span>
    <button class="like-btn" data-comment-id="${id}">
     <i class="fa-regular fa-thumbs-up"></i>
        ${likes}</button>
  `;

  commentDiv.appendChild(avatar);
  commentDiv.appendChild(content);
  commentDiv.appendChild(reactionDiv);
  setTimeout(() => attachReactionEvents(commentDiv, id), 0);
  return commentDiv;
}

// ─── Like / Dislike ──────────────────────────────────────────

function attachReactionEvents(commentDiv, id) {
  const likeBtn    = commentDiv.querySelector(".like-btn");
  const dislikeBtn = commentDiv.querySelector(".dislike-btn");
  const voteKey    = `vote_${ITEM_ID}_${id}`;
  const prev       = localStorage.getItem(voteKey);
  if (prev === "like")    likeBtn?.classList.add("voted");
  if (prev === "dislike") dislikeBtn?.classList.add("voted");
  likeBtn?.addEventListener("click",    () => handleVote(id, "like",    likeBtn, dislikeBtn));
  dislikeBtn?.addEventListener("click", () => handleVote(id, "dislike", likeBtn, dislikeBtn));
}

async function handleVote(commentId, type, likeBtn, dislikeBtn) {
  const voteKey = `vote_${ITEM_ID}_${commentId}`;
  const prev    = localStorage.getItem(voteKey);
  const comRef  = ref(db, `comments/${ITEM_ID}/${commentId}`);
  try {
    const snap = await get(comRef);
    if (!snap.exists()) return;
    const data = snap.val();
    let likes    = data.likes    || 0;
    let dislikes = data.dislikes || 0;

    if (prev === type) {
      if (type === "like") likes--; else dislikes--;
      localStorage.removeItem(voteKey);
      likeBtn.classList.remove("voted"); dislikeBtn.classList.remove("voted");
    } else {
      if (prev === "like")    { likes--;    likeBtn.classList.remove("voted");    }
      if (prev === "dislike") { dislikes--; dislikeBtn.classList.remove("voted"); }
      if (type === "like")    { likes++;    likeBtn.classList.add("voted");    }
      else                    { dislikes++; dislikeBtn.classList.add("voted"); }
      localStorage.setItem(voteKey, type);
    }

    await update(comRef, { likes: Math.max(0, likes), dislikes: Math.max(0, dislikes) });

    // تحديث الأرقام مباشرة في الـ DOM
    const card = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (card) {
      const lc = card.querySelector(".like-count");
      const dc = card.querySelector(".dislike-count");
      if (lc) lc.textContent = Math.max(0, likes);
      if (dc) dc.textContent = Math.max(0, dislikes);
    }
  } catch (err) { console.error("خطأ في التصويت:", err); }
}

// ─── عرض الكومنتس ────────────────────────────────────────────

let allComments  = [];
let visibleCount = 5;

function renderComments() {
  const container = document.getElementById("commentsContainer");
  if (!container) return;
  container.innerHTML = "";

  if (allComments.length === 0) {
    container.innerHTML = `<p style="text-align:center;color:#999;padding:30px;direction:rtl;font-family:'Readex Pro',sans-serif;">لا يوجد تعليقات بعد — كن أول من يقيّم! 🌟</p>`;
    const lb = document.getElementById("loadMoreBtn");
    if (lb) lb.style.display = "none";
    return;
  }

  allComments.slice(0, visibleCount).forEach((c) => container.appendChild(createCommentElement(c)));

  const lb = document.getElementById("loadMoreBtn");
  if (lb) lb.style.display = visibleCount < allComments.length ? "block" : "none";
}

window.loadMoreComments = function () {
  visibleCount += 5;
  renderComments();
};

// ─── Real-Time Listener ───────────────────────────────────────

function loadComments() {
  onValue(ref(db, `comments/${ITEM_ID}`), (snapshot) => {
    allComments = [];
    snapshot.forEach((child) => allComments.push({ id: child.key, ...child.val() }));
    allComments.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    renderComments();
    updateProductStats();
    updateCommentCount();
  });
}

// ============================================================
//  📊 إحصائيات التقييم (شكل الملف القديم بالضبط)
// ============================================================

function updateProductStats() {
  const statsContainer = document.getElementById("starsStats");
  if (!statsContainer) return;

  const counts = [0, 0, 0, 0, 0];
  allComments.forEach((c) => { if (c.rating >= 1 && c.rating <= 5) counts[c.rating - 1]++; });
  const total         = counts.reduce((a, b) => a + b, 0);
  const averageRating = total > 0
    ? (counts.reduce((sum, count, i) => sum + count * (i + 1), 0) / total).toFixed(1) : 0;

  statsContainer.innerHTML = "";
  const mainSection = document.createElement("div");

  // قسم التقييم العام
  const ratingSection = document.createElement("div");
  ratingSection.style.cssText = "text-align:center;min-width:120px;";

  const reviewsTitle = document.createElement("h3");
  reviewsTitle.textContent = "إحصائيات تقييم المنتج";
  reviewsTitle.style.cssText = `margin:0 0 35px 0;font-size:18px;color:#000;font-weight:600;
    font-family:"Readex Pro",sans-serif;font-optical-sizing:auto;font-style:normal;`;

  const ratingNumber = document.createElement("div");
  ratingNumber.textContent = averageRating;
  ratingNumber.style.cssText = "font-size:48px;font-weight:bold;color:#333;margin:10px 0;line-height:1;";

  const starsDiv = document.createElement("div");
  starsDiv.style.cssText = "display:flex;justify-content:center;gap:2px;margin:10px 0;";
  for (let i = 1; i <= 5; i++) {
    const s = document.createElement("span");
    s.innerHTML = "★";
    s.style.cssText = `font-size:28px;color:${i <= Math.round(averageRating) ? "#ffc107" : "#e9ecef"};text-shadow:0 0 2px black;`;
    starsDiv.appendChild(s);
  }

  const reviewCount = document.createElement("div");
  reviewCount.textContent = `مراجعات ${total}`;
  reviewCount.style.cssText = `color:rgb(108,117,125);font-size:16px;margin-top:5px;margin-bottom:10px;
    font-family:"Readex Pro",sans-serif;font-optical-sizing:auto;font-style:normal;`;

  ratingSection.append(reviewsTitle, ratingNumber, starsDiv, reviewCount);

  // أشرطة التقييم
  const detailSection = document.createElement("div");
  detailSection.style.cssText = "flex:1;min-width:300px;";
  for (let i = 5; i >= 1; i--) {
    const percent = total > 0 ? (counts[i - 1] / total) * 100 : 0;
    const bar = document.createElement("div");
    bar.style.cssText = "display:flex;align-items:center;gap:12px;margin-bottom:13px;";

    const pLabel = document.createElement("span");
    pLabel.textContent = `${Math.round(percent)}%`;
    pLabel.style.cssText = "width:35px;text-align:right;font-size:15px;color:#6c757d;font-weight:500;";

    const pContainer = document.createElement("div");
    pContainer.style.cssText = `flex:1;height:8px;background-color:rgb(228,219,219);
      border-radius:6px;overflow:hidden;position:relative;direction:rtl;`;
    const pBar = document.createElement("div");
    pBar.style.cssText = `height:100%;width:${percent}%;
      background:linear-gradient(90deg,#333 0%,#555 100%);border-radius:6px;transition:width 0.3s ease;`;
    pContainer.appendChild(pBar);

    const sNum = document.createElement("span");
    sNum.textContent = i;
    sNum.style.cssText = "width:20px;text-align:center;font-size:14px;font-weight:600;color:#333;";

    bar.append(pLabel, pContainer, sNum);
    detailSection.appendChild(bar);
  }

  mainSection.append(ratingSection, detailSection);
  statsContainer.appendChild(mainSection);
}

function updateCommentCount() {
  const el = document.getElementById("totalComments");
  if (el) el.textContent = `عدد التقييمات: ${allComments.length}`;
}

// ============================================================
//  📝 نشر كومنت جديد
// ============================================================

let isPosting = false;

window.postComment = async function () {
  if (isPosting) return;
  const commentInput = document.getElementById("commentInput");
  const submitBtn    = document.getElementById("button");
  const text         = commentInput?.value?.trim();
  const userName     = getCurrentUserName();

  if (userName === "مستخدم") {
    showToast("❌ يجب عليك إنشاء حساب أولاً قبل نشر التعليق", "error"); return;
  }
  if (!text) { showToast("يرجى كتابة تعليق! ✍️", "info"); commentInput?.focus(); return; }
  if (selectedRating === 0) { showToast("يرجى اختيار تقييم من النجوم! ⭐", "info"); return; }
  if (text.length > 500) { showToast("التعليق طويل جداً (500 حرف كحد أقصى)", "error"); return; }

  isPosting = true;
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "جاري النشر..."; }

  const email     = getCurrentUserEmail();
  let   userPhoto = getCurrentUserPhoto();
  if (!userPhoto && email) userPhoto = await fetchUserPhoto(email);

  try {
    await push(ref(db, `comments/${ITEM_ID}`), {
      userName,
      userEmail: email || "",
      userPhoto: userPhoto || "",
      text,
      rating:    selectedRating,
      likes:     0,
      dislikes:  0,
      createdAt: Date.now()
    });
    commentInput.value = "";
    selectedRating = 0;
    updateStarDisplay();
    showToast("✅ تم نشر تعليقك!", "success");
  } catch (err) {
    console.error("خطأ في إضافة الكومنت:", err);
    showToast("❌ حصل خطأ، حاول مرة تانية", "error");
  } finally {
    isPosting = false;
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "نشر"; }
  }
};

// ============================================================
//  🔔 Toast + 🔒 XSS
// ============================================================

function showToast(msg, type = "info") {
  let t = document.getElementById("toast-item");
  if (!t) {
    t = document.createElement("div"); t.id = "toast-item";
    t.style.cssText = `position:fixed;bottom:30px;left:50%;
      transform:translateX(-50%) translateY(70px);background:#1a1a2e;color:#fff;
      padding:12px 24px;border-radius:10px;font-family:'Readex Pro',sans-serif;
      font-size:14px;direction:rtl;box-shadow:0 4px 20px rgba(0,0,0,.25);z-index:9999;
      opacity:0;transition:opacity .3s,transform .3s;border-right:4px solid #c8a96e;white-space:nowrap;`;
    document.body.appendChild(t);
  }
  t.style.borderRightColor = { success:"#2e7d32", error:"#e53935", info:"#c8a96e" }[type] || "#c8a96e";
  t.textContent = msg;
  requestAnimationFrame(() => { t.style.opacity="1"; t.style.transform="translateX(-50%) translateY(0)"; });
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity="0"; t.style.transform="translateX(-50%) translateY(70px)"; }, 3000);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
                    .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

// ============================================================
//  🚀 تشغيل
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  loadComments();
});
