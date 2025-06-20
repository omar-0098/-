document.addEventListener('DOMContentLoaded', function() {
    const registerSection = document.getElementById('registerSection');
    const buyButton = document.querySelectorAll('.btn_cart')[0];
    const check = document.querySelector('.check');
    
    // دالة التحقق من ظهور العنصر
    function checkVisibility() {
        if (registerSection && registerSection.offsetParent !== null) {
            // إذا كان العنصر ظاهرًا، أخفي الزر
            if (buyButton) {
                buyButton.style.pointerEvents = 'none';
                buyButton.style.background = '#a6a6a6';
                buyButton.style.borderColor = '#5e5e5e';
                check.style.display = 'none';
            }
            
            // بدء عرض الرسالة كل دقيقة
            startMessageInterval();
        } else {
            // إذا كان العنصر غير ظاهر، أظهر الزر
            if (buyButton) {
                buyButton.style.pointerEvents = 'all';
                buyButton.style.background = '#f9607f';
                buyButton.style.borderColor = '#f9607f';
                check.style.display = 'block';
            }
            
            // إيقاف عرض الرسالة إذا كان يعمل
        }
    }
    
    // متغيرات للتحكم في interval الرسالة
    let messageInterval;
    
    // التحقق الأولي عند تحميل الصفحة
    checkVisibility();
    
    // إذا كنت تتوقع تغييرات ديناميكية، يمكنك إضافة مراقب للتحقق
    const observer = new MutationObserver(checkVisibility);
    
    if (registerSection) {
        observer.observe(registerSection.parentNode, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    }
});
/////////////////////////

  document.addEventListener('DOMContentLoaded', function() {
    try {
      const userDataString = localStorage.getItem('userData');
      
      if (!userDataString) {
        console.log("لا يوجد بيانات مستخدم في localStorage");
        return; // الخروج إذا لم تكن البيانات موجودة
      }

      const userData = JSON.parse(userDataString);
      
      if (!userData || !userData.profileImage) {
        console.log("لا يوجد رابط للصورة في بيانات المستخدم");
        return; // الخروج إذا لم يكن هناك profileImage
      }

      const iconElement = document.getElementById('icon_person');
      
      if (!iconElement) {
        console.log("عنصر الأيقونة غير موجود في الصفحة");
        return; // الخروج إذا لم يتم العثور على العنصر
      }

      // إنشاء عنصر الصورة
      const imgElement = document.createElement('img');
      imgElement.src = userData.profileImage;
      imgElement.alt = 'صورة المستخدم';
      imgElement.style.width = '24px';
      imgElement.style.height = '24px';
      imgElement.style.borderRadius = '50%';
      imgElement.style.objectFit = 'cover'; // لضمان ظهور الصورة بشكل صحيح

      // استبدال الأيقونة بالصورة
      iconElement.replaceWith(imgElement);
      
    } catch (error) {
      console.error("حدث خطأ أثناء تحميل الصورة:", error);
    }
  });

/////////////////////////


// the check box
const checkboxes = document.querySelectorAll('.exclusive');

checkboxes.forEach((checkbox) => {
  checkbox.addEventListener('change', function() {
    if (this.checked) {
      // الغي التشيك من الباقيين
      checkboxes.forEach((cb) => {
        if (cb !== this) cb.checked = false;
      });

      // روح للموقع الخاص
      const url = this.getAttribute('data-url');
      window.location.href = url;
    }
  });
});


////////////////////


function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth' // السلاسة 😍
  });
}

/////////////////


// img-big
window.onload = function() {
  let bigImags = document.getElementById("bidImg");

  window.changeItemImage = function(img) {
    bigImags.style.opacity = 0; // نخفيها الأول بحركة ناعمة

    setTimeout(function() {
      bigImags.src = img; // نغير الصورة
      bigImags.style.opacity = 1; // نظهرها بحركة
    }, 250); // نص ثانية تقريباً
  }
}




// document.getElementById("linkSelect").addEventListener("change", function () {
//   const selectedUrl = this.value;
//   if (selectedUrl) {
//     window.open(selectedUrl, "_blank"); // يفتح الرابط في تبويب جديد
//     this.selectedIndex = 0; // يرجّع الاختيار لأول عنصر
//   }
// });

document.addEventListener('click', function(e) {
  const img = e.target.closest('.img_product img');
  if (img) {
    e.preventDefault();

    const link = img.closest('a').getAttribute('href');

    // إنشاء overlay والدوران
    const overlay = document.createElement('div');
    overlay.className = 'overlay';

    const spinner = document.createElement('div');
    spinner.className = 'spinner';

    overlay.appendChild(spinner);
    document.body.appendChild(overlay);

    // بعد 3 ثواني، إزالة الأنيميشن وفتح الرابط
    setTimeout(() => {
      overlay.remove();
      window.location.href = link;
    }, 1000);
  }
});



/////////////////////////////////////////////////
// window.onload = function() {
//   const darkMode = localStorage.getItem('darkMode');
//   if (darkMode === 'enabled') {
//     document.body.classList.add('dark-mode');
//   }
// }

// function toggleDarkMode() {
//   document.body.classList.toggle('dark-mode');
//   if (document.body.classList.contains('dark-mode')) {
//     localStorage.setItem('darkMode', 'enabled');
//   } else {
//     localStorage.setItem('darkMode', 'disabled');
//   }
// }






