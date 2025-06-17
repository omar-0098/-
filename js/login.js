
const scriptURL = "https://script.google.com/macros/s/AKfycbzDPcLwO1U091L_W1Ha-M-_GjL5z6V7aFh6RxTberNq8tsYLIkkI1BtdF5ufA8qpSmvag/exec";

// إعدادات JSONBin
const JSONBIN_CONFIG = {
    API_KEY: "$2a$10$xAWjC3zelpDKCd6zdOdUg.D0bwtEURjcR5sEiYdonjBmP5lHuqzq2", // ضع مفتاح API الخاص بك هنا
    BIN_ID: "6848177e8960c979a5a77f85", // ضع معرف الـ Bin الخاص بك هنا
    BASE_URL: "https://api.jsonbin.io/v3"
};

const form = document.getElementById("registerForm");
const overlay = document.getElementById("overlay");
const person1 = document.querySelector(".person1");
const closeOverlay = document.getElementById("closeOverlay");
const registerSection = document.getElementById("registerSection");
const welcomeSection = document.getElementById("welcomeSection");
const userNameElement = document.getElementById("userName");

// عند تحميل الصفحة، تحقق إذا كان المستخدم مسجل مسبقاً
document.addEventListener('DOMContentLoaded', async function() {
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
        const userData = JSON.parse(savedUser);
        
        // التحقق من وجود البيانات في JSONBin قبل عرض الترحيب
        const userExists = await checkUserInJSONBin(userData.email);
        
        if (userExists) {
            showWelcomeSection(userData.name);
            console.log("بيانات المستخدم المحفوظة:", userData);
            displayUserData(userData);
        } else {
            // إذا لم توجد البيانات في JSONBin، امسح الحساب المحلي
            deleteLocalAccount();
            console.log("لم توجد بيانات المستخدم في JSONBin، تم مسح الحساب المحلي");
        }
    }
    
    // إضافة التحقق المباشر من التكرار
    setTimeout(() => {
        setupRealTimeValidation();
    }, 1000);
});

// دالة لعرض بيانات المستخدم مع زر مسح الحساب
function displayUserData(userData) {
    // إزالة العرض السابق إذا كان موجوداً
    const existingDisplay = document.getElementById('userDataDisplay');
    if (existingDisplay) {
        existingDisplay.remove();
    }
    
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
        <button id="deleteAccountBtn" style="
            background: #ff4444;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 15px;
            font-size: 14px;
        ">حذف الحساب</button>
    `;
    
    document.body.appendChild(userDataDiv);
    
    // إضافة وظيفة حذف الحساب
    document.getElementById('deleteAccountBtn').addEventListener('click', function() {
        showDeleteConfirmation();
    });
}

// دالة لإظهار تأكيد حذف الحساب
function showDeleteConfirmation() {
    const confirmation = document.createElement('div');
    confirmation.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 2px solid #ff4444;
        border-radius: 10px;
        padding: 30px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 400px;
        font-family: Arial, sans-serif;
    `;
    
    confirmation.innerHTML = `
        <div style="color: #ff4444; font-size: 48px; margin-bottom: 15px;">⚠️</div>
        <h2 style="color: #333; margin-bottom: 15px;">تأكيد حذف الحساب</h2>
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            هل أنت متأكد من أنك تريد حذف حسابك؟ <br>
            <strong>هذا الإجراء لا يمكن التراجع عنه.</strong>
        </p>
        <div style="display: flex; gap: 10px; justify-content: center;">
            <button id="confirmDelete" style="
                background: #ff4444;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            ">نعم، احذف الحساب</button>
            <button id="cancelDelete" style="
                background: #666;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            ">إلغاء</button>
        </div>
    `;
    
    // إضافة overlay خلفي
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(confirmation);
    
    // إضافة الأحداث
    document.getElementById('confirmDelete').addEventListener('click', async () => {
        document.body.removeChild(confirmation);
        document.body.removeChild(overlay);
        await deleteUserAccount();
    });
    
    document.getElementById('cancelDelete').addEventListener('click', () => {
        document.body.removeChild(confirmation);
        document.body.removeChild(overlay);
    });
}

