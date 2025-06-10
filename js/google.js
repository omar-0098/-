// إعدادات API - ضع مفاتيحك الحقيقية هنا
const CONFIG = {
    JSONBIN_API_KEY: '$2a$10$xAWjC3zelpDKCd6zdOdUg.D0bwtEURjcR5sEiYdonjBmP5lHuqzq2', // 👈 ضع مفتاح JSONBin.io هنا
    JSONBIN_COLLECTION_ID: '6848177e8960c979a5a77f85', // اختياري - يمكن تركه فارغ
    GOOGLE_SHEETS_URL: 'https://script.google.com/macros/s/AKfycbzDPcLwO1U091L_W1Ha-M-_GjL5z6V7aFh6RxTberNq8tsYLIkkI1BtdF5ufA8qpSmvag/exec'
};

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
            <div id="phoneError" style="color: red; margin-top: 10px; font-size: 14px;"></div>
            <h2> هذا الموقع يحمي بياناتك و تطبق عليه <span><a href="Privacy.html" target="_blank">سياسة الخصوصية</a></span> الخاصة بكشمير هوم</h2>
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
        document.getElementById("phoneError").textContent = "";
    });
    
    // التعامل مع إرسال رقم الهاتف
    document.getElementById("submitPhone").addEventListener("click", async function() {
        const phoneInput = document.getElementById("userPhone");
        const phoneError = document.getElementById("phoneError");
        const phoneNumber = phoneInput.value.trim();
        const submitButton = this;
        
        // إعادة تعيين رسالة الخطأ
        phoneError.textContent = "";
        
        // التحقق من الشروط
        if (!phoneNumber) {
            phoneError.textContent = "الرجاء إدخال رقم الهاتف";
            phoneInput.focus();
            return;
        }
        
        if (phoneNumber.length !== 11) {
            phoneError.textContent = "يجب أن يتكون رقم الهاتف من 11 رقمًا";
            phoneInput.focus();
            return;
        }
        
        if (phoneNumber[0] !== '0') {
            phoneError.textContent = "يجب أن يبدأ رقم الهاتف بالرقم 0";
            phoneInput.focus();
            return;
        }
        
        if (!/^\d+$/.test(phoneNumber)) {
            phoneError.textContent = "يجب أن يحتوي رقم الهاتف على أرقام فقط";
            phoneInput.focus();
            return;
        }
        
        // إعداد بيانات المستخدم مع رقم الهاتف
        const userData = {
            name: decoded.given_name || "غير معروف",
            family: decoded.family_name || "",
            email: decoded.email || "",
            phone: phoneNumber,
            registered: true,
            registrationDate: new Date().toISOString(),
            loginMethod: "google",
            picture: decoded.picture || ""
        };

        // تعطيل الزر أثناء الإرسال
        submitButton.disabled = true;
        submitButton.textContent = "جاري التسجيل...";
        phoneInput.disabled = true;
        
        try {
            // إرسال البيانات إلى JSONBin.io و Google Sheets بشكل متوازي
            const results = await Promise.allSettled([
                sendToJSONBin(userData),
                sendToGoogleSheets(userData)
            ]);
            
            // التحقق من نتائج الإرسال
            let successCount = 0;
            let errors = [];
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successCount++;
                    console.log(`✅ نجح إرسال البيانات إلى ${index === 0 ? 'JSONBin.io' : 'Google Sheets'}`);
                } else {
                    const serviceName = index === 0 ? 'JSONBin.io' : 'Google Sheets';
                    errors.push(`فشل في إرسال البيانات إلى ${serviceName}: ${result.reason}`);
                    console.error(`❌ فشل إرسال البيانات إلى ${serviceName}:`, result.reason);
                }
            });
            
            if (successCount > 0) {
                // نجح إرسال البيانات إلى خدمة واحدة على الأقل
                localStorage.setItem("userData", JSON.stringify(userData));
                
                // إظهار رسالة نجاح
                phoneError.style.color = "green";
                phoneError.textContent = "تم التسجيل بنجاح! جاري تحويلك...";
                
                // انتظار قصير قبل الانتقال
                setTimeout(() => {
                    showWelcomeSection(userData.name);
                    displayUserData(userData);
                    overlay.style.display = "none";
                    
                    // إضافة زر حذف الحساب
                    addDeleteAccountButton();
                }, 1500);
                
                if (errors.length > 0) {
                    console.warn("⚠️ تحذير: بعض الخدمات فشلت:", errors);
                }
            } else {
                // فشل في جميع الخدمات
                throw new Error("فشل في إرسال البيانات إلى جميع الخدمات. تحقق من الاتصال بالإنترنت وحاول مرة أخرى.");
            }
            
        } catch (error) {
            console.error("❌ خطأ في تسجيل البيانات:", error);
            phoneError.style.color = "red";
            phoneError.textContent = error.message || "حدث خطأ في التسجيل. يرجى المحاولة مرة أخرى.";
        } finally {
            // إعادة تفعيل الزر
            submitButton.disabled = false;
            submitButton.textContent = "تسجيل";
            phoneInput.disabled = false;
        }
    });
    
    // إضافة استماع لمفتاح Enter
    document.getElementById("userPhone").addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            document.getElementById("submitPhone").click();
        }
    });
}

