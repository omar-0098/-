// إعدادات Cloudinary
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dzczc4gss/image/upload';
const UPLOAD_PRESET = 'omar009';

// دالة مبسطة وفعالة لرفع الصورة
async function uploadToCloudinary() {
    console.log('🚀 بدء رفع الصورة...');
    
    try {
        // 1. قراءة البيانات من localStorage
        const userDataString = localStorage.getItem('userData');
        if (!userDataString) {
            console.error('❌ لا توجد بيانات في localStorage');
            return;
        }
        
        const userData = JSON.parse(userDataString);
        console.log('✅ تم قراءة البيانات من localStorage');
        
        // 2. التحقق من وجود الصورة
        if (!userData.profileImage || !userData.profileImage.startsWith('data:image/')) {
            console.error('❌ لا توجد صورة صالحة');
            return;
        }
        
        console.log('✅ الصورة موجودة، الحجم:', userData.profileImage.length, 'حرف');
        
        // 3. تحويل base64 إلى blob بطريقة صحيحة
        const base64Data = userData.profileImage.split(',')[1];
        const mimeType = userData.profileImage.match(/data:([^;]+);/)[1];
        
        console.log('📝 نوع الملف:', mimeType);
        
        // تحويل base64 إلى binary array
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { type: mimeType });
        console.log('✅ تم تحويل الصورة إلى blob، الحجم:', blob.size, 'بايت');
        
        // 4. إنشاء FormData
        const formData = new FormData();
        formData.append('file', blob, 'profile.jpg');
        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('folder', 'profile_images');
        
        console.log('📤 جاري الرفع إلى Cloudinary...');
        
        // 5. رفع الصورة
        const response = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: formData
        });
        
        console.log('📡 رد الخادم:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ خطأ من Cloudinary:', errorText);
            
            // محاولة تحليل الخطأ
            try {
                const errorJson = JSON.parse(errorText);
                console.error('تفاصيل الخطأ:', errorJson);
            } catch (e) {
                console.error('نص الخطأ:', errorText);
            }
            
            return;
        }
        
        const result = await response.json();
        console.log('🎉 تم الرفع بنجاح!');
        console.log('🔗 رابط الصورة:', result.secure_url);
        
        // 6. تحديث localStorage
        userData.profileImage = result.secure_url;
        userData.cloudinaryPublicId = result.public_id;
        userData.uploadDate = new Date().toISOString();
        
        localStorage.setItem('userData', JSON.stringify(userData));
        console.log('💾 تم تحديث localStorage');
        
        // 7. عرض الصورة الجديدة
        displayImage(result.secure_url);
        
        return result;
        
    } catch (error) {
        console.error('💥 خطأ عام:', error);
        
        // تفاصيل إضافية للتشخيص
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.error('🌐 مشكلة في الشبكة أو CORS');
        } else if (error.name === 'SyntaxError') {
            console.error('📝 مشكلة في تحليل البيانات');
        }
        
        return null;
    }
}

// دالة لعرض الصورة
function displayImage(imageUrl) {
    console.log('🖼️ عرض الصورة...');
    
    // إنشاء عنصر img
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = `
        width: 150px;
        height: 150px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid #4CAF50;
        margin: 10px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    `;
    
    // إضافة عنوان
    const title = document.createElement('h3');
    title.textContent = 'صورة البروفايل الجديدة:';
    title.style.cssText = 'color: #4CAF50; font-family: Arial, sans-serif;';
    
    // إضافة العناصر للصفحة
    document.body.appendChild(title);
    document.body.appendChild(img);
    
    console.log('✅ تم عرض الصورة في الصفحة');
}

// دالة فحص سريع للبيانات
function checkData() {
    console.log('🔍 فحص البيانات...');
    
    const userData = localStorage.getItem('userData');
    if (!userData) {
        console.log('❌ لا توجد بيانات');
        return false;
    }
    
    try {
        const parsed = JSON.parse(userData);
        console.log('📊 البيانات:');
        console.log('- الاسم:', parsed.name);
        console.log('- الإيميل:', parsed.email);
        console.log('- يوجد صورة:', !!parsed.profileImage);
        
        if (parsed.profileImage) {
            console.log('- نوع الصورة:', parsed.profileImage.substring(0, 30) + '...');
            console.log('- حجم الصورة:', parsed.profileImage.length, 'حرف');
            
            // فحص إذا كانت الصورة على Cloudinary بالفعل
            if (parsed.profileImage.includes('cloudinary.com')) {
                console.log('ℹ️ الصورة موجودة على Cloudinary بالفعل');
                console.log('🔗 الرابط:', parsed.profileImage);
                return 'already_uploaded';
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ خطأ في تحليل البيانات:', error);
        return false;
    }
}

// دالة تشخيص شاملة
async function diagnoseAndUpload() {
    console.log('🔬 بدء التشخيص الشامل...');
    console.log('⏰ الوقت:', new Date().toLocaleString());
    
    // 1. فحص البيانات
    const dataStatus = checkData();
    
    if (dataStatus === false) {
        console.error('❌ لا يمكن المتابعة - مشكلة في البيانات');
        return;
    }
    
    if (dataStatus === 'already_uploaded') {
        console.log('✅ الصورة موجودة بالفعل على Cloudinary');
        return;
    }
    
    // 2. اختبار الاتصال بـ Cloudinary
    console.log('🌐 اختبار الاتصال...');
    
    try {
        const testResponse = await fetch(CLOUDINARY_URL.replace('/upload', ''));
        console.log('✅ يمكن الوصول إلى Cloudinary');
    } catch (error) {
        console.error('❌ لا يمكن الوصول إلى Cloudinary:', error);
    }
    
    // 3. رفع الصورة
    console.log('📤 بدء رفع الصورة...');
    await uploadToCloudinary();
}

// تشغيل مباشر
console.log('🎬 تشغيل الكود...');
diagnoseAndUpload();

// يمكنك أيضاً تشغيل الدوال منفردة:
// checkData();              // فحص البيانات فقط
// uploadToCloudinary();     // رفع الصورة مباشرة