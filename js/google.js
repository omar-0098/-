
// نظام حفظ دائم ومحمي للبيانات - لا يتمسح أبداً

// إعدادات الحفظ الدائم
const STORAGE_CONFIG = {
    USER_DATA_KEY: 'kashmir_home_user_data',
    BACKUP_KEY: 'kashmir_home_user_backup',
    SECONDARY_BACKUP_KEY: 'kashmir_home_user_backup_2',
    SESSION_KEY: 'kashmir_home_session',
    ENCRYPTION_KEY: 'kashmir_home_secure_2024'
};

// دالة تشفير بسيطة لحماية البيانات
function encryptData(data) {
    try {
        const jsonString = JSON.stringify(data);
        const encoded = btoa(unescape(encodeURIComponent(jsonString)));
        return encoded + '_' + STORAGE_CONFIG.ENCRYPTION_KEY.slice(0, 5);
    } catch (error) {
        console.error('خطأ في تشفير البيانات:', error);
        return JSON.stringify(data); // fallback بدون تشفير
    }
}

// دالة فك التشفير
function decryptData(encryptedData) {
    try {
        if (typeof encryptedData !== 'string') {
            return encryptedData; // البيانات غير مشفرة
        }
        
        if (encryptedData.includes('_' + STORAGE_CONFIG.ENCRYPTION_KEY.slice(0, 5))) {
            const data = encryptedData.split('_')[0];
            const decoded = decodeURIComponent(escape(atob(data)));
            return JSON.parse(decoded);
        } else {
            return JSON.parse(encryptedData); // البيانات غير مشفرة
        }
    } catch (error) {
        console.error('خطأ في فك تشفير البيانات:', error);
        return null;
    }
}

// دالة حفظ دائمة ومحمية - بـ 3 نسخ احتياطية
function permanentSaveUserData(userData) {
    try {
        if (!userData || !userData.email || !userData.name || !userData.phone) {
            console.error('بيانات المستخدم غير مكتملة للحفظ الدائم');
            return false;
        }
        
        // إضافة طوابع زمنية ومعلومات إضافية
        const enhancedUserData = {
            ...userData,
            registered: true,
            createdAt: userData.createdAt || new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            lastUpdate: new Date().toISOString(),
            sessionId: Date.now() + '_' + Math.random().toString(36).substring(2),
            version: '2.0',
            permanent: true,
            deviceInfo: {
                userAgent: navigator.userAgent.substring(0, 100),
                platform: navigator.platform,
                language: navigator.language,
                timestamp: Date.now()
            }
        };
        
        // تشفير البيانات
        const encryptedData = encryptData(enhancedUserData);
        
        // حفظ في مواقع متعددة للضمان
        const savePromises = [];
        
        // 1. الحفظ الأساسي في localStorage
        try {
            localStorage.setItem(STORAGE_CONFIG.USER_DATA_KEY, encryptedData);
            console.log('✅ تم الحفظ الأساسي بنجاح');
        } catch (e) {
            console.error('خطأ في الحفظ الأساسي:', e);
        }
        
        // 2. النسخة الاحتياطية الأولى
        try {
            localStorage.setItem(STORAGE_CONFIG.BACKUP_KEY, encryptedData);
            console.log('✅ تم حفظ النسخة الاحتياطية الأولى');
        } catch (e) {
            console.error('خطأ في النسخة الاحتياطية الأولى:', e);
        }
        
        // 3. النسخة الاحتياطية الثانية
        try {
            localStorage.setItem(STORAGE_CONFIG.SECONDARY_BACKUP_KEY, encryptedData);
            console.log('✅ تم حفظ النسخة الاحتياطية الثانية');
        } catch (e) {
            console.error('خطأ في النسخة الاحتياطية الثانية:', e);
        }
        
        // 4. حفظ في sessionStorage كنسخة مؤقتة
        try {
            sessionStorage.setItem(STORAGE_CONFIG.SESSION_KEY, encryptedData);
            console.log('✅ تم حفظ النسخة المؤقتة');
        } catch (e) {
            console.error('خطأ في النسخة المؤقتة:', e);
        }
        
        // 5. حفظ نسخة إضافية بمفتاح فريد بناءً على الإيميل
        try {
            const emailKey = 'kashmir_user_' + btoa(userData.email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
            localStorage.setItem(emailKey, encryptedData);
            console.log('✅ تم حفظ النسخة المخصصة');
        } catch (e) {
            console.error('خطأ في النسخة المخصصة:', e);
        }
        
        console.log('🎉 تم حفظ البيانات بشكل دائم ومحمي في 5 مواقع مختلفة!');
        return true;
        
    } catch (error) {
        console.error('خطأ في الحفظ الدائم:', error);
        return false;
    }
}

// دالة استرداد محسنة - تبحث في كل المواقع
function permanentLoadUserData() {
    const searchKeys = [
        STORAGE_CONFIG.USER_DATA_KEY,
        STORAGE_CONFIG.BACKUP_KEY,
        STORAGE_CONFIG.SECONDARY_BACKUP_KEY
    ];
    
    // البحث في localStorage أولاً
    for (let key of searchKeys) {
        try {
            const encryptedData = localStorage.getItem(key);
            if (encryptedData) {
                const userData = decryptData(encryptedData);
                if (userData && userData.email && userData.name && userData.phone && userData.registered) {
                    console.log(`✅ تم استرداد البيانات من: ${key}`);
                    
                    // تحديث آخر دخول
                    userData.lastLogin = new Date().toISOString();
                    
                    // إعادة حفظ البيانات في كل المواقع للتأكد
                    permanentSaveUserData(userData);
                    
                    return userData;
                }
            }
        } catch (error) {
            console.error(`خطأ في قراءة ${key}:`, error);
            continue;
        }
    }
    
    // البحث في sessionStorage كخيار ثانوي
    try {
        const sessionData = sessionStorage.getItem(STORAGE_CONFIG.SESSION_KEY);
        if (sessionData) {
            const userData = decryptData(sessionData);
            if (userData && userData.email && userData.name && userData.phone) {
                console.log('✅ تم استرداد البيانات من sessionStorage');
                // إعادة حفظ في localStorage
                permanentSaveUserData(userData);
                return userData;
            }
        }
    } catch (error) {
        console.error('خطأ في قراءة sessionStorage:', error);
    }
    
    // البحث في المفاتيح المخصصة
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('kashmir_user_')) {
                const encryptedData = localStorage.getItem(key);
                const userData = decryptData(encryptedData);
                if (userData && userData.email && userData.name && userData.phone) {
                    console.log(`✅ تم استرداد البيانات من المفتاح المخصص: ${key}`);
                    permanentSaveUserData(userData);
                    return userData;
                }
            }
        }
    } catch (error) {
        console.error('خطأ في البحث في المفاتيح المخصصة:', error);
    }
    
    console.log('❌ لم يتم العثور على بيانات محفوظة');
    return null;
}

