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
            <div id="phoneError" style="color: red; margin-top: 10px;"></div>
            <h2> هذ الموقع يحمي بيناتك و تطبق علية <span><a href="Privacy.html" target="_blank">السياسة و الخصوصية</a></span> الخاصة بكشمير هوم</h2>
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
    });
    
    // التعامل مع إرسال رقم الهاتف
    document.getElementById("submitPhone").addEventListener("click", function() {
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
        
        if (!/^\d+$/.test(phoneNumber)) {
            phoneError.textContent = "يجب أن يحتوي رقم الهاتف على أرقام فقط";
            return;
        }
        
        // إعداد بيانات المستخدم مع رقم الهاتف
        const userData = {
            id: generateUniqueId(), // إنشاء معرف فريد
            name: decoded.given_name || "غير معروف",
            family: decoded.family_name || "",
            email: decoded.email || "",
            phone: phoneNumber,
            registered: true,
            timestamp: new Date().toISOString()
        };

        // إعداد بيانات Google Sheets
        const formData = new FormData();
        formData.append("Nameo", userData.name);
        formData.append("FamilyName", userData.family);
        formData.append("Emailo", userData.email);
        formData.append("Phone", userData.phone);
        formData.append("Passwordo", "google");
        formData.append("ID", userData.id);

        // إرسال البيانات إلى كل من JSONBin و Google Sheets
        Promise.all([
            // إرسال إلى JSONBin.io
            sendToJSONBin(userData),
            // إرسال إلى Google Sheets
            sendToGoogleSheets(formData)
        ])
        .then(([jsonbinResult, googleSheetsResult]) => {
            if (jsonbinResult.success && googleSheetsResult.success) {
                localStorage.setItem("userData", JSON.stringify(userData));
                showWelcomeSection(userData.name);
                displayUserData(userData);
                overlay.style.display = "none";
                
                // إضافة زر حذف الحساب في واجهة المستخدم
                addDeleteAccountButton();
            } else {
                showError("فشل في إرسال البيانات إلى أحد الخدمات أو كليهما");
            }
        })
        .catch(err => {
            console.error("خطأ في إرسال البيانات:", err);
            showError("خطأ في تسجيل الدخول باستخدام Google");
        });
    });
}

// دالة لإضافة زر حذف الحساب
function addDeleteAccountButton() {
    // التحقق من وجود الزر مسبقاً
    if (document.getElementById('deleteAccountBtn')) {
        return;
    }
    
    // إنشاء زر حذف الحساب
    const deleteButton = document.createElement('button');
    deleteButton.id = 'deleteAccountBtn';
    deleteButton.innerHTML = '🗑️ حذف الحساب';
    deleteButton.className = 'delete-account-btn';
    deleteButton.style.cssText = `
        background-color: #dc3545;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        margin: 10px;
        font-size: 14px;
        transition: background-color 0.3s;
    `;
    
    // إضافة تأثير hover
    deleteButton.onmouseover = function() {
        this.style.backgroundColor = '#c82333';
    };
    deleteButton.onmouseout = function() {
        this.style.backgroundColor = '#dc3545';
    };
    
    // ربط الوظيفة بالزر
    deleteButton.onclick = function() {
        deleteCurrentUserAccount();
    };
    
    // إضافة الزر إلى المكان المناسب (يمكنك تعديل المكان حسب تصميم موقعك)
    const userSection = document.querySelector('.welcome-section, .user-dashboard, .user-info');
    if (userSection) {
        userSection.appendChild(deleteButton);
    } else {
        // إذا لم يوجد قسم محدد، أضف الزر في نهاية body
        document.body.appendChild(deleteButton);
    }
}

// إعدادات JSONBin
const JSONBIN_CONFIG = {
    API_KEY: "$2a$10$xAWjC3zelpDKCd6zdOdUg.D0bwtEURjcR5sEiYdonjBmP5lHuqzq2",
    BIN_ID: "684969188a456b7966ac3e0f"
};

