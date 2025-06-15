// عند تحميل الصفحة، تحقق من وجود مستخدم مسجل بالفعل
document.addEventListener('DOMContentLoaded', function() {
    checkAndUpdateLoginStatus();
});

// دالة للتحقق من حالة تسجيل الدخول وتحديث الواجهة
function checkAndUpdateLoginStatus() {
    const userData = getStoredUserData();
    
    if (userData && userData.registered) {
        // إذا كان المستخدم مسجلاً، نحدث الواجهة
        showWelcomeSection(userData.name);
        displayUserData(userData);
        updateUIAfterSuccessfulRegistration();
        
        // إخفاء نموذج تسجيل الدخول إذا كان ظاهراً
        const overlay = document.getElementById("overlay");
        if (overlay) overlay.style.display = "none";
    } else {
        // إذا لم يكن مسجلاً، نظهر أزرار التسجيل
        const loginButtons = document.querySelectorAll('.login-button');
        loginButtons.forEach(btn => btn.style.display = 'block');
        
        const logoutButtons = document.querySelectorAll('.logout-button');
        logoutButtons.forEach(btn => btn.style.display = 'none');
    }
}

// دالة للحصول على بيانات المستخدم المخزنة
function getStoredUserData() {
    const savedUserData = localStorage.getItem("userData");
    if (!savedUserData) return null;
    
    try {
        const userData = JSON.parse(savedUserData);
        if (validateUserData(userData)) {
            return userData;
        }
        return null;
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
}

// دالة للتحقق من صحة بيانات المستخدم
function validateUserData(userData) {
    if (!userData) return false;
    
    const requiredFields = ['name', 'email', 'phone', 'registered'];
    for (const field of requiredFields) {
        if (!userData[field]) {
            return false;
        }
    }
    
    return true;
}

// دالة تسجيل الدخول المعدلة
function logineCallback(response) {
    const decoded = jwt_decode(response.credential);
    
    // إنشاء عناصر واجهة المستخدم لطلب رقم الهاتف
    const overlay = document.getElementById("overlay");
    const phoneForm = document.createElement("div");
    phoneForm.innerHTML = `
        <div class="login-start2">
            <div class="logine-img"><img src="login.png" alt="" style="width: 100%;"></div>
            <h3>الرجاء إدخال رقم الهاتف</h3>
            <input type="tel" id="userPhone" placeholder="رقم الهاتف" maxlength="11" inputmode="numeric">
            <button id="submitPhone">تسجيل</button>
            <div id="phoneError" class="error-message" style="display: none; color: red; margin-top: 10px; text-align: center;"></div>
            <h2> هذا الموقع يحمي بياناتك و تطبق عليه <span><a href="Privacy.html" target="_blank">السياسة و الخصوصية</a></span> الخاصة بكشمير هوم</h2>
        </div>
    `;
    
    overlay.innerHTML = "";
    overlay.appendChild(phoneForm);
    overlay.style.display = "flex";
    
    // التحقق من المدخلات أثناء الكتابة
    document.getElementById("userPhone").addEventListener("input", function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
        
        if (this.value.length > 0 && this.value[0] !== '0') {
            this.value = '0' + this.value.replace(/^0+/, '');
        }
        
        if (this.value.length > 11) {
            this.value = this.value.slice(0, 11);
        }
        
        const phoneError = document.getElementById("phoneError");
        if (phoneError) phoneError.style.display = "none";
    });
    
    // التعامل مع إرسال رقم الهاتف
    document.getElementById("submitPhone").addEventListener("click", function() {
        setTimeout(async () => {
            await handlePhoneSubmission(decoded);
        }, 10);
    });
}

