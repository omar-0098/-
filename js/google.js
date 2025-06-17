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

   setTimeout(() => {
    localStorage.setItem("userData", JSON.stringify(userData));
    showWelcomeSection(userData.name);
    displayUserData(userData);
    overlay.style.display = "none";
    
    // إزالة منع التمرير من الصفحة
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
    
    // حذف العنصر registerSection/person1 بطرق متعددة للتأكد
    deleteRegisterSection();
    
    // إعادة تفعيل أزرار السلة فوراً
    reactivateCartButtons();
    
    // إعادة تحميل الصفحة بعد تأخير أطول للتأكد من تفعيل الأزرار
    setTimeout(() => {
        window.location.reload();
    }, 4000);
    
}, 1500);

// دالة مخصصة لحذف عنصر التسجيل
function deleteRegisterSection() {
    console.log('محاولة حذف عنصر التسجيل...');
    
    // البحث بالـ ID أولاً
    let registerElement = document.getElementById("registerSection");
    
    // إذا لم يتم العثور عليه بالـ ID، ابحث بالكلاس
    if (!registerElement) {
        registerElement = document.querySelector(".person1");
    }
    
    // إذا لم يتم العثور عليه بعد، ابحث بكلاس person2 داخل person1
    if (!registerElement) {
        const person2Element = document.querySelector(".person2");
        if (person2Element) {
            registerElement = person2Element.closest(".person1");
        }
    }
    
    // إذا تم العثور على العنصر، احذفه
    if (registerElement) {
        // إضافة تأثير الاختفاء قبل الحذف
        registerElement.style.transition = "opacity 0.5s ease-out, transform 0.5s ease-out";
        registerElement.style.opacity = "0";
        registerElement.style.transform = "scale(0.8)";
        
        // حذف العنصر بعد انتهاء التأثير
        setTimeout(() => {
            registerElement.remove();
            console.log('✅ تم حذف عنصر التسجيل بنجاح');
            
            // إطلاق حدث مخصص للإشارة إلى حذف العنصر
            const elementDeletedEvent = new CustomEvent('registerSectionDeleted', {
                detail: { 
                    deletedAt: Date.now(),
                    elementType: 'registerSection'
                }
            });
            document.dispatchEvent(elementDeletedEvent);
            
        }, 500);
        
    } else {
        console.log('⚠️ لم يتم العثور على عنصر التسجيل للحذف');
        
        // محاولة أخيرة للبحث عن العنصر بكل الطرق الممكنة
        const allPossibleElements = [
            document.querySelector('[id="registerSection"]'),
            document.querySelector('.person1'),
            document.querySelector('.person2')?.parentElement,
            ...document.querySelectorAll('div').filter(div => 
                div.textContent.includes('انشاء حساب') || 
                div.innerHTML.includes('fa-regular fa-user')
            )
        ].filter(Boolean);
        
        if (allPossibleElements.length > 0) {
            console.log('🔍 تم العثور على عناصر محتملة:', allPossibleElements.length);
            
            allPossibleElements.forEach((element, index) => {
                if (element && element.remove) {
                    element.style.transition = "opacity 0.3s ease-out";
                    element.style.opacity = "0";
                    
                    setTimeout(() => {
                        element.remove();
                        console.log(`✅ تم حذف العنصر المحتمل ${index + 1}`);
                    }, 300);
                }
            });
        }
    }
}

// دالة إضافية لضمان الحذف عند تحميل الصفحة (في حالة وجود بيانات محفوظة)
function checkAndDeleteRegisterSectionOnLoad() {
    // التحقق من وجود بيانات مستخدم محفوظة
    const savedUserData = localStorage.getItem("userData");
    
    if (savedUserData) {
        try {
            const userData = JSON.parse(savedUserData);
            
            // إذا كان المستخدم مسجلاً، احذف عنصر التسجيل
            if (userData.registered === true) {
                console.log('🔄 مستخدم مسجل موجود، حذف عنصر التسجيل...');
                
                // انتظر قليلاً لضمان تحميل الصفحة كاملة
                setTimeout(() => {
                    deleteRegisterSection();
                }, 1000);
            }
        } catch (error) {
            console.error('خطأ في قراءة بيانات المستخدم المحفوظة:', error);
        }
    }
}

