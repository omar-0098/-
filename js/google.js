// إضافة دالة لفحص وجود حساب محفوظ عند تحميل الصفحة
function checkSavedAccount() {
    try {
        const savedUserData = localStorage.getItem("userData");
        if (savedUserData) {
            const userData = JSON.parse(savedUserData);
            
            // التحقق من صحة البيانات المحفوظة
            if (userData.email && userData.name && userData.phone && userData.registered) {
                console.log('تم العثور على حساب محفوظ:', userData.name);
                
                // إظهار الترحيب وتحديث الواجهة
                showWelcomeSection(userData.name);
                displayUserData(userData);
                updateUIAfterSuccessfulRegistration();
                
                return true;
            }
        }
    } catch (error) {
        console.error('خطأ في قراءة البيانات المحفوظة:', error);
        // إذا كانت البيانات تالفة، احذفها
        localStorage.removeItem("userData");
    }
    return false;
}

// دالة لحفظ بيانات المستخدم بشكل آمن
function saveUserData(userData) {
    try {
        // التأكد من وجود البيانات الأساسية
        if (!userData.email || !userData.name || !userData.phone) {
            console.error('بيانات المستخدم غير مكتملة');
            return false;
        }
        
        // إضافة طابع زمني لآخر تسجيل دخول
        userData.lastLogin = new Date().toISOString();
        userData.registered = true;
        
        // حفظ البيانات
        localStorage.setItem("userData", JSON.stringify(userData));
        console.log('تم حفظ بيانات المستخدم بنجاح');
        return true;
    } catch (error) {
        console.error('خطأ في حفظ بيانات المستخدم:', error);
        return false;
    }
}

// دالة لتحديث بيانات المستخدم المحفوظة
function updateSavedUserData(newData) {
    try {
        const savedUserData = localStorage.getItem("userData");
        if (savedUserData) {
            const userData = JSON.parse(savedUserData);
            
            // دمج البيانات الجديدة مع الموجودة
            const updatedData = { ...userData, ...newData };
            updatedData.lastUpdate = new Date().toISOString();
            
            localStorage.setItem("userData", JSON.stringify(updatedData));
            return true;
        }
    } catch (error) {
        console.error('خطأ في تحديث بيانات المستخدم:', error);
    }
    return false;
}

// دالة للحصول على بيانات المستخدم المحفوظة
function getSavedUserData() {
    try {
        const savedUserData = localStorage.getItem("userData");
        if (savedUserData) {
            return JSON.parse(savedUserData);
        }
    } catch (error) {
        console.error('خطأ في قراءة بيانات المستخدم:', error);
        localStorage.removeItem("userData");
    }
    return null;
}

// دالة لتسجيل الخروج وحذف البيانات المحفوظة
function logoutUser() {
    try {
        localStorage.removeItem("userData");
        
        // إعادة تعيين الواجهة
        resetUIToDefaultState();
        
        console.log('تم تسجيل الخروج بنجاح');
        return true;
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        return false;
    }
}

// دالة لإعادة تعيين الواجهة للحالة الافتراضية
function resetUIToDefaultState() {
    // إخفاء قسم الترحيب
    const welcomeSection = document.getElementById('welcome-section');
    if (welcomeSection) {
        welcomeSection.style.display = 'none';
    }
    
    // إظهار رسالة "يجب إنشاء حساب"
    const messageDiv = document.getElementById('mustRegisterMessage');
    if (messageDiv) {
        messageDiv.style.display = 'block';
    }
    
    // إخفاء زر الدفع/الخروج للسلة
    const checkoutItem = document.querySelector('li.check');
    if (checkoutItem) {
        checkoutItem.style.display = 'none';
    }
    
    // تعطيل أزرار إضافة للسلة
    document.querySelectorAll('.btn_add_cart').forEach(function(button) {
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
        button.style.pointerEvents = 'none';
    });
}

