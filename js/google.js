// دالة للتحقق من وجود مستخدم بالإيميل أو الهاتف
async function checkUserExists(email, phone) {
    try {
        const existingData = await getExistingJSONBinData();
        
        if (!existingData.users || existingData.users.length === 0) {
            return { exists: false };
        }
        
        // البحث عن الإيميل أو الهاتف في قاعدة البيانات
        const emailExists = existingData.users.find(user => user.email === email);
        const phoneExists = existingData.users.find(user => user.phone === phone);
        
        return {
            exists: emailExists || phoneExists,
            emailExists: !!emailExists,
            phoneExists: !!phoneExists,
            existingUser: emailExists || phoneExists
        };
    } catch (error) {
        console.error('خطأ في التحقق من وجود المستخدم:', error);
        return { exists: false, error: true };
    }
}

// دالة محسنة للعثور على المستخدم في قاعدة البيانات
async function findUserInDatabase(identifier, type = 'email') {
    try {
        const existingData = await getExistingJSONBinData();
        
        if (!existingData.users || existingData.users.length === 0) {
            return null;
        }
        
        let foundUser = null;
        
        switch (type) {
            case 'email':
                foundUser = existingData.users.find(user => user.email === identifier);
                break;
            case 'phone':
                foundUser = existingData.users.find(user => user.phone === identifier);
                break;
            case 'id':
                foundUser = existingData.users.find(user => user.id === identifier);
                break;
            default:
                // البحث بجميع الطرق
                foundUser = existingData.users.find(user => 
                    user.email === identifier || 
                    user.phone === identifier || 
                    user.id === identifier
                );
        }
        
        return foundUser || null;
    } catch (error) {
        console.error('خطأ في البحث عن المستخدم:', error);
        return null;
    }
}

// دالة محسنة لتسجيل الدخول مع التحقق من التكرار
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
    
    // التعامل مع إرسال رقم الهاتف مع التحقق من التكرار
    document.getElementById("submitPhone").addEventListener("click", async function() {
        const phoneInput = document.getElementById("userPhone");
        const phoneError = document.getElementById("phoneError");
        const loadingMessage = document.getElementById("loadingMessage");
        const phoneNumber = phoneInput.value.trim();
        const userEmail = decoded.email || "";
        
        // إعادة تعيين رسائل الخطأ والتحميل
        phoneError.textContent = "";
        loadingMessage.style.display = "none";
        
        // التحقق من الشروط الأساسية
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
            // التحقق من وجود المستخدم بالإيميل أو الهاتف
            const userCheck = await checkUserExists(userEmail, phoneNumber);
            
            if (userCheck.error) {
                throw new Error("خطأ في الاتصال بقاعدة البيانات");
            }
            
            if (userCheck.exists) {
                loadingMessage.style.display = "none";
                
                let errorMessage = "";
                if (userCheck.emailExists && userCheck.phoneExists) {
                    errorMessage = "هذا الإيميل ورقم الهاتف مسجلان مسبقاً";
                } else if (userCheck.emailExists) {
                    errorMessage = "هذا الإيميل مسجل مسبقاً";
                } else if (userCheck.phoneExists) {
                    errorMessage = "رقم الهاتف هذا مسجل مسبقاً";
                }
                
                phoneError.textContent = errorMessage;
                
                // إظهار خيار تسجيل الدخول للمستخدم الموجود
                const loginOption = document.createElement("div");
                loginOption.innerHTML = `
                    <p style="color: #007bff; margin-top: 10px;">
                        هل تريد تسجيل الدخول بدلاً من إنشاء حساب جديد؟
                        <button id="loginExistingUser" style="margin-left: 10px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">
                            تسجيل دخول
                        </button>
                    </p>
                `;
                
                if (!document.getElementById("loginExistingUser")) {
                    phoneError.appendChild(loginOption);
                    
                    document.getElementById("loginExistingUser").addEventListener("click", function() {
                        loginExistingUser(userCheck.existingUser);
                    });
                }
                
                return;
            }
            
            // إذا لم يكن المستخدم موجوداً، متابعة إنشاء الحساب
            loadingMessage.textContent = "جاري إنشاء الحساب...";
            
            // إعداد بيانات المستخدم مع رقم الهاتف
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

            // إرسال البيانات إلى كل من JSONBin و Google Sheets
            const results = await Promise.all([
                sendToJSONBin(userData),
                sendToGoogleSheets(formData)
            ]);
            
            const [jsonbinResult, googleSheetsResult] = results;
            
            if (jsonbinResult.success && googleSheetsResult.success) {
                localStorage.setItem("userData", JSON.stringify(userData));
                showWelcomeSection(userData.name);
                displayUserData(userData);
                overlay.style.display = "none";
                
                // إضافة زر حذف الحساب في واجهة المستخدم
                addDeleteAccountButton();
                
                // إظهار رسالة نجاح
                showSuccessMessage("تم إنشاء الحساب بنجاح!");
                
            } else {
                throw new Error("فشل في إرسال البيانات إلى أحد الخدمات أو كليهما");
            }
            
        } catch (error) {
            console.error("خطأ في تسجيل الدخول:", error);
            loadingMessage.style.display = "none";
            phoneError.textContent = "خطأ في تسجيل الدخول: " + (error.message || "خطأ غير معروف");
        }
    });
}