// تشغيل الفحص عند تحميל الصفحة
document.addEventListener('DOMContentLoaded', checkAndDeleteRegisterSectionOnLoad);

// تشغيل الفحص أيضاً عند تحميل النافذة (للتأكد)
window.addEventListener('load', () => {
    setTimeout(checkAndDeleteRegisterSectionOnLoad, 500);
});

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

// دالة جديدة لإعادة تفعيل أزرار السلة
function reactivateCartButtons() {
    console.log('إعادة تفعيل أزرار السلة...');
    
    // تطبيق تفعيل فوري أولاً
    activateButtons();
    
    // ثم إعادة تفعيل بعد 100ms
    setTimeout(() => {
        activateButtons();
    }, 100);
    
    // وإعادة تفعيل مرة أخرى بعد 300ms للتأكد
    setTimeout(() => {
        activateButtons();
    }, 300);
    
    // وإعادة تفعيل نهائية بعد 500ms
    setTimeout(() => {
        activateButtons();
        console.log('تم الانتهاء من تفعيل أزرار السلة');
    }, 500);
}

// دالة مساعدة لتفعيل الأزرار
function activateButtons() {
    const cartButtons = document.querySelectorAll('.btn_add_cart');
    console.log(`تفعيل ${cartButtons.length} زر سلة`);
    
    cartButtons.forEach((button, index) => {
        // إزالة event listeners السابقة
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // إضافة event listener جديد
        newButton.addEventListener('click', handleCartClick);
        
        // التأكد من أن الزر نشط
        newButton.disabled = false;
        newButton.style.pointerEvents = 'auto';
        newButton.style.opacity = '1';
        newButton.style.cursor = 'pointer';
        newButton.style.userSelect = 'none';
        
        // إضافة تأثير hover
        newButton.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        
        newButton.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
        
        console.log(`✓ تم تفعيل زر السلة ${index + 1} - المنتج: ${newButton.getAttribute('data-id')}`);
    });
    
    // إطلاق حدث التفعيل
    const cartActivatedEvent = new CustomEvent('cartButtonsActivated', {
        detail: { 
            buttonCount: cartButtons.length,
            timestamp: Date.now()
        }
    });
    document.dispatchEvent(cartActivatedEvent);
}

// دالة معالجة النقر على أزرار السلة
function handleCartClick(event) {
    // منع السلوك الافتراضي
    event.preventDefault();
    event.stopPropagation();
    
    console.log('🛒 تم النقر على زر السلة');
    
    const button = event.target.closest('.btn_add_cart');
    if (!button) {
        console.log('❌ لم يتم العثور على زر السلة');
        return;
    }
    
    // تعطيل الزر مؤقتاً لمنع النقر المتكرر
    button.style.pointerEvents = 'none';
    
    const productId = button.getAttribute('data-id');
    const isActive = button.classList.contains('active');
    
    console.log(`📦 معرف المنتج: ${productId}, في السلة: ${isActive}`);
    
    // إذا كانت لديك دالة خاصة لمعالجة إضافة المنتجات للسلة، استدعها هنا
    if (typeof addToCart === 'function') {
        addToCart(productId, button);
    } else if (typeof handleAddToCart === 'function') {
        handleAddToCart(productId, button);
    } else if (typeof toggleCart === 'function') {
        toggleCart(productId, button);
    } else {
        // كود افتراضي لإضافة/إزالة من السلة
        console.log('🔄 تنفيذ إضافة افتراضية للسلة');
        
        // إضافة تأثير بصري فوري
        button.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            if (isActive) {
                // إزالة من السلة
                button.classList.remove('active');
                button.innerHTML = '<i class="fa-solid fa-cart-plus"></i> اضف الي السلة';
                console.log('➖ تم إزالة المنتج من السلة');
            } else {
                // إضافة للسلة
                button.classList.add('active');
                button.innerHTML = '<i class="fa-solid fa-cart-plus"></i> تم اضافة الي السلة';
                console.log('➕ تم إضافة المنتج للسلة');
            }
            
            // إعادة الزر لحالته الطبيعية
            button.style.transform = 'scale(1)';
            button.style.pointerEvents = 'auto';
            
            // إطلاق حدث مخصص للإشارة إلى تغيير السلة
            const cartChangeEvent = new CustomEvent('cartChanged', {
                detail: { 
                    productId: productId, 
                    added: !isActive,
                    button: button,
                    timestamp: Date.now()
                }
            });
            document.dispatchEvent(cartChangeEvent);
            
        }, 150);
    }
    
    // إعادة تفعيل الزر بعد ثانية واحدة للأمان
    setTimeout(() => {
        button.style.pointerEvents = 'auto';
    }, 1000);
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



