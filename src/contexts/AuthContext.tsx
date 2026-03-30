// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, set, onDisconnect } from 'firebase/database';
import { auth, db, rtdb } from '../lib/firebase';

export type UserRole =
  | 'super_admin' | 'area_manager' | 'supervisor'
  | 'street_monitor' | 'driver' | 'client' | 'family' | 'partner';

export interface AppUser {
  uid: string;
  name: string;
  phone: string;
  role: UserRole;
  status: 'pending' | 'active' | 'suspended' | 'banned';
  avatar?: string;
  areaId?: string;
  familyHeadId?: string;
  voipExtension?: string;
  voipPassword?: string;
  paymentType?: 'fixed' | 'percent';
  paymentValue?: number;
  rating?: number;
  totalRides?: number;
  wallet?: number;
  isOnline?: boolean;
  cloudinaryFolder?: string;
}

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<AppUser>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<string>;
}

interface RegisterData {
  name: string;
  phone: string;
  password: string;
  role: UserRole;
  familyHeadId?: string;
  area?: string;
  nationalId?: string;
  licenseNumber?: string;
  vehicleType?: string;
  address?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

// phone → email للـ Firebase Auth (Firebase Auth بتستخدم email)
export const phoneToEmail = (phone: string) => `${phone.replace(/\s/g,'')}@ghafeer.app`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fUser) => {
      if (fUser) {
        setFirebaseUser(fUser);
        const appUser = await fetchUserDoc(fUser.uid);
        setUser(appUser);
        // Set online status in Realtime DB
        if (appUser?.status === 'active') {
          const presenceRef = ref(rtdb, `presence/${fUser.uid}`);
          set(presenceRef, { online: true, lastSeen: Date.now(), role: appUser.role });
          onDisconnect(presenceRef).set({ online: false, lastSeen: Date.now(), role: appUser.role });
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function fetchUserDoc(uid: string): Promise<AppUser | null> {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return { uid, ...snap.data() } as AppUser;
  }

  async function login(phone: string, password: string): Promise<AppUser> {
    const email = phoneToEmail(phone);
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const appUser = await fetchUserDoc(cred.user.uid);
    if (!appUser) throw new Error('المستخدم غير موجود');
    if (appUser.status === 'pending') throw new Error('حسابك في انتظار موافقة الإدارة');
    if (appUser.status === 'suspended') throw new Error('حسابك موقوف. تواصل مع الإدارة');
    if (appUser.status === 'banned') throw new Error('تم حظر هذا الحساب');
    return appUser;
  }

  async function logout(): Promise<void> {
    if (firebaseUser) {
      const presenceRef = ref(rtdb, `presence/${firebaseUser.uid}`);
      await set(presenceRef, { online: false, lastSeen: Date.now() });
    }
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  }

  async function register(data: RegisterData): Promise<string> {
    const email = phoneToEmail(data.phone);
    const cred = await createUserWithEmailAndPassword(auth, email, data.password);
    const uid = cred.user.uid;

    const status = (data.role === 'client' || data.role === 'family') ? 'active' : 'pending';

    const userDoc: Omit<AppUser, 'uid'> = {
      name: data.name,
      phone: data.phone,
      role: data.role,
      status,
      rating: 5.0,
      totalRides: 0,
      wallet: 0,
      isOnline: false,
      familyHeadId: data.familyHeadId,
      cloudinaryFolder: `ghafeer/${data.role}s/${uid}`,
    };

    await setDoc(doc(db, 'users', uid), {
      ...userDoc,
      createdAt: serverTimestamp(),
      ...(data.nationalId && { nationalId: data.nationalId }),
      ...(data.licenseNumber && { licenseNumber: data.licenseNumber }),
      ...(data.vehicleType && { vehicleType: data.vehicleType }),
      ...(data.area && { area: data.area }),
      ...(data.address && { address: data.address }),
    });

    // إشعار للإدارة لو سائق
    if (data.role === 'driver') {
      await setDoc(doc(db, 'notifications', `pending_driver_${uid}`), {
        type: 'new_driver_pending',
        driverId: uid,
        driverName: data.name,
        driverPhone: data.phone,
        createdAt: serverTimestamp(),
        read: false,
      });
    }

    return uid;
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