// دالة لحذف حساب المستخدم من JSONBin
async function deleteUserAccount() {
    const savedUser = localStorage.getItem('userData');
    if (!savedUser) return;
    
    const userData = JSON.parse(savedUser);
    
    try {
        // عرض رسالة تحميل
        showLoading("جاري حذف الحساب...");
        
        // احصل على البيانات من JSONBin
        const response = await fetch(`${JSONBIN_CONFIG.BASE_URL}/b/${JSONBIN_CONFIG.BIN_ID}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            let existingData = Array.isArray(result.record) ? result.record : [];
            
            // احذف بيانات المستخدم
            existingData = existingData.filter(user => user.email !== userData.email);
            
            // ارسل البيانات المحدثة
            const updateResponse = await fetch(`${JSONBIN_CONFIG.BASE_URL}/b/${JSONBIN_CONFIG.BIN_ID}`, {
                method: 'PUT',
                headers: {
                    'X-Master-Key': JSONBIN_CONFIG.API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(existingData)
            });

            if (updateResponse.ok) {
                // احذف الحساب محلياً
                deleteLocalAccount();
                
                clearMessages();
                showAccountDeletedMessage();
                console.log('تم حذف الحساب بنجاح');
            } else {
                throw new Error('فشل في حذف البيانات من JSONBin');
            }
        } else {
            throw new Error('فشل في الوصول إلى البيانات');
        }
    } catch (error) {
        console.error('خطأ في حذف الحساب:', error);
        clearMessages();
        showError('فشل في حذف الحساب. يرجى المحاولة مرة أخرى.');
    }
}

// متغير لحفظ موضع التمرير الحالي
let scrollPosition = 0;

person1.addEventListener('click', () => {
    scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    overlay.style.display = 'flex';
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.width = '100%';
});

// زر إغلاق الفورم
closeOverlay.addEventListener('click', () => {
    overlay.style.display = 'none';
    
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    
    window.scrollTo(0, scrollPosition);
});

// دالة لإرسال البيانات إلى JSONBin
async function sendToJSONBin(userData) {
    try {
        // أولاً، احصل على البيانات المحفوظة
        const response = await fetch(`${JSONBIN_CONFIG.BASE_URL}/b/${JSONBIN_CONFIG.BIN_ID}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.API_KEY,
                'Content-Type': 'application/json'
            }
        });

        let existingData = [];
        if (response.ok) {
            const result = await response.json();
            existingData = Array.isArray(result.record) ? result.record : [];
        }

        // أضف البيانات الجديدة مع معرف فريد وتاريخ
        const newEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...userData
        };
        
        existingData.push(newEntry);

        // ارسل البيانات المحدثة
        const updateResponse = await fetch(`${JSONBIN_CONFIG.BASE_URL}/b/${JSONBIN_CONFIG.BIN_ID}`, {
            method: 'PUT',
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(existingData)
        });

        if (updateResponse.ok) {
            console.log('تم إرسال البيانات إلى JSONBin بنجاح');
            return true;
        } else {
            throw new Error('فشل في إرسال البيانات إلى JSONBin');
        }
    } catch (error) {
        console.error('خطأ في إرسال البيانات إلى JSONBin:', error);
        return false;
    }
}

// دالة لإرسال البيانات إلى Google Sheets مع إعدادات محسنة
async function sendToGoogleSheets(formData) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // مهلة زمنية 10 ثوانٍ

    try {
        const response = await fetch(scriptURL, {
            method: "POST",
            body: formData,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('انتهت المهلة الزمنية للطلب');
        }
        throw error;
    }
}

