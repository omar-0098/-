
  let bigImags = document.getElementById("bidImg");
  let scale = 1;
  let initialDistance = null;

  // === الموبايل: زووم باللمس ===
  bigImags.addEventListener("touchstart", function (e) {
    if (e.touches.length === 2) {
      initialDistance = getDistance(e.touches[0], e.touches[1]);
    }
  });

  bigImags.addEventListener("touchmove", function (e) {
    if (e.touches.length === 2 && initialDistance) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      scale = currentDistance / initialDistance;
      bigImags.style.transform = `scale(${scale})`;
    }
  });

  bigImags.addEventListener("touchend", function (e) {
    if (e.touches.length < 2) {
      initialDistance = null;
      if (scale < 1) scale = 1;
      bigImags.style.transform = `scale(${scale})`;
    }
  });

  function getDistance(touch1, touch2) {
    return Math.hypot(
      touch2.pageX - touch1.pageX,
      touch2.pageY - touch1.pageY
    );
  }

  // === الكمبيوتر: زووم بعجلة الماوس ===
  bigImags.addEventListener("wheel", function (e) {
    e.preventDefault();
    if (e.deltaY < 0) {
      // scroll up
      scale += 0.1;
    } else {
      // scroll down
      scale -= 0.1;
      if (scale < 1) scale = 1;
    }
    bigImags.style.transform = `scale(${scale})`;
  });

  // === تغيير الصورة مع إعادة التهيئة ===
  window.changeItemImage = function(img) {
    bigImags.style.opacity = 0;
    setTimeout(function() {
      bigImags.src = img;
      bigImags.style.opacity = 1;
      bigImags.style.transform = "scale(1)";
      scale = 1;
    }, 250);
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






