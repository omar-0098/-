
const img = document.getElementById("bidImg");
let scale = 1;
let originX = 0;
let originY = 0;
let lastX = 0;
let lastY = 0;
let isDragging = false;
let initialPinchDistance = null;
let lastScale = 1;

// ✅ زووم بالماوس
img.addEventListener("wheel", (e) => {
  e.preventDefault();

  const rect = img.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;

  const zoomIntensity = 0.1;
  const delta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;
  const newScale = Math.min(Math.max(0.5, scale + delta), 4);

  originX -= (offsetX / scale - offsetX / newScale);
  originY -= (offsetY / scale - offsetY / newScale);

  scale = newScale;
  updateTransform();
});

// ✅ سحب بالماوس
img.addEventListener("mousedown", (e) => {
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  img.style.cursor = "grabbing";
  preventPageScroll(true);
});

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  originX += (e.clientX - lastX) / scale;
  originY += (e.clientY - lastY) / scale;
  lastX = e.clientX;
  lastY = e.clientY;
  updateTransform();
});

window.addEventListener("mouseup", () => {
  isDragging = false;
  img.style.cursor = "grab";
  preventPageScroll(false);
});

// ✅ سحب باللمس بإصبع واحد
img.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    isDragging = true;
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
    preventPageScroll(true);
  }
});

img.addEventListener("touchmove", (e) => {
  if (e.touches.length === 1 && isDragging) {
    originX += (e.touches[0].clientX - lastX) / scale;
    originY += (e.touches[0].clientY - lastY) / scale;
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
    updateTransform();
  }

  // ✅ دعم pinch zoom
  if (e.touches.length === 2) {
    e.preventDefault(); // يمنع الزوم الافتراضي

    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const distance = Math.hypot(dx, dy);

    if (initialPinchDistance == null) {
      initialPinchDistance = distance;
      lastScale = scale;
    } else {
      const pinchScale = distance / initialPinchDistance;
      scale = Math.min(Math.max(0.5, lastScale * pinchScale), 4);
      updateTransform();
    }
  }
}, { passive: false });

img.addEventListener("touchend", (e) => {
  if (e.touches.length < 2) {
    isDragging = false;
    initialPinchDistance = null;
    preventPageScroll(false);
  }
});

function updateTransform() {
  img.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
}

function preventPageScroll(enable) {
  document.body.style.overflow = enable ? "hidden" : "";
}

// ✅ تغيير الصورة عند الضغط على صورة صغيرة
function changeItemImage(src) {
  img.style.opacity = 0;
  setTimeout(() => {
    img.src = src;
    scale = 1;
    originX = 0;
    originY = 0;
    updateTransform();
    img.style.opacity = 1;
  }, 200);
}




















// إعدادات JSONBin
const BIN_ID = "684430798561e97a5020a6a3";
const API_KEY = "$2a$10$xAWjC3zelpDKCd6zdOdUg.D0bwtEURjcR5sEiYdonjBmP5lHuqzq2";

const colors = ['#e74c3c', '#8e44ad', '#3498db', '#f39c12', '#27ae60', '#e67e22', '#1abc9c'];
let allComments = [];
let visibleCount = 5;
let selectedRating = 0;

// 🆕 معرف المنتج الحالي (الصفحة)
const productId = window.location.pathname;

function getRandomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function createCommentElement({ name, comment, date, color, rating, imageUrl }) {
  const commentDiv = document.createElement('div');
  commentDiv.className = 'comment';

  const avatar = document.createElement('div');
  avatar.className = 'avatar';

  if (imageUrl) {
    avatar.style.backgroundImage = `url(${imageUrl})`;
    avatar.style.backgroundSize = 'cover';
    avatar.style.backgroundPosition = 'center';
  } else {
    avatar.style.backgroundColor = color;
    avatar.textContent = name.charAt(0);
  }

  const content = document.createElement('div');
  content.className = 'comment-content';
  content.innerHTML = `
    <div class="comment-name">${name}</div>
    <div class="comment-text">${'⭐'.repeat(rating)}</div>
    <div class="comment-text">${comment}</div>
    <div class="comment-date">تاريخ النشر: ${formatDate(date)}</div>
  `;

  commentDiv.appendChild(avatar);
  commentDiv.appendChild(content);

  return commentDiv;
}

function renderComments() {
  const container = document.getElementById('commentsContainer');
  container.innerHTML = '';
  const filtered = allComments.filter(c => c.productId === productId);
  const toShow = filtered.slice().reverse().slice(0, visibleCount);
  toShow.forEach(comment => {
    container.appendChild(createCommentElement(comment));
  });
  document.getElementById('loadMoreBtn').style.display = (visibleCount < filtered.length) ? 'block' : 'none';
}

