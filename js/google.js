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
