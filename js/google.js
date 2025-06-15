// دالة للتحقق من حالة تسجيل الدخول عند تحميل الصفحة
function checkLoginStatus() {
    try {
        const userData = localStorage.getItem("userData");
        
        if (userData) {
            const parsedUserData = JSON.parse(userData);
            
            // التحقق من أن البيانات صالحة ومكتملة
            if (parsedUserData && parsedUserData.email && parsedUserData.phone && parsedUserData.registered) {
                console.log('تم العثور على بيانات مستخدم صالحة:', parsedUserData);
                
                // تحديث واجهة المستخدم لتظهر أن المستخدم مسجل الدخول
                showWelcomeSection(parsedUserData.name);
                displayUserData(parsedUserData);
                updateUIAfterSuccessfulRegistration();
                
                return true; // المستخدم مسجل الدخول
            }
        }
        
        return false; // المستخدم غير مسجل الدخول
    } catch (error) {
        console.error('خطأ في التحقق من حالة تسجيل الدخول:', error);
        // في حالة وجود خطأ، امسح البيانات المعطوبة
        localStorage.removeItem("userData");
        return false;
    }
}

// دالة لتسجيل الخروج
function logout() {
    try {
        // مسح بيانات المستخدم من localStorage
        localStorage.removeItem("userData");
        
        // إخفاء قسم الترحيب
        const welcomeSection = document.getElementById('welcomeSection');
        if (welcomeSection) {
            welcomeSection.style.display = 'none';
        }
        
        // إخفاء بيانات المستخدم
        const userDataSection = document.getElementById('userDataSection');
        if (userDataSection) {
            userDataSection.style.display = 'none';
        }
        
        // إظهار رسالة "يجب إنشاء حساب" مرة أخرى
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
        
        console.log('تم تسجيل الخروج بنجاح');
        
        // إعادة تحميل الصفحة (اختياري)
        // window.location.reload();
        
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
    }
}

// دالة محسنة لتحديث الواجهة بعد التسجيل الناجح
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
    });
    
    // تحديث أي عناصر أخرى متعلقة بحالة تسجيل الدخول
    const man1 = document.querySelector('.man1');
    if (man1) {
        man1.style.display = 'block';
    }
    
    // التأكد من أن الصفحة قابلة للتمرير بشكل طبيعي
    document.body.classList.remove('no-scroll', 'modal-open', 'overlay-open');
    
    // إضافة زر تسجيل الخروج إذا لم يكن موجوداً
    addLogoutButton();
    
    console.log('تم تحديث واجهة المستخدم بعد التسجيل الناجح مع تفعيل التمرير');
}