// دالة لإرسال البيانات إلى JSONBin.io
async function sendToJSONBin(userData) {
    try {
        // أولاً، جرب الحصول على البيانات الموجودة
        const existingData = await getExistingJSONBinData();
        
        // إضافة المستخدم الجديد إلى القائمة
        const updatedData = {
            users: existingData.users ? [...existingData.users, userData] : [userData],
            lastUpdated: new Date().toISOString(),
            totalUsers: existingData.users ? existingData.users.length + 1 : 1
        };
        
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_CONFIG.BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_CONFIG.API_KEY
            },
            body: JSON.stringify(updatedData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('تم حفظ البيانات في JSONBin بنجاح:', result);
            return { success: true, data: result };
        } else {
            console.error('خطأ في حفظ البيانات في JSONBin:', result);
            return { success: false, error: result };
        }
    } catch (error) {
        console.error('خطأ في الاتصال بـ JSONBin:', error);
        return { success: false, error: error };
    }
}

// دالة لإرسال البيانات إلى Google Sheets
async function sendToGoogleSheets(formData) {
    try {
        const response = await fetch("https://script.google.com/macros/s/AKfycbzDPcLwO1U091L_W1Ha-M-_GjL5z6V7aFh6RxTberNq8tsYLIkkI1BtdF5ufA8qpSmvag/exec", {
            method: "POST",
            body: formData
        });
        
        const result = await response.json();
        
        if (result.result === "success") {
            console.log('تم حفظ البيانات في Google Sheets بنجاح:', result);
            return { success: true, data: result };
        } else {
            console.error('خطأ في حفظ البيانات في Google Sheets:', result);
            return { success: false, error: result };
        }
    } catch (error) {
        console.error('خطأ في الاتصال بـ Google Sheets:', error);
        return { success: false, error: error };
    }
}

// دالة لإنشاء معرف فريد
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// دالة لحذف حساب المستخدم
async function deleteUserAccount(userIdentifier, identificationType = 'email') {
    try {
        // الخطوة 1: جلب البيانات الحالية من JSONBin
        const existingData = await getExistingJSONBinData();
        
        if (!existingData.users || existingData.users.length === 0) {
            console.log('لا توجد بيانات مستخدمين للحذف');
            return { success: false, message: 'لا توجد بيانات للحذف' };
        }
        
        // الخطوة 2: البحث عن المستخدم وحذفه
        const originalLength = existingData.users.length;
        let filteredUsers;
        
        switch (identificationType) {
            case 'email':
                filteredUsers = existingData.users.filter(user => user.email !== userIdentifier);
                break;
            case 'phone':
                filteredUsers = existingData.users.filter(user => user.phone !== userIdentifier);
                break;
            case 'id':
                filteredUsers = existingData.users.filter(user => user.id !== userIdentifier);
                break;
            default:
                filteredUsers = existingData.users.filter(user => 
                    user.email !== userIdentifier && 
                    user.phone !== userIdentifier && 
                    user.id !== userIdentifier
                );
        }
        
        // التحقق من حذف المستخدم
        if (filteredUsers.length === originalLength) {
            console.log('المستخدم غير موجود');
            return { success: false, message: 'المستخدم غير موجود' };
        }
        
        // الخطوة 3: تحديث البيانات في JSONBin
        const updatedData = {
            users: filteredUsers,
            lastUpdated: new Date().toISOString(),
            totalUsers: filteredUsers.length,
            lastDeletedUser: userIdentifier,
            deletedAt: new Date().toISOString()
        };
        
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_CONFIG.BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_CONFIG.API_KEY
            },
            body: JSON.stringify(updatedData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // الخطوة 4: حذف البيانات من localStorage
            clearUserLocalData();
            
            console.log('تم حذف المستخدم بنجاح من JSONBin:', result);
            return { 
                success: true, 
                message: 'تم حذف الحساب بنجاح',
                deletedUser: userIdentifier,
                remainingUsers: filteredUsers.length
            };
        } else {
            console.error('خطأ في حذف المستخدم من JSONBin:', result);
            return { success: false, message: 'فشل في حذف الحساب من قاعدة البيانات' };
        }
        
    } catch (error) {
        console.error('خطأ في حذف حساب المستخدم:', error);
        return { success: false, message: 'خطأ في حذف الحساب' };
    }
}