// === استراتيجية شاملة لحماية بيانات localStorage من الحذف ===

// 1. دالة حفظ محسنة مع تشفير وتكرار
function secureStorageSet(key, value, encrypt = true) {
    try {
        let dataToStore = value;
        
        // تشفير البيانات (اختياري)
        if (encrypt && typeof value === 'object') {
            dataToStore = btoa(JSON.stringify(value));
        }
        
        // حفظ في localStorage
        localStorage.setItem(key, typeof dataToStore === 'object' ? JSON.stringify(dataToStore) : dataToStore);
        
        // حفظ نسخة احتياطية في sessionStorage
        sessionStorage.setItem(key + '_backup', typeof dataToStore === 'object' ? JSON.stringify(dataToStore) : dataToStore);
        
        // حفظ نسخة في cookies (للبيانات الصغيرة)
        if (JSON.stringify(dataToStore).length < 4000) {
            document.cookie = `${key}=${encodeURIComponent(typeof dataToStore === 'object' ? JSON.stringify(dataToStore) : dataToStore)}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/`;
        }
        
        // حفظ في IndexedDB للبيانات الكبيرة
        saveToIndexedDB(key, dataToStore);
        
        console.log(`✅ تم حفظ ${key} في جميع وسائل التخزين`);
        return true;
    } catch (error) {
        console.error('خطأ في حفظ البيانات:', error);
        return false;
    }
}

// 2. دالة استرجاع محسنة مع البحث في جميع المصادر
function secureStorageGet(key, decrypt = true) {
    let data = null;
    
    try {
        // محاولة الحصول على البيانات من localStorage
        data = localStorage.getItem(key);
        
        // إذا لم توجد، ابحث في sessionStorage
        if (!data) {
            data = sessionStorage.getItem(key + '_backup');
            if (data) {
                console.log(`🔄 تم استرجاع ${key} من sessionStorage`);
                // إعادة حفظها في localStorage
                localStorage.setItem(key, data);
            }
        }
        
        // إذا لم توجد، ابحث في cookies
        if (!data) {
            data = getCookieValue(key);
            if (data) {
                console.log(`🔄 تم استرجاع ${key} من cookies`);
                // إعادة حفظها في localStorage
                localStorage.setItem(key, data);
            }
        }
        
        // إذا لم توجد، ابحث في IndexedDB
        if (!data) {
            data = await getFromIndexedDB(key);
            if (data) {
                console.log(`🔄 تم استرجاع ${key} من IndexedDB`);
                // إعادة حفظها في localStorage
                localStorage.setItem(key, typeof data === 'object' ? JSON.stringify(data) : data);
            }
        }
        
        if (data) {
            // فك التشفير إذا كان مطلوباً
            if (decrypt && typeof data === 'string') {
                try {
                    // محاولة فك تشفير base64
                    const decoded = atob(data);
                    return JSON.parse(decoded);
                } catch {
                    // إذا فشل فك التشفير، ارجع البيانات كما هي
                    try {
                        return JSON.parse(data);
                    } catch {
                        return data;
                    }
                }
            }
            
            try {
                return JSON.parse(data);
            } catch {
                return data;
            }
        }
        
        return null;
    } catch (error) {
        console.error('خطأ في استرجاع البيانات:', error);
        return null;
    }
}

// 3. دوال مساعدة للتعامل مع IndexedDB
function saveToIndexedDB(key, data) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('PersistentStorage', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('data')) {
                db.createObjectStore('data', { keyPath: 'key' });
            }
        };
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['data'], 'readwrite');
            const store = transaction.objectStore('data');
            
            store.put({ key: key, value: data, timestamp: Date.now() });
            
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
        };
    });
}

function getFromIndexedDB(key) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('PersistentStorage', 1);
        
        request.onerror = () => resolve(null);
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('data')) {
                resolve(null);
                return;
            }
            
            const transaction = db.transaction(['data'], 'readonly');
            const store = transaction.objectStore('data');
            const getRequest = store.get(key);
            
            getRequest.onsuccess = () => {
                resolve(getRequest.result ? getRequest.result.value : null);
            };
            
            getRequest.onerror = () => resolve(null);
        };
    });
}

// 4. دالة مساعدة للحصول على قيمة من cookies
function getCookieValue(name) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === name) {
            return decodeURIComponent(value);
        }
    }
    return null;
}

// 5. مراقبة localStorage وإعادة الحفظ التلقائي
function monitorLocalStorage() {
    const CRITICAL_KEYS = ['userData', 'userInfo', 'loginData']; // أضف المفاتيح المهمة هنا
    
    setInterval(() => {
        CRITICAL_KEYS.forEach(key => {
            const data = localStorage.getItem(key);
            if (!data) {
                console.warn(`⚠️ تم حذف ${key} من localStorage، جاري الاسترجاع...`);
                
                // محاولة الاسترجاع من المصادر البديلة
                const recovered = secureStorageGet(key);
                if (recovered) {
                    localStorage.setItem(key, typeof recovered === 'object' ? JSON.stringify(recovered) : recovered);
                    console.log(`✅ تم استرجاع ${key} بنجاح`);
                }
            }
        });
    }, 5000); // فحص كل 5 ثوانٍ
}

// 6. حماية من حذف localStorage برمجياً
function protectLocalStorage() {
    const originalClear = Storage.prototype.clear;
    const originalRemoveItem = Storage.prototype.removeItem;
    
    const PROTECTED_KEYS = ['userData', 'userInfo', 'loginData'];
    
    // حماية من clear()
    Storage.prototype.clear = function() {
        console.warn('🛡️ محاولة حذف localStorage محظورة للبيانات المحمية');
        
        // حفظ البيانات المحمية
        const protectedData = {};
        PROTECTED_KEYS.forEach(key => {
            const value = this.getItem(key);
            if (value) {
                protectedData[key] = value;
            }
        });
        
        // تنفيذ الحذف الأصلي
        originalClear.call(this);
        
        // إعادة البيانات المحمية
        Object.keys(protectedData).forEach(key => {
            this.setItem(key, protectedData[key]);
        });
        
        console.log('✅ تم الحفاظ على البيانات المحمية');
    };
    
    // حماية من removeItem()
    Storage.prototype.removeItem = function(key) {
        if (PROTECTED_KEYS.includes(key)) {
            console.warn(`🛡️ محاولة حذف ${key} محظورة - البيانات محمية`);
            return;
        }
        
        originalRemoveItem.call(this, key);
    };
}

