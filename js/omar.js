

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






