// ========== جزء الفيديو والـ iframe ==========
// ========== جزء الفيديو والـ iframe ==========



let bigImags = document.getElementById("bidImg");
window.changeItemImage = function(img) {
  bigImags.style.opacity = 0;
  setTimeout(function() {
    bigImags.src = img;
    bigImags.style.opacity = 1;
  }, 250);
}



// ========== جزء الفيديو والـ iframe ==========



const img = document.getElementById("bidImg");

let scale = 1;
let lastScale = 1;
let startX = 0;
let startY = 0;
let translateX = 0;
let translateY = 0;
let initialX = 0;
let initialY = 0;

let isDragging = false;

img.addEventListener("wheel", function (e) {
    e.preventDefault();
    scale += (e.deltaY < 0 ? 0.1 : -0.1);
    scale = Math.min(Math.max(1, scale), 3);
    updateTransform();
});

img.addEventListener("touchstart", function (e) {
    if (e.touches.length === 2) {
        e.preventDefault();
        const [touch1, touch2] = e.touches;
        lastScale = getDistance(touch1, touch2);
    } else if (e.touches.length === 1 && scale > 1) {
        isDragging = true;
        initialX = e.touches[0].clientX - translateX;
        initialY = e.touches[0].clientY - translateY;
    }
});

img.addEventListener("touchmove", function (e) {
    if (e.touches.length === 2) {
        const [touch1, touch2] = e.touches;
        const currentDistance = getDistance(touch1, touch2);
        const zoomFactor = currentDistance / lastScale;
        scale *= zoomFactor;
        scale = Math.min(Math.max(1, scale), 3);
        lastScale = currentDistance;
        updateTransform();
    } else if (e.touches.length === 1 && isDragging) {
        e.preventDefault();
        translateX = e.touches[0].clientX - initialX;
        translateY = e.touches[0].clientY - initialY;
        updateTransform();
    }
});

img.addEventListener("touchend", function (e) {
    if (e.touches.length < 2) {
        isDragging = false;
    }
});

function getDistance(touch1, touch2) {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function updateTransform() {
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

  }




// ========== جزء الفيديو والـ iframe ==========


// ============================
// التعليقات والتقييمات للمنتج
// ============================

let comments = JSON.parse(localStorage.getItem('comments')) || [];
let displayedCount = 0;
const commentsPerLoad = 5;
let currentRating = 0;

// تحميل عند فتح الصفحة
window.onload = function () {
  displayComments();
  updateStats();
  updateStarDisplay();
};

// نشر تعليق وتقييم
function postComment() {
  const name = document.getElementById("usernameInput").value.trim();
  const commentText = document.getElementById("commentInput").value.trim();

  if (!name || !commentText || currentRating === 0) {
    alert("يرجى تعبئة الاسم والتعليق واختيار التقييم.");
    return;
  }

  const comment = {
    name: name,
    comment: commentText,
    stars: currentRating,
    time: new Date().toLocaleString()
  };

  comments.unshift(comment); // نضيف في البداية
  localStorage.setItem('comments', JSON.stringify(comments));
  clearInputs();
  displayedCount = 0;
  displayComments();
  updateStats();
}

// إفراغ الحقول بعد النشر
function clearInputs() {
  document.getElementById("usernameInput").value = '';
  document.getElementById("commentInput").value = '';
  currentRating = 0;
  updateStarDisplay();
}

// عرض التعليقات حسب العدد المحدد
function displayComments() {
  const container = document.getElementById("commentsContainer");
  container.innerHTML = "";

  const commentsToShow = comments.slice(0, displayedCount + commentsPerLoad);
  commentsToShow.forEach(comment => {
    const commentDiv = document.createElement("div");
    commentDiv.className = "comment";
    commentDiv.innerHTML = `
      <strong>${comment.name}</strong>
      <p>${comment.comment}</p>
      <div>⭐ ${comment.stars} | <small>${comment.time}</small></div>
      <hr>
    `;
    container.appendChild(commentDiv);
  });

  displayedCount = commentsToShow.length;

  document.getElementById("totalComments").textContent = `عدد التقييمات: ${comments.length}`;
  document.getElementById("loadMoreBtn").style.display = (displayedCount < comments.length) ? "block" : "none";
}

// زر "عرض المزيد"
function loadMoreComments() {
  displayComments();
}

// تحديث إحصائيات النجوم
function updateStats() {
  const statsContainer = document.getElementById("starsStats");
  if (comments.length === 0) {
    statsContainer.innerHTML = "لا توجد تقييمات بعد.";
    return;
  }

  let sum = 0;
  let starsCount = [0, 0, 0, 0, 0]; // من 1 إلى 5 نجوم

  comments.forEach(c => {
    sum += c.stars;
    starsCount[c.stars - 1]++;
  });

  const avg = (sum / comments.length).toFixed(1);
  let statsHTML = `<p>متوسط التقييم: ${avg} من 5</p>`;

  for (let i = 5; i >= 1; i--) {
    const count = starsCount[i - 1];
    const percent = ((count / comments.length) * 100).toFixed(0);
    statsHTML += `
      <div>
        ${i} نجوم: ${count} (${percent}%)
        <div style="background:#ccc; height:6px; width:100%;">
          <div style="background:#f39c12; height:6px; width:${percent}%;"></div>
        </div>
      </div>
    `;
  }

  statsContainer.innerHTML = statsHTML;
}

// التعامل مع النجوم عند النقر
document.querySelectorAll(".star").forEach(star => {
  star.addEventListener("click", () => {
    currentRating = parseInt(star.dataset.star);
    updateStarDisplay();
  });
});

// عرض النجوم حسب التقييم
function updateStarDisplay() {
  const ratingText = document.getElementById("ratingDisplay");
  document.querySelectorAll(".star").forEach(star => {
    const starValue = parseInt(star.dataset.star);
    star.style.color = (starValue <= currentRating) ? "#FFD700" : "#ccc";
  });

  ratingText.textContent = `التقييم: ${currentRating} نجوم`;
}

