// إنشاء عناصر HTML ديناميكيًا
document.addEventListener("DOMContentLoaded", () => {
  
  // إنشاء HTML الخاص بالشات
  const chatHTML = `
    <!-- زر فتح الشات -->
    <div id="chat-toggle">💬</div>

    <!-- منطقة الحذف -->
  <div id="trash-zone">✖</div>

    <!-- نافذة الشات الرئيسية -->
    <div id="chat-widget">
      
      <!-- رأس الشات -->
      <div id="chat-header">
        <div class="chat-header-main">
          <img src="img/chat.svg" alt="كشمير هوم">
          <div>
            <h2>كشميرووو</h2>
            <h3>شات كشمير هوم</h3>
          </div>
        </div>
        <button id="close-chat">✕</button>
      </div>

      <!-- قسم الشات الرئيسي -->
      <div class="chat-all show">
        <div id="chat-body"></div>
        <div id="chat-options"></div>
        
        <div id="chat-input">
          <input type="text" id="message" placeholder="اكتب رسالتك..." />
          <button id="send">➤</button>
        </div>
      </div>

      <!-- قسم المحادثات القديمة -->
      <div class="chat-acient hide">
        <div id="old-chats"></div>
      </div>

      <!-- قسم الشروط والخصوصية -->
      <div class="chat-pivet hide">
        <div class="section">
          <div class="container">
            <h1>الشروط والأحكام:</h1>
            <p>مرحباً بك في <span>كشمير هوم</span> باستخدامك لهذا الموقع فإنك توافق على الشروط التالية:</p> 
            <ul>
              <li>يُستخدم الموقع <span>للتسوق الإلكتروني</span> فقط ولا يُسمح باستخدامه لأي نشاط غير مشروع.</li>
              <li>نحتفظ بالحق في تعديل أو إلغاء الطلبات في حال حدوث أي خلل أو مخالفة.</li>
              <li>الأسعار قابلة <span>للتغيير</span> دون إشعار مسبق.</li>
              <li>جميع المحتويات محمية بموجب حقوق الملكية الفكرية.</li>
              <li>الاسترجاع مسموح خلال <span>7 أيام</span> من الاستلام بشرط أن يكون المنتج في حالته الأصلية.</li>
            </ul>
          </div>
        </div>

        <hr>

        <div class="section">
          <div class="container">
            <h1>السياسة والخصوصية:</h1>
            <p>نحن نقدر خصوصيتك وملتزمون <span>بحمايتها</span> فيما يلي كيف نتعامل مع بياناتك:</p>      
            <ul>
              <li>عند الدفع سوف يتواصل معك أحد من كشمير هوم وتأكد أنه من كشمير هوم بواسطة هذا الرقم <span>01028604523</span> يتواصل معك لاستكمال <span>عملية الشراء نقداً</span></li>
              <li>لا نشارك معلوماتك مع أي طرف ثالث إلا للضرورة <span>(مثل شركات الشحن)</span>.</li>
              <li>نحمي معلوماتك بوسائل أمان متقدمة.</li>
            </ul>
            <p>باستخدامك لهذا الموقع، فإنك توافق على سياسة الخصوصية المذكورة أعلاه.</p>
          </div>
        </div>
      </div>

      <!-- أزرار التنقل السفلية -->
      <div class="sect">
        <div class="now" id="btn-all">
          <p><i class="fa-solid fa-house"></i></p>
          <h1>شات</h1>
        </div>

        <div class="old" id="btn-old">
          <p><i class="fa-regular fa-comment"></i></p>
          <h1>محادثات قديمة</h1>
        </div>

        <div class="private" id="btn-private">
          <p><i class="fa-solid fa-book"></i></p>
          <h1>الخصوصية</h1>
        </div>
      </div>

    </div>

    <!-- صوت الإشعار -->
    <audio id="sound" src="sounds/notification.mp3"></audio>
  `;

  // إضافة HTML للصفحة
  document.body.insertAdjacentHTML('beforeend', chatHTML);

  // الآن نبدأ الكود الأصلي
  const chatToggle = document.getElementById("chat-toggle");
  const chatWidget = document.getElementById("chat-widget");
  const closeChat = document.getElementById("close-chat");
  const chatBody = document.getElementById("chat-body");
  const chatOptions = document.getElementById("chat-options");
  const oldChats = document.getElementById("old-chats");
  const sound = document.getElementById("sound");
let userName = localStorage.getItem("userName") || "عزيزنا العميل";
  let currentSession = null;
  let stage = "main";

  /* فتح وسحب الشات */
  const trashZone = document.getElementById("trash-zone");
  const originalPos = { right: 20, bottom: 25 };

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;
  let moved = false;
  let isOverTrash = false;

  function checkTrashCollision() {
    const chatRect = chatToggle.getBoundingClientRect();
    const trashRect = trashZone.getBoundingClientRect();

    return (
      chatRect.left < trashRect.right &&
      chatRect.right > trashRect.left &&
      chatRect.top < trashRect.bottom &&
      chatRect.bottom > trashRect.top
    );
  }

  function startDrag(x, y) {
    const rect = chatToggle.getBoundingClientRect();
    offsetX = x - rect.left;
    offsetY = y - rect.top;

    isDragging = true;
    moved = false;
    isOverTrash = false;

    chatToggle.style.transition = "none";
    trashZone.style.display = "flex";
    document.body.classList.add("dragging");
  }

  function drag(x, y) {
    if (!isDragging) return;

    moved = true;

    chatToggle.style.left = x - offsetX + "px";
    chatToggle.style.top = y - offsetY + "px";
    chatToggle.style.right = "auto";
    chatToggle.style.bottom = "auto";

    isOverTrash = checkTrashCollision();
    trashZone.style.background = isOverTrash ? "#b70000" : "red";
  }

  function endDrag() {
    if (!isDragging) return;

    isDragging = false;
    trashZone.style.display = "none";
    document.body.classList.remove("dragging");

    if (isOverTrash) {
      chatToggle.style.transition = "transform .3s";
      chatToggle.style.transform = "scale(0)";
      setTimeout(() => {
        chatToggle.style.display = "none";
      }, 300);
      return;
    }

    chatToggle.style.transition = "left .4s, top .4s";
    chatToggle.style.left = "auto";
    chatToggle.style.top = "auto";
    chatToggle.style.right = originalPos.right + "px";
    chatToggle.style.bottom = originalPos.bottom + "px";
  }

  /* Mouse Events */
  chatToggle.addEventListener("mousedown", e => {
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  });

  document.addEventListener("mousemove", e => {
    if (!isDragging) return;
    drag(e.clientX, e.clientY);
  });

  document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    endDrag();
  });

  /* Touch Events */
  chatToggle.addEventListener("touchstart", e => {
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
  }, { passive: true });

  document.addEventListener("touchmove", e => {
    if (!isDragging) return;
    const t = e.touches[0];
    drag(t.clientX, t.clientY);
  }, { passive: true });

  document.addEventListener("touchend", () => {
    if (!isDragging) return;
    
    const wasOverTrash = isOverTrash;
    const wasMoved = moved;
    
    endDrag();
    
    // فتح الشات فقط إذا لم يتم السحب ومش فوق الحذف والشات مش مفتوح
    if (!wasMoved && !wasOverTrash && chatWidget.style.display !== "flex") {
      openChatWithAnimation();
    }
  });

  /* فتح الشات بالضغط (للكمبيوتر) - مع تأخير وأنيميشن */
  chatToggle.addEventListener("click", () => {
    if (moved || chatWidget.style.display === "flex") return;
    openChatWithAnimation();
  });

  /* دالة فتح الشات مع الأنيميشن */
  function openChatWithAnimation() {
    // إضافة كلاس للأنيميشن
    chatWidget.classList.add('opening');
    
    setTimeout(() => {
      chatWidget.style.display = "flex";
      startNewChat();
      loadOldChats();
      
      // إزالة كلاس الأنيميشن بعد الانتهاء
      setTimeout(() => {
        chatWidget.classList.remove('opening');
      }, 500);
    }, 1000); // تأخير ثانية واحدة
  }

  /* غلق الشات */
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
    // إضافة رسالة الترحيب بدون صوت في البداية
    chatBody.innerHTML += `<div class="bot">أهلاً ${userName} 👋 عامل ايه انا كشميروو لو عايز اي حاجة اسألني عليها</div>`;
    chatBody.scrollTop = chatBody.scrollHeight;
    showOptions();
  }

  /* رسائل */
  function botMsg(text) {
    chatBody.innerHTML += `<div class="bot">${text}</div>`;
    // تشغيل الصوت فقط عند ظهور رسالة من البوت
    sound.play().catch(() => {});
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
        <button class="option" onclick="handle('المنتجات')">المنتجات</button>
        <button class="option" onclick="handle('العروض')">العروض</button>
        <button class="option" onclick="handle('ازاي استخدم الموقع')">ازاي استخدم الموقع</button>
        <button class="option" onclick="handle('فيه مشكلة')">فيه مشكلة</button>
      `;
    }

    if (stage === "product") {
      chatOptions.innerHTML = `
        <button class="option" onclick="handle('الفوط')">الفوط</button>
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
  window.handle = function(choice) {
    userMsg(choice);
    chatOptions.innerHTML = "";

    typing(() => {
      if (choice === "المنتجات") {
        stage = "product";
        botMsg("عايز تعرف ايه عن منتجاتنا.");
        showOptions();
      }

      if (choice === "الفوط") {
        botMsg("فوط كشمير هوم تبدأ من 250 جنية الي 950 جنية و يوجد ايضا فوط اطفال");
        stage = "main";
        showOptions();
      }

      if (choice === "الملايات") {
        botMsg("ملايات كشمير هوم تبدأ من 350 جنية الي 1200 جنية");
        stage = "main";
        showOptions();
      }

      if (choice === "البرانس") {
        botMsg("برانس كشمير هوم تبدأ من 950 جنية الي 3600 جنية");
        stage = "main";
        showOptions();
      }

      if (choice === "البطاطين") {
        botMsg("بطاطين كشمير هوم تبدأ من 600 جنية الي 2000 جنية");
        stage = "main";
        showOptions();
      }

      if (choice === "اللحاف") {
        botMsg("اللحاف كشمير هوم تبدأ من 800 جنية الي 3000 جنية");
        stage = "main";
        showOptions();
      }

      if (choice === "الكوفرتا") {
        botMsg("كوفرتا كشمير هوم تبدأ من 800 جنية الي 3000 جنية");
        stage = "main";
        showOptions();
      }

      if (choice === "العروض") {
        botMsg("عروض كشمير هوم مستمرة معاك للابد كشمير هوم يعني البيت المصري");
        showOptions();
      }

      if (choice === "ازاي استخدم الموقع") {
        botMsg("قريباً سيتم إضافة دليل الاستخدام");
        showOptions();
      }

      if (choice.includes("فيه مشكلة")) {
        botMsg("تواصل معنا عبر:<br>" +
               "<b>فيسبوك:</b> <a href='https://www.facebook.com/p/%D9%83%D8%B4%D9%85%D9%8A%D8%B1-%D9%87%D9%88%D9%85-kashmir-home-100064031503557/' target='_blank'>اضغط هنا للفيسبوك</a><br>" +
               "<b>واتساب:</b> <a href='https://wa.me/201028604523' target='_blank'>اضغط هنا للواتساب</a><br>" +
               "<b>ايميل:</b> <a href='mailto:kashmirhome.00@gmail.com'>kashmirhome.00@gmail.com</a><br>" +
               "<b>انستجرام:</b> <a href='https://www.instagram.com/kashmir_home_center/' target='_blank'>اضغط هنا للانستجرام</a>");
        showOptions();
      }
    });
  };

  window.back = function() {
    stage = "main";
    showOptions();
  };

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
          <span class="delete-chat" onclick="deleteChat('${key}')">
            <i class="fa-solid fa-trash"></i>
          </span>
        `;
        oldChats.appendChild(div);
      });
  }

  window.openChat = function(key) {
    saveChat();
    chatWidget.style.display = "flex";
    showSection('all');
    currentSession = key;
    chatBody.innerHTML = localStorage.getItem(key);
    chatBody.scrollTop = chatBody.scrollHeight;
  };

  window.deleteChat = function(key) {
    if (confirm("حذف المحادثة؟")) {
      localStorage.removeItem(key);
      loadOldChats();
    }
  };

  /* التنقل بين الأقسام */
  window.showSection = function(section) {
    document.querySelectorAll('.chat-all, .chat-acient, .chat-pivet').forEach(el => {
      el.classList.add('hide');
      el.classList.remove('show');
    });

    if (section === 'all') {
      document.querySelector('.chat-all').classList.remove('hide');
      document.querySelector('.chat-all').classList.add('show');
    } else if (section === 'old') {
      document.querySelector('.chat-acient').classList.remove('hide');
      document.querySelector('.chat-acient').classList.add('show');
      loadOldChats();
    } else if (section === 'private') {
      document.querySelector('.chat-pivet').classList.remove('hide');
      document.querySelector('.chat-pivet').classList.add('show');
    }
  };

  document.getElementById('btn-all').addEventListener('click', () => showSection('all'));
  document.getElementById('btn-old').addEventListener('click', () => showSection('old'));
  document.getElementById('btn-private').addEventListener('click', () => showSection('private'));
});
