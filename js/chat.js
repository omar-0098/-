
const chatToggle = document.getElementById("chat-toggle");
const chatWidget = document.getElementById("chat-widget");
const closeChat = document.getElementById("close-chat");
const chatBody = document.getElementById("chat-body");
const chatOptions = document.getElementById("chat-options");
const oldChats = document.getElementById("old-chats");
const sound = document.getElementById("sound");

const userName = localStorage.getItem("userName") || "عزيزنا العميل ";
let currentSession = null;
let stage = "main";

/* فتح */
document.addEventListener("DOMContentLoaded", () => {

  const chatToggle = document.getElementById("chat-toggle");
  const trashZone = document.getElementById("trash-zone");

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;
  let moved = false;
  let isOverTrash = false;

  chatToggle.addEventListener("mousedown", (e) => {
    isDragging = true;
    moved = false;

    const rect = chatToggle.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    trashZone.style.display = "flex";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    moved = true;

    chatToggle.style.left = `${e.clientX - offsetX}px`;
    chatToggle.style.top = `${e.clientY - offsetY}px`;
    chatToggle.style.right = "auto";
    chatToggle.style.bottom = "auto";

    const chatRect = chatToggle.getBoundingClientRect();
    const trashRect = trashZone.getBoundingClientRect();

    isOverTrash =
      chatRect.left < trashRect.right &&
      chatRect.right > trashRect.left &&
      chatRect.top < trashRect.bottom &&
      chatRect.bottom > trashRect.top;
  });

  document.addEventListener("mouseup", () => {
    if (!isDragging) return;

    isDragging = false;
    trashZone.style.display = "none";

    if (isOverTrash) {
      chatToggle.classList.add("hide");
      setTimeout(() => {
        chatToggle.style.display = "none";
      }, 300);
    }
  });

  // ✅ فتح الشات فقط لو مفيش سحب
  chatToggle.addEventListener("click", () => {
    if (moved) return;

    chatWidget.style.display = "flex";
    startNewChat();
    loadOldChats();
  });

});

/* غلق */
closeChat.onclick = () => {
  saveChat();
  chatWidget.style.display = "none";
  chatBody.innerHTML = "";
};

/* شات جديد */
function startNewChat() {
  currentSession = "chat_" + Date.now();
  stage = "main";
  chatBody.innerHTML = "";
  botMsg(`أهلاً ${userName} 👋 عامل ايه انا ;كشميرووو لو عايز اي حاجة اسئلني عليها`);
  showOptions();
}

/* رسائل */
function botMsg(text) {
  chatBody.innerHTML += `<div class="bot">${text}</div>`;
  sound.play();
  chatBody.scrollTop = chatBody.scrollHeight;
}

function userMsg(text) {
  chatBody.innerHTML += `<div class="user">${text}</div>`;
  chatBody.scrollTop = chatBody.scrollHeight;
}

/* كتابة */
function typing(callback) {
  const t = document.createElement("div");
  t.className = "typing";
  t.innerHTML = "<span></span><span></span><span></span>";
  chatBody.appendChild(t);
  setTimeout(() => {
    t.remove();
    callback();
  }, 1000);
}

/* القوائم */
function showOptions() {
  if (stage === "main") {
    chatOptions.innerHTML = `
      <button class="option" onclick="handle('المنتجات')"> المنتجات</button>
      <button class="option" onclick="handle('العروض')"> العروض </button>
      <button class="option" onclick="handle('ازاي استخدم الموقع ')"> ازاي استخدم الموقع </button>
      <button class="option" onclick="handle('فيه مشكلة ')"> فيه مشكلة </button>

    `;
  }

  if (stage === "product") {
    chatOptions.innerHTML = `
      <button class="option" onclick="handle('الفواط')"> الفواط </button>
      <button class="option" onclick="handle('الملايات')">الملايات</button>
      <button class="option" onclick="handle('البرانس')">البرانس</button>
      <button class="option" onclick="handle('البطاطين')">البطاطين</button>
      <button class="option" onclick="handle('اللحاف')">اللحاف</button>
      <button class="option" onclick="handle('الكوفرتا')">الكوفرتا</button>

      <button class="option" onclick="back()">⬅ رجوع</button>
    `;
  }




}

