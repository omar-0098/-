
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
const productId = window.location.pathname;

function getRandomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createCommentElement({ name, comment, date, color, rating, imageUrl, id, likes = 0, dislikes = 0 }) {
  const commentDiv = document.createElement('div');
  commentDiv.className = 'comment';
  commentDiv.dataset.commentId = id;

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
    <div class="comment-date .comment-stars"> ${formatDate(date)}</div>
    <div class="comment-text">${'<i class="fa-solid fa-star" id="star"></i>'.repeat(rating)}</div>
    <div class="comment-text">${comment}</div>
  `;

  const reactionDiv = document.createElement('div');
  reactionDiv.className = 'comment-reactions';
  reactionDiv.innerHTML = `
    <button class="dislike-btn" data-comment-id="${id}"><svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M239.82,157l-12-96A24,24,0,0,0,204,40H32A16,16,0,0,0,16,56v88a16,16,0,0,0,16,16H75.06l37.78,75.58A8,8,0,0,0,120,240a40,40,0,0,0,40-40V184h56a24,24,0,0,0,23.82-27ZM72,144H32V56H72Zm150,21.29a7.88,7.88,0,0,1-6,2.71H152a8,8,0,0,0-8,8v24a24,24,0,0,1-19.29,23.54L88,150.11V56H204a8,8,0,0,1,7.94,7l12,96A7.87,7.87,0,0,1,222,165.29Z"></path>
                      </svg> ${dislikes}</button>
    <span class="vote-separator"></span>
    <button class="like-btn" data-comment-id="${id}"><svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
      <path d="M234,80.12A24,24,0,0,0,216,72H160V56a40,40,0,0,0-40-40,8,8,0,0,0-7.16,4.42L75.06,96H32a16,16,0,0,0-16,16v88a16,16,0,0,0,16,16H204a24,24,0,0,0,23.82-21l12-96A24,24,0,0,0,234,80.12ZM32,112H72v88H32ZM223.94,97l-12,96a8,8,0,0,1-7.94,7H88V105.89l36.71-73.43A24,24,0,0,1,144,56V80a8,8,0,0,0,8,8h64a8,8,0,0,1,7.94,9Z"></path>
        </svg>${likes}</button>
  `;

  commentDiv.appendChild(avatar);
  commentDiv.appendChild(content);
  commentDiv.appendChild(reactionDiv);

  // إضافة الأحداث بعد إنشاء الأزرار
  setTimeout(() => attachReactionEvents(commentDiv), 0);

  return commentDiv;
}

function attachReactionEvents(commentDiv) {
  const id = commentDiv.dataset.commentId;
  const likeBtn = commentDiv.querySelector('.like-btn');
  const dislikeBtn = commentDiv.querySelector('.dislike-btn');
  const voteKey = `vote_${id}`;
  const previousVote = localStorage.getItem(voteKey);

  likeBtn.addEventListener('click', () => handleVote(id, 'like', likeBtn, dislikeBtn));
  dislikeBtn.addEventListener('click', () => handleVote(id, 'dislike', likeBtn, dislikeBtn));

  // تمييز التصويت السابق
  if (previousVote === 'like') likeBtn.classList.add('voted');
  else if (previousVote === 'dislike') dislikeBtn.classList.add('voted');
}

async function handleVote(commentId, type, likeBtn, dislikeBtn) {
  const voteKey = `vote_${commentId}`;
  const previousVote = localStorage.getItem(voteKey);

  const comment = allComments.find(c => c.id === commentId);
  if (!comment) return;

  if (previousVote === type) {
    // إلغاء التصويت
    if (type === 'like') comment.likes--;
    else comment.dislikes--;
    localStorage.removeItem(voteKey);
  } else {
    // تحديث التصويت
    if (type === 'like') {
      comment.likes++;
      if (previousVote === 'dislike') comment.dislikes--;
    } else {
      comment.dislikes++;
      if (previousVote === 'like') comment.likes--;
    }
    localStorage.setItem(voteKey, type);
  }

  await updateCommentsOnServer();
  renderComments();
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
  const fatherName = userData.family || '';
  const fullName = fatherName ? `${name} ${fatherName}` : name;
  const imageUrl = userData.imageUrl || null;

  if (name === 'مستخدم') {
    return alert("❌ يجب عليك إنشاء حساب أولاً قبل نشر التعليق.");
  }

  if (!comment) return alert('يرجى كتابة تعليق!');
  if (selectedRating === 0) return alert('يرجى اختيار تقييم من النجوم!');

  const newComment = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: fullName,
    comment,
    date: new Date(),
    color: getRandomColor(),
    rating: selectedRating,
    imageUrl,
    productId,
    likes: 0,
    dislikes: 0
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

async function updateCommentsOnServer() {
  try {
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY
      },
      body: JSON.stringify({ comments: allComments })
    });
  } catch (err) {
    console.error("❌ فشل تحديث بيانات الإعجابات:", err);
  }
}

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