function loadMoreComments() {
  visibleCount += 5;
  renderComments();
  updateProductStats();
  updateCommentCount();
}

function updateProductStats() {
  const statsContainer = document.getElementById('starsStats');
  const counts = [0, 0, 0, 0, 0];

  const filtered = allComments.filter(c => c.productId === productId);
  filtered.forEach(c => { if (c.rating >= 1 && c.rating <= 5) counts[c.rating - 1]++; });

  const total = counts.reduce((a, b) => a + b, 0);
  statsContainer.innerHTML = '';

  for (let i = 5; i >= 1; i--) {
    const percent = total > 0 ? (counts[i - 1] / total) * 100 : 0;
    statsContainer.innerHTML += `
      <div class="rating-bar">
        <span class="label">⭐ ${i}</span>
        <div class="progress"><div class="progress-inner" style="width: ${percent}%;"></div></div>
        <span class="count">${counts[i - 1]}</span>
      </div>
    `;
  }
}

function updateCommentCount() {
  const count = allComments.filter(c => c.productId === productId).length;
  document.getElementById('totalComments').textContent = `عدد التقيمات: ${count}`;
}

function updateStarDisplay() {
  const colorMap = { 1: 'red', 2: 'orange', 3: '#f1c40f', 4: 'green', 5: '#3498db' };
  document.querySelectorAll('.star').forEach(star => {
    const num = parseInt(star.getAttribute('data-star'));
    star.classList.toggle('selected', num <= selectedRating);
    star.style.color = num <= selectedRating ? colorMap[selectedRating] : '#ccc';
  });
  document.getElementById('ratingDisplay').textContent = `التقييم: ${selectedRating} نجمة`;
}

document.querySelectorAll('.star').forEach(star => {
  star.addEventListener('click', () => {
    selectedRating = parseInt(star.getAttribute('data-star'));
    updateStarDisplay();
  });
});

async function postComment() {
  const commentInput = document.getElementById('commentInput');
  const comment = commentInput.value.trim();
  const userData = JSON.parse(localStorage.getItem('userData')) || {};
  const name = userData.name || 'مستخدم';
  const fatherName = userData.family || ''; // افترض أن هناك حقل اسم الأب
  const fullName = fatherName ? `${name} ${fatherName}` : name; // دمج الاسم واسم الأب
  const imageUrl = userData.imageUrl || null;

  if (name === 'مستخدم') {
    return alert("❌ يجب عليك إنشاء حساب أولاً قبل نشر التعليق.");
  }

  if (!comment) return alert('يرجى كتابة تعليق!');
  if (selectedRating === 0) return alert('يرجى اختيار تقييم من النجوم!');

  const newComment = {
    name: fullName, // استخدام الاسم الكامل بدلاً من الاسم الأول فقط
    comment,
    date: new Date(),
    color: getRandomColor(),
    rating: selectedRating,
    imageUrl,
    productId
  };

  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': API_KEY }
    });
    const data = await res.json();
    const comments = data.record.comments || [];

    comments.push(newComment);

    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY
      },
      body: JSON.stringify({ comments })
    });

    allComments.push(newComment);
    renderComments();
    updateProductStats();
    updateCommentCount();

    commentInput.value = '';
    selectedRating = 0;
    updateStarDisplay();

    alert("✅ تم نشر تعليقك!");
  } catch (err) {
    console.error("❌ خطأ أثناء إرسال التعليق:", err);
    alert("حدث خطأ أثناء إرسال التعليق.");
  }
}

// تحميل التعليقات عند فتح الصفحة
window.onload = async function () {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': API_KEY }
    });
    const data = await res.json();
    allComments = data.record.comments || [];
  } catch (e) {
    console.error("⚠️ خطأ أثناء تحميل التعليقات:", e);
    allComments = [];
  }
  renderComments();
  updateProductStats();
  updateCommentCount();
};























const btn = document.getElementById("cartBtn");
const overlay = document.getElementById("overlay");

let iframe = overlay.querySelector("iframe");
let video = overlay.querySelector("video");

btn.addEventListener("click", function () {
  overlay.style.display = "flex";

  if (iframe) {
    iframe.style.display = "block";
    iframe.src = iframe.src; // نضمن تشغيله من الأول
  } else if (video) {
    video.style.display = "block";
    video.play(); // نشغل الفيديو
  }
});

overlay.addEventListener("click", function (e) {
  if (iframe && !iframe.contains(e.target)) {
    overlay.style.display = "none";
    iframe.style.display = "none";
    iframe.src = iframe.src; // نوقف الiframe
  }
  if (video && !video.contains(e.target)) {
    overlay.style.display = "none";
    video.style.display = "none";
    video.pause(); // نوقف الفيديو
    video.currentTime = 0; // نرجعه لأول ثانية
  }
});