// 7. تطبيق Storage Persistence API
async function requestPersistentStorage() {
    if ('storage' in navigator && 'persist' in navigator.storage) {
        try {
            const isPersistent = await navigator.storage.persist();
            if (isPersistent) {
                console.log('✅ تم تفعيل التخزين الدائم');
            } else {
                console.log('⚠️ لم يتم منح إذن التخزين الدائم');
            }
        } catch (error) {
            console.error('خطأ في طلب التخزين الدائم:', error);
        }
    }
}

// 8. نسخ احتياطي دوري للخادم
function backupToServer(userData) {
    if (!userData) return;
    
    try {
        // إرسال نسخة احتياطية كل 10 دقائق
        setInterval(async () => {
            try {
                await fetch('/api/backup-user-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: userData.email,
                        data: userData,
                        timestamp: Date.now()
                    })
                });
                console.log('✅ تم إرسال نسخة احتياطية للخادم');
            } catch (error) {
                console.error('خطأ في النسخ الاحتياطي:', error);
            }
        }, 10 * 60 * 1000); // كل 10 دقائق
    } catch (error) {
        console.error('خطأ في إعداد النسخ الاحتياطي:', error);
    }
}

// 9. تطبيق الحماية على الكود الموجود
function initializePersistentStorage() {
    console.log('🚀 تهيئة نظام التخزين الدائم...');
    
    // تفعيل الحماية
    protectLocalStorage();
    
    // بدء المراقبة
    monitorLocalStorage();
    
    // طلب التخزين الدائم
    requestPersistentStorage();
    
    console.log('✅ تم تفعيل نظام الحماية الشامل');
}

// 10. دالة محسنة لحفظ بيانات المستخدم (تحديث للكود الموجود)
function saveUserDataPermanently(userData) {
    console.log('💾 حفظ بيانات المستخدم بشكل دائم...');
    
    // حفظ في جميع وسائل التخزين
    secureStorageSet('userData', userData);
    secureStorageSet('userInfo', {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        lastLogin: Date.now()
    });
    
    // نسخ احتياطي للخادم
    backupToServer(userData);
    
    console.log('✅ تم حفظ بيانات المستخدم في جميع المواقع');
}

// 11. دالة للتحقق من وجود البيانات واستعادتها
async function checkAndRestoreUserData() {
    console.log('🔍 البحث عن بيانات المستخدم...');
    
    let userData = secureStorageGet('userData');
    
    if (!userData) {
        console.log('⚠️ لم يتم العثور على بيانات المستخدم، محاولة الاستعادة...');
        
        // محاولة الاستعادة من جميع المصادر
        userData = await secureStorageGet('userData');
        
        if (userData) {
            console.log('✅ تم استعادة بيانات المستخدم');
            // إعادة حفظها في localStorage
            saveUserDataPermanently(userData);
        }
    }
    
    return userData;
}

// === تطبيق التحسينات على الكود الموجود ===

// تحديث دالة logineCallback لاستخدام النظام الجديد
function enhancedLogineCallback(response) {
    const decoded = jwt_decode(response.credential);
    
    // باقي الكود نفسه حتى وصول لحفظ userData
    // استبدال السطر:
    // localStorage.setItem("userData", JSON.stringify(userData));
    // بـ:
    saveUserDataPermanently(userData);
    
    // باقي الكود...
}

// === تشغيل النظام ===
// تشغيل النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initializePersistentStorage();
    
    // فحص البيانات الموجودة
    checkAndRestoreUserData().then(userData => {
        if (userData) {
            console.log('👤 تم العثور على بيانات المستخدم:', userData.name);
            // تطبيق واجهة المستخدم المناسبة
            showWelcomeSection(userData.name);
            displayUserData(userData);
        }
    });
});

// === مثال للاستخدام ===
/*
// حفظ البيانات
const userData = {
    name: "أحمد محمد",
    email: "ahmed@example.com",
    phone: "01234567890"
};

saveUserDataPermanently(userData);

// استرجاع البيانات
const retrievedData = secureStorageGet('userData');
console.log(retrievedData);
*/
