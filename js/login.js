
const scriptURL = "https://script.google.com/macros/s/AKfycbxRGNbJlfhu0R3y9cjeevewdavkR63cUmRWWDYcW5dIoQFwyHe0OQfdkL5BJ1CqmFyuJg/exec";
// const scriptURL = "https://script.google.com/macros/s/AKfycby2NA_ysjrMtpA5cJFaXDeXG55-FvuO46ajiG7L9lNDgSmxalCLfRJpS5Vh8KHlqH7kgA/exec";
const form = document.getElementById("registerForm");
const overlay = document.getElementById("overlay");
const person1 = document.querySelector(".person1");
const closeOverlay = document.getElementById("closeOverlay");
const registerSection = document.getElementById("registerSection");
const welcomeSection = document.getElementById("welcomeSection");
const userNameElement = document.getElementById("userName");

// عند تحميل الصفحة، تحقق إذا كان المستخدم مسجل مسبقاً
document.addEventListener('DOMContentLoaded', function() {
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
        const userData = JSON.parse(savedUser);
        showWelcomeSection(userData.name);
        // عرض بيانات المستخدم المحفوظة في console
        console.log("بيانات المستخدم المحفوظة:", userData);
        // يمكنك عرضها في صفحة الويب أيضاً إذا أردت
        displayUserData(userData);
    }
});

// دالة لعرض بيانات المستخدم
function displayUserData(userData) {
    const userDataDiv = document.createElement('div');
    userDataDiv.id = 'userDataDisplay';
    userDataDiv.style.margin = '20px';
    userDataDiv.style.padding = '15px';
    userDataDiv.style.border = '1px solid #ddd';
    userDataDiv.style.borderRadius = '5px';
    userDataDiv.style.backgroundColor = '#f9f9f9';
    
    userDataDiv.innerHTML = `
        <h3>بيانات المستخدم المحفوظة:</h3>
        <p><strong>الاسم:</strong> ${userData.name}</p>
        <p><strong>العائلة:</strong> ${userData.family}</p>
        <p><strong>البريد الإلكتروني:</strong> ${userData.email}</p>
        <p><strong>رقم الهاتف:</strong> ${userData.phone}</p>
    `;
    
    document.body.appendChild(userDataDiv);
}

// عند الضغط على زر "انشاء حساب" إظهار الفورم
// متغير لحفظ موضع التمرير الحالي
let scrollPosition = 0;

person1.addEventListener('click', () => {
    // حفظ موضع التمرير الحالي
    scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    // إظهار النموذج
    overlay.style.display = 'flex';
    
    // منع التمرير
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.width = '100%';
});

// عند إغلاق النموذج (في دالة setupFormEvents)
function setupFormEvents() {
    document.getElementById('closeOverlay')?.addEventListener('click', () => {
        overlay.style.display = 'none';
        
        // استعادة التمرير
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        
        // العودة إلى موضع التمرير السابق
        window.scrollTo(0, scrollPosition);
    });
    
    // باقي الأحداث...
}
// زر إغلاق الفورم
closeOverlay.addEventListener('click', () => {
    overlay.style.display = 'none';
});

// عند إرسال النموذج
form.addEventListener("submit", (e) => {
    e.preventDefault();

    const userName = document.getElementById("name").value;
    const userFamily = document.getElementById("family").value;
    const phone = document.getElementById("phone").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!validateForm(email, password, phone)) return;

    fetch(scriptURL, { method: "POST", body: new FormData(form) })
        .then(response => {
            if (!response.ok) throw new Error('Network Error');
            return response.json();
        })
        .then(data => {
            if (data.result === "success") {
                showSuccess("تم التسجيل بنجاح!");
                
                // إخفاء النافذة بعد ثانيتين
                setTimeout(() => {
                    overlay.style.display = 'none';
                    form.reset();
                    
                    // إخفاء قسم التسجيل وإظهار قسم الترحيب
                    registerSection.style.display = 'none';
                    showWelcomeSection(userName);
                    
                    // حفظ بيانات المستخدم كاملة
                    const userData = {
                        name: userName,
                        family: userFamily,
                        email: email,
                        phone: phone,
                        registered: true
                    };
                    localStorage.setItem('userData', JSON.stringify(userData));
                    
                    // عرض البيانات المحفوظة
                    displayUserData(userData);
                }, 2000);
            } else {
                showError("حدث خطأ أثناء التسجيل");
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError("حدث خطأ أثناء الاتصال بالخادم");
        });
});

// باقي الدوال تبقى كما هي (validateForm, showError, showSuccess, clearMessages)
function validateForm(email, password, phone) {
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        showError("البريد الإلكتروني غير صالح");
        return false;
    }
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(password)) {
    showError("كلمة المرور يجب أن تحتوي على أحرف إنجليزية وأرقام معاً (6 أحرف على الأقل)");
    return false;
}
    if (!/^01[0125][0-9]{8}$/.test(phone)) {
        showError("رقم الهاتف غير صالح");
        return false;
    }
    return true;
}

function showError(message) {
    clearMessages();
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = 'red';
    errorDiv.style.margin = '10px 0';
    errorDiv.style.textAlign = 'center';
    errorDiv.textContent = message;
    form.insertBefore(errorDiv, form.querySelector('h2'));
}

function showSuccess(message) {
    clearMessages();
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.color = 'green';
    successDiv.style.margin = '10px 0';
    successDiv.style.textAlign = 'center';
    successDiv.textContent = message;
    form.insertBefore(successDiv, form.querySelector('h2'));
}

function clearMessages() {
    const oldError = form.querySelector('.error-message');
    const oldSuccess = form.querySelector('.success-message');
    if (oldError) oldError.remove();
    if (oldSuccess) oldSuccess.remove();
}

// دالة لعرض قسم الترحيب
function showWelcomeSection(name) {
    registerSection.style.display = "none";
    userNameElement.textContent = name;
    welcomeSection.style.display = 'flex';
}












function updateUIBasedOnMan1() {
    const man1 = document.querySelector('.man1');
    const checkoutItem = document.querySelector('li.check');
    const messageDiv = document.getElementById('mustRegisterMessage');
    const masegeLoginDiv = document.querySelector('.masege-login');

    if (man1) {
        const isMan1Hidden = window.getComputedStyle(man1).display === 'none';

        if (isMan1Hidden) {
            // إخفاء زر الدفع
            if (checkoutItem) {
                checkoutItem.style.display = 'none';
            }

            // إظهار رسالة يجب إنشاء حساب
            if (messageDiv) {
                messageDiv.style.display = 'block';
            }

            // تعطيل زر السلة تماماً
            document.querySelectorAll('.btn_add_cart').forEach(function(button) {
                // منع جميع الأحداث
                button.style.pointerEvents = 'auto';
                button.style.opacity = '0.6';
                button.style.cursor = 'not-allowed';
                
                // إزالة جميع معالجات الأحداث الموجودة
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                
                // إضافة معالج حدث جديد يمنع التنفيذ ويعرض الرسالة فقط
                newButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    
                    //  إظهار الرسالة المؤقتة
                     if (masegeLoginDiv) {
                         masegeLoginDiv.style.display = 'block';

                         setTimeout(() => {
                             masegeLoginDiv.style.display = 'none';

                        }, 2000);
                    }




                 return false;
                });
            });
        } else {

            // إظهار زر الدفع عند تسجيل الدخول
            if (checkoutItem) {
                checkoutItem.style.display = 'list-item';
            }

            // إخفاء الرسالة
            if (messageDiv) {
                messageDiv.style.display = 'none';
            }

            // إعادة تفعيل زر السلة
            document.querySelectorAll('.btn_add_cart').forEach(function(button) {
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
                button.onclick = null;
            });
        }
    }
}

// تشغيل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', updateUIBasedOnMan1);

// مراقبة التغييرات باستمرار
setInterval(updateUIBasedOnMan1, 500);















