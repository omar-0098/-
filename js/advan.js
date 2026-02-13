
// مشاركة المنتج
function toggleShare() {
    const menu = document.getElementById("shareMenu");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}

function shareWhatsApp() {
    const productName = document.querySelector(".name").innerText.trim();
    const pageLink = window.location.href;

    // اللينك لوحده في سطر
    const message = productName + "\n\n" + pageLink;

    window.open(
        "https://wa.me/?text=" + encodeURIComponent(message),
        "_blank"
    );
}

function shareTelegram() {
    const productName = document.querySelector(".name").innerText.trim();
    const pageLink = window.location.href;

    // تليجرام لازم اللينك يبقى url
    window.open(
        "https://t.me/share/url?url=" + encodeURIComponent(pageLink) +
        "&text=" + encodeURIComponent(productName),
        "_blank"
    );
}












// ===== إنشاء overlay ضبابي =====
const blurOverlay = document.createElement("div");
Object.assign(blurOverlay.style, {
  position: "fixed",
  inset: "0",
  background: "rgba(0,0,0,0.25)",
  backdropFilter: "blur(6px)",
  zIndex: "9998"
});

// ===== إنشاء dialog =====
const downloadDialog = document.createElement("dialog");
Object.assign(downloadDialog.style, {
  padding: "0",
  border: "none",
  borderRadius: "10px",
  zIndex: "9999",
    position: "fixed",
    top: "45%",
    left: "42%",
});

downloadDialog.innerHTML = `
  <form method="dialog"
    style="padding:22px; min-width:335px; text-align:center; font-family:Arial;">
    
    <!-- الصورة -->
    <img
      src="https://cdn-icons-png.flaticon.com/512/892/892634.png"
      alt="Download"
      style="width:55px; margin-bottom:12px;"
    >

    <p style="font-size:16px; margin-bottom:20px;">
      هل تريد تنزيل جميع الصور؟
    </p>

    <menu style="display:flex; gap:12px; justify-content:center;">
      <button value="cancel"
        style="padding:6px 14px;">
        إلغاء
      </button>

      <button value="ok"
        style="background:#0d6efd; color:#fff; border:none;
               padding:6px 18px; border-radius:6px;">
        موافق
      </button>
    </menu>
  </form>
`;

document.body.appendChild(downloadDialog);

// ===== دالة التحميل =====
function downloadAllImages() {

  // أضف الضبابية
  document.body.appendChild(blurOverlay);

  downloadDialog.showModal();

  // عند الإغلاق
  downloadDialog.addEventListener("close", () => {

    // شيل الضبابية
    blurOverlay.remove();

    if (downloadDialog.returnValue !== "ok") return;

    const imgElements = document.querySelectorAll(
      'img[onclick*="changeItemImage"]'
    );

    if (!imgElements.length) {
      alert("لا توجد صور للتحميل");
      return;
    }

    imgElements.forEach((img, index) => {
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = img.src;

        const fileName = img.src.split("/").pop().split("\\").pop();
        link.download = fileName;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 300);
    });
  }, { once: true });
}






const HEART_COUNT = 10;
const HEART_DELAY = 120;
const HEART_LIFETIME = 1000;

// تحميل المفضلة
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

document.querySelectorAll(".fav-btn").forEach(button => {
  const productId = button.getAttribute("data-id");

  // لو المنتج في المفضلة
  if (favorites.includes(productId)) {
    button.classList.add("active");
  }

  button.addEventListener("click", () => {
    if (favorites.includes(productId)) {
      // إزالة
      favorites = favorites.filter(id => id !== productId);
      button.classList.remove("active");
    } else {
      // إضافة + قلوب
      favorites.push(productId);
      activateLike(button);
    }

    localStorage.setItem("favorites", JSON.stringify(favorites));
  });
});

function heartAnimation() {
  const heart = document.createElement("div");
  heart.textContent = "❤️";
  heart.style.position = "fixed";
  heart.style.left = Math.random() * 100 + "vw";
  heart.style.bottom = "-30px";
  heart.style.fontSize = "24px";
  heart.style.opacity = "1";
  heart.style.transition = `all ${HEART_LIFETIME}ms ease-out`;
  heart.style.zIndex = "9999";
  document.body.appendChild(heart);

  setTimeout(() => {
    heart.style.bottom = "50vh";
    heart.style.opacity = "0";
  }, 10);

  setTimeout(() => heart.remove(), HEART_LIFETIME);
}

function activateLike(button) {
  button.classList.add("active");

  for (let i = 0; i < HEART_COUNT; i++) {
    setTimeout(heartAnimation, i * HEART_DELAY);
  }
}