// دالة لتسجيل دخول المستخدم الموجود
function loginExistingUser(existingUser) {
    try {
        // تحديث البيانات في localStorage
        localStorage.setItem("userData", JSON.stringify(existingUser));
        
        // إظهار واجهة المستخدم
        showWelcomeSection(existingUser.name);
        displayUserData(existingUser);
        
        // إخفاء overlay
        const overlay = document.getElementById("overlay");
        overlay.style.display = "none";
        
        // إضافة زر حذف الحساب
        addDeleteAccountButton();
        
        // إظهار رسالة ترحيب
        showSuccessMessage(`مرحباً بعودتك ${existingUser.name}!`);
        
    } catch (error) {
        console.error("خطأ في تسجيل دخول المستخدم الموجود:", error);
        showError("خطأ في تسجيل الدخول");
    }
}

// دالة لإظهار رسالة النجاح
function showSuccessMessage(message) {
    const successDiv = document.createElement("div");
    successDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        ">
            ${message}
        </div>
    `;
    
    document.body.appendChild(successDiv);
    
    // إزالة الرسالة بعد 3 ثوان
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 3000);
}

// دالة لإظهار رسالة الخطأ
function showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        ">
            ${message}
        </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // إزالة الرسالة بعد 5 ثوان
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// دالة محسنة لإرسال البيانات إلى JSONBin مع التحقق المضاعف
async function sendToJSONBin(userData) {
    try {
        // التحقق مرة أخرى قبل الإرسال (للتأكد المضاعف)
        const finalCheck = await checkUserExists(userData.email, userData.phone);
        
        if (finalCheck.exists) {
            return { 
                success: false, 
                error: "المستخدم موجود مسبقاً", 
                duplicate: true 
            };
        }
        
        // الحصول على البيانات الموجودة
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

// دالة للتحقق من صحة البيانات قبل الإرسال
function validateUserData(userData) {
    const errors = [];
    
    if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
        errors.push("الإيميل غير صحيح");
    }
    
    if (!userData.phone || !/^0\d{10}$/.test(userData.phone)) {
        errors.push("رقم الهاتف غير صحيح");
    }
    
    if (!userData.name || userData.name.trim().length < 2) {
        errors.push("الاسم قصير جداً");
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// دالة محسنة للحصول على البيانات الموجودة من JSONBin
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
            console.error('خطأ في جلب البيانات من JSONBin:', response.status);
            return { users: [] };
        }
    } catch (error) {
        console.error('خطأ في جلب البيانات من JSONBin:', error);
        return { users: [] };
    }
}

// دالة للتحقق من تفرد البيانات في الوقت الفعلي
async function realTimeUniqueCheck(email, phone) {
    try {
        // جلب أحدث البيانات
        const latestData = await getExistingJSONBinData();
        
        if (!latestData.users || latestData.users.length === 0) {
            return { isUnique: true };
        }
        
        // البحث عن التكرارات
        const emailMatch = latestData.users.find(user => user.email === email);
        const phoneMatch = latestData.users.find(user => user.phone === phone);
        
        return {
            isUnique: !emailMatch && !phoneMatch,
            emailExists: !!emailMatch,
            phoneExists: !!phoneMatch,
            conflictingUsers: [emailMatch, phoneMatch].filter(Boolean)
        };
        
    } catch (error) {
        console.error('خطأ في التحقق من التفرد:', error);
        // في حالة الخطأ، نفترض أن البيانات فريدة لتجنب منع التسجيل
        return { isUnique: true, error: true };
    }
}

// دالة لتنظيف البيانات المكررة (لاستخدامها في حالات الطوارئ)
async function cleanupDuplicateUsers() {
    try {
        const existingData = await getExistingJSONBinData();
        
        if (!existingData.users || existingData.users.length === 0) {
            return { success: true, message: "لا توجد بيانات للتنظيف" };
        }
        
        const uniqueUsers = [];
        const seenEmails = new Set();
        const seenPhones = new Set();
        
        for (const user of existingData.users) {
            if (!seenEmails.has(user.email) && !seenPhones.has(user.phone)) {
                uniqueUsers.push(user);
                seenEmails.add(user.email);
                seenPhones.add(user.phone);
            }
        }
        
        const updatedData = {
            users: uniqueUsers,
            lastUpdated: new Date().toISOString(),
            totalUsers: uniqueUsers.length,
            cleanupPerformed: true,
            originalCount: existingData.users.length,
            removedDuplicates: existingData.users.length - uniqueUsers.length
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
            return { 
                success: true, 
                message: `تم تنظيف ${updatedData.removedDuplicates} مستخدم مكرر`,
                data: result 
            };
        } else {
            return { success: false, error: result };
        }
        
    } catch (error) {
        console.error('خطأ في تنظيف البيانات المكررة:', error);
        return { success: false, error: error };
    }
}
