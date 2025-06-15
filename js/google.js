
// إصلاح دالة logineCallback لمنع تجميد الصفحة
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
    
    // التعامل مع إرسال رقم الهاتف - تحسين لمنع التجميد
    document.getElementById("submitPhone").addEventListener("click", function() {
        // استخدام setTimeout لتجنب blocking الـ UI thread
        setTimeout(async () => {
            await handlePhoneSubmission(decoded);
        }, 10);
    });
}

// فصل منطق التعامل مع إرسال الهاتف في دالة منفصلة
async function handlePhoneSubmission(decoded) {
    const phoneInput = document.getElementById("userPhone");
    const phoneError = document.getElementById("phoneError");
    const submitButton = document.getElementById("submitPhone");
    const phoneNumber = phoneInput.value.trim();
    
    // منع الضغط المتكرر على الزر
    submitButton.disabled = true;
    submitButton.textContent = "جاري المعالجة...";
    
    try {
        // إخفاء رسالة الخطأ أولاً
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
        
        // إظهار رسالة التحقق من التكرار
        showPhoneLoading("جاري التحقق من البيانات...");

        // التحقق من تكرار الإيميل والتليفون مع timeout
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

        // إذا لم يكن هناك تكرار، تابع عملية التسجيل
        showPhoneLoading("جاري إرسال البيانات...");

        // إعداد بيانات المستخدم مع رقم الهاتف
        const userData = {
            name: decoded.given_name || "غير معروف",
            family: decoded.family_name || "",
            email: decoded.email || "",
            phone: phoneNumber,
            registered: true,
            copon1: "",
            copon2: ""
        };

        // إرسال البيانات مع معالجة أفضل للأخطاء
        const registrationResult = await performRegistration(userData);
        
        if (registrationResult.success) {
            showPhoneSuccess(registrationResult.message);
            
            // إخفاء النافذة بعد ثانيتين وتحديث الواجهة
            setTimeout(() => {
                try {
                    localStorage.setItem("userData", JSON.stringify(userData));
                    showWelcomeSection(userData.name);
                    displayUserData(userData);
                    document.getElementById("overlay").style.display = "none";
                    updateUIAfterSuccessfulRegistration();
                } catch (error) {
                    console.error('خطأ في تحديث الواجهة:', error);
                    // حتى لو حدث خطأ في التحديث، اخفي النافذة
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
        // إعادة تفعيل الزر في جميع الحالات
        submitButton.disabled = false;
        submitButton.textContent = "تسجيل";
    }
}

// دالة منفصلة لمعالجة التسجيل
async function performRegistration(userData) {
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
    let errors = [];

    // إرسال إلى Google Sheets مع timeout
    try {
        const googleResponse = await Promise.race([
            sendToGoogleSheets(formData),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Google Sheets Timeout')), 10000)
            )
        ]);
        
        if (googleResponse && googleResponse.result === "success") {
            googleSheetsSuccess = true;
            console.log('تم إرسال البيانات إلى Google Sheets بنجاح');
        }
    } catch (error) {
        console.error('خطأ في إرسال البيانات إلى Google Sheets:', error);
        errors.push('Google Sheets');
    }

    // إرسال إلى JSONBin مع timeout
    try {
        jsonBinSuccess = await Promise.race([
            sendToJSONBin(userData),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('JSONBin Timeout')), 10000)
            )
        ]);
    } catch (error) {
        console.error('خطأ في إرسال البيانات إلى JSONBin:', error);
        errors.push('JSONBin');
    }

    // تحديد نتيجة العملية
    if (googleSheetsSuccess && jsonBinSuccess) {
        return {
            success: true,
            message: "تم التسجيل بنجاح في جميع المنصات!"
        };
    } else if (googleSheetsSuccess || jsonBinSuccess) {
        const platforms = [];
        if (googleSheetsSuccess) platforms.push("Google Sheets");
        if (jsonBinSuccess) platforms.push("JSONBin");
        return {
            success: true,
            message: `تم التسجيل بنجاح في: ${platforms.join(', ')}`
        };
    } else {
        return {
            success: false,
            message: "فشل في التسجيل. يرجى المحاولة مرة أخرى."
        };
    }
}

// تحسين دالة إرسال البيانات إلى Google Sheets
async function sendToGoogleSheets(formData) {
    const scriptURL = "https://script.google.com/macros/s/AKfycbzDPcLwO1U091L_W1Ha-M-_GjL5z6V7aFh6RxTberNq8tsYLIkkI1BtdF5ufA8qpSmvag/exec";
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // تقليل المهلة الزمنية

        const response = await fetch(scriptURL, {
            method: "POST",
            body: formData,
            signal: controller.signal,
            // إضافة headers للتحسين
            headers: {
                'Accept': 'application/json'
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // التحقق من وجود محتوى قبل محاولة parsing
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data;
        } else {
            // إذا لم تكن النتيجة JSON، اعتبرها نجاح
            return { result: "success" };
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('انتهت المهلة الزمنية للطلب');
        }
        throw error;
    }
}

// تحسين دالة إرسال البيانات إلى JSONBin
async function sendToJSONBin(userData) {
    const JSONBIN_CONFIG = {
        API_KEY: "$2a$10$xAWjC3zelpDKCd6zdOdUg.D0bwtEURjcR5sEiYdonjBmP5lHuqzq2",
        BIN_ID: "6848177e8960c979a5a77f85",
        BASE_URL: "https://api.jsonbin.io/v3"
    };

    try {
        // إنشاء controller للتحكم في الـ timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        // أولاً، احصل على البيانات المحفوظة
        const response = await fetch(`${JSONBIN_CONFIG.BASE_URL}/b/${JSONBIN_CONFIG.BIN_ID}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.API_KEY,
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });

        let existingData = [];
        if (response.ok) {
            const result = await response.json();
            existingData = Array.isArray(result.record) ? result.record : [];
        }

        // أضف البيانات الجديدة مع معرف فريد وتاريخ
        const newEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...userData
        };
        
        existingData.push(newEntry);

        // ارسل البيانات المحدثة
        const updateResponse = await fetch(`${JSONBIN_CONFIG.BASE_URL}/b/${JSONBIN_CONFIG.BIN_ID}`, {
            method: 'PUT',
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(existingData),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (updateResponse.ok) {
            console.log('تم إرسال البيانات إلى JSONBin بنجاح');
            return true;
        } else {
            throw new Error('فشل في إرسال البيانات إلى JSONBin');
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('انتهت المهلة الزمنية لـ JSONBin');
        } else {
            console.error('خطأ في إرسال البيانات إلى JSONBin:', error);
        }
        return false;
    }
}

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
