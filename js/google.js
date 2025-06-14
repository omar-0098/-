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
    document.getElementById("submitPhone").addEventListener("click", function() {
        const phoneInput = document.getElementById("userPhone");
        const phoneError = document.getElementById("phoneError");
        const phoneNumber = phoneInput.value.trim();
        
        // إعادة تعيين رسالة الخطأ
        // phoneError.textContent = "";
        
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
            name: decoded.given_name || "غير معروف",
            family: decoded.family_name || "",
            email: decoded.email || "",
            phone: phoneNumber,
            registered: true
        };

        const formData = new FormData();
        formData.append("Nameo", userData.name);
        formData.append("FamilyName", userData.family);
        formData.append("Emailo", userData.email);
        formData.append("Phone", userData.phone);
        formData.append("Passwordo", "google");

        // إرسال البيانات إلى جوجل شيت
        fetch("https://script.google.com/macros/s/AKfycbzDPcLwO1U091L_W1Ha-M-_GjL5z6V7aFh6RxTberNq8tsYLIkkI1BtdF5ufA8qpSmvag/exec", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.result === "success") {
                localStorage.setItem("userData", JSON.stringify(userData));
                showWelcomeSection(userData.name);
                displayUserData(userData);
                overlay.style.display = "none";
                
                // إعادة تحميل الصفحة بعد نجاح التسجيل
                // setTimeout(() => {
                //     location.reload();
                // }, 1000); // تأخير ثانية واحدة ليرى المستخدم رسالة النجاح
                
            } else {
                showError("فشل تسجيل بيانات الدخول من Google");
            }
        })
        .catch(err => {
            console.error("Google login error:", err);
            showError("خطأ في تسجيل الدخول باستخدام Google");
        });
    });
}
