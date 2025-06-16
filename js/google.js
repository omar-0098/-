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
    document.getElementById("submitPhone").addEventListener("click", async function() {
        const phoneInput = document.getElementById("userPhone");
        const phoneError = document.getElementById("phoneError");
        const phoneNumber = phoneInput.value.trim();
        
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

        try {
            // التحقق من تكرار الإيميل والتليفون
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
                // إرسال إلى Google Sheets
                const googleResponse = await sendToGoogleSheets(formData);
                
                if (googleResponse.result === "success") {
                    googleSheetsSuccess = true;
                    console.log('تم إرسال البيانات إلى Google Sheets بنجاح');
                }
            } catch (error) {
                console.error('خطأ في إرسال البيانات إلى Google Sheets:', error);
            }

            try {
                // إرسال إلى JSONBin
                jsonBinSuccess = await sendToJSONBin(userData);
            } catch (error) {
                console.error('خطأ في إرسال البيانات إلى JSONBin:', error);
            }

            // إظهار النتائج
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

            // إخفاء النافذة بعد ثانيتين مع تنفيذ المطلوب
            setTimeout(() => {
                localStorage.setItem("userData", JSON.stringify(userData));
                
                // تعيين علامة في localStorage تشير إلى أن المستخدم مسجل
                localStorage.setItem("userLoggedIn", "true");
                localStorage.setItem("loginTimestamp", Date.now().toString());
                
                showWelcomeSection(userData.name);
                displayUserData(userData);
                overlay.style.display = "none";
                
                // إزالة منع التمرير من الصفحة
                document.body.style.overflow = "auto";
                document.documentElement.style.overflow = "auto";
                
                // حذف العنصر person1 إذا كان موجوداً
                const person1Element = document.getElementById("person1");
                if (person1Element) {
                    person1Element.remove();
                    console.log('تم حذف العنصر person1');
                }
                
                // إعادة تحميل الصفحة (الأزرار ستُفعل بعد إعادة التحميل)
                setTimeout(() => {
                    window.location.reload();
                }, 500);
                
            }, 2000);

        } catch (error) {
            console.error('خطأ في عملية التسجيل:', error);
            showPhoneError("حدث خطأ أثناء التحقق من البيانات. يرجى المحاولة مرة أخرى.");
        }
    });
    
    // دوال المساعدة لرسائل رقم الهاتف
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

// دالة لإرسال البيانات إلى Google Sheets مع إعدادات محسنة
async function sendToGoogleSheets(formData) {
    const scriptURL = "https://script.google.com/macros/s/AKfycbzDPcLwO1U091L_W1Ha-M-_GjL5z6V7aFh6RxTberNq8tsYLIkkI1BtdF5ufA8qpSmvag/exec";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // مهلة زمنية 10 ثوانٍ

    try {
        const response = await fetch(scriptURL, {
            method: "POST",
            body: formData,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('انتهت المهلة الزمنية للطلب');
        }
        throw error;
    }
}

// دالة لإرسال البيانات إلى JSONBin
async function sendToJSONBin(userData) {
    // إعدادات JSONBin
    const JSONBIN_CONFIG = {
        API_KEY: "$2a$10$xAWjC3zelpDKCd6zdOdUg.D0bwtEURjcR5sEiYdonjBmP5lHuqzq2",
        BIN_ID: "6848177e8960c979a5a77f85",
        BASE_URL: "https://api.jsonbin.io/v3"
    };

    try {
        // أولاً، احصل على البيانات المحفوظة
        const response = await fetch(`${JSONBIN_CONFIG.BASE_URL}/b/${JSONBIN_CONFIG.BIN_ID}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.API_KEY,
                'Content-Type': 'application/json'
            }
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
            body: JSON.stringify(existingData)
        });

        if (updateResponse.ok) {
            console.log('تم إرسال البيانات إلى JSONBin بنجاح');
            return true;
        } else {
            throw new Error('فشل في إرسال البيانات إلى JSONBin');
        }
    } catch (error) {
        console.error('خطأ في إرسال البيانات إلى JSONBin:', error);
        return false;
    }
}

// دالة للتحقق من تكرار الإيميل والتليفون في JSONBin
async function checkDuplicateUser(email, phone) {
    const JSONBIN_CONFIG = {
        API_KEY: "$2a$10$xAWjC3zelpDKCd6zdOdUg.D0bwtEURjcR5sEiYdonjBmP5lHuqzq2",
        BIN_ID: "6848177e8960c979a5a77f85",
        BASE_URL: "https://api.jsonbin.io/v3"
    };

    try {
        const response = await fetch(`${JSONBIN_CONFIG.BASE_URL}/b/${JSONBIN_CONFIG.BIN_ID}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.API_KEY,
                'Content-Type': 'application/json'
            }
        });

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
        console.error('خطأ في التحقق من التكرار:', error);
        // في حالة الخطأ، نسمح بالمتابعة لتجنب منع التسجيل كلياً
        return {
            emailExists: false,
            phoneExists: false,
            duplicateEmail: null,
            duplicatePhone: null
        };
    }
}

