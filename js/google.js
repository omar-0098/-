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
                console.log("تم إرسال البيانات بنجاح إلى كل من JSONBin و Google Sheets");
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

// دالة لإرسال البيانات إلى JSONBin.io
async function sendToJSONBin(userData) {
    try {
        const response = await fetch('https://api.jsonbin.io/v3/b', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': '$2a$10$xAWjC3zelpDKCd6zdOdUg.D0bwtEURjcR5sEiYdonjBmP5lHuqzq2', // ضع مفتاح API الخاص بك هنا
                'X-Bin-Name': `user_${userData.id}`,
                'X-Collection-Id': '6848177e8960c979a5a77f85' // اختياري: إذا كنت تريد تجميع البيانات
            },
            body: JSON.stringify(userData)
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
        
        const response = await fetch('https://api.jsonbin.io/v3/b/YOUR_BIN_ID', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': '$2a$10$xAWjC3zelpDKCd6zdOdUg.D0bwtEURjcR5sEiYdonjBmP5lHuqzq2'
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
        const response = await fetch('https://api.jsonbin.io/v3/b/YOUR_BIN_ID/latest', {
            method: 'GET',
            headers: {
                'X-Master-Key': '$2a$10$xAWjC3zelpDKCd6zdOdUg.D0bwtEURjcR5sEiYdonjBmP5lHuqzq2'
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
