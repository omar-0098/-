// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    displayUserHeaderInfo();
});

// دالة مساعدة لجلب البيانات من localStorage
function getLocalStorageData() {
    const savedData = localStorage.getItem('userData');
    return savedData ? JSON.parse(savedData) : null;
}

// دالة لجلب بيانات المستخدم وعرضها في الحقول مع التحقق من وجود العناصر
function loadUserData() {
    const userData = getLocalStorageData();
    
    if (userData) {
        // دالة مساعدة للتحقق من وجود العنصر قبل تعيين القيمة
        function setValueIfElementExists(elementId, value) {
            const element = document.getElementById(elementId);
            if (element) element.value = value || '';
        }
        
        setValueIfElementExists('userName', userData.name);
        setValueIfElementExists('userFamily', userData.family);
        setValueIfElementExists('userEmail', userData.email);
        setValueIfElementExists('userPhone', userData.phone);
    }
}

// دالة لعرض معلومات المستخدم في الهيدر مع التحقق من وجود العناصر
function displayUserHeaderInfo() {
    const userData = getLocalStorageData();
    
    if (userData) {
        const welcomeElement = document.getElementById('welcomeName');
        const emailElement = document.getElementById('userEmailDisplay');
        
        if (welcomeElement) {
            welcomeElement.textContent = userData.name ? `مرحبا ${userData.name}` : 'مرحبا';
        }
        
        if (emailElement) {
            emailElement.textContent = userData.email || '';
        }
    }
}

// دالة لتحديث بيانات المستخدم مع التحقق من وجود العناصر
function updateUserInfo() {
    const userData = getLocalStorageData() || {};
    
    function getValueIfElementExists(elementId) {
        const element = document.getElementById(elementId);
        return element ? element.value.trim() : null;
    }
    
    const updatedData = {
        ...userData,
        name: getValueIfElementExists('editName') || userData.name,
        family: getValueIfElementExists('editFamily') || userData.family,
        email: getValueIfElementExists('editEmail') || userData.email,
        phone: getValueIfElementExists('editPhone') || userData.phone
    };
    
    localStorage.setItem('userData', JSON.stringify(updatedData));
    displayUserHeaderInfo();
    loadUserData();
    
    alert('تم تحديث البيانات بنجاح!');
    return true;
}









        
// document.addEventListener('DOMContentLoaded', function() {
//     // تحميل البيانات وحالة التحديث
//     loadUserData();
//     checkUpdateStatus();
    
//     // إعداد زر التحديث
//     const updateBtn = document.getElementById('updateNamesBtn');
    
//     // عند الضغط على زر التحديث
//     updateBtn.addEventListener('click', function() {
//         updateUserNames();
//     });
    
//     // تفعيل/تعطيل الزر عند التغيير
//     document.getElementById('userName').addEventListener('input', checkForChanges);
//     document.getElementById('userFamily').addEventListener('input', checkForChanges);
// });

// // دالة التحقق من حالة التحديث
// function checkUpdateStatus() {
//     const userData = JSON.parse(localStorage.getItem('userData')) || {};
    
//     // إذا كان التحديث قد تم مسبقاً
//     if (userData.isUpdated) {
//         disableEditing();
//     } else {
//         // إذا لم يتم التحديث بعد
//         document.getElementById('updateNamesBtn').disabled = true;
//         checkForChanges();
//     }
// }

// // دالة التحديث
// function updateUserNames() {
//     const updateBtn = document.getElementById('updateNamesBtn');
    
//     // جلب البيانات الحالية
//     const userData = JSON.parse(localStorage.getItem('userData')) || {};
    
//     // تحديث البيانات
//     userData.name = document.getElementById('userName').value;
//     userData.family = document.getElementById('userFamily').value;
//     userData.isUpdated = true; // علامة أن التحديث تم
    
//     // حفظ البيانات المحدثة
//     localStorage.setItem('userData', JSON.stringify(userData));
    
//     // تعطيل النظام بعد التحديث
//     disableEditing();
    
//     alert('تم تحديث الأسماء بنجاح!');
//     displayUserHeaderInfo();
// }

// // دالة تعطيل التعديل بعد التحديث
// function disableEditing() {
//     const updateBtn = document.getElementById('updateNamesBtn');
    
//     updateBtn.disabled = true;
//     updateBtn.textContent = 'تم التحديث';
//     updateBtn.style.backgroundColor = '#4CAF50';
//     document.getElementById('userName').readOnly = true;
//     document.getElementById('userFamily').readOnly = true;
// }

// // دالة التحقق من التغييرات
// function checkForChanges() {
//     if (isUpdated()) return;
    
//     const updateBtn = document.getElementById('updateNamesBtn');
//     const userData = JSON.parse(localStorage.getItem('userData')) || {};

//     const nameChanged = document.getElementById('userName').value !== userData.name;
//     const familyChanged = document.getElementById('userFamily').value !== userData.family;
    
