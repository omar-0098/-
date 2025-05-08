
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












// ========== جزء التعليقات ==========
const colors = ['#e74c3c', '#8e44ad', '#3498db', '#f39c12', '#27ae60', '#e67e22', '#1abc9c'];
let allComments = [];
let visibleCount = 5;
let selectedRating = 0;

// 🆕 تحديد اسم مفتاح التخزين حسب الصفحة
const pageKey = `comments_${window.location.pathname}`;

function getRandomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 🆕 حفظ التعليقات الخاصة بالصفحة فقط
function saveComments() {
  localStorage.setItem(pageKey, JSON.stringify(allComments));
}

function updateProductStats() {
  const statsContainer = document.getElementById('starsStats');
  const counts = [0, 0, 0, 0, 0];

  allComments.forEach(c => {
    if (c.rating >= 1 && c.rating <= 5) {
      counts[c.rating - 1]++;
    }
  });

  const total = counts.reduce((a, b) => a + b, 0);
  statsContainer.innerHTML = '';

  for (let i = 5; i >= 1; i--) {
    const count = counts[i - 1];
    const percent = total > 0 ? (count / total) * 100 : 0;

    const bar = document.createElement('div');
    bar.className = 'rating-bar';
    bar.innerHTML = `
      <span class="label">⭐ ${i}</span>
      <div class="progress">
        <div class="progress-inner" style="width: ${percent}%;"></div>
      </div>
      <span class="count">${count}</span>
    `;
    statsContainer.appendChild(bar);
  }
}

function createCommentElement({ name, comment, date, color, rating }) {
  const commentDiv = document.createElement('div');
  commentDiv.className = 'comment';

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.style.backgroundColor = color;
  avatar.textContent = name.charAt(0);

  const content = document.createElement('div');
  content.className = 'comment-content';

  const nameDiv = document.createElement('div');
  nameDiv.className = 'comment-name';
  nameDiv.textContent = name;

  const textDiv = document.createElement('div');
  textDiv.className = 'comment-text';
  textDiv.id = 'text';
  textDiv.textContent = comment;

  const ratingDiv = document.createElement('div');
  ratingDiv.className = 'comment-text';
  ratingDiv.innerHTML = '⭐'.repeat(rating);

  const dateDiv = document.createElement('div');
  dateDiv.className = 'comment-date';
  dateDiv.textContent = 'تاريخ النشر: ' + formatDate(date);

  content.appendChild(nameDiv);
  content.appendChild(ratingDiv);
  content.appendChild(textDiv);
  content.appendChild(dateDiv);

  commentDiv.appendChild(avatar);
  commentDiv.appendChild(content);

  let clickCount = 0;
  commentDiv.addEventListener('click', () => {
    clickCount++;
    if (clickCount === 3) {
      const password = prompt("🔒 أدخل كلمة السر لحذف التعليق:");
      if (password === 'omar') {
        commentDiv.remove();
        allComments = allComments.filter(c =>
          !(c.name === name && c.comment === comment && formatDate(c.date) === formatDate(date))
        );
        saveComments();
        renderComments();
        updateProductStats();
        updateCommentCount();
      } else {
        alert("❌ كلمة السر غير صحيحة!");
      }
      clickCount = 0;
    }
  });

  return commentDiv;
}

function renderComments() {
  const container = document.getElementById('commentsContainer');
  container.innerHTML = '';
  const toShow = allComments.slice().reverse().slice(0, visibleCount);
  toShow.forEach(comment => {
    const commentEl = createCommentElement(comment);
    container.appendChild(commentEl);
  });
  document.getElementById('loadMoreBtn').style.display = (visibleCount < allComments.length) ? 'block' : 'none';
}

function loadMoreComments() {
  visibleCount += 5;
  renderComments();
  updateProductStats();
  updateCommentCount();
}

function postComment() {
  const nameInput = document.getElementById('usernameInput');
  const commentInput = document.getElementById('commentInput');
  const name = nameInput.value.trim();
  const comment = commentInput.value.trim();
  const wordCount = name.split(' ').length;

  if (wordCount < 2 || wordCount > 5) {
    alert('❌ يجب أن يكون الاسم ثلاثي إلى خماسي فقط!');
    return;
  }

  if (comment === '') {
    alert('يرجى كتابة تعليق!');
    return;
  }

  if (selectedRating === 0) {
    alert('يرجى اختيار تقييم من النجوم!');
    return;
  }

  const newComment = {
    name,
    comment,
    date: new Date(),
    color: getRandomColor(),
    rating: selectedRating
  };

  allComments.push(newComment);
  saveComments();
  renderComments();
  updateProductStats();
  updateCommentCount();

  nameInput.value = '';
  commentInput.value = '';
  selectedRating = 0;
  updateStarDisplay();
}

document.querySelectorAll('.star').forEach(star => {
  star.addEventListener('click', () => {
    selectedRating = parseInt(star.getAttribute('data-star'));
    updateStarDisplay();
  });
});

function updateStarDisplay() {
  const colorMap = {
    1: 'red',
    2: 'orange',
    3: '#f1c40f',
    4: 'green',
    5: '#3498db'
  };
  document.querySelectorAll('.star').forEach(star => {
    const starNum = parseInt(star.getAttribute('data-star'));
    star.classList.remove('selected');
    star.style.color = starNum <= selectedRating ? colorMap[selectedRating] : '#ccc';
    if (starNum <= selectedRating) {
      star.classList.add('selected');
    }
  });
  document.getElementById('ratingDisplay').textContent = `التقييم: ${selectedRating} نجمة`;
}

// ✅ تحميل التعليقات الخاصة بالصفحة
window.onload = function () {
  allComments = JSON.parse(localStorage.getItem(pageKey) || '[]');
  renderComments();
  updateProductStats();
  updateCommentCount();
};

function updateCommentCount() {
  const count = allComments.length;
  document.getElementById('totalComments').textContent = `عدد التقيمات: ${count}`;
}





































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