// دالة لمسح بيانات المستخدم من localStorage
function clearUserLocalData() {
    try {
        // حذف بيانات المستخدم
        localStorage.removeItem("userData");
        
        // حذف أي بيانات أخرى متعلقة بالمستخدم (اضف المفاتيح حسب الحاجة)
        localStorage.removeItem("userSession");
        localStorage.removeItem("userPreferences");
        localStorage.removeItem("userCart");
        localStorage.removeItem("userFavorites");
        
        console.log('تم مسح بيانات المستخدم من localStorage');
        
        // إعادة تحميل الصفحة أو إعادة توجيه المستخدم
        // window.location.reload(); // اختياري
        
    } catch (error) {
        console.error('خطأ في مسح البيانات المحلية:', error);
    }
}

// دالة لحذف الحساب الحالي (المستخدم المسجل حالياً)
async function deleteCurrentUserAccount() {
    try {
        // جلب بيانات المستخدم الحالي
        const currentUser = JSON.parse(localStorage.getItem("userData"));
        
        if (!currentUser) {
            alert('لا يوجد مستخدم مسجل حالياً');
            return;
        }
        
        // تأكيد الحذف
        const confirmation = confirm(`هل أنت متأكد من حذف حسابك؟\nالبريد الإلكتروني: ${currentUser.email}\nهذا الإجراء لا يمكن التراجع عنه.`);
        
        if (!confirmation) {
            return;
        }
        
        // حذف الحساب
        const result = await deleteUserAccount(currentUser.email, 'email');
        
        if (result.success) {
            alert('تم حذف حسابك بنجاح');
            
            // إخفاء واجهة المستخدم المسجل
            hideUserInterface();
            
            // إظهار واجهة تسجيل الدخول
            showLoginInterface();
            
        } else {
            alert('فشل في حذف الحساب: ' + result.message);
        }
        
    } catch (error) {
        console.error('خطأ في حذف الحساب الحالي:', error);
        alert('حدث خطأ أثناء حذف الحساب');
    }
}

// دالة لإخفاء واجهة المستخدم
function hideUserInterface() {
    // إخفاء العناصر المتعلقة بالمستخدم المسجل
    const userElements = document.querySelectorAll('.user-logged-in, .welcome-section, .user-dashboard');
    userElements.forEach(element => {
        element.style.display = 'none';
    });
}

// دالة لإظهار واجهة تسجيل الدخول
function showLoginInterface() {
    // إظهار أزرار تسجيل الدخول
    const loginElements = document.querySelectorAll('.login-buttons, .auth-section');
    loginElements.forEach(element => {
        element.style.display = 'block';
    });
}

// دالة للتحقق من وجود المستخدم في قاعدة البيانات وتسجيل خروجه إذا لم يعد موجوداً
async function checkUserExistenceAndLogout() {
    try {
        // جلب بيانات المستخدم الحالي من localStorage
        const currentUser = JSON.parse(localStorage.getItem("userData"));
        
        if (!currentUser) {
            // لا يوجد مستخدم مسجل
            return;
        }
        
        // البحث عن المستخدم في قاعدة البيانات
        const userInDatabase = await findUserInDatabase(currentUser.email, 'email');
        
        if (!userInDatabase) {
            // المستخدم غير موجود في قاعدة البيانات - تسجيل الخروج
            console.log('تم حذف المستخدم من قاعدة البيانات - تسجيل خروج تلقائي');
            
            // مسح البيانات المحلية
            clearUserLocalData();
            
            // إخفاء واجهة المستخدم
            hideUserInterface();
            
            // إظهار واجهة تسجيل الدخول
            showLoginInterface();
            
            // إظهار رسالة للمستخدم
            alert('تم حذف حسابك من النظام. سيتم تسجيل خروجك تلقائياً.');
            
            // إعادة تحميل الصفحة (اختياري)
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
            return false; // المستخدم غير موجود
        }
        
        return true; // المستخدم موجود
        
    } catch (error) {
        console.error('خطأ في التحقق من وجود المستخدم:', error);
        return true; // في حالة الخطأ، نفترض أن المستخدم موجود
    }
}

