import { 
    addUserToFirestore, 
    findUserByEmail,
    updateUserInFirestore,
    watchUserChanges 
} from './firebase-config.js';

// استيراد مكتبة jwt_decode
// تأكد من إضافة السكريبت في HTML: <script src="https://cdn.jsdelivr.net/npm/jwt-decode@3.1.2/build/jwt-decode.min.js"></script>

// ================== نظام حفظ البيانات الدائم ==================

// إعدادات نظام الحفظ الدائم
const STORAGE_CONFIG = {
    // مفاتيح التخزين المتعددة
    KEYS: {
        USER_DATA: 'userData',
        USER_BACKUP_1: 'userData_backup_1',
        USER_BACKUP_2: 'userData_backup_2',
        USER_BACKUP_3: 'userData_backup_3',
        LAST_SAVE: 'lastSaveTime'
    },
    // فترة الحفظ التلقائي (كل 30 ثانية)
    AUTO_SAVE_INTERVAL: 30000,
    // عدد النسخ الاحتياطية
    BACKUP_COUNT: 3
};

// متغير للاحتفاظ بالبيانات في الذاكرة
let currentUserData = null;
let autoSaveInterval = null;
let firebaseWatcher = null;

// ================== دوال نظام الحفظ الدائم ==================

/**
 * حفظ البيانات بطرق متعددة لضمان عدم فقدانها
 */
async function savePermanentData(userData) {
    try {
        const dataToSave = {
            ...userData,
            lastSaved: new Date().toISOString(),
            version: '1.0'
        };
        
        const jsonData = JSON.stringify(dataToSave);
        
        // 1. حفظ في localStorage (النسخة الأساسية)
        localStorage.setItem(STORAGE_CONFIG.KEYS.USER_DATA, jsonData);
        
        // 2. حفظ نسخ احتياطية متعددة
        localStorage.setItem(STORAGE_CONFIG.KEYS.USER_BACKUP_1, jsonData);
        localStorage.setItem(STORAGE_CONFIG.KEYS.USER_BACKUP_2, jsonData);
        localStorage.setItem(STORAGE_CONFIG.KEYS.USER_BACKUP_3, jsonData);
        
        // 3. حفظ وقت آخر حفظ
        localStorage.setItem(STORAGE_CONFIG.KEYS.LAST_SAVE, Date.now().toString());
        
        // 4. حفظ في sessionStorage كنسخة إضافية
        sessionStorage.setItem(STORAGE_CONFIG.KEYS.USER_DATA, jsonData);
        
        // 5. حفظ في الذاكرة
        currentUserData = { ...dataToSave };
        
        // 6. محاولة حفظ في IndexedDB
        saveToIndexedDB(dataToSave);
        
        // 7. حفظ في Firebase
        if (userData.email) {
            try {
                const existingUser = await findUserByEmail(userData.email);
                
                if (existingUser.exists) {
                    // تحديث البيانات الموجودة
                    await updateUserInFirestore(userData.email, dataToSave);
                    console.log('✅ تم تحديث البيانات في Firebase');
                } else {
                    // إضافة مستخدم جديد
                    await addUserToFirestore(dataToSave);
                    console.log('✅ تم إضافة البيانات إلى Firebase');
                }
            } catch (error) {
                console.error('❌ خطأ في حفظ البيانات في Firebase:', error);
            }
        }
        
        console.log('✅ تم حفظ البيانات بنجاح في جميع المواقع');
        return true;
        
    } catch (error) {
        console.error('❌ خطأ في حفظ البيانات:', error);
        return false;
    }
}

/**
 * استرجاع البيانات من أفضل مصدر متاح
 */
async function loadPermanentData() {
    try {
        // محاولة الاسترجاع من المصادر المختلفة بالترتيب
        const sources = [
            () => localStorage.getItem(STORAGE_CONFIG.KEYS.USER_DATA),
            () => localStorage.getItem(STORAGE_CONFIG.KEYS.USER_BACKUP_1),
            () => localStorage.getItem(STORAGE_CONFIG.KEYS.USER_BACKUP_2),
            () => localStorage.getItem(STORAGE_CONFIG.KEYS.USER_BACKUP_3),
            () => sessionStorage.getItem(STORAGE_CONFIG.KEYS.USER_DATA),
            () => currentUserData ? JSON.stringify(currentUserData) : null
        ];
        
        for (const source of sources) {
            try {
                const data = source();
                if (data) {
                    const parsedData = JSON.parse(data);
                    if (parsedData && parsedData.email) {
                        console.log('✅ تم استرجاع البيانات بنجاح من localStorage');
                        
                        // التحقق من Firebase وتحديث البيانات إذا لزم الأمر
                        try {
                            const firebaseUser = await findUserByEmail(parsedData.email);
                            if (firebaseUser.exists && firebaseUser.data) {
                                // دمج البيانات من Firebase مع البيانات المحلية
                                const mergedData = {
                                    ...parsedData,
                                    ...firebaseUser.data
                                };
                                savePermanentData(mergedData);
                                return mergedData;
                            }
                        } catch (error) {
                            console.warn('⚠️ لم يتم العثور على البيانات في Firebase، استخدام البيانات المحلية');
                        }
                        
                        // تحديث جميع المصادر بالبيانات المسترجعة
                        savePermanentData(parsedData);
                        return parsedData;
                    }
                }
            } catch (parseError) {
                console.warn('⚠️ خطأ في تحليل البيانات من أحد المصادر:', parseError);
                continue;
            }
        }
        
        console.log('ℹ️ لم يتم العثور على بيانات محفوظة');
        return null;
        
    } catch (error) {
        console.error('❌ خطأ في استرجاع البيانات:', error);
        return null;
    }
}

/**
 * حفظ البيانات في IndexedDB للحفظ طويل المدى
 */
function saveToIndexedDB(userData) {
    if (!window.indexedDB) {
        console.log('IndexedDB غير مدعوم في هذا المتصفح');
        return;
    }
    
    const request = indexedDB.open('UserDataDB', 1);
    
    request.onerror = function() {
        console.error('خطأ في فتح IndexedDB');
    };
    
    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['userData'], 'readwrite');
        const store = transaction.objectStore('userData');
        
        const data = {
            id: 'currentUser',
            ...userData,
            indexedDBSaved: new Date().toISOString()
        };
        
        store.put(data);
        console.log('✅ تم حفظ البيانات في IndexedDB');
    };
    
    request.onupgradeneeded = function(event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('userData')) {
            db.createObjectStore('userData', { keyPath: 'id' });
            console.log('✅ تم إنشاء قاعدة بيانات IndexedDB');
        }
    };
}

/**
 * استرجاع البيانات من IndexedDB
 */
function loadFromIndexedDB() {
    return new Promise((resolve) => {
        if (!window.indexedDB) {
            resolve(null);
            return;
        }
        
        const request = indexedDB.open('UserDataDB', 1);
        
        request.onerror = function() {
            resolve(null);
        };
        
        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(['userData'], 'readonly');
            const store = transaction.objectStore('userData');
            const getRequest = store.get('currentUser');
            
            getRequest.onsuccess = function() {
                resolve(getRequest.result);
            };
            
            getRequest.onerror = function() {
                resolve(null);
            };
        };
        
        request.onupgradeneeded = function() {
            resolve(null);
        };
    });
}

/**
 * بدء نظام الحفظ التلقائي
 */
function startAutoSave() {
    // إيقاف أي حفظ تلقائي سابق
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
    
    // بدء الحفظ التلقائي
    autoSaveInterval = setInterval(async () => {
        if (currentUserData) {
            await savePermanentData(currentUserData);
            console.log('🔄 تم الحفظ التلقائي للبيانات');
        }
    }, STORAGE_CONFIG.AUTO_SAVE_INTERVAL);
    
    console.log('✅ تم بدء نظام الحفظ التلقائي');
}

/**
 * حماية البيانات من الحذف عند إغلاق الصفحة
 */
function protectDataOnUnload() {
    window.addEventListener('beforeunload', async function(event) {
        if (currentUserData) {
            // حفظ نهائي قبل إغلاق الصفحة
            await savePermanentData(currentUserData);
            console.log('💾 تم الحفظ النهائي قبل إغلاق الصفحة');
        }
    });
    
    // حفظ إضافي عند فقدان التركيز
    window.addEventListener('blur', async function() {
        if (currentUserData) {
            await savePermanentData(currentUserData);
        }
    });
    
    // حفظ عند إخفاء الصفحة
    document.addEventListener('visibilitychange', async function() {
        if (document.hidden && currentUserData) {
            await savePermanentData(currentUserData);
        }
    });
}

