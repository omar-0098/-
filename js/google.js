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

// تحسين دالة التحقق من التكرار
async function checkDuplicateUser(email, phone) {
    const JSONBIN_CONFIG = {
        API_KEY: "$2a$10$xAWjC3zelpDKCd6zdOdUg.D0bwtEURjcR5sEiYdonjBmP5lHuqzq2",
        BIN_ID: "6848177e8960c979a5a77f85",
        BASE_URL: "https://api.jsonbin.io/v3"
    };

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`${JSONBIN_CONFIG.BASE_URL}/b/${JSONBIN_CONFIG.BIN_ID}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.API_KEY,
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

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
        if (error.name === 'AbortError') {
            console.error('انتهت المهلة الزمنية للتحقق من التكرار');
        } else {
            console.error('خطأ في التحقق من التكرار:', error);
        }
        // في حالة الخطأ، نسمح بالمتابعة لتجنب منع التسجيل كلياً
        return {
            emailExists: false,
            phoneExists: false,
            duplicateEmail: null,
            duplicatePhone: null
        };
    }
}

// دالة جديدة لتحديث الواجهة بعد التسجيل الناجح - مع معالجة الأخطاء
// دالة محدثة لتحديث الواجهة بعد التسجيل الناجح
function updateUIAfterSuccessfulRegistration() {
    // إعادة تفعيل التمرير العادي للصفحة
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    
    // إزالة أي قيود على التمرير من الـ overlay أو النوافذ المنبثقة
    const overlay = document.getElementById("overlay");
    if (overlay) {
        overlay.style.overflow = 'auto';
    }
    
    // إخفاء رسالة "يجب إنشاء حساب"
    const messageDiv = document.getElementById('mustRegisterMessage');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
    
    // إظهار زر الدفع/الخروج للسلة
    const checkoutItem = document.querySelector('li.check');
    if (checkoutItem) {
        checkoutItem.style.display = 'list-item';
    }
    
    // تفعيل أزرار إضافة للسلة
    document.querySelectorAll('.btn_add_cart').forEach(function(button) {
        // إعادة تفعيل الزر
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
        button.style.pointerEvents = 'auto';
        
        // إزالة معالج الأحداث المعطل والعودة للوظيفة العادية
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // إعادة تفعيل الوظيفة الأصلية للزر (إذا كانت موجودة)
        // يمكنك إضافة معالج الأحداث الأصلي هنا حسب كودك
    });
    
    // تحديث أي عناصر أخرى متعلقة بحالة تسجيل الدخول
    const man1 = document.querySelector('.man1');
    if (man1) {
        // إظهار عنصر man1 إذا كان مخفياً
        man1.style.display = 'block';
    }
    
    // التأكد من أن الصفحة قابلة للتمرير بشكل طبيعي
    // إزالة أي فئات CSS قد تمنع التمرير
    document.body.classList.remove('no-scroll', 'modal-open', 'overlay-open');
    
    // إعادة تعيين أي inline styles قد تؤثر على التمرير
    document.body.removeAttribute('style');
    
    console.log('تم تحديث واجهة المستخدم بعد التسجيل الناجح مع تفعيل التمرير');
}

// دوال المساعدة لرسائل رقم الهاتف - بدون تغيير
function showPhoneError(message) {
    const phoneError = document.getElementById("phoneError");
    if (phoneError) {
        phoneError.textContent = message;
        phoneError.style.cssText = `
            display: block;
            color: red;
            margin: 10px 0;
            text-align: center;
            padding: 10px;
            background-color: #fee;
            border: 1px solid #fcc;
            border-radius: 5px;
        `;
    }
}

function showPhoneSuccess(message) {
    const phoneError = document.getElementById("phoneError");
    if (phoneError) {
        phoneError.textContent = message;
        phoneError.style.cssText = `
            display: block;
            color: green;
            margin: 10px 0;
            text-align: center;
            padding: 10px;
            background-color: #efe;
            border: 1px solid #cfc;
            border-radius: 5px;
        `;
    }
}

function showPhoneWarning(message) {
    const phoneError = document.getElementById("phoneError");
    if (phoneError) {
        phoneError.textContent = message;
        phoneError.style.cssText = `
            display: block;
            color: orange;
            margin: 10px 0;
            text-align: center;
            padding: 10px;
            background-color: #ffeaa7;
            border: 1px solid #fdcb6e;
            border-radius: 5px;
        `;
    }
}

function showPhoneLoading(message) {
    const phoneError = document.getElementById("phoneError");
    if (phoneError) {
        phoneError.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center;">
                <div style="width: 20px; height: 20px; border: 2px solid #2196f3; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-left: 10px;"></div>
                ${message}
            </div>
        `;
        phoneError.style.cssText = `
            display: block;
            color: blue;
            margin: 10px 0;
            text-align: center;
            padding: 10px;
            background-color: #e3f2fd;
            border: 1px solid #2196f3;
            border-radius: 5px;
        `;
        
        // إضافة CSS للأنيميشن إذا لم يكن موجوداً
        if (!document.getElementById('phone-loading-styles')) {
            const style = document.createElement('style');
            style.id = 'phone-loading-styles';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }
}