// دالة للتحقق الدوري من وجود المستخدم
function startUserExistenceCheck() {
    // التحقق كل 30 ثانية
    setInterval(async () => {
        await checkUserExistenceAndLogout();
    }, 30000); // 30 ثانية
}

// دالة للتحقق من وجود المستخدم عند تحميل الصفحة
async function checkUserOnPageLoad() {
    // انتظار قليل للتأكد من تحميل البيانات
    setTimeout(async () => {
        const userExists = await checkUserExistenceAndLogout();
        
        if (userExists) {
            console.log('المستخدم موجود في قاعدة البيانات');
            // بدء التحقق الدوري
            startUserExistenceCheck();
        }
    }, 1000);
}

// دالة للتحقق من وجود المستخدم عند النقر على أي زر أو تفاعل
async function checkUserBeforeAction(callback) {
    const userExists = await checkUserExistenceAndLogout();
    
    if (userExists && typeof callback === 'function') {
        // إذا كان المستخدم موجود، تنفيذ الوظيفة المطلوبة
        callback();
    } else if (!userExists) {
        // إذا لم يعد المستخدم موجود، منع التنفيذ
        console.log('تم منع التنفيذ - المستخدم غير موجود في قاعدة البيانات');
    }
}

// دالة محسنة لتسجيل الخروج
function forceLogout(reason = 'تم تسجيل الخروج') {
    try {
        // مسح جميع البيانات المحلية
        clearUserLocalData();
        
        // إخفاء واجهة المستخدم
        hideUserInterface();
        
        // إظهار واجهة تسجيل الدخول
        showLoginInterface();
        
        // إظهار رسالة للمستخدم
        if (reason !== 'silent') {
            alert(reason);
        }
        
        // إعادة تعيين الصفحة
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        
        console.log('تم تسجيل الخروج:', reason);
        
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
    }
}

// دالة للتحقق من حالة الاتصال وقاعدة البيانات
async function checkDatabaseConnection() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_CONFIG.BIN_ID}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.API_KEY
            }
        });
        
        if (!response.ok) {
            throw new Error('فشل الاتصال بقاعدة البيانات');
        }
        
        const result = await response.json();
        
        // التحقق من وجود البيانات
        if (!result.record || !result.record.users) {
            // إذا كانت قاعدة البيانات فارغة أو محذوفة
            const currentUser = JSON.parse(localStorage.getItem("userData"));
            if (currentUser) {
                forceLogout('تم مسح جميع البيانات من النظام. سيتم تسجيل خروجك.');
                return false;
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('خطأ في الاتصال بقاعدة البيانات:', error);
        return true; // في حالة خطأ الشبكة، نفترض أن الاتصال سليم
    }
}

// دالة بديلة لإرسال البيانات إلى JSONBin مع تحديث البيانات الموجودة
async function sendToJSONBinWithUpdate(userData) {
    try {
        // أولاً، جرب الحصول على البيانات الموجودة
        const existingData = await getExistingJSONBinData();
        
        // إضافة المستخدم الجديد إلى القائمة
        const updatedData = {
            users: existingData.users ? [...existingData.users, userData] : [userData],
            lastUpdated: new Date().toISOString(),
            totalUsers: existingData.users ? existingData.users.length + 1 : 1
        };
        
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_CONFIG.BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_CONFIG.API_KEY
            },
            body: JSON.stringify(updatedData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('تم تحديث البيانات في JSONBin بنجاح:', result);
            return { success: true, data: result };
        } else {
            console.error('خطأ في تحديث البيانات في JSONBin:', result);
            return { success: false, error: result };
        }
    } catch (error) {
        console.error('خطأ في تحديث البيانات في JSONBin:', error);
        return { success: false, error: error };
    }
}