// دالة إرسال البيانات إلى JSONBin.io
async function sendToJSONBin(userData) {
    const JSONBIN_API_URL = 'https://api.jsonbin.io/v3/b';
    const JSONBIN_API_KEY = CONFIG.JSONBIN_API_KEY; // 👈 يتم أخذه من الإعدادات
    
    if (!JSONBIN_API_KEY || JSONBIN_API_KEY === 'YOUR_JSONBIN_API_KEY_HERE') {
        throw new Error('JSONBin.io API Key غير محدد. يرجى إضافة المفتاح في إعدادات CONFIG.');
    }
    
    // إنشاء معرف فريد للمستخدم
    const userId = userData.email || generateUUID();
    
    const requestHeaders = {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_API_KEY,
        'X-Bin-Name': `User_${userId.replace(/[@.]/g, '_')}`
    };
    
    // إضافة Collection ID إذا كان متوفراً
    if (CONFIG.JSONBIN_COLLECTION_ID) {
        requestHeaders['X-Collection-Id'] = CONFIG.JSONBIN_COLLECTION_ID;
    }
    
    const response = await fetch(JSONBIN_API_URL, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({
            userId: userId,
            timestamp: new Date().toISOString(),
            userData: userData,
            source: 'website_registration',
            active: true,
            userAgent: navigator.userAgent,
            ipInfo: 'client_side' // لا يمكن الحصول على IP من الكلاينت
        })
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`JSONBin.io error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    
    // حفظ Bin ID لاستخدامه في الحذف لاحقاً
    if (result.metadata && result.metadata.id) {
        const userBinData = {
            binId: result.metadata.id,
            userId: userId,
            email: userData.email,
            createdAt: new Date().toISOString()
        };
        
        // حفظ معلومات الـ Bin في localStorage للمستخدم
        localStorage.setItem('userBinData', JSON.stringify(userBinData));
        console.log('✅ تم حفظ Bin ID:', result.metadata.id);
    }
    
    return result;
}

// دالة إرسال البيانات إلى Google Sheets
async function sendToGoogleSheets(userData) {
    const formData = new FormData();
    formData.append("action", "register");
    formData.append("Nameo", userData.name);
    formData.append("FamilyName", userData.family);
    formData.append("Emailo", userData.email);
    formData.append("Phone", userData.phone);
    formData.append("Passwordo", "google");
    formData.append("RegistrationDate", userData.registrationDate);
    formData.append("LoginMethod", userData.loginMethod);

    const response = await fetch(CONFIG.GOOGLE_SHEETS_URL, {
        method: "POST",
        body: formData
    });
    
    if (!response.ok) {
        throw new Error(`Google Sheets error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.result !== "success") {
        throw new Error(`Google Sheets API error: ${data.error || 'Unknown error'}`);
    }
    
    return data;
}