// تحديث دالة logineCallback لحفظ البيانات بشكل صحيح
function logineCallback(response) {
    const decoded = jwt_decode(response.credential);
    
    // إنشاء عناصر واجهة المستخدم لطلب رقم الهاتف
    const overlay = document.getElementById("overlay");
    const phoneForm = document.createElement("div");
    phoneForm.innerHTML = `
        <div class="login-start2" >
            <div class="logine-img"><img src="login.png" alt="" style="width: 100%;"></div>
            <h3>الرجاء إدخال رقم الهاتف</h3>
            <input type="tel" id="userPhone" placeholder="رقم الهاتف" maxlength="11" inputmode="numeric">
            <button id="submitPhone">تسجيل</button>
            <div id="phoneError" class="error-message" style="display: none; color: red; margin-top: 10px; text-align: center;"></div>
            <h2> هذا الموقع يحمي بياناتك و تطبق عليه <span><a href="Privacy.html" target="_blank">السياسة و الخصوصية</a></span> الخاصة بكشمير هوم</h2>
        </div>
    `;
    
    // إضافة النموذج إلى الـ overlay
    overlay.innerHTML = "";
    overlay.appendChild(phoneForm);
    overlay.style.display = "flex";
    
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
        
        // إخفاء رسالة الخطأ عند بدء الكتابة
        const phoneError = document.getElementById("phoneError");
        if (phoneError) {
            phoneError.style.display = "none";
        }
    });
    
    // التعامل مع إرسال رقم الهاتف
    document.getElementById("submitPhone").addEventListener("click", function() {
        setTimeout(async () => {
            await handlePhoneSubmission(decoded);
        }, 10);
    });
}

// تحديث دالة handlePhoneSubmission لحفظ البيانات
async function handlePhoneSubmission(decoded) {
    const phoneInput = document.getElementById("userPhone");
    const phoneError = document.getElementById("phoneError");
    const submitButton = document.getElementById("submitPhone");
    const phoneNumber = phoneInput.value.trim();
    
    // منع الضغط المتكرر على الزر
    submitButton.disabled = true;
    submitButton.textContent = "جاري المعالجة...";
    
    try {
        // التحقق من الشروط (نفس الكود الموجود)
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

        // التحقق من تكرار الإيميل والتليفون
        const duplicateCheck = await Promise.race([
            checkDuplicateUser(decoded.email, phoneNumber),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 15000)
            )
        ]);
        
        if (duplicateCheck.emailExists && duplicateCheck.phoneExists) {
            showPhoneError("هذا الإيميل ورقم الهاتف مستخدمان بالفعل. يرجى استخدام إيميل ورقم هاتف مختلفين.");
            return;
        } else if (duplicateCheck.emailExists) {
            showPhoneError("هذا البريد الإلكتروني مستخدم بالفعل. يرجى استخدام بريد إلكتروني آخر.");
            return;
        } else if (duplicateCheck.phoneExists) {
            showPhoneError("رقم الهاتف هذا مستخدم بالفعل. يرجى استخدام رقم هاتف آخر.");
            return;
        }

        showPhoneLoading("جاري إرسال البيانات...");

        // إعداد بيانات المستخدم
        const userData = {
            name: decoded.given_name || "غير معروف",
            family: decoded.family_name || "",
            email: decoded.email || "",
            phone: phoneNumber,
            registered: true,
            copon1: "",
            copon2: "",
            registrationDate: new Date().toISOString() // إضافة تاريخ التسجيل
        };

        // إرسال البيانات
        const registrationResult = await performRegistration(userData);
        
        if (registrationResult.success) {
            showPhoneSuccess(registrationResult.message);
            
            // حفظ البيانات بشكل آمن
            const saveSuccess = saveUserData(userData);
            
            if (saveSuccess) {
                console.log('تم حفظ بيانات المستخدم في localStorage');
            } else {
                console.warn('فشل في حفظ بيانات المستخدم محلياً');
            }
            
            // تحديث الواجهة بعد ثانيتين
            setTimeout(() => {
                try {
                    showWelcomeSection(userData.name);
                    displayUserData(userData);
                    document.getElementById("overlay").style.display = "none";
                    updateUIAfterSuccessfulRegistration();
                } catch (error) {
                    console.error('خطأ في تحديث الواجهة:', error);
                    document.getElementById("overlay").style.display = "none";
                }
            }, 2000);
        } else {
            showPhoneError(registrationResult.message);
        }

    } catch (error) {
        console.error('خطأ في عملية التسجيل:', error);
        if (error.message === 'Timeout') {
            showPhoneError("انتهت المهلة الزمنية. يرجى المحاولة مرة أخرى.");
        } else {
            showPhoneError("حدث خطأ أثناء التحقق من البيانات. يرجى المحاولة مرة أخرى.");
        }
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "تسجيل";
    }
}