//     updateBtn.disabled = !(nameChanged || familyChanged);
// }

// // دالة للتحقق إذا كان التحديث تم مسبقاً
// function isUpdated() {
//     const userData = JSON.parse(localStorage.getItem('userData')) || {};
//     return userData.isUpdated;
// }

// // باقي الدوال كما هي (loadUserData, displayUserHeaderInfo)






















































































document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    checkUpdateStatus();
    
    const updateBtn = document.getElementById('updateNamesBtn');
    
    updateBtn.addEventListener('click', function() {
        updateUserNames();
    });
    
    document.getElementById('userName').addEventListener('input', checkForChanges);
    document.getElementById('userFamily').addEventListener('input', checkForChanges);
});

// دالة التحقق من حالة التحديث
function checkUpdateStatus() {
    const userData = JSON.parse(localStorage.getItem('userData')) || {};
    
    if (userData.isUpdated) {
        disableEditing();
    } else {
        document.getElementById('updateNamesBtn').disabled = true;
        checkForChanges();
    }
}

// دالة التحديث المعدلة لإرسال البيانات إلى Google Sheets
async function updateUserNames() {
    const updateBtn = document.getElementById('updateNamesBtn');
    updateBtn.disabled = true;
    updateBtn.textContent = 'جاري التحديث...';
    
    try {
        const userData = JSON.parse(localStorage.getItem('userData')) || {};
        const email = userData.email; // افترض أن لديك بريد المستخدم
        
        // تحديث البيانات المحلية
        userData.name = document.getElementById('userName').value;
        userData.family = document.getElementById('userFamily').value;
        userData.isUpdated = true;
        userData.updateTimestamp = new Date().toISOString();
        
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // إرسال البيانات إلى Google Sheets
        const response = await sendDataToGoogleSheets({
            email: email,
            name: userData.name,
            family: userData.family,
            timestamp: userData.updateTimestamp
        });
        
        if (response.success) {
            disableEditing();
            alert('تم تحديث الأسماء بنجاح وتم تسجيلها في قاعدة البيانات!');
            displayUserHeaderInfo();
        } else {
            throw new Error(response.message || 'فشل في إرسال البيانات');
        }
    } catch (error) {
        console.error('Error updating data:', error);
        updateBtn.disabled = false;
        updateBtn.textContent = 'تحديث الأسماء';
        alert('حدث خطأ أثناء محاولة تحديث البيانات. الرجاء المحاولة مرة أخرى.');
    }
}

// دالة لإرسال البيانات إلى Google Sheets
async function sendDataToGoogleSheets(data) {
    // هنا يجب استبدال هذا برمز الاتصال الفعلي ب Google Sheets
    // يمكنك استخدام Google Apps Script أو خدمة ويب أخرى
    
    // مثال باستخدام fetch إلى نقطة نهاية Google Apps Script
    try {
        const scriptUrl = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
        const response = await fetch(scriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            mode: 'no-cors' // قد تحتاج هذا لبعض التطبيقات
        });
        
        // إذا كنت تستخدم Google Apps Script مع إرجاع JSON
        // const result = await response.json();
        // return result;
        
        // في هذا المثال سنفترض أن الإرسال ناجح
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// بقية الدوال كما هي
function disableEditing() {
    const updateBtn = document.getElementById('updateNamesBtn');
    
    updateBtn.disabled = true;
    updateBtn.textContent = 'تم التحديث';
    updateBtn.style.backgroundColor = '#4CAF50';
    document.getElementById('userName').readOnly = true;
    document.getElementById('userFamily').readOnly = true;
}

function checkForChanges() {
    if (isUpdated()) return;
    
    const updateBtn = document.getElementById('updateNamesBtn');
    const userData = JSON.parse(localStorage.getItem('userData')) || {};

    const nameChanged = document.getElementById('userName').value !== userData.name;
    const familyChanged = document.getElementById('userFamily').value !== userData.family;
    
    updateBtn.disabled = !(nameChanged || familyChanged);
}

function isUpdated() {
    const userData = JSON.parse(localStorage.getItem('userData')) || {};
    return userData.isUpdated;
}

// باقي الدوال الأخرى...






















































const icon = document.getElementById("icon_person");
const fileInput = document.getElementById("fileInput");
const profileImage = document.getElementById("profileImage");

// عند تحميل الصفحة، نتحقق إذا كانت هناك صورة محفوظة
window.addEventListener('load', function() {
    const savedImage = localStorage.getItem('userProfileImage');
    if (savedImage) {
        profileImage.src = savedImage;
        profileImage.style.display = "block";
        icon.style.display = "none";
    }
});

// عند الضغط على الأيقونة
icon.addEventListener("click", () => {
    fileInput.click();
});

// عند اختيار صورة جديدة
fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    
    if (file) {
        // التحقق من نوع الصورة
        if (!file.type.match('image.*')) {
            alert('الرجاء اختيار ملف صورة فقط');
            return;
        }

        // التحقق من حجم الصورة (2MB كحد أقصى)
        if (file.size > 2 * 1024 * 1024) {
            alert('حجم الصورة يجب أن يكون أقل من 2MB');
            return;
        }

        const reader = new FileReader();
        
        reader.onload = function(e) {
            // عرض الصورة المختارة
            profileImage.src = e.target.result;
            profileImage.style.display = "block";
            icon.style.display = "none";
            
            // تخزين الصورة في localStorage
            localStorage.setItem('userProfileImage', e.target.result);
            
            // يمكنك دمجها مع بيانات المستخدم الأخرى
            const userData = JSON.parse(localStorage.getItem('userData')) || {};
            userData.profileImage = e.target.result;
            localStorage.setItem('userData', JSON.stringify(userData));
            
            // إرسال البيانات إلى Google Sheets
            sendToGoogleSheets(userData);
            
            alert('تم حفظ الصورة بنجاح!');
        };
        
        reader.onerror = function() {
            alert('حدث خطأ أثناء قراءة الصورة');
        };
        
        reader.readAsDataURL(file);
    }
});