/**
 * التحقق من سلامة البيانات المحفوظة
 */
async function validateSavedData() {
    const data = await loadPermanentData();
    if (data && data.email && data.name) {
        console.log('✅ البيانات المحفوظة سليمة');
        return true;
    }
    console.log('⚠️ البيانات المحفوظة غير مكتملة أو تالفة');
    return false;
}

/**
 * بدء مراقبة التغييرات في Firebase
 */
function startFirebaseWatch(email) {
    // إيقاف المراقبة السابقة إن وجدت
    if (firebaseWatcher) {
        firebaseWatcher();
        firebaseWatcher = null;
    }
    
    // بدء مراقبة جديدة
    firebaseWatcher = watchUserChanges(email, (result) => {
        if (result.exists && result.data) {
            console.log('🔄 تم اكتشاف تحديث في Firebase');
            
            // تحديث البيانات المحلية
            const mergedData = {
                ...currentUserData,
                ...result.data
            };
            
            currentUserData = mergedData;
            localStorage.setItem(STORAGE_CONFIG.KEYS.USER_DATA, JSON.stringify(mergedData));
            
            // إشعار المستخدم بالتحديث إذا لزم الأمر
            console.log('✅ تم مزامنة البيانات مع Firebase');
        } else if (!result.exists) {
            console.warn('⚠️ تم حذف المستخدم من Firebase');
            // يمكنك إضافة منطق لتسجيل الخروج التلقائي هنا
        }
    });
    
    console.log('✅ تم بدء مراقبة التغييرات في Firebase');
}

// ================== تعديل الكود الأصلي ==================

function logineCallback(response) {
    const decoded = jwt_decode(response.credential);
    
    // التحقق من وجود بيانات محفوظة مسبقاً
    loadPermanentData().then(existingData => {
        if (existingData && existingData.email === decoded.email) {
            console.log('✅ تم العثور على بيانات محفوظة للمستخدم');
            currentUserData = existingData;
            
            // بدء مراقبة Firebase
            startFirebaseWatch(decoded.email);
            
            // عرض البيانات المحفوظة
            displayWelcomeMessage(existingData.name);
        } else {
            // إنشاء حساب جديد
            const newUserData = {
                name: decoded.given_name || decoded.name,
                family: decoded.family_name || '',
                email: decoded.email,
                phone: '',
                registered: true,
                copon1: '',
                copon2: ''
            };
            
            // حفظ البيانات الجديدة
            savePermanentData(newUserData).then(() => {
                currentUserData = newUserData;
                
                // بدء مراقبة Firebase
                startFirebaseWatch(decoded.email);
                
                // عرض رسالة الترحيب
                displayWelcomeMessage(newUserData.name);
            });
        }
        
        // بدء نظام الحفظ التلقائي
        startAutoSave();
    });
}

function displayWelcomeMessage(name) {
    console.log(`مرحباً ${name}!`);
    // أضف هنا كود عرض رسالة الترحيب في واجهة المستخدم
}

// ================== دوال إضافية لإدارة البيانات المحفوظة ==================

/**
 * دالة لعرض البيانات المحفوظة في وحدة التحكم
 */
async function showSavedData() {
    const data = await loadPermanentData();
    if (data) {
        console.log('📊 البيانات المحفوظة:', data);
        console.log('📅 تاريخ آخر حفظ:', data.lastSaved);
        console.log('✅ البيانات سليمة ومتاحة');
    } else {
        console.log('❌ لا توجد بيانات محفوظة');
    }
}

/**
 * دالة لتنظيف البيانات القديمة (استخدم بحذر!)
 */
function clearAllSavedData() {
    const confirmed = confirm('هل أنت متأكد من حذف جميع البيانات المحفوظة؟ هذا الإجراء لا يمكن التراجع عنه!');
    if (confirmed) {
        // حذف من localStorage
        Object.values(STORAGE_CONFIG.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        
        // حذف من sessionStorage
        sessionStorage.removeItem(STORAGE_CONFIG.KEYS.USER_DATA);
        
        // مسح البيانات من الذاكرة
        currentUserData = null;
        
        // إيقاف الحفظ التلقائي
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
            autoSaveInterval = null;
        }
        
        // إيقاف مراقبة Firebase
        if (firebaseWatcher) {
            firebaseWatcher();
            firebaseWatcher = null;
        }
        
        console.log('🗑️ تم حذف جميع البيانات المحفوظة');
        alert('تم حذف جميع البيانات بنجاح');
    }
}