// دالة للحصول على البيانات الموجودة من JSONBin
async function getExistingJSONBinData() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_CONFIG.BIN_ID}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.API_KEY
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            return result.record;
        } else {
            return { users: [] };
        }
    } catch (error) {
        console.error('خطأ في جلب البيانات من JSONBin:', error);
        return { users: [] };
    }
}




// دالة للتحقق من تكرار الإيميل أو الهاتف
async function checkIfUserExists(email, phone) {
    try {
        const existingData = await getExistingJSONBinData();
        
        if (!existingData.users || existingData.users.length === 0) {
            return {
                emailExists: false,
                phoneExists: false,
                canCreateAccount: true
            };
        }
        
        // البحث عن الإيميل
        const emailFound = existingData.users.some(user => user.email === email);
        
        // البحث عن رقم الهاتف
        const phoneFound = existingData.users.some(user => user.phone === phone);
        
        return {
            emailExists: emailFound,
            phoneExists: phoneFound,
            canCreateAccount: !emailFound && !phoneFound
        };
        
    } catch (error) {
        console.error('خطأ في التحقق من المستخدم:', error);
        return {
            emailExists: false,
            phoneExists: false,
            canCreateAccount: true,
            error: true
        };
    }
}

// دالة تسجيل الدخول المعدلة
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
            <div id="phoneError" style="color: red; margin-top: 10px;"></div>
            <div id="loadingMessage" style="color: blue; margin-top: 10px; display: none;">جاري التحقق...</div>
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
    });
    
    // التعامل مع إرسال رقم الهاتف
    document.getElementById("submitPhone").addEventListener("click", async function() {
        const phoneInput = document.getElementById("userPhone");
        const phoneError = document.getElementById("phoneError");
        const loadingMessage = document.getElementById("loadingMessage");
        const phoneNumber = phoneInput.value.trim();
        const userEmail = decoded.email || "";
        
        // إعادة تعيين الرسائل
        phoneError.textContent = "";
        loadingMessage.style.display = "none";
        
        // التحقق من صحة رقم الهاتف
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
        
        if (!/^\d+$/.test(phoneNumber)) {
            phoneError.textContent = "يجب أن يحتوي رقم الهاتف على أرقام فقط";
            return;
        }
        
        // إظهار رسالة التحميل
        loadingMessage.style.display = "block";
        loadingMessage.textContent = "جاري التحقق من البيانات...";
        
        try {
            // التحقق من تكرار الإيميل أو الهاتف
            const checkResult = await checkIfUserExists(userEmail, phoneNumber);
            
            if (checkResult.error) {
                throw new Error("خطأ في الاتصال بقاعدة البيانات");
            }
            
            // إذا كان الإيميل أو الهاتف موجود، منع إنشاء الحساب
            if (!checkResult.canCreateAccount) {
                loadingMessage.style.display = "none";
                
                let errorMessage = "";
                if (checkResult.emailExists && checkResult.phoneExists) {
                    errorMessage = "الإيميل ورقم الهاتف مسجلان مسبقاً";
                } else if (checkResult.emailExists) {
                    errorMessage = "هذا الإيميل مسجل مسبقاً";
                } else if (checkResult.phoneExists) {
                    errorMessage = "رقم الهاتف مسجل مسبقاً";
                }
                
                phoneError.textContent = errorMessage;
                return;
            }
            
            // إذا لم يكن هناك تكرار، إنشاء الحساب عادي
            loadingMessage.textContent = "جاري إنشاء الحساب...";
            
            // إعداد بيانات المستخدم
            const userData = {
                id: generateUniqueId(),
                name: decoded.given_name || "غير معروف",
                family: decoded.family_name || "",
                email: userEmail,
                phone: phoneNumber,
                registered: true,
                timestamp: new Date().toISOString()
            };

            // إعداد بيانات Google Sheets
            const formData = new FormData();
            formData.append("Nameo", userData.name);
            formData.append("FamilyName", userData.family);
            formData.append("Emailo", userData.email);
            formData.append("Phone", userData.phone);
            formData.append("Passwordo", "google");
            formData.append("ID", userData.id);

            // إرسال البيانات إلى قاعدة البيانات
            const [jsonbinResult, googleSheetsResult] = await Promise.all([
                sendToJSONBin(userData),
                sendToGoogleSheets(formData)
            ]);
            
            if (jsonbinResult.success && googleSheetsResult.success) {
                // حفظ بيانات المستخدم محلياً
                localStorage.setItem("userData", JSON.stringify(userData));
                
                // إظهار واجهة المستخدم
                showWelcomeSection(userData.name);
                displayUserData(userData);
                overlay.style.display = "none";
                
                // إضافة زر حذف الحساب
                addDeleteAccountButton();
                
                // إظهار رسالة نجاح
                showMessage("تم إنشاء الحساب بنجاح!", "success");
                
            } else {
                throw new Error("فشل في حفظ البيانات");
            }
            
        } catch (error) {
            console.error("خطأ في إنشاء الحساب:", error);
            loadingMessage.style.display = "none";
            phoneError.textContent = "خطأ في إنشاء الحساب: " + (error.message || "خطأ غير معروف");
        }
    });
}