// إضافة حدث الضغط المزدوج لحذف الصورة
profileImage.addEventListener("dblclick", function() {
    if (confirm("هل تريد حقاً حذف هذه الصورة؟")) {
        // حذف الصورة من localStorage
        localStorage.removeItem('userProfileImage');
        
        // حذف الصورة من بيانات المستخدم
        const userData = JSON.parse(localStorage.getItem('userData')) || {};
        delete userData.profileImage;
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // إعادة عرض الأيقونة الأصلية
        profileImage.style.display = "none";
        icon.style.display = "block";
        profileImage.src = "";
        
        alert("تم حذف الصورة بنجاح");
    }
});

// دالة لإرسال البيانات إلى Google Sheets
function sendToGoogleSheets(data) {
    // هنا يجب وضع رابط سكربت Google Apps Script الخاص بك
    const scriptURL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
    
    // تحضير البيانات للإرسال
    const formData = new FormData();
    formData.append('action', 'saveProfileImage');
    formData.append('data', JSON.stringify(data));
    
    // إرسال البيانات
    fetch(scriptURL, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('تم إرسال البيانات بنجاح:', data);
    })
    .catch(error => {
        console.error('حدث خطأ أثناء الإرسال:', error);
    });
}


















document.addEventListener('DOMContentLoaded', function() {
  // تعريف العناصر
  const logoutBtn = document.getElementById('logoutLink');
  const deletionModal = document.getElementById('accountDeletionModal');
  const deletionEmailInput = document.getElementById('accountDeletionEmailInput');
  const deletionError = document.getElementById('deletionErrorMsg');
  const confirmDeletionBtn = document.getElementById('confirmAccountDeletion');
  const cancelDeletionBtn = document.getElementById('cancelAccountDeletion');
  const deletionLoader = document.getElementById('deletionLoader');
  
  // عند النقر على تسجيل الخروج
  logoutBtn.addEventListener('click', function(e) {
    e.preventDefault();
    deletionModal.style.display = 'block';
    deletionEmailInput.value = '';
    deletionError.style.display = 'none';
  });
  
  // عند الإلغاء
  cancelDeletionBtn.addEventListener('click', function() {
    deletionModal.style.display = 'none';
  });
  
  // عند تأكيد الحذف
  confirmDeletionBtn.addEventListener('click', function() {
    const enteredEmail = deletionEmailInput.value.trim().toLowerCase();
    const userData = JSON.parse(localStorage.getItem('userData')) || {};
    const storedEmail = userData.email ? userData.email.toLowerCase() : '';
    
    if (!enteredEmail) {
      deletionError.textContent = 'يجب إدخال البريد الإلكتروني';
      deletionError.style.display = 'block';
      return;
    }
    
    if (enteredEmail !== storedEmail) {
      deletionError.textContent = 'البريد الإلكتروني غير متطابق مع السجلات';
      deletionError.style.display = 'block';
      return;
    }
    
    // بدء عملية الحذف
    deletionModal.style.display = 'none';
    deletionLoader.style.display = 'flex';
    
    setTimeout(function() {
      // 1. حذف جميع البيانات المحفوظة
      localStorage.clear(); // حذف كل شيء في localStorage
      sessionStorage.clear(); // حذف بيانات الجلسة
      
      // 2. الانتقال للصفحة الرئيسية مع منع العودة
      window.location.replace('/'); // هذه الطريقة تمنع العودة للصفحة السابقة
      
      // 3. إضافة علامة في localStorage للإشارة لتسجيل الخروج
      localStorage.setItem('logoutFlag', 'true');
    }, 1000);
  });
  
  // التحقق من حالة تسجيل الخروج عند تحميل الصفحة
  if (localStorage.getItem('logoutFlag') === 'true') {
    localStorage.removeItem('logoutFlag');
    window.location.replace('/');
  }
});