// دالة إنشاء UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// دالة حذف حساب المستخدم
async function deleteUserAccount() {
    // رسالة تأكيد مخصصة
    const confirmed = confirm(
        "⚠️ تحذير: حذف الحساب\n\n" +
        "هل أنت متأكد من رغبتك في حذف حسابك نهائياً؟\n\n" +
        "سيتم حذف جميع بياناتك ولن تتمكن من استردادها.\n" +
        "هذا الإجراء لا يمكن التراجع عنه.\n\n" +
        "اضغط 'موافق' للمتابعة أو 'إلغاء' للعودة."
    );
    
    if (!confirmed) {
        return false;
    }
    
    // تأكيد إضافي
    const doubleConfirm = confirm(
        "تأكيد أخير:\n\n" +
        "هل أنت متأكد 100% من رغبتك في حذف حسابك؟\n\n" +
        "اضغط 'موافق' لحذف الحساب نهائياً."
    );
    
    if (!doubleConfirm) {
        return false;
    }
    
    // إظهار رسالة التحميل
    const loadingMessage = document.createElement('div');
    loadingMessage.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            text-align: center;
            z-index: 10000;
        ">
            <div style="font-size: 18px; margin-bottom: 10px;">🗑️ جاري حذف الحساب...</div>
            <div style="font-size: 14px; color: #666;">يرجى الانتظار</div>
        </div>
    `;
    document.body.appendChild(loadingMessage);
    
    try {
        // الحصول على بيانات المستخدم
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const userBinData = JSON.parse(localStorage.getItem("userBinData") || "{}");
        
        if (!userData.email && !userBinData.binId) {
            throw new Error("لم يتم العثور على بيانات المستخدم");
        }
        
        console.log('🗑️ بدء عملية حذف الحساب...');
        console.log('📧 البريد الإلكتروني:', userData.email);
        console.log('🆔 Bin ID:', userBinData.binId);
        
        // حذف البيانات من الخدمات
        const deleteResults = await Promise.allSettled([
            deleteFromJSONBin(userBinData.binId),
            deleteFromGoogleSheets(userData.email)
        ]);
        
        // التحقق من نتائج الحذف
        let successCount = 0;
        let errors = [];
        
        deleteResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                successCount++;
                const serviceName = index === 0 ? 'JSONBin.io' : 'Google Sheets';
                console.log(`✅ تم حذف البيانات من ${serviceName} بنجاح`);
            } else {
                const serviceName = index === 0 ? 'JSONBin.io' : 'Google Sheets';
                errors.push(`فشل في حذف البيانات من ${serviceName}`);
                console.error(`❌ فشل حذف البيانات من ${serviceName}:`, result.reason);
            }
        });
        
        // إزالة رسالة التحميل
        document.body.removeChild(loadingMessage);
        
        if (successCount > 0) {
            // حذف البيانات المحلية
            localStorage.removeItem("userData");
            localStorage.removeItem("userBinData");
            
            // رسالة نجاح
            alert("✅ تم حذف حسابك بنجاح\n\nشكراً لاستخدامك موقعنا.");
            
            // إعادة تحميل الصفحة أو إعادة توجيه المستخدم
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
            return true;
        } else {
            throw new Error("فشل في حذف البيانات من جميع الخدمات");
        }
        
    } catch (error) {
        // إزالة رسالة التحميل في حالة الخطأ
        if (document.body.contains(loadingMessage)) {
            document.body.removeChild(loadingMessage);
        }
        
        console.error("❌ خطأ في حذف الحساب:", error);
        alert(
            "❌ حدث خطأ أثناء حذف الحساب\n\n" +
            "تفاصيل الخطأ: " + error.message + "\n\n" +
            "يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني."
        );
        return false;
    }
}

// دالة حذف البيانات من JSONBin.io
async function deleteFromJSONBin(binId) {
    if (!binId) {
        throw new Error("Bin ID غير موجود - لا يمكن حذف البيانات من JSONBin.io");
    }
    
    const JSONBIN_API_KEY = CONFIG.JSONBIN_API_KEY; // 👈 يتم أخذه من الإعدادات
    
    if (!JSONBIN_API_KEY || JSONBIN_API_KEY === 'YOUR_JSONBIN_API_KEY_HERE') {
        throw new Error('JSONBin.io API Key غير محدد للحذف');
    }
    
    console.log('🗑️ جاري حذف البيانات من JSONBin.io، Bin ID:', binId);
    
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        method: 'DELETE',
        headers: {
            'X-Master-Key': JSONBIN_API_KEY
        }
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`JSONBin.io deletion error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ تم حذف البيانات من JSONBin.io بنجاح');
    return result;
}

