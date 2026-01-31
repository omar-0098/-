// ================== إعدادات Firebase ==================

// استيراد Firebase SDK
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    updateDoc,
    doc,
    deleteDoc,
    serverTimestamp,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// إعدادات Firebase الخاصة بك
const firebaseConfig = {
    apiKey: "AIzaSyDd1QAvtssFMbuCpSlSXAGaOdj5k3QKCEY",
    authDomain: "kashmair-1fe6b.firebaseapp.com",
    projectId: "kashmair-1fe6b",
    storageBucket: "kashmair-1fe6b.firebasestorage.app",
    messagingSenderId: "71413982047",
    appId: "1:71413982047:web:3cc7b6b04e34ea75f04cea",
    measurementId: "G-24MH8K7858"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ================== دوال Firebase للتعامل مع البيانات ==================

/**
 * إضافة مستخدم جديد إلى Firestore
 */
async function addUserToFirestore(userData) {
    try {
        const usersCollection = collection(db, 'users');
        
        const userDoc = {
            id: Date.now(),
            timestamp: serverTimestamp(),
            name: userData.name,
            family: userData.family,
            email: userData.email,
            phone: userData.phone,
            registered: true,
            copon1: userData.copon1 || "",
            copon2: userData.copon2 || "",
            profileImage: userData.profileImage || null,
            isUpdated: userData.isUpdated || false,
            updateTimestamp: userData.updateTimestamp || null,
            lastSaved: new Date().toISOString(),
            version: '1.0'
        };
        
        const docRef = await addDoc(usersCollection, userDoc);
        console.log('✅ تم إضافة المستخدم بنجاح إلى Firestore - ID:', docRef.id);
        
        return {
            success: true,
            docId: docRef.id,
            data: userDoc
        };
    } catch (error) {
        console.error('❌ خطأ في إضافة المستخدم إلى Firestore:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * البحث عن مستخدم بالإيميل
 */
async function findUserByEmail(email) {
    try {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            return {
                exists: true,
                id: userDoc.id,
                data: userDoc.data()
            };
        }
        
        return {
            exists: false,
            id: null,
            data: null
        };
    } catch (error) {
        console.error('❌ خطأ في البحث عن المستخدم:', error);
        return {
            exists: false,
            error: error.message
        };
    }
}

/**
 * البحث عن مستخدم برقم الهاتف
 */
async function findUserByPhone(phone) {
    try {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, where('phone', '==', phone));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            return {
                exists: true,
                id: userDoc.id,
                data: userDoc.data()
            };
        }
        
        return {
            exists: false,
            id: null,
            data: null
        };
    } catch (error) {
        console.error('❌ خطأ في البحث عن رقم الهاتف:', error);
        return {
            exists: false,
            error: error.message
        };
    }
}

/**
 * التحقق من تكرار الإيميل والهاتف
 */
async function checkDuplicateUser(email, phone) {
    try {
        const [emailCheck, phoneCheck] = await Promise.all([
            findUserByEmail(email),
            findUserByPhone(phone)
        ]);
        
        return {
            emailExists: emailCheck.exists,
            phoneExists: phoneCheck.exists,
            duplicateEmail: emailCheck.data,
            duplicatePhone: phoneCheck.data
        };
    } catch (error) {
        console.error('❌ خطأ في التحقق من التكرار:', error);
        return {
            emailExists: false,
            phoneExists: false,
            duplicateEmail: null,
            duplicatePhone: null,
            error: error.message
        };
    }
}

/**
 * تحديث بيانات المستخدم
 */
async function updateUserInFirestore(email, updateData) {
    try {
        const userResult = await findUserByEmail(email);
        
        if (!userResult.exists) {
            console.error('❌ المستخدم غير موجود');
            return {
                success: false,
                error: 'User not found'
            };
        }
        
        const userDocRef = doc(db, 'users', userResult.id);
        await updateDoc(userDocRef, {
            ...updateData,
            lastUpdated: serverTimestamp()
        });
        
        console.log('✅ تم تحديث بيانات المستخدم بنجاح');
        return {
            success: true,
            id: userResult.id
        };
    } catch (error) {
        console.error('❌ خطأ في تحديث البيانات:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * حذف مستخدم من Firestore
 */
async function deleteUserFromFirestore(email) {
    try {
        const userResult = await findUserByEmail(email);
        
        if (!userResult.exists) {
            console.error('❌ المستخدم غير موجود');
            return {
                success: false,
                error: 'User not found'
            };
        }
        
        const userDocRef = doc(db, 'users', userResult.id);
        await deleteDoc(userDocRef);
        
        console.log('✅ تم حذف المستخدم بنجاح من Firestore');
        return {
            success: true,
            id: userResult.id
        };
    } catch (error) {
        console.error('❌ خطأ في حذف المستخدم:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * جلب جميع المستخدمين (للإدارة فقط)
 */
async function getAllUsers() {
    try {
        const usersCollection = collection(db, 'users');
        const querySnapshot = await getDocs(usersCollection);
        
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✅ تم جلب ${users.length} مستخدم`);
        return {
            success: true,
            users: users
        };
    } catch (error) {
        console.error('❌ خطأ في جلب المستخدمين:', error);
        return {
            success: false,
            error: error.message,
            users: []
        };
    }
}

/**
 * مراقبة التغييرات في بيانات مستخدم معين (Real-time)
 */
function watchUserChanges(email, callback) {
    try {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, where('email', '==', email));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                callback({
                    exists: true,
                    id: userDoc.id,
                    data: userDoc.data()
                });
            } else {
                callback({
                    exists: false,
                    id: null,
                    data: null
                });
            }
        }, (error) => {
            console.error('❌ خطأ في مراقبة التغييرات:', error);
            callback({
                exists: false,
                error: error.message
            });
        });
        
        return unsubscribe; // استخدم هذه الدالة لإيقاف المراقبة
    } catch (error) {
        console.error('❌ خطأ في إعداد المراقبة:', error);
        return null;
    }
}

// ================== تصدير الدوال للاستخدام ==================

export {
    db,
    addUserToFirestore,
    findUserByEmail,
    findUserByPhone,
    checkDuplicateUser,
    updateUserInFirestore,
    deleteUserFromFirestore,
    getAllUsers,
    watchUserChanges
};