/**
 * دالة لتصدير البيانات المحفوظة
 */
async function exportSavedData() {
    const data = await loadPermanentData();
    if (data) {
        const dataBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user_data_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('📥 تم تصدير البيانات بنجاح');
    } else {
        alert('لا توجد بيانات لتصديرها');
    }
}

/**
 * دالة لاستيراد البيانات من ملف
 */
function importSavedData(fileInput) {
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                if (importedData.email && importedData.name) {
                    await savePermanentData(importedData);
                    currentUserData = importedData;
                    
                    // بدء مراقبة Firebase للبيانات المستوردة
                    startFirebaseWatch(importedData.email);
                    
                    console.log('📤 تم استيراد البيانات بنجاح');
                    alert('تم استيراد البيانات بنجاح');
                } else {
                    alert('ملف البيانات غير صالح');
                }
            } catch (error) {
                console.error('خطأ في استيراد البيانات:', error);
                alert('خطأ في قراءة ملف البيانات');
            }
        };
        reader.readAsText(file);
    }
}

/**
 * دالة لإنشاء تقرير حالة نظام الحفظ
 */
function getStorageStatus() {
    const status = {
        localStorage: {
            available: !!window.localStorage,
            dataExists: !!localStorage.getItem(STORAGE_CONFIG.KEYS.USER_DATA),
            backups: {
                backup1: !!localStorage.getItem(STORAGE_CONFIG.KEYS.USER_BACKUP_1),
                backup2: !!localStorage.getItem(STORAGE_CONFIG.KEYS.USER_BACKUP_2),
                backup3: !!localStorage.getItem(STORAGE_CONFIG.KEYS.USER_BACKUP_3)
            }
        },
        sessionStorage: {
            available: !!window.sessionStorage,
            dataExists: !!sessionStorage.getItem(STORAGE_CONFIG.KEYS.USER_DATA)
        },
        indexedDB: {
            available: !!window.indexedDB
        },
        memoryStorage: {
            dataExists: !!currentUserData
        },
        autoSave: {
            active: !!autoSaveInterval,
            lastSave: localStorage.getItem(STORAGE_CONFIG.KEYS.LAST_SAVE)
        },
        firebase: {
            watcherActive: !!firebaseWatcher
        }
    };
    
    console.log('📊 تقرير حالة نظام الحفظ:', status);
    return status;
}

// ================== تهيئة النظام عند تحميل الصفحة ==================

// تشغيل النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 بدء تهيئة نظام الحفظ الدائم مع Firebase');
    
    // تفعيل حماية البيانات
    protectDataOnUnload();
    
    // محاولة استرجاع البيانات المحفوظة
    const savedData = await loadPermanentData();
    if (savedData) {
        currentUserData = savedData;
        console.log('✅ تم استرجاع البيانات المحفوظة:', savedData.name, savedData.email);
        
        // بدء نظام الحفظ التلقائي
        startAutoSave();
        
        // بدء مراقبة Firebase
        if (savedData.email) {
            startFirebaseWatch(savedData.email);
        }
    }
    
    // عرض تقرير حالة النظام
    getStorageStatus();
    
    console.log('✅ تم تهيئة نظام الحفظ الدائم بنجاح مع Firebase');
});

// إضافة دوال للوصول السهل من وحدة التحكم
window.userDataManager = {
    save: savePermanentData,
    load: loadPermanentData,
    show: showSavedData,
    clear: clearAllSavedData,
    export: exportSavedData,
    import: importSavedData,
    status: getStorageStatus,
    current: () => currentUserData,
    startWatch: (email) => startFirebaseWatch(email),
    stopWatch: () => {
        if (firebaseWatcher) {
            firebaseWatcher();
            firebaseWatcher = null;
            console.log('⏹️ تم إيقاف مراقبة Firebase');
        }
    }
};

console.log('🔧 يمكنك استخدام window.userDataManager للتحكم في البيانات من وحدة التحكم');