// دالة لإرسال البيانات إلى JSONBin
async function sendToJSONBin(userData) {
    try {
        // الحصول على البيانات الموجودة
        const existingData = await getExistingJSONBinData();
        
        // إضافة المستخدم الجديد
        const updatedData = {
            users: existingData.users ? [...existingData.users, userData] : [userData],
            lastUpdated: new Date().toISOString(),
            totalUsers: existingData.users ? existingData.users.length + 1 : 1
        };
        
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_CONFIG.BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_CONFIG.API_KEY
            },
            body: JSON.stringify(updatedData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('تم حفظ البيانات في JSONBin بنجاح');
            return { success: true, data: result };
        } else {
            console.error('خطأ في حفظ البيانات في JSONBin:', result);
            return { success: false, error: result };
        }
    } catch (error) {
        console.error('خطأ في الاتصال بـ JSONBin:', error);
        return { success: false, error: error };
    }
}

// دالة لإرسال البيانات إلى Google Sheets
async function sendToGoogleSheets(formData) {
    try {
        const response = await fetch("https://script.google.com/macros/s/AKfycbzDPcLwO1U091L_W1Ha-M-_GjL5z6V7aFh6RxTberNq8tsYLIkkI1BtdF5ufA8qpSmvag/exec", {
            method: "POST",
            body: formData
        });
        
        const result = await response.json();
        
        if (result.result === "success") {
            console.log('تم حفظ البيانات في Google Sheets بنجاح');
            return { success: true, data: result };
        } else {
            console.error('خطأ في حفظ البيانات في Google Sheets:', result);
            return { success: false, error: result };
        }
    } catch (error) {
        console.error('خطأ في الاتصال بـ Google Sheets:', error);
        return { success: false, error: error };
    }
}

// دالة للحصول على البيانات الموجودة من JSONBin
async function getExistingJSONBinData() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_CONFIG.BIN_ID}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.API_KEY
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            return result.record || { users: [] };
        } else {
            console.error('خطأ في جلب البيانات من JSONBin');
            return { users: [] };
        }
    } catch (error) {
        console.error('خطأ في جلب البيانات من JSONBin:', error);
        return { users: [] };
    }
}

