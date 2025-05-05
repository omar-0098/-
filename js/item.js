// ========== جزء الفيديو والـ iframe ==========



let bigImags = document.getElementById("bidImg");
window.changeItemImage = function(img) {
  bigImags.style.opacity = 0;
  setTimeout(function() {
    bigImags.src = img;
    bigImags.style.opacity = 1;
  }, 250);
}











// ========== جزء التعليقات ==========





  const firebaseConfig = {
    apiKey: "AIzaSyDNJZ6zmakEvlkNJkiX--bkLedAo5gwtnA",
    authDomain: "product-comments-9d950.firebaseapp.com",
    databaseURL: "https://product-comments-9d950-default-rtdb.firebaseio.com",
    projectId: "product-comments-9d950",
    storageBucket: "product-comments-9d950.appspot.com",
    messagingSenderId: "126824621961",
    appId: "1:126824621961:web:265bb69368667bf9bfe358",
    measurementId: "G-NFYGH3H6WF"
  };

  firebase.initializeApp(firebaseConfig);
  firebase.analytics();
  const db = firebase.database();

  const colors = ['#e74c3c', '#8e44ad', '#3498db', '#f39c12', '#27ae60', '#e67e22', '#1abc9c'];
  let allComments = [];
  let selectedRating = 0;

  function getRandomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function formatDate(date) {
    return new Date(date).toLocaleString('ar-EG');
  }

  function saveCommentToFirebase(commentData) {
    const pageRef = db.ref(`comments/${window.location.pathname}`);
    pageRef.push(commentData);
  }

  function postComment() {
    const nameInput = document.getElementById('usernameInput');
    const commentInput = document.getElementById('commentInput');
    const name = nameInput.value.trim();
    const comment = commentInput.value.trim();

    if (name.split(' ').length < 2 || name.split(' ').length > 5) {
      alert('❌ يجب أن يكون الاسم ثلاثي إلى خماسي فقط!');
      return;
    }
    if (comment === '') {
      alert('يرجى كتابة تعليق!');
      return;
    }
    if (selectedRating === 0) {
      alert('يرجى اختيار تقييم!');
      return;
    }

    const newComment = {
      name,
      comment,
      date: new Date().toISOString(),
      color: getRandomColor(),
      rating: selectedRating
    };

    saveCommentToFirebase(newComment);
    nameInput.value = '';
    commentInput.value = '';
    selectedRating = 0;
    updateStarDisplay();
  }

  function renderComments() {
    const container = document.getElementById('commentsContainer');
    container.innerHTML = '';
    allComments.slice().reverse().forEach(({ name, comment, date, color, rating }) => {
      const div = document.createElement('div');
      div.className = 'comment';

      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.style.backgroundColor = color;
      avatar.textContent = name.charAt(0);

      const content = document.createElement('div');
      content.className = 'comment-content';

      content.innerHTML = `
        <div class="comment-name">${name}</div>
        <div class="comment-text">${'⭐'.repeat(rating)}</div>
        <div class="comment-text">${comment}</div>
        <div class="comment-date">تاريخ النشر: ${formatDate(date)}</div>
      `;

      div.appendChild(avatar);
      div.appendChild(content);
      container.appendChild(div);
    });
  }

  function updateProductStats() {
    const statsContainer = document.getElementById('starsStats');
    const counts = [0, 0, 0, 0, 0];

    allComments.forEach(c => {
      if (c.rating >= 1 && c.rating <= 5) counts[c.rating - 1]++;
    });

    const total = counts.reduce((a, b) => a + b, 0);
    statsContainer.innerHTML = '';

    for (let i = 5; i >= 1; i--) {
      const count = counts[i - 1];
      const percent = total > 0 ? (count / total) * 100 : 0;

      const bar = document.createElement('div');
      bar.className = 'rating-bar';
      bar.innerHTML = `
        <span>⭐ ${i}</span>
        <div style="background:#eee; width: 100%; height: 10px; margin: 5px 0;">
          <div style="background:#3498db; height: 10px; width: ${percent}%;"></div>
        </div>
        <span>${count}</span>
      `;
      statsContainer.appendChild(bar);
    }
  }

  function updateCommentCount() {
    document.getElementById('totalComments').textContent = `عدد التقييمات: ${allComments.length}`;
  }

  window.onload = function () {
    const pageRef = db.ref(`comments/${window.location.pathname}`);
    pageRef.on('value', (snapshot) => {
      const data = snapshot.val() || {};
      allComments = Object.values(data);
      renderComments();
      updateProductStats();
      updateCommentCount();
    });
  };

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