// دالة لإضافة زر تسجيل الخروج
function addLogoutButton() {
    // التحقق من وجود الزر مسبقاً
    if (document.getElementById('logoutButton')) {
        return;
    }
    
    // إنشاء زر تسجيل الخروج
    const logoutButton = document.createElement('button');
    logoutButton.id = 'logoutButton';
    logoutButton.textContent = 'تسجيل الخروج';
    logoutButton.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        background-color: #dc3545;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 5px;
        cursor: pointer;
        z-index: 1000;
        font-size: 14px;
    `;
    
    // إضافة حدث النقر
    logoutButton.addEventListener('click', logout);
    
    // إضافة الزر إلى الصفحة
    document.body.appendChild(logoutButton);
}

// دالة محسنة لحفظ بيانات المستخدم
function saveUserData(userData) {
    try {
        // إضافة timestamp لتتبع وقت الحفظ
        const dataToSave = {
            ...userData,
            lastLogin: new Date().toISOString(),
            registered: true
        };
        
        localStorage.setItem("userData", JSON.stringify(dataToSave));
        console.log('تم حفظ بيانات المستخدم بنجاح');
        return true;
    } catch (error) {
        console.error('خطأ في حفظ بيانات المستخدم:', error);
        return false;
    }
}

// دالة للحصول على بيانات المستخدم
function getUserData() {
    try {
        const userData = localStorage.getItem("userData");
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('خطأ في قراءة بيانات المستخدم:', error);
        return null;
    }
}

// تحديث دالة logineCallback لتستخدم الدالة المحسنة لحفظ البيانات
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
        this.value = this.value.replace(/[^0-9]/g, '');
        
        if (this.value.length > 0 && this.value[0] !== '0') {
            this.value = '0' + this.value.replace(/^0+/, '');
        }
        
        if (this.value.length > 11) {
            this.value = this.value.slice(0, 11);
        }
        
        const phoneError = document.getElementById("phoneError");
        if (phoneError) {
            phoneError.style.display = "none";
        }
    });
    
    // التعامل مع إرسال رقم الهاتف
    document.getElementById("submitPhone").addEventListener("click", async function() {
        const phoneInput = document.getElementById("userPhone");
        const phoneError = document.getElementById("phoneError");
        const phoneNumber = phoneInput.value.trim();
        
        phoneError.style.display = "none";
        
        // التحقق من الشروط
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

        try {
            const duplicateCheck = await checkDuplicateUser(decoded.email, phoneNumber);
            
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
            formData.append("Nameo", userData.name);
            formData.append("FamilyName", userData.family);
            formData.append("Emailo", userData.email);
            formData.append("Phone", userData.phone);
            formData.append("Passwordo", "google");
            formData.append("copon1", "");
            formData.append("copon2", "");

            let googleSheetsSuccess = false;
            let jsonBinSuccess = false;

            try {
                const googleResponse = await sendToGoogleSheets(formData);
                if (googleResponse.result === "success") {
                    googleSheetsSuccess = true;
                    console.log('تم إرسال البيانات إلى Google Sheets بنجاح');
                }
            } catch (error) {
                console.error('خطأ في إرسال البيانات إلى Google Sheets:', error);
            }

            try {
                jsonBinSuccess = await sendToJSONBin(userData);
            } catch (error) {
                console.error('خطأ في إرسال البيانات إلى JSONBin:', error);
            }

            if (googleSheetsSuccess && jsonBinSuccess) {
                showPhoneSuccess("تم التسجيل بنجاح في جميع المنصات!");
            } else if (googleSheetsSuccess || jsonBinSuccess) {
                const platforms = [];
                if (googleSheetsSuccess) platforms.push("Google Sheets");
                if (jsonBinSuccess) platforms.push("JSONBin");
                showPhoneWarning(`تم التسجيل بنجاح في: ${platforms.join(', ')}`);
            } else {
                showPhoneError("فشل في التسجيل. يرجى المحاولة مرة أخرى.");
                return;
            }

            setTimeout(() => {
                // استخدام الدالة المحسنة لحفظ البيانات
                saveUserData(userData);
                showWelcomeSection(userData.name);
                displayUserData(userData);
                overlay.style.display = "none";
                updateUIAfterSuccessfulRegistration();
            }, 2000);

        } catch (error) {
            console.error('خطأ في عملية التسجيل:', error);
            showPhoneError("حدث خطأ أثناء التحقق من البيانات. يرجى المحاولة مرة أخرى.");
        }
    });
    
    // دوال المساعدة
    function showPhoneError(message) {
        const phoneError = document.getElementById("phoneError");
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

    function showPhoneSuccess(message) {
        const phoneError = document.getElementById("phoneError");
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

    function showPhoneWarning(message) {
        const phoneError = document.getElementById("phoneError");
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

    function showPhoneLoading(message) {
        const phoneError = document.getElementById("phoneError");
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

// استدعاء دالة التحقق من حالة تسجيل الدخول عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('تم تحميل الصفحة، جاري التحقق من حالة تسجيل الدخول...');
    checkLoginStatus();
});

// إضافة مستمع لتحميل النافذة كبديل
window.addEventListener('load', function() {
    console.log('تم تحميل النافذة بالكامل، جاري التحقق من حالة تسجيل الدخول...');
    checkLoginStatus();
});
