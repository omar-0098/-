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



document.addEventListener("DOMContentLoaded", function () {
  const itemContainer = document.getElementById("item-container");
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  fetch("products.json")
    .then((response) => response.json())
    .then((data) => {
      const product = data.products.find((p) => p.id == productId);
      if (product) {
        const productCard = `
          <div class="product-card">
            <img src="${product.image}" alt="${product.name}">
            <h2>${product.name}</h2>
            <p>${product.description}</p>
            <p>Price: ${product.price} MAD</p>
            <div class="rating" data-product-id="${product.id}">
              <span data-rating="1">&#9733;</span>
              <span data-rating="2">&#9733;</span>
              <span data-rating="3">&#9733;</span>
              <span data-rating="4">&#9733;</span>
              <span data-rating="5">&#9733;</span>
            </div>
            <textarea id="comment" placeholder="Write your comment"></textarea>
            <button onclick="postComment(${product.id})">Submit</button>
            <div class="comments" id="comments-${product.id}"></div>
          </div>
        `;
        itemContainer.innerHTML = productCard;

        document.querySelectorAll(".rating span").forEach((star) => {
          star.addEventListener("click", function () {
            const rating = this.getAttribute("data-rating");
            const ratingDiv = this.parentElement;
            ratingDiv.setAttribute("data-selected-rating", rating);

            ratingDiv.querySelectorAll("span").forEach((s, i) => {
              if (i < rating) {
                s.classList.add("selected");
              } else {
                s.classList.remove("selected");
              }
            });
          });
        });

        loadComments(product.id);
      } else {
        itemContainer.innerHTML = "<p>Product not found.</p>";
      }
    })
    .catch((error) => {
      console.error("Error loading product data:", error);
    });
});

function postComment(productId) {
  const commentInput = document.getElementById("comment");
  const comment = commentInput.value;
  const ratingDiv = document.querySelector(`.rating[data-product-id="${productId}"]`);
  const rating = ratingDiv.getAttribute("data-selected-rating");

  if (comment && rating) {
    const commentObj = {
      text: comment,
      rating: rating,
      timestamp: new Date().toISOString(),
    };

    let comments = JSON.parse(localStorage.getItem(`comments_${productId}`)) || [];
    comments.push(commentObj);
    localStorage.setItem(`comments_${productId}`, JSON.stringify(comments));

    commentInput.value = "";
    loadComments(productId);
  } else {
    alert("Please provide a comment and rating.");
  }
}

function loadComments(productId) {
  const commentsDiv = document.getElementById(`comments-${productId}`);
  const comments = JSON.parse(localStorage.getItem(`comments_${productId}`)) || [];

  commentsDiv.innerHTML = comments
    .map(
      (c) => `
      <div class="comment">
        <p>${"★".repeat(c.rating)}${"☆".repeat(5 - c.rating)}</p>
        <p>${c.text}</p>
        <small>${new Date(c.timestamp).toLocaleString()}</small>
      </div>
    `
    )
    .join("");
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











































let selectedRating = 0;

// تفعيل الضغط على النجوم
document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', function () {
        selectedRating = parseInt(this.getAttribute('data-star'));
        updateStarsDisplay(selectedRating);
    });
});

function updateStarsDisplay(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        const starValue = parseInt(star.getAttribute('data-star'));
        star.style.color = starValue <= rating ? 'gold' : 'gray';
    });

    const ratingDisplay = document.getElementById('ratingDisplay');
    ratingDisplay.textContent = `التقييم: ${rating} نجوم`;
}

// إرسال التعليق
function postComment() {
    const username = document.getElementById('usernameInput').value.trim();
    const comment = document.getElementById('commentInput').value.trim();
    
    if (username === "" || comment === "" || selectedRating === 0) {
        alert("يرجى ملء جميع الحقول وتحديد التقييم بالنجوم");
        return;
    }

    const commentHtml = `
        <div class="comment">
            <div class="comment-header">
                <strong>${username}</strong> - ${selectedRating} ★
            </div>
            <p>${comment}</p>
        </div>
    `;

    const container = document.getElementById('commentsContainer');
    container.insertAdjacentHTML('afterbegin', commentHtml);

    // إعادة تعيين الحقول
    document.getElementById('usernameInput').value = "";
    document.getElementById('commentInput').value = "";
    selectedRating = 0;
    updateStarsDisplay(0);
}