// دالة معالجة إرسال رقم الهاتف المعدلة
async function handlePhoneSubmission(decoded) {
    const phoneInput = document.getElementById("userPhone");
    const phoneError = document.getElementById("phoneError");
    const submitButton = document.getElementById("submitPhone");
    const phoneNumber = phoneInput.value.trim();
    
    submitButton.disabled = true;
    submitButton.textContent = "جاري المعالجة...";
    
    try {
        phoneError.style.display = "none";
        
        if (!phoneNumber) {
            showPhoneError("الرجاء إدخال رقم الهاتف");
            return;
        }
        
        if (phoneNumber.length !== 11) {
            showPhoneError("يجب أن يتكون رقم الهاتف من 11 رقمًا");
            return;
        }
        
        if (phoneNumber[0] !== '0') {
            showPhoneError("يجب أن يبدأ رقم الهاتف بالرقم 0");
            return;
        }
        
        if (!/^01[0125][0-9]{8}$/.test(phoneNumber)) {
            showPhoneError("رقم الهاتف غير صالح");
            return;
        }
        
        showPhoneLoading("جاري التحقق من البيانات...");

        const duplicateCheck = await Promise.race([
            checkDuplicateUser(decoded.email, phoneNumber),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 15000)
            )
        ]);
        
        if (duplicateCheck.emailExists && duplicateCheck.phoneExists) {
            showPhoneError("هذا الإيميل ورقم الهاتف مستخدمان بالفعل");
            return;
        } else if (duplicateCheck.emailExists) {
            showPhoneError("هذا البريد الإلكتروني مستخدم بالفعل");
            return;
        } else if (duplicateCheck.phoneExists) {
            showPhoneError("رقم الهاتف هذا مستخدم بالفعل");
            return;
        }

        showPhoneLoading("جاري إرسال البيانات...");

        const userData = {
            name: decoded.given_name || "غير معروف",
            family: decoded.family_name || "",
            email: decoded.email || "",
            phone: phoneNumber,
            registered: true,
            copon1: "",
            copon2: "",
            sessionId: generateSessionId(),
            lastLogin: new Date().toISOString()
        };

        const registrationResult = await performRegistration(userData);
        
        if (registrationResult.success) {
            showPhoneSuccess(registrationResult.message);
            
            setTimeout(() => {
                try {
                    // حفظ البيانات في localStorage
                    localStorage.setItem("userData", JSON.stringify(userData));
                    
                    // تحديث الواجهة
                    showWelcomeSection(userData.name);
                    displayUserData(userData);
                    document.getElementById("overlay").style.display = "none";
                    updateUIAfterSuccessfulRegistration();
                    
                    // إرسال حدث لتحديث المكونات الأخرى
                    document.dispatchEvent(new Event('userLoggedIn'));
                } catch (error) {
                    console.error('Error in updating UI:', error);
                    document.getElementById("overlay").style.display = "none";
                }
            }, 2000);
        } else {
            showPhoneError(registrationResult.message);
        }

    } catch (error) {
        console.error('Error in registration:', error);
        showPhoneError("حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "تسجيل";
    }
}

// دالة إنشاء معرف جلسة عمل
function generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// دالة تسجيل الخروج
function handleLogout() {
    // مسح بيانات المستخدم
    localStorage.removeItem("userData");
    sessionStorage.removeItem("currentSession");
    
    // تحديث الواجهة
    const welcomeElements = document.querySelectorAll('.welcome-user');
    welcomeElements.forEach(el => el.style.display = 'none');
    
    const loginButtons = document.querySelectorAll('.login-button');
    loginButtons.forEach(btn => btn.style.display = 'block');
    
    const logoutButtons = document.querySelectorAll('.logout-button');
    logoutButtons.forEach(btn => btn.style.display = 'none');
    
    // إخفاء عناصر خاصة بالمستخدم المسجل
    const userOnlyElements = document.querySelectorAll('.user-only');
    userOnlyElements.forEach(el => el.style.display = 'none');
    
    // إرسال حدث لتحديث المكونات الأخرى
    document.dispatchEvent(new Event('userLoggedOut'));
    
    // إعادة تحميل الصفحة لتطبيق التغييرات
    window.location.reload();
}

// ربط دالة تسجيل الخروج بالأزرار
document.querySelectorAll('.logout-button').forEach(button => {
    button.addEventListener('click', handleLogout);
});

// دالة عرض رسالة ترحيبية
function showWelcomeSection(userName) {
    const welcomeElements = document.querySelectorAll('.welcome-user');
    welcomeElements.forEach(el => {
        el.textContent = `مرحباً ${userName}`;
        el.style.display = 'block';
    });
    
    const loginButtons = document.querySelectorAll('.login-button');
    loginButtons.forEach(btn => btn.style.display = 'none');
    
    const logoutButtons = document.querySelectorAll('.logout-button');
    logoutButtons.forEach(btn => btn.style.display = 'block');
    
    const userOnlyElements = document.querySelectorAll('.user-only');
    userOnlyElements.forEach(el => el.style.display = 'block');
}

// دالة تحديث واجهة المستخدم بعد التسجيل الناجح
function updateUIAfterSuccessfulRegistration() {
    // تمكين التمرير
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    
    // إخفاء رسائل "يجب التسجيل"
    const mustRegisterMessages = document.querySelectorAll('.must-register');
    mustRegisterMessages.forEach(msg => msg.style.display = 'none');
    
    // تمكين أزرار إضافة إلى السلة
    document.querySelectorAll('.btn_add_cart').forEach(button => {
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
        button.style.pointerEvents = 'auto';
    });
    
    // إظهار عناصر خاصة بالمستخدم المسجل
    const userOnlyElements = document.querySelectorAll('.user-only');
    userOnlyElements.forEach(el => el.style.display = 'block');
}

// باقي الدوال المساعدة (checkDuplicateUser, performRegistration, sendToGoogleSheets, sendToJSONBin)
// تبقى كما هي بدون تغيير
