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

// متغير لحفظ موضع التمرير الحالي
let scrollPosition = 0;

// ===============================
// دالة تسجيل الدخول عبر Google
// ===============================
function logineCallback(response) {
    const decoded = jwt_decode(response.credential);
    
    // إنشاء عناصر واجهة المستخدم لطلب رقم الهاتف
    const phoneForm = document.createElement("div");
    phoneForm.innerHTML = `
        <div class="login-start2">
            <div class="logine-img"><img src="login.png" alt="" style="width: 100%;"></div>
            <h3>الرجاء إدخال رقم الهاتف</h3>
            <input type="tel" id="userPhone" placeholder="رقم الهاتف" maxlength="11" inputmode="numeric">
            <div id="phoneError" style="color: red; margin: 10px 0; text-align: center;"></div>
            <button id="submitPhone">تسجيل</button>
            <h2>هذا الموقع يحمي بياناتك وتطبق عليه <span><a href="Privacy.html" target="_blank">السياسة والخصوصية</a></span> الخاصة بكشمير هوم</h2>
        </div>
    `;
    
    // إضافة النموذج إلى الـ overlay
    overlay.innerHTML = "";
    overlay.appendChild(phoneForm);
    overlay.style.display = "flex";
    
    // منع التمرير في الخلفية
    scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.width = '100%';
    
    // التحقق من المدخلات أثناء الكتابة
    document.getElementById("userPhone").addEventListener("input", function(e) {
        // السماح بالأرقام فقط
        this.value = this.value.replace(/[^0-9]/g, '');
        
        // التحقق من أن الرقم يبدأ بصفر
        if (this.value.length > 0 && this.value[0] !== '0') {
            this.value = '0' + this.value.replace(/^0+/, '');
        }
        
        // تحديد الطول الأقصى
        if (this.value.length > 11) {
            this.value = this.value.slice(0, 11);
        }
        
        // مسح رسالة الخطأ عند الكتابة
        document.getElementById("phoneError").textContent = "";
    });
    
    // التعامل مع إرسال رقم الهاتف
    document.getElementById("submitPhone").addEventListener("click", async function() {
        const phoneInput = document.getElementById("userPhone");
        const phoneError = document.getElementById("phoneError");
        const phoneNumber = phoneInput.value.trim();
        
        // إعادة تعيين رسالة الخطأ
        phoneError.textContent = "";
        
        // التحقق من الشروط
        if (!phoneNumber) {
            phoneError.textContent = "الرجاء إدخال رقم الهاتف";
            return;
        }
        
        if (phoneNumber.length !== 11) {
            phoneError.textContent = "يجب أن يتكون رقم الهاتف من 11 رقمًا";
            return;
        }
        
        if (phoneNumber[0] !== '0') {
            phoneError.textContent = "يجب أن يبدأ رقم الهاتف بالرقم 0";
            return;
        }
        
        if (!/^01[0125][0-9]{8}$/.test(phoneNumber)) {
            phoneError.textContent = "رقم الهاتف غير صالح (يجب أن يبدأ بـ 010, 011, 012, أو 015)";
            return;
        }
        
        // إظهار رسالة التحقق من التكرار
        showGoogleLoginLoading("جاري التحقق من البيانات...");
        
        try {
            // التحقق من تكرار الإيميل والتليفون
            const duplicateCheck = await checkDuplicateUser(decoded.email, phoneNumber);
            
            clearGoogleLoginMessages();
            
            if (duplicateCheck.emailExists && duplicateCheck.phoneExists) {
                showGoogleLoginError("هذا الإيميل ورقم الهاتف مستخدمان بالفعل. يرجى استخدام حساب Google آخر ورقم هاتف مختلف.");
                return;
            } else if (duplicateCheck.emailExists) {
                showGoogleLoginError("هذا البريد الإلكتروني مستخدم بالفعل. يرجى استخدام حساب Google آخر.");
                return;
            } else if (duplicateCheck.phoneExists) {
                showGoogleLoginError("رقم الهاتف هذا مستخدم بالفعل. يرجى استخدام رقم هاتف آخر.");
                return;
            }
            
            // إظهار رسالة الإرسال
            showGoogleLoginLoading("جاري تسجيل الدخول...");
            
            // إعداد بيانات المستخدم مع رقم الهاتف
            const userData = {
                name: decoded.given_name || "غير معروف",
                family: decoded.family_name || "",
                email: decoded.email || "",
                phone: phoneNumber,
                registered: true,
                copon1: "",
                copon2: ""
            };

            const formData = new FormData();
            formData.append("name", userData.name);
            formData.append("family", userData.family);
            formData.append("email", userData.email);
            formData.append("phone", userData.phone);
            formData.append("password", "google_login");
            formData.append("copon1", "");
            formData.append("copon2", "");

            let googleSheetsSuccess = false;
            let jsonBinSuccess = false;

            try {
                // إرسال إلى Google Sheets
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
            clearGoogleLoginMessages();
            
            if (googleSheetsSuccess && jsonBinSuccess) {
                showGoogleLoginSuccess("تم تسجيل الدخول بنجاح!");
            } else if (googleSheetsSuccess || jsonBinSuccess) {
                const platforms = [];
                if (googleSheetsSuccess) platforms.push("Google Sheets");
                if (jsonBinSuccess) platforms.push("JSONBin");
                showGoogleLoginWarning(`تم التسجيل بنجاح في: ${platforms.join(', ')}`);
            } else {
                showGoogleLoginError("فشل في تسجيل الدخول. يرجى المحاولة مرة أخرى.");
                return;
            }

            // إخفاء النافذة وإظهار الترحيب بعد ثانيتين
            setTimeout(() => {
                localStorage.setItem("userData", JSON.stringify(userData));
                showWelcomeSection(userData.name);
                displayUserData(userData);
                overlay.style.display = "none";
                
                // استعادة التمرير
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                window.scrollTo(0, scrollPosition);
                
            }, 2000);

        } catch (error) {
            console.error('خطأ في عملية تسجيل الدخول عبر Google:', error);
            clearGoogleLoginMessages();
            showGoogleLoginError("حدث خطأ أثناء التحقق من البيانات. يرجى المحاولة مرة أخرى.");
        }
    });
}

// دوال الرسائل لتسجيل الدخول عبر Google
function showGoogleLoginError(message) {
    clearGoogleLoginMessages();
    const errorDiv = document.createElement('div');
    errorDiv.className = 'google-error-message';
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
    document.querySelector('.login-start2').insertBefore(errorDiv, document.querySelector('#submitPhone'));
}

function showGoogleLoginSuccess(message) {
    clearGoogleLoginMessages();
    const successDiv = document.createElement('div');
    successDiv.className = 'google-success-message';
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
    document.querySelector('.login-start2').insertBefore(successDiv, document.querySelector('#submitPhone'));
}

function showGoogleLoginWarning(message) {
    clearGoogleLoginMessages();
    const warningDiv = document.createElement('div');
    warningDiv.className = 'google-warning-message';
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
    document.querySelector('.login-start2').insertBefore(warningDiv, document.querySelector('#submitPhone'));
}

function showGoogleLoginLoading(message) {
    clearGoogleLoginMessages();
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'google-loading-message';
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
    
    // إضافة CSS للأنيميشن إذا لم يكن موجوداً
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
    
    document.querySelector('.login-start2').insertBefore(loadingDiv, document.querySelector('#submitPhone'));
}

function clearGoogleLoginMessages() {
    const messages = document.querySelectorAll('.google-error-message, .google-success-message, .google-warning-message, .google-loading-message');
    messages.forEach(msg => msg.remove());
}

// ===============================
// باقي الكود الأساسي
// ===============================

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
    
    // تحديث الواجهة حسب حالة المستخدم
    updateUIBasedOnMan1();
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

// عند إرسال النموذج (التسجيل العادي)
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
        showLoading("جاري إرسال البيانات...");

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
            overlay.style.display =