/* التحكم */
function handle(choice) {
  userMsg(choice);
  chatOptions.innerHTML = "";

  typing(() => {
    if (choice === "المنتجات") {
      stage = "product";
      botMsg(" . عايز تعرف ايه عن منتجاتنا  ");
      showOptions();
    }

    if (choice === "الفواط") {
      botMsg(" فواط كشمير هوم تبدا من 250 جنية الي 950 جنية و يوجد ايضا فواط اطفال ");
      stage = "main";
      showOptions();
    }

    if (choice === "الملايات") {
      botMsg(" ملايات كشمير هوم تبدا من 350 جنية الي 1200 جنية  ");
      stage = "main";
      showOptions();
    }
 if (choice === "البرانس") {
      botMsg(" برانس كشمير هوم تبدا من 950 جنية الي 3600 جنية  ");
      stage = "main";
      showOptions();
    }
     if (choice === "البطاطين") {
      botMsg(" يطاطين كشمير هوم تبدا من 600 جنية الي 200 جنية  ");
      stage = "main";
      showOptions();
    }
     if (choice === "اللحاف") {
      botMsg(" اللحاف كشمير هوم تبدا من 800 جنية الي 3000 جنية  ");
      stage = "main";
      showOptions();
    }
      if (choice === "الكوفرتا") {
      botMsg(" كوفرتا كشمير هوم تبدا من 800 جنية الي 3000 جنية  ");
      stage = "main";
      showOptions();
    }


    if (choice === "العروض") {
      botMsg("  عروض كشمير هوم مستمرة معاك للابد كشمير هوم يعني البيت المصري  ");
      showOptions();
    }

    if (choice === "ازاي استخدم الموقع ") {
      botMsg("   ");
      showOptions();
    }


if (choice.includes("فيه مشكلة")) {
  botMsg("تواصل معنا عبر:<br>" +
         " <b>فيسبوك:</b> <a href='https://www.facebook.com/p/%D9%83%D8%B4%D9%85%D9%8A%D8%B1-%D9%87%D9%88%D9%85-kashmir-home-100064031503557/' target='_blank'>اضغط هنا للفيسبوك</a><br>" +
         " <b>واتساب:</b> <a href='https://wa.me/201028604523' target='_blank'>اضغط هنا للواتساب</a><br>" +
         " <b>ايميل:</b> <a href='mailto:kashmirhome.00@gmail'>email@example.com</a><br>" +
         " <b>انستجرام:</b> <a href='https://www.instagram.com/kashmir_home_center/?fbclid=IwY2xjawHwa8xleHRuA2FlbQIxMAABHc8LrSfm4Gu37osiGk8MTGyptSigZZqTQ0WbYC1CRy2d4y0JmsYTbUiQzQ_aem_W7NnxJhHGMWugD_WC8i6EQ#' target='_blank'>اضغط هنا للانستجرام</a>");
  showOptions();
}
 


  });
}

function back() {
  stage = "main";
  showOptions();
}

/* حفظ */
function saveChat() {
  if (currentSession && chatBody.innerHTML.trim()) {
    localStorage.setItem(currentSession, chatBody.innerHTML);
    loadOldChats();
  }
}

/* تحميل المحادثات */
function loadOldChats() {
  oldChats.innerHTML = "";
  Object.keys(localStorage)
    .filter(k => k.startsWith("chat_"))
    .sort((a,b)=>b.localeCompare(a))
    .forEach(key => {
      const div = document.createElement("div");
      div.className = "old-chat";
      div.innerHTML = `
      <img src="img/chat.svg"/>
        <span onclick="openChat('${key}')">
          محادثة ${new Date(+key.split("_")[1]).toLocaleString()}
        </span>
        <span class="delete-chat" onclick="deleteChat('${key}')"> <i class="fa-solid fa-trash"></i></span>
      `;
      oldChats.appendChild(div);
    });
}

function openChat(key) {
  saveChat();

  // فتح نافذة الشات
  chatWidget.style.display = "flex";

  // التحويل على سيكشن الشات
  showSection('all');

  currentSession = key;
  chatBody.innerHTML = localStorage.getItem(key);

  // سكرول لآخر رسالة
  chatBody.scrollTop = chatBody.scrollHeight;
}

function deleteChat(key) {
  if (confirm("حذف المحادثة؟")) {
    localStorage.removeItem(key);
    loadOldChats();
  }
}

function addBotMessage(text) {
  const div = document.createElement("div");
  div.className = "bot animate"; // 👈 هنا بس
  div.textContent = text;

  document.getElementById("chat-body").appendChild(div);
  scrollChat();
}
function openOldChat(chatHTML) {
  const chatBody = document.getElementById("chat-body");
  chatBody.innerHTML = chatHTML;

  // نشيل animate من أي رسالة قديمة
  chatBody.querySelectorAll(".animate").forEach(el => {
    el.classList.remove("animate");
  });
}






















document.addEventListener("DOMContentLoaded", () => {

  const chatToggle = document.getElementById("chat-toggle");
  const trashZone = document.getElementById("trash-zone");

  // المكان الأصلي
  const originalPos = {
    right: 20,
    bottom: 80
  };

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;
  let moved = false;
  let isOverTrash = false;

  // مسك الأيقونة
  chatToggle.addEventListener("mousedown", (e) => {
    isDragging = true;
    moved = false;

    const rect = chatToggle.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    // نلغي الـ transition أثناء السحب
    chatToggle.style.transition = "none";

    trashZone.style.display = "flex";
  });

  // التحريك
  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    moved = true;

    chatToggle.style.left = `${e.clientX - offsetX}px`;
    chatToggle.style.top = `${e.clientY - offsetY}px`;
    chatToggle.style.right = "auto";
    chatToggle.style.bottom = "auto";

    const chatRect = chatToggle.getBoundingClientRect();
    const trashRect = trashZone.getBoundingClientRect();

    isOverTrash =
      chatRect.left < trashRect.right &&
      chatRect.right > trashRect.left &&
      chatRect.top < trashRect.bottom &&
      chatRect.bottom > trashRect.top;
  });

  // الإفلات
  document.addEventListener("mouseup", () => {
    if (!isDragging) return;

    isDragging = false;
    trashZone.style.display = "none";

    // لو فوق ❌ (اختياري – احذفها)
    if (isOverTrash) {
      chatToggle.classList.add("hide");
      setTimeout(() => {
        chatToggle.style.display = "none";
      }, 300);
      return;
    }

    // ✅ الرجوع التلقائي للمكان الأصلي
    chatToggle.style.transition =
      "left 0.4s ease, top 0.4s ease";

    chatToggle.style.left = "auto";
    chatToggle.style.top = "auto";
    chatToggle.style.right = originalPos.right + "px";
    chatToggle.style.bottom = originalPos.bottom + "px";
  });

  // منع الفتح بعد السحب
  chatToggle.addEventListener("click", (e) => {
    if (moved) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // فتح الشات هنا لو حابب
  });

});