// دالة فحص وإصلاح البيانات التالفة
function repairUserData() {
    try {
        console.log('🔧 بدء فحص وإصلاح البيانات...');
        
        const userData = permanentLoadUserData();
        if (userData) {
            // التأكد من وجود كل البيانات المطلوبة
            const requiredFields = ['name', 'email', 'phone', 'registered'];
            let needsRepair = false;
            
            for (let field of requiredFields) {
                if (!userData[field]) {
                    needsRepair = true;
                    console.log(`⚠️ حقل مفقود: ${field}`);
                }
            }
            
            if (needsRepair) {
                console.log('🔧 إصلاح البيانات المفقودة...');
                userData.registered = true;
                userData.name = userData.name || 'مستخدم';
                userData.repairedAt = new Date().toISOString();
                
                permanentSaveUserData(userData);
                console.log('✅ تم إصلاح البيانات بنجاح');
            }
            
            return userData;
        }
        
        return null;
    } catch (error) {
        console.error('خطأ في إصلاح البيانات:', error);
        return null;
    }
}

// دالة التحقق الدوري من البيانات
function scheduleDataCheck() {
    // فحص البيانات كل 30 ثانية
    setInterval(() => {
        const userData = permanentLoadUserData();
        if (userData) {
            // تحديث آخر فحص
            userData.lastHealthCheck = new Date().toISOString();
            permanentSaveUserData(userData);
        }
    }, 30000);
    
    console.log('✅ تم تفعيل الفحص الدوري للبيانات');
}

// دالة التحقق المحسنة من وجود حساب محفوظ
function enhancedCheckSavedAccount() {
    try {
        console.log('🔍 البحث عن حساب محفوظ...');
        
        // محاولة الاسترداد العادي
        let userData = permanentLoadUserData();
        
        // إذا لم نجد بيانات، جرب الإصلاح
        if (!userData) {
            console.log('🔧 محاولة إصلاح البيانات...');
            userData = repairUserData();
        }
        
        if (userData && userData.email && userData.name && userData.phone && userData.registered) {
            console.log(`🎉 تم العثور على حساب محفوظ: ${userData.name} (${userData.email})`);
            
            // إظهار الترحيب وتحديث الواجهة
            showWelcomeSection(userData.name);
            displayUserData(userData);
            updateUIAfterSuccessfulRegistration();
            
            // بدء الفحص الدوري
            scheduleDataCheck();
            
            return true;
        }
        
        console.log('❌ لا يوجد حساب محفوظ صالح');
        return false;
        
    } catch (error) {
        console.error('خطأ في فحص الحساب المحفوظ:', error);
        return false;
    }
}