// دالة حذف البيانات من Google Sheets (تعديل الحالة إلى محذوف)
async function deleteFromGoogleSheets(userEmail) {
    if (!userEmail) {
        throw new Error("البريد الإلكتروني غير موجود - لا يمكن حذف البيانات من Google Sheets");
    }
    
    console.log('🗑️ جاري تحديث حالة المستخدم في Google Sheets، البريد:', userEmail);
    
    const formData = new FormData();
    formData.append("action", "delete");
    formData.append("email", userEmail);
    formData.append("deleteDate", new Date().toISOString());
    
    const response = await fetch(CONFIG.GOOGLE_SHEETS_URL, {
        method: "POST",
        body: formData
    });
    
    if (!response.ok) {
        throw new Error(`Google Sheets deletion error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.result !== "success") {
        throw new Error(`Google Sheets API error: ${data.error || 'Unknown error'}`);
    }
    
    console.log('✅ تم تحديث حالة المستخدم في Google Sheets بنجاح');
    return data;
}

// دالة إضافة زر حذف الحساب في واجهة المستخدم
function addDeleteAccountButton() {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    
    if (userData.registered) {
        // التحقق من وجود الزر مسبقاً لتجنب التكرار
        if (document.querySelector('.delete-account-btn')) {
            console.log('⚠️ زر حذف الحساب موجود بالفعل');
            return;
        }
        
        // إنشاء زر حذف الحساب
        const deleteButton = document.createElement("button");
        deleteButton.innerHTML = "🗑️ حذف الحساب";
        deleteButton.className = "delete-account-btn";
        deleteButton.style.cssText = `
            background: linear-gradient(135deg, #dc3545, #c82333);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            margin: 15px 5px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(220, 53, 69, 0.3);
        `;
        
        // إضافة تأثيرات hover
        deleteButton.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 20px rgba(220, 53, 69, 0.4)';
        });
        
        deleteButton.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 10px rgba(220, 53, 69, 0.3)';
        });
        
        deleteButton.addEventListener("click", deleteUserAccount);
        
        // البحث عن أفضل مكان لإضافة الزر
        const userDataSection = document.querySelector(".user-data-section") || 
                               document.querySelector(".user-info") ||
                               document.querySelector(".profile-section") ||
                               document.querySelector(".account-settings") ||
                               document.body;
        
        // إضافة الزر
        userDataSection.appendChild(deleteButton);
        
        console.log('✅ تم إضافة زر حذف الحساب بنجاح');
    }
}

// دالة التحقق من حالة المستخدم
function checkUserStatus() {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const userBinData = JSON.parse(localStorage.getItem("userBinData") || "{}");
    
    console.log('👤 حالة المستخدم:');
    console.log('📧 مسجل:', userData.registered || false);
    console.log('📧 البريد:', userData.email || 'غير محدد');
    console.log('🆔 Bin ID:', userBinData.binId || 'غير محدد');
    
    return {
        isRegistered: userData.registered || false,
        hasEmail: !!userData.email,
        hasBinId: !!userBinData.binId,
        userData: userData,
        userBinData: userBinData
    };
}

// دالة اختبار الاتصال بـ JSONBin.io
async function testJSONBinConnection() {
    try {
        console.log('🧪 اختبار الاتصال بـ JSONBin.io...');
        
        const testData = {
            test: true,
            timestamp: new Date().toISOString(),
            message: 'اختبار الاتصال'
        };
        
        const result = await sendToJSONBin({
            name: "Test User",
            family: "Test Family",
            email: "test@example.com",
            phone: "01234567890"
        });
        
        console.log("✅ تم الاتصال بـ JSONBin.io بنجاح!", result);
        alert("✅ تم اختبار الاتصال بـ JSONBin.io بنجاح!");
        
    } catch (error) {
        console.error("❌ فشل الاتصال بـ JSONBin.io:", error);
        alert("❌ فشل الاتصال بـ JSONBin.io:\n\n" + error.message);
    }
}

// دالة التحقق من الإعدادات
function validateConfig() {
    const issues = [];
    
    if (!CONFIG.JSONBIN_API_KEY || CONFIG.JSONBIN_API_KEY === 'YOUR_JSONBIN_API_KEY_HERE') {
        issues.push('❌ JSONBin.io API Key غير محدد');
    }
    
    if (!CONFIG.GOOGLE_SHEETS_URL || CONFIG.GOOGLE_SHEETS_URL.includes('YOUR_GOOGLE_SHEETS_URL')) {
        issues.push('❌ رابط Google Sheets غير محدد');
    }
    
    if (issues.length > 0) {
        console.warn('⚠️ مشاكل في الإعدادات:');
        issues.forEach(issue => console.warn(issue));
        return false;
    }
    
    console.log('✅ جميع الإعدادات صحيحة');
    return true;
}

// تشغيل التحقق من الإعدادات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 تم تحميل نظام إدارة المستخدمين');
    validateConfig();
    
    // إضافة زر حذف الحساب إذا كان المستخدم مسجل دخول
    const userStatus = checkUserStatus();
    if (userStatus.isRegistered) {
        setTimeout(addDeleteAccountButton, 1000); // تأخير قصير للتأكد من تحميل العناصر
    }
});