// عند إرسال النموذج
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userName = document.getElementById("name").value;
    const userFamily = document.getElementById("family").value;
    const phone = document.getElementById("phone").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // التحقق من صحة البيانات أولاً
    if (!validateForm(email, password, phone)) return;

    // إظهار رسالة التحقق من التكرار
    showLoading("جاري التحقق من البيانات...");

    try {
        // التحقق من تكرار الإيميل والتليفون
        const duplicateCheck = await checkDuplicateUser(email, phone);
        
        clearMessages();
        
        if (duplicateCheck.emailExists && duplicateCheck.phoneExists) {
            showError("هذا الإيميل ورقم الهاتف مستخدمان بالفعل. يرجى استخدام إيميل ورقم هاتف مختلفين.");
            return;
        } else if (duplicateCheck.emailExists) {
            showError("هذا البريد الإلكتروني مستخدم بالفعل. يرجى استخدام بريد إلكتروني آخر.");
            return;
        } else if (duplicateCheck.phoneExists) {
            showError("رقم الهاتف هذا مستخدم بالفعل. يرجى استخدام رقم هاتف آخر.");
            return;
        }

        // إذا لم يكن هناك تكرار، تابع عملية التسجيل
        showLoading("  جاري انشاء حساب...");

    const userData = {
    name: userName,
    family: userFamily,
    email: email,
    phone: phone,
    registered: true,
    copon1: "",
    copon2: ""
};


        let googleSheetsSuccess = false;
        let jsonBinSuccess = false;

        try {
            // إرسال إلى Google Sheets
const formData = new FormData(form);
formData.append("copon1", "");
formData.append("copon2", "");
            const googleResponse = await sendToGoogleSheets(formData);
            
            if (googleResponse.result === "success") {
                googleSheetsSuccess = true;
                console.log('تم إرسال البيانات إلى Google Sheets بنجاح');
            }
        } catch (error) {
            console.error('خطأ في إرسال البيانات إلى Google Sheets:', error);
        }

        try {
            // إرسال إلى JSONBin
            jsonBinSuccess = await sendToJSONBin(userData);
        } catch (error) {
            console.error('خطأ في إرسال البيانات إلى JSONBin:', error);
        }

        // إظهار النتائج
        clearMessages();
        
        if (googleSheetsSuccess && jsonBinSuccess) {
            showSuccess("تم التسجيل بنجاح في جميع المنصات!");
        } else if (googleSheetsSuccess || jsonBinSuccess) {
            const platforms = [];
            if (googleSheetsSuccess) platforms.push("Google Sheets");
            if (jsonBinSuccess) platforms.push("JSONBin");
            showWarning(`تم التسجيل بنجاح في: ${platforms.join(', ')}`);
        } else {
            showError("فشل في التسجيل. يرجى المحاولة مرة أخرى.");
            return;
        }

        // إخفاء النافذة بعد ثانيتين
        setTimeout(() => {
            overlay.style.display = 'none';
            form.reset();
            
            registerSection.style.display = 'none';
            showWelcomeSection(userName);
            
            localStorage.setItem('userData', JSON.stringify(userData));
            displayUserData(userData);
            
            // استعادة التمرير
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, scrollPosition);
            
        }, 2000);

    } catch (error) {
        console.error('خطأ في عملية التسجيل:', error);
        clearMessages();
        showError("حدث خطأ أثناء التحقق من البيانات. يرجى المحاولة مرة أخرى.");
    }
});

// دوال التحقق والرسائل
function validateForm(email, password, phone) {
    clearMessages();
    
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
    errorDiv.style.cssText = `
        color: red;
        margin: 10px 0;
        text-align: center;
        padding: 10px;
        background-color: #fee;
        border: 1px solid #fcc;
        border-radius: 5px;
    `;
    errorDiv.textContent = message;
    form.insertBefore(errorDiv, form.querySelector('h2'));
}

