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
// ===== Firebase config (غيّر هذه القيم بحسب مشروعك) =====
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com"
};

// ===== تهيئة Firebase =====
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===== المتغيرات =====
let currentRating = 0;

// ===== عند تحميل الصفحة =====
window.onload = () => {
  setupStarRating();
  loadComments();
  updateStarDisplay();
};

// ===== إعداد نظام النجوم =====
function setupStarRating() {
  document.querySelectorAll(".star").forEach(star => {
    star.addEventListener("click", () => {
      currentRating = parseInt(star.dataset.star);
      updateStarDisplay();
    });
  });
}

// ===== تحديث عرض النجوم =====
function updateStarDisplay() {
  document.querySelectorAll(".star").forEach(star => {
    const starValue = parseInt(star.dataset.star);
    star.style.color = (starValue <= currentRating) ? "#FFD700" : "#ccc";
  });

  document.getElementById("ratingDisplay").textContent = `التقييم: ${currentRating} نجوم`;
}

// ===== نشر تعليق =====
function postComment() {
  const name = document.getElementById("usernameInput").value.trim();
  const commentText = document.getElementById("commentInput").value.trim();

  if (!name || !commentText || currentRating === 0) {
    alert("يرجى ملء جميع الحقول وتحديد التقييم.");
    return;
  }

  const comment = {
    name: name,
    comment: commentText,
    stars: currentRating,
    time: new Date().toISOString()
  };

  db.ref("comments").push(comment)
    .then(() => {
      document.getElementById("usernameInput").value = "";
      document.getElementById("commentInput").value = "";
      currentRating = 0;
      updateStarDisplay();
    })
    .catch(error => {
      console.error("فشل في إضافة التعليق:", error);
    });
}

// ===== تحميل التعليقات من Firebase =====
function loadComments() {
  const container = document.getElementById("commentsContainer");
  let stats = [0, 0, 0, 0, 0]; // 1 إلى 5 نجوم
  let total = 0, sum = 0;

  db.ref("comments").on("value", snapshot => {
    container.innerHTML = "";
    const data = snapshot.val();
    if (data) {
      const comments = Object.values(data).sort((a, b) => new Date(b.time) - new Date(a.time));
      comments.forEach(c => {
        const div = document.createElement("div");
        div.innerHTML = `
          <strong>${c.name}</strong>
          <p>${c.comment}</p>
          <div>⭐ ${c.stars} | <small>${new Date(c.time).toLocaleString()}</small></div>
          <hr>
        `;
        container.appendChild(div);
        stats[c.stars - 1]++;
        sum += c.stars;
        total++;
      });
    }

    document.getElementById("totalComments").textContent = `عدد التقييمات: ${total}`;
    updateStats(stats, sum, total);
  });
}

// ===== تحديث الإحصائيات =====
function updateStats(stats, sum, total) {
  const statsDiv = document.getElementById("starsStats");
  if (total === 0) {
    statsDiv.innerHTML = "لا توجد تقييمات بعد.";
    return;
  }

  const avg = (sum / total).toFixed(1);
  let html = `<p>متوسط التقييم: ${avg} من 5</p>`;

  for (let i = 5; i >= 1; i--) {
    const count = stats[i - 1];
    const percent = ((count / total) * 100).toFixed(0);
    html += `
      <div>
        ${i} نجوم: ${count} (${percent}%)
        <div style="background:#ccc; height:6px; width:100%; margin:4px 0;">
          <div style="background:#f39c12; height:6px; width:${percent}%;"></div>
        </div>
      </div>
    `;
  }

  statsDiv.innerHTML = html;
}
