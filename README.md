# 🛡️ الغفير — منصة إدارة الغفراء

## خطوات التشغيل

### 1️⃣ أنشئ Firebase Project
- روح https://console.firebase.google.com
- اضغط "Add project" واديه اسم مثلاً `elghafeer`
- بعد ما يتعمل، اضغط على الأيقونة `</>` (Web App)
- سميه أي اسم واضغط Register
- **انسخ الـ firebaseConfig** — هتحتاجه في الخطوة التانية

### 2️⃣ فعّل الخدمات دي في Firebase
```
Authentication → Sign-in method → Email/Password → Enable
Firestore Database → Create database → Start in test mode
Realtime Database → Create database → Start in test mode
```

### 3️⃣ Firestore Security Rules (مؤقت للتطوير)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4️⃣ ابعت لي الـ Config وأنا أحطه
جيب من Firebase Console → Project Settings → Your apps → firebaseConfig
يبدو كده:
```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "....firebaseapp.com",
  projectId: "...",
  storageBucket: "....appspot.com",
  messagingSenderId: "...",
  appId: "1:...",
  databaseURL: "https://....firebaseio.com"
};
```

### 5️⃣ ارفع على GitHub
```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/elghafeer.git
git push -u origin main
```

### 6️⃣ اربط بـ Vercel
- روح https://vercel.com → Import Git Repository
- اختار الـ repo بتاعك
- في Environment Variables حط:
```
VITE_FIREBASE_API_KEY = AIza...
VITE_FIREBASE_AUTH_DOMAIN = ...firebaseapp.com
VITE_FIREBASE_PROJECT_ID = ...
VITE_FIREBASE_STORAGE_BUCKET = ...appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID = ...
VITE_FIREBASE_APP_ID = 1:...
VITE_FIREBASE_DATABASE_URL = https://...-rtdb.firebaseio.com
```
- اضغط Deploy ✅

### 7️⃣ أنشئ أول أدمن
بعد ما الموقع يشتغل، روح Firebase Console → Firestore:
```
Collection: users
Document ID: [uid بتاع المستخدم من Authentication]
Fields:
  name: "اسمك"
  phone: "01XXXXXXXXX"
  role: "super_admin"
  status: "active"
  rating: 5
  totalRides: 0
  wallet: 0
  isOnline: false
```

### 8️⃣ إعدادات Cloudinary (للصور)
- روح https://cloudinary.com وعمل حساب مجاني
- من Dashboard: خد الـ Cloud Name
- روح Settings → Upload → Add upload preset → Unsigned → سميه `ghafeer_unsigned`
- ادخل الموقع → الأدمن → إعدادات → Cloudinary وحط البيانات

---

## هيكل الصلاحيات
| Role | الوصول |
|------|--------|
| super_admin | كل حاجة |
| area_manager | السائقين + الرحلات |
| supervisor | قبول سائقين + SOS + واكي توكي |
| street_monitor | متابعة فقط |
| driver | داشبورد السائق |
| client / family | طلب رحلات |