function showSuccess(message) {
    clearMessages();
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
        color: green;
        margin: 10px 0;
        text-align: center;
        padding: 10px;
        background-color: #efe;
        border: 1px solid #cfc;
        border-radius: 5px;
    `;
    successDiv.textContent = message;
    form.insertBefore(successDiv, form.querySelector('h2'));
}

function showWarning(message) {
    clearMessages();
    const warningDiv = document.createElement('div');
    warningDiv.className = 'warning-message';
    warningDiv.style.cssText = `
        color: orange;
        margin: 10px 0;
        text-align: center;
        padding: 10px;
        background-color: #ffeaa7;
        border: 1px solid #fdcb6e;
        border-radius: 5px;
    `;
    warningDiv.textContent = message;
    form.insertBefore(warningDiv, form.querySelector('h2'));
}

function showLoading(message) {
    clearMessages();
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-message';
    loadingDiv.style.cssText = `
        color: blue;
        margin: 10px 0;
        text-align: center;
        padding: 10px;
        background-color: #e3f2fd;
        border: 1px solid #2196f3;
        border-radius: 5px;
    `;
    loadingDiv.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center;">
            <div style="width: 20px; height: 20px; border: 2px solid #2196f3; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-left: 10px;"></div>
            ${message}
        </div>
    `;
    
    // إضافة CSS للأنيميشن
    if (!document.getElementById('loading-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-styles';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    form.insertBefore(loadingDiv, form.querySelector('h2'));
}

function clearMessages() {
    const messages = form.querySelectorAll('.error-message, .success-message, .warning-message, .loading-message');
    messages.forEach(msg => msg.remove());
}

// دالة للتحقق من تكرار الإيميل والتليفون في JSONBin
async function checkDuplicateUser(email, phone) {
    try {
        const response = await fetch(`${JSONBIN_CONFIG.BASE_URL}/b/${JSONBIN_CONFIG.BIN_ID}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            const existingData = Array.isArray(result.record) ? result.record : [];
            
            // البحث عن إيميل أو تليفون مكرر
            const duplicateEmail = existingData.find(user => user.email === email);
            const duplicatePhone = existingData.find(user => user.phone === phone);
            
            return {
                emailExists: !!duplicateEmail,
                phoneExists: !!duplicatePhone,
                duplicateEmail: duplicateEmail,
                duplicatePhone: duplicatePhone
            };
        }
        return {
            emailExists: false,
            phoneExists: false,
            duplicateEmail: null,
            duplicatePhone: null
        };
    } catch (error) {
        console.error('خطأ في التحقق من التكرار:', error);
        // في حالة الخطأ، نسمح بالمتابعة لتجنب منع التسجيل كلياً
        return {
            emailExists: false,
            phoneExists: false,
            duplicateEmail: null,
            duplicatePhone: null
        };
    }
}

// دالة للتحقق من وجود البيانات في JSONBin
async function checkUserInJSONBin(email) {
    try {
        const response = await fetch(`${JSONBIN_CONFIG.BASE_URL}/b/${JSONBIN_CONFIG.BIN_ID}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            const existingData = Array.isArray(result.record) ? result.record : [];
            return existingData.some(user => user.email === email);
        }
        return false;
    } catch (error) {
        console.error('خطأ في التحقق من JSONBin:', error);
        return false;
    }
}

// دالة للتحقق من صحة الحساب بشكل دوري
async function validateUserAccount() {
    const savedUser = localStorage.getItem('userData');
    if (!savedUser) return;

    const userData = JSON.parse(savedUser);
    const userExists = await checkUserInJSONBin(userData.email);
    
    if (!userExists) {
        // إذا لم توجد البيانات في JSONBin، امسح الحساب المحلي
        deleteLocalAccount();
        showAccountDeletedMessage();
    }
}

// دالة لمسح الحساب المحلي
function deleteLocalAccount() {
    // مسح البيانات من localStorage
    localStorage.removeItem('userData');
    
    // إخفاء قسم الترحيب وإظهار قسم التسجيل
    welcomeSection.style.display = 'none';
    registerSection.style.display = 'block';
    
    // إزالة عرض بيانات المستخدم
    const userDataDisplay = document.getElementById('userDataDisplay');
    if (userDataDisplay) {
        userDataDisplay.remove();
    }
    
    console.log('تم مسح الحساب المحلي');
}

// دالة لإظهار رسالة مسح الحساب
function showAccountDeletedMessage() {
    // إنشاء نافذة منبثقة لإشعار المستخدم
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 2px solid #ff4444;
        border-radius: 10px;
        padding: 30px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 400px;
        font-family: Arial, sans-serif;
    `;
    
    notification.innerHTML = `
        <div style="color: #ff4444; font-size: 48px; margin-bottom: 15px;">⚠️</div>
        <h2 style="color: #333; margin-bottom: 15px;">تم حذف حسابك</h2>
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            تم حذف بياناتك من النظام، لذلك تم مسح حسابك من هذا الجهاز أيضاً.
            يمكنك إنشاء حساب جديد إذا أردت.
        </p>
        <button id="closeNotification" style="
            background: #ff4444;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        ">فهمت</button>
    `;
    
    // إضافة overlay خلفي
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(notification);
    
    // إغلاق الإشعار
    document.getElementById('closeNotification').addEventListener('click', () => {
        document.body.removeChild(notification);
        document.body.removeChild(overlay);
    });
}

// دالة لعرض قسم الترحيب مع التحقق الدوري
function showWelcomeSection(name) {
    registerSection.style.display = "none";
    userNameElement.textContent = name;
    welcomeSection.style.display = 'flex';
    
    // بدء التحقق الدوري من وجود الحساب (كل 30 ثانية)
    const checkInterval = setInterval(async () => {
        await validateUserAccount();
        
        // إيقاف التحقق إذا لم يعد المستخدم مسجلاً
        if (!localStorage.getItem('userData')) {
            clearInterval(checkInterval);
        }
    }, 30000); // كل 30 ثانية
    
    // تحقق فوري عند عرض القسم
    setTimeout(() => validateUserAccount(), 2000);
}




// تشغيل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', updateUIBasedOnMan1);

// مراقبة التغييرات باستمرار
setInterval(updateUIBasedOnMan1, 500);