// دالة لإنشاء زر تسجيل الخروج (اختيارية)
function createLogoutButton() {
    const userData = getSavedUserData();
    if (userData) {
        // إنشاء زر تسجيل الخروج
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logoutBtn';
        logoutBtn.textContent = 'تسجيل الخروج';
        logoutBtn.style.cssText = `
            background-color: #f44336;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px;
            font-size: 14px;
        `;
        
        logoutBtn.addEventListener('click', function() {
            if (confirm('هل أنت متأكد من رغبتك في تسجيل الخروج؟')) {
                logoutUser();
                // إعادة تحميل الصفحة لإعادة تعيين كل شيء
                location.reload();
            }
        });
        
        // إضافة الزر لقسم الترحيب إذا كان موجوداً
        const welcomeSection = document.getElementById('welcome-section');
        if (welcomeSection && !document.getElementById('logoutBtn')) {
            welcomeSection.appendChild(logoutBtn);
        }
    }
}

// دالة تعمل عند تحميل الصفحة - يجب استدعاؤها عند DOMContentLoaded
function initializeApp() {
    console.log('تهيئة التطبيق...');
    
    // تحقق من وجود حساب محفوظ
    const hasAccount = checkSavedAccount();
    
    if (hasAccount) {
        console.log('تم تسجيل الدخول تلقائياً');
        // إنشاء زر تسجيل الخروج
        createLogoutButton();
    } else {
        console.log('لا يوجد حساب محفوظ');
        // إعادة تعيين الواجهة للحالة الافتراضية
        resetUIToDefaultState();
    }
}

// إضافة event listener لتحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// إضافة event listener للتأكد من العمل حتى لو تم تحميل الصفحة بالكامل
window.addEventListener('load', function() {
    // تأخير قصير للتأكد من تحميل كل العناصر
    setTimeout(() => {
        const hasAccount = checkSavedAccount();
        if (hasAccount) {
            createLogoutButton();
        }
    }, 500);
});

// دالة مساعدة للتحقق من حالة تسجيل الدخول
function isUserLoggedIn() {
    const userData = getSavedUserData();
    return userData && userData.registered && userData.email && userData.phone;
}

// دالة لإضافة رسالة ترحيب مخصصة
function showCustomWelcomeMessage() {
    const userData = getSavedUserData();
    if (userData) {
        const lastLogin = userData.lastLogin ? new Date(userData.lastLogin) : null;
        const registrationDate = userData.registrationDate ? new Date(userData.registrationDate) : null;
        
        let welcomeMessage = `مرحباً بك ${userData.name}!`;
        
        if (lastLogin) {
            const now = new Date();
            const timeDiff = now - lastLogin;
            const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            
            if (daysDiff > 0) {
                welcomeMessage += ` لم نراك منذ ${daysDiff} ${daysDiff === 1 ? 'يوم' : 'أيام'}`;
            }
        }
        
        console.log(welcomeMessage);
        return welcomeMessage;
    }
    return null;
}