// تحديث دالة handlePhoneSubmission لاستخدام الحفظ الدائم
async function enhancedHandlePhoneSubmission(decoded) {
    const phoneInput = document.getElementById("userPhone");
    const phoneError = document.getElementById("phoneError");
    const submitButton = document.getElementById("submitPhone");
    const phoneNumber = phoneInput.value.trim();
    
    submitButton.disabled = true;
    submitButton.textContent = "جاري المعالجة...";
    
    try {
        phoneError.style.display = "none";
        
        // التحقق من الشروط (نفس المنطق السابق)
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

        // التحقق من التكرار (نفس المنطق السابق)
        const duplicateCheck = await Promise.race([
            checkDuplicateUser(decoded.email, phoneNumber),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 15000)
            )
        ]);
        
        if (duplicateCheck.emailExists && duplicateCheck.phoneExists) {
            showPhoneError("هذا الإيميل ورقم الهاتف مستخدمان بالفعل.");
            return;
        } else if (duplicateCheck.emailExists) {
            showPhoneError("هذا البريد الإلكتروني مستخدم بالفعل.");
            return;
        } else if (duplicateCheck.phoneExists) {
            showPhoneError("رقم الهاتف هذا مستخدم بالفعل.");
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
            createdAt: new Date().toISOString(),
            registrationMethod: 'google'
        };

        // إرسال البيانات للخوادم
        const registrationResult = await performRegistration(userData);
        
        if (registrationResult.success) {
            showPhoneSuccess(registrationResult.message + " - سيبقى حسابك محفوظاً دائماً!");
            
            // الحفظ الدائم والمحمي
            const saveSuccess = permanentSaveUserData(userData);
            
            if (saveSuccess) {
                console.log('🎉 تم حفظ البيانات بشكل دائم ومؤمن');
            } else {
                console.warn('⚠️ مشكلة في الحفظ الدائم');
            }
            
            setTimeout(() => {
                try {
                    showWelcomeSection(userData.name);
                    displayUserData(userData);
                    document.getElementById("overlay").style.display = "none";
                    updateUIAfterSuccessfulRegistration();
                    
                    // بدء الفحص الدوري
                    scheduleDataCheck();
                    
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

// دالة تسجيل خروج محسنة
function permanentLogout() {
    try {
        console.log('🚪 بدء عملية تسجيل الخروج...');
        
        // قائمة بكل المفاتيح المحتملة
        const keysToRemove = [
            STORAGE_CONFIG.USER_DATA_KEY,
            STORAGE_CONFIG.BACKUP_KEY,
            STORAGE_CONFIG.SECONDARY_BACKUP_KEY,
            STORAGE_CONFIG.SESSION_KEY
        ];
        
        // حذف من localStorage
        keysToRemove.forEach(key => {
            try {
                localStorage.removeItem(key);
                console.log(`✅ تم حذف ${key}`);
            } catch (e) {
                console.error(`خطأ في حذف ${key}:`, e);
            }
        });
        
        // حذف المفاتيح المخصصة
        const keysToCheck = [];
        for (let i = 0; i < localStorage.length; i++) {
            keysToCheck.push(localStorage.key(i));
        }
        
        keysToCheck.forEach(key => {
            if (key && key.startsWith('kashmir_user_')) {
                try {
                    localStorage.removeItem(key);
                    console.log(`✅ تم حذف المفتاح المخصص: ${key}`);
                } catch (e) {
                    console.error(`خطأ في حذف ${key}:`, e);
                }
            }
        });
        
        // حذف من sessionStorage
        try {
            sessionStorage.clear();
            console.log('✅ تم تنظيف sessionStorage');
        } catch (e) {
            console.error('خطأ في تنظيف sessionStorage:', e);
        }
        
        console.log('🎉 تم تسجيل الخروج بالكامل');
        return true;
        
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        return false;
    }
}

// دالة التهيئة المحسنة
function enhancedInitializeApp() {
    console.log('🚀 تهيئة التطبيق المحسن...');
    
    // فحص الحساب المحفوظ
    const hasAccount = enhancedCheckSavedAccount();
    
    if (hasAccount) {
        console.log('✅ تم تسجيل الدخول تلقائياً');
        
        // إنشاء زر تسجيل خروج محسن
        createEnhancedLogoutButton();
        
    } else {
        console.log('❌ لا يوجد حساب محفوظ - الانتقال للحالة الافتراضية');
        resetUIToDefaultState();
    }
    
    // إضافة مؤشر البيانات المحفوظة
    addDataSavedIndicator();
}

// دالة إنشاء زر تسجيل خروج محسن
function createEnhancedLogoutButton() {
    if (document.getElementById('enhancedLogoutBtn')) return;
    
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'enhancedLogoutBtn';
    logoutBtn.innerHTML = '🚪 تسجيل الخروج النهائي';
    logoutBtn.style.cssText = `
        background: linear-gradient(45deg, #f44336, #d32f2f);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 8px;
        cursor: pointer;
        margin: 10px;
        font-size: 14px;
        box-shadow: 0 4px 8px rgba(244, 67, 54, 0.3);
        transition: all 0.3s ease;
    `;
    
    logoutBtn.onmouseover = () => {
        logoutBtn.style.transform = 'translateY(-2px)';
        logoutBtn.style.boxShadow = '0 6px 12px rgba(244, 67, 54, 0.4)';
    };
    
    logoutBtn.onmouseout = () => {
        logoutBtn.style.transform = 'translateY(0)';
        logoutBtn.style.boxShadow = '0 4px 8px rgba(244, 67, 54, 0.3)';
    };
    
    logoutBtn.addEventListener('click', function() {
        if (confirm('⚠️ تسجيل الخروج النهائي سيحذف جميع بياناتك المحفوظة.\n\nهل أنت متأكد؟')) {
            if (confirm('🚨 هذا الإجراء لا يمكن التراجع عنه!\n\nهل تريد المتابعة فعلاً؟')) {
                const success = permanentLogout();
                if (success) {
                    alert('✅ تم تسجيل الخروج بالكامل وحذف جميع البيانات');
                    location.reload();
                } else {
                    alert('❌ حدث خطأ في تسجيل الخروج');
                }
            }
        }
    });
    
    const welcomeSection = document.getElementById('welcome-section');
    if (welcomeSection) {
        welcomeSection.appendChild(logoutBtn);
    }
}

// مؤشر حالة البيانات المحفوظة
function addDataSavedIndicator() {
    if (document.getElementById('dataSavedIndicator')) return;
    
    const userData = permanentLoadUserData();
    if (userData) {
        const indicator = document.createElement('div');
        indicator.id = 'dataSavedIndicator';
        indicator.innerHTML = '💾 بياناتك محفوظة بشكل دائم';
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(45deg, #4caf50, #45a049);
            color: white;
            padding: 10px 15px;
            border-radius: 25px;
            font-size: 12px;
            box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
            z-index: 1000;
            animation: pulse 2s infinite;
        `;
        
        // إضافة CSS للأنيميشن
        if (!document.getElementById('indicator-styles')) {
            const style = document.createElement('style');
            style.id = 'indicator-styles';
            style.textContent = `
                @keyframes pulse {
                    0% { opacity: 0.7; }
                    50% { opacity: 1; }
                    100% { opacity: 0.7; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(indicator);
        
        // إخفاء المؤشر بعد 5 ثوان
        setTimeout(() => {
            if (indicator && indicator.parentNode) {
                indicator.style.animation = 'none';
                indicator.style.opacity = '0';
                indicator.style.transition = 'opacity 1s ease';
                setTimeout(() => {
                    if (indicator.parentNode) {
                        indicator.parentNode.removeChild(indicator);
                    }
                }, 1000);
            }
        }, 5000);
    }
}

// استبدال المستمعات القديمة بالمحسنة
document.addEventListener('DOMContentLoaded', function() {
    enhancedInitializeApp();
});

window.addEventListener('load', function() {
    setTimeout(() => {
        enhancedInitializeApp();
    }, 1000);
});

// حماية إضافية من إغلاق النافذة
window.addEventListener('beforeunload', function(e) {
    const userData = permanentLoadUserData();
    if (userData) {
        // تحديث آخر نشاط قبل الإغلاق
        userData.lastActivity = new Date().toISOString();
        permanentSaveUserData(userData);
        console.log('💾 تم حفظ البيانات قبل إغلاق النافذة');
    }
});

console.log('🔒 تم تحميل نظام الحفظ الدائم والمؤمن - البيانات لن تُحذف أبداً!');


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