// دالة لتفعيل أزرار "أضف إلى السلة" بعد التسجيل
function enableAddToCartButtons() {
    console.log('بدء تفعيل أزرار السلة...');
    
    // قائمة شاملة بجميع أنواع أزرار السلة المحتملة
    const buttonSelectors = [
        '.add-to-cart',
        '.btn-cart', 
        '.cart-btn',
        '.add-cart',
        '.buy-now',
        '.purchase-btn',
        '.order-btn',
        '[data-action="add-to-cart"]',
        '[data-cart]',
        'button[onclick*="addToCart"]',
        'button[onclick*="buyNow"]',
        'button[onclick*="purchase"]',
        '#addToCartBtn',
        '#buyNowBtn',
        '#purchaseBtn',
        '.btn[data-product-id]',
        'button[data-product-id]',
        '.product-btn',
        '.shop-btn'
    ];
    
    let enabledCount = 0;
    
    buttonSelectors.forEach(selector => {
        try {
            const buttons = document.querySelectorAll(selector);
            buttons.forEach(button => {
                // تفعيل الزر
                button.disabled = false;
                button.removeAttribute('disabled');
                
                // إزالة الكلاسات التي تجعل الزر غير نشط
                const disabledClasses = ['disabled', 'btn-disabled', 'inactive', 'not-available', 'login-required'];
                disabledClasses.forEach(cls => button.classList.remove(cls));
                
                // إضافة كلاسات التفعيل
                button.classList.add('active', 'enabled', 'available');
                
                // تحديث النص
                const currentText = button.textContent.trim();
                if (currentText.includes('سجل') || currentText.includes('تسجيل') || 
                    currentText.includes('دخول') || currentText.includes('login')) {
                    button.textContent = 'أضف إلى السلة';
                }
                
                // تحديث الأنماط
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
                button.style.pointerEvents = 'auto';
                button.style.backgroundColor = button.style.backgroundColor || '#007bff';
                button.style.color = button.style.color || '#fff';
                
                // إزالة أي تنبيهات تسجيل دخول
                if (button.onclick) {
                    const onclickStr = button.onclick.toString();
                    if (onclickStr.includes('login') || onclickStr.includes('تسجيل')) {
                        // الاحتفاظ بمعرف المنتج إن وجد
                        const productId = button.getAttribute('data-product-id') || 
                                        button.getAttribute('data-id') ||
                                        button.getAttribute('product-id');
                        
                        button.onclick = function(e) {
                            e.preventDefault();
                            console.log('تم النقر على زر السلة للمنتج:', productId);
                            
                            // يمكنك استبدال هذا بدالة السلة الخاصة بك
                            if (window.addToCart && productId) {
                                window.addToCart(productId);
                            } else if (window.buyNow && productId) {
                                window.buyNow(productId);
                            } else {
                                alert('تم إضافة المنتج إلى السلة بنجاح!');
                            }
                        };
                    }
                }
                
                enabledCount++;
            });
        } catch (error) {
            console.warn('خطأ في معالجة المحدد:', selector, error);
        }
    });
    
    console.log(`تم تفعيل ${enabledCount} زر من أزرار السلة`);
    
    // البحث عن أي روابط تحتوي على كلمات السلة وتفعيلها
    const cartLinks = document.querySelectorAll('a[href*="cart"], a[href*="buy"], a[href*="purchase"]');
    cartLinks.forEach(link => {
        link.style.pointerEvents = 'auto';
        link.style.opacity = '1';
        link.classList.remove('disabled');
    });
    
    // إرسال حدث مخصص
    const event = new CustomEvent('cartButtonsEnabled', {
        detail: { enabledCount: enabledCount }
    });
    document.dispatchEvent(event);
    
    console.log('تم تفعيل أزرار السلة بعد التسجيل الناجح');
    
    // إرسال حدث مخصص للإشارة إلى أن المستخدم سجل دخوله
    const userLoggedInEvent = new CustomEvent('userLoggedIn', {
        detail: { message: 'تم تسجيل الدخول بنجاح' }
    });
    document.dispatchEvent(userLoggedInEvent);
}

// دالة للتحقق من حالة تسجيل الدخول وتفعيل الأزرار عند تحميل الصفحة
function checkLoginStatusAndEnableButtons() {
    const userLoggedIn = localStorage.getItem("userLoggedIn");
    const userData = localStorage.getItem("userData");
    
    if (userLoggedIn === "true" && userData) {
        console.log('المستخدم مسجل دخول، جاري تفعيل أزرار السلة...');
        enableAddToCartButtons();
        
        // إزالة العنصر person1 إذا كان موجوداً
        const person1Element = document.getElementById("person1");
        if (person1Element) {
            person1Element.remove();
            console.log('تم حذف العنصر person1');
        }
        
        // التأكد من أن التمرير مفعل
        document.body.style.overflow = "auto";
        document.documentElement.style.overflow = "auto";
    }
}

// تشغيل الدالة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', checkLoginStatusAndEnableButtons);

// تشغيل الدالة أيضاً إذا كان DOM محمل بالفعل
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkLoginStatusAndEnableButtons);
} else {
    checkLoginStatusAndEnableButtons();
}