// دالة لإنشاء معرف فريد
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// دالة لإظهار الرسائل
function showMessage(message, type = "info") {
    const colors = {
        success: "#28a745",
        error: "#dc3545",
        info: "#17a2b8"
    };
    
    const messageDiv = document.createElement("div");
    messageDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            max-width: 300px;
        ">
            ${message}
        </div>
    `;
    
    document.body.appendChild(messageDiv);
    
    // إزالة الرسالة بعد 3 ثوان
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 3000);
}

// دالة لإضافة زر حذف الحساب
function addDeleteAccountButton() {
    // التحقق من وجود الزر مسبقاً
    if (document.getElementById('deleteAccountBtn')) {
        return;
    }
    
    // إنشاء زر حذف الحساب
    const deleteButton = document.createElement('button');
    deleteButton.id = 'deleteAccountBtn';
    deleteButton.innerHTML = '🗑️ حذف الحساب';
    deleteButton.className = 'delete-account-btn';
    deleteButton.style.cssText = `
        background-color: #dc3545;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        margin: 10px;
        font-size: 14px;
        transition: background-color 0.3s;
    `;
    
    // إضافة تأثير hover
    deleteButton.onmouseover = function() {
        this.style.backgroundColor = '#c82333';
    };
    deleteButton.onmouseout = function() {
        this.style.backgroundColor = '#dc3545';
    };
    
    // ربط الوظيفة بالزر
    deleteButton.onclick = function() {
        deleteCurrentUserAccount();
    };
    
    // إضافة الزر إلى المكان المناسب
    const userSection = document.querySelector('.welcome-section, .user-dashboard, .user-info');
    if (userSection) {
        userSection.appendChild(deleteButton);
    } else {
        document.body.appendChild(deleteButton);
    }
}

// دالة لحذف الحساب الحالي
async function deleteCurrentUserAccount() {
    try {
        const currentUser = JSON.parse(localStorage.getItem("userData"));
        
        if (!currentUser) {
            showMessage('لا يوجد مستخدم مسجل حالياً', 'error');
            return;
        }
        
        const confirmation = confirm(`هل أنت متأكد من حذف حسابك؟\nالبريد الإلكتروني: ${currentUser.email}\nهذا الإجراء لا يمكن التراجع عنه.`);
        
        if (!confirmation) {
            return;
        }
        
        // حذف المستخدم من قاعدة البيانات
        const result = await deleteUserFromDatabase(currentUser.email, currentUser.phone);
        
        if (result.success) {
            // مسح البيانات المحلية
            localStorage.removeItem("userData");
            
            showMessage('تم حذف حسابك بنجاح', 'success');
            
            // إعادة تحميل الصفحة بعد 2 ثانية
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } else {
            showMessage('فشل في حذف الحساب: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('خطأ في حذف الحساب:', error);
        showMessage('حدث خطأ أثناء حذف الحساب', 'error');
    }
}

// دالة لحذف المستخدم من قاعدة البيانات
async function deleteUserFromDatabase(email, phone) {
    try {
        const existingData = await getExistingJSONBinData();
        
        if (!existingData.users || existingData.users.length === 0) {
            return { success: false, message: 'لا توجد بيانات للحذف' };
        }
        
        // تصفية المستخدمين (حذف المستخدم المطلوب)
        const filteredUsers = existingData.users.filter(user => 
            user.email !== email && user.phone !== phone
        );
        
        // التحقق من حذف المستخدم
        if (filteredUsers.length === existingData.users.length) {
            return { success: false, message: 'المستخدم غير موجود' };
        }
        
        // تحديث البيانات
        const updatedData = {
            users: filteredUsers,
            lastUpdated: new Date().toISOString(),
            totalUsers: filteredUsers.length
        };
        
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_CONFIG.BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_CONFIG.API_KEY
            },
            body: JSON.stringify(updatedData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            return { success: true, message: 'تم حذف الحساب بنجاح' };
        } else {
            return { success: false, message: 'فشل في حذف الحساب من قاعدة البيانات' };
        }
        
    } catch (error) {
        console.error('خطأ في حذف المستخدم:', error);
        return { success: false, message: 'خطأ في حذف الحساب' };
    }
}
