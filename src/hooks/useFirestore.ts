// src/hooks/useFirestore.ts
import { useState, useEffect } from 'react';
import {
  collection, query, where, orderBy, onSnapshot,
  doc, updateDoc, addDoc, setDoc, serverTimestamp,
  getDoc, limit, Timestamp,
} from 'firebase/firestore';
import { ref, onValue, set } from 'firebase/database';
import { db, rtdb } from '../lib/firebase';
import type { AppUser } from '../contexts/AuthContext';

// ===== Geo Helpers =====
export function calcDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`,
      { headers: { 'Accept-Language': 'ar' } }
    );
    const data = await res.json();
    const addr = data.address;
    const parts = [
      addr?.road || addr?.pedestrian,
      addr?.suburb || addr?.neighbourhood,
      addr?.city || addr?.town || addr?.village,
    ].filter(Boolean);
    return parts.join('، ') || data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

export async function getAutoLandmarks(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number
): Promise<string[]> {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?steps=true&annotations=false&overview=false`
    );
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return [];
    const steps: string[] = [];
    for (const leg of data.routes[0].legs) {
      for (const step of leg.steps) {
        const name = step.name?.trim();
        if (name && name.length > 2 && !steps.includes(name) && steps.length < 6) {
          steps.push(name);
        }
      }
    }
    return steps;
  } catch {
    return [];
  }
}

// ===== Area Pricing =====
export interface Area {
  id: string;
  name: string;               // اسم المنطقة
  city: string;               // المدينة
  baseFare: number;           // أجرة أساسية (جنيه)
  perKmRate: number;          // سعر الكيلومتر (جنيه)
  minFare: number;            // حد أدنى (جنيه)
  maxFare?: number;           // حد أقصى (اختياري)
  supervisors: string[];      // UIDs المشرفين
  areaManagerId?: string;     // UID مدير المنطقة
  active: boolean;
  createdAt?: any;
  updatedAt?: any;
}

// جيب كل المناطق
export function useAreas() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'areas'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setAreas(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Area));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { areas, loading };
}

// حفظ / تعديل منطقة
export async function saveArea(area: Omit<Area, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) {
  if (existingId) {
    await updateDoc(doc(db, 'areas', existingId), { ...area, updatedAt: serverTimestamp() });
    return existingId;
  } else {
    const ref = await addDoc(collection(db, 'areas'), { ...area, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return ref.id;
  }
}

// حذف منطقة
export async function deleteArea(areaId: string) {
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'areas', areaId));
}

// احسب سعر الرحلة بناءً على المنطقة
export function calcPriceByArea(distanceKm: number, area?: Area | null): number {
  // لو مفيش منطقة محددة — سعر افتراضي
  const base = area?.baseFare ?? 5;
  const perKm = area?.perKmRate ?? 3;
  const min = area?.minFare ?? 8;
  const max = area?.maxFare;
  const price = Math.round(base + distanceKm * perKm);
  const withMin = Math.max(min, price);
  return max ? Math.min(max, withMin) : withMin;
}

// جيب منطقة من إحداثيات (أقرب منطقة للعميل)
export async function getAreaByLocation(lat: number, lng: number): Promise<Area | null> {
  try {
    const snap = await import('firebase/firestore').then(f =>
      f.getDocs(query(collection(db, 'areas'), where('active', '==', true)))
    );
    const areas = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Area & { centerLat?: number; centerLng?: number });
    // لو المناطق عندها إحداثيات مركز — اختار الأقرب
    // دلوقتي بنرجع أول منطقة نشطة كـ fallback
    return areas.length > 0 ? areas[0] : null;
  } catch {
    return null;
  }
}

// ===== Online Drivers =====
export function useOnlineDrivers(clientLat?: number, clientLng?: number, maxKm = 5) {
  const [drivers, setDrivers] = useState<(AppUser & { distanceKm?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'driver'),
      where('status', '==', 'active'),
      where('isOnline', '==', true)
    );

    const unsub = onSnapshot(q, async (snap) => {
      const driversData = snap.docs.map(d => ({ uid: d.id, ...d.data() }) as AppUser);

      if (clientLat && clientLng) {
        const withDistance = await Promise.all(
          driversData.map(async (driver) => {
            return new Promise<AppUser & { distanceKm?: number }>((resolve) => {
              const locRef = ref(rtdb, `driverLocation/${driver.uid}`);
              onValue(locRef, (snap) => {
                const loc = snap.val();
                if (loc?.lat && loc?.lng) {
                  const dist = calcDistanceKm(clientLat, clientLng, loc.lat, loc.lng);
                  resolve({ ...driver, distanceKm: dist });
                } else {
                  resolve({ ...driver, distanceKm: undefined });
                }
              }, { onlyOnce: true });
            });
          })
        );
        const nearby = withDistance
          .filter(d => d.distanceKm !== undefined && d.distanceKm <= maxKm)
          .sort((a, b) => (a.distanceKm || 99) - (b.distanceKm || 99));
        setDrivers(nearby);
      } else {
        setDrivers(driversData);
      }
      setLoading(false);
    });

    return unsub;
  }, [clientLat, clientLng, maxKm]);

  return { drivers, loading };
}

// ===== All Drivers (Admin) =====
export function useDrivers(statusFilter?: string) {
  const [drivers, setDrivers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let q = query(collection(db, 'users'), where('role', '==', 'driver'), orderBy('createdAt', 'desc'));
    if (statusFilter) q = query(collection(db, 'users'), where('role', '==', 'driver'), where('status', '==', statusFilter), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setDrivers(snap.docs.map(d => ({ uid: d.id, ...d.data() }) as AppUser));
      setLoading(false);
    });
    return unsub;
  }, [statusFilter]);
  return { drivers, loading };
}

// ===== Clients =====
export function useClients() {
  const [clients, setClients] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', 'in', ['client', 'family']), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setClients(snap.docs.map(d => ({ uid: d.id, ...d.data() }) as AppUser));
      setLoading(false);
    });
    return unsub;
  }, []);
  return { clients, loading };
}

// ===== Ride Interface =====
export interface Ride {
  id: string;
  clientId: string;
  clientName: string;
  driverId?: string;
  driverName?: string;
  status: 'searching' | 'accepted' | 'waiting' | 'started' | 'completed' | 'cancelled';
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  areaId?: string;
  areaName?: string;
  qrCode: string;
  otp: string;
  price: number;
  distanceKm?: number;
  clientRating?: number;
  driverRating?: number;
  landmarks: { name: string; done: boolean; doneAt?: Timestamp }[];
  createdAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
}

export function useDriverRide(driverId: string) {
  const [ride, setRide] = useState<Ride | null>(null);
  useEffect(() => {
    if (!driverId) return;
    const q = query(collection(db, 'rides'), where('driverId', '==', driverId), where('status', 'in', ['accepted', 'waiting', 'started']), limit(1));
    const unsub = onSnapshot(q, snap => {
      setRide(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() } as Ride);
    });
    return unsub;
  }, [driverId]);
  return ride;
}

export function useClientRide(clientId: string) {
  const [ride, setRide] = useState<Ride | null>(null);
  useEffect(() => {
    if (!clientId) return;
    const q = query(collection(db, 'rides'), where('clientId', '==', clientId), where('status', 'in', ['searching', 'accepted', 'waiting', 'started']), limit(1));
    const unsub = onSnapshot(q, snap => {
      setRide(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() } as Ride);
    });
    return unsub;
  }, [clientId]);
  return ride;
}

export function useActiveRides() {
  const [rides, setRides] = useState<Ride[]>([]);
  useEffect(() => {
    const q = query(collection(db, 'rides'), where('status', 'in', ['accepted', 'waiting', 'started']), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => { setRides(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Ride)); });
    return unsub;
  }, []);
  return rides;
}

export function useAllRides(limitCount = 50) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const q = query(collection(db, 'rides'), orderBy('createdAt', 'desc'), limit(limitCount));
    const unsub = onSnapshot(q, snap => {
      setRides(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Ride));
      setLoading(false);
    });
    return unsub;
  }, [limitCount]);
  return { rides, loading };
}

// ===== SOS =====
export interface SOSAlert {
  id: string; userId: string; userName: string; userPhone: string;
  rideId?: string; lat?: number; lng?: number;
  status: 'active' | 'resolved'; createdAt: Timestamp;
}
export function useSOSAlerts() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  useEffect(() => {
    const q = query(collection(db, 'sos_alerts'), where('status', '==', 'active'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => { setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() }) as SOSAlert)); });
    return unsub;
  }, []);
  return alerts;
}

// ===== PTT =====
export function usePTTSignal(driverId: string) {
  const [signal, setSignal] = useState<{ active: boolean; adminName?: string } | null>(null);
  useEffect(() => {
    if (!driverId) return;
    const pttRef = ref(rtdb, `ptt/${driverId}`);
    const unsub = onValue(pttRef, snap => { setSignal(snap.val()); });
    return () => unsub();
  }, [driverId]);
  return signal;
}
export async function sendPTTSignal(driverId: string, active: boolean, adminName: string) {
  await set(ref(rtdb, `ptt/${driverId}`), active ? { active: true, adminName, startedAt: Date.now() } : { active: false });
}

// ===== Dashboard Stats =====
export function useDashboardStats() {
  const [stats, setStats] = useState({ activeDrivers: 0, clients: 0, pendingDrivers: 0, liveRides: 0 });
  useEffect(() => {
    const q1 = onSnapshot(query(collection(db, 'users'), where('role', '==', 'driver'), where('status', '==', 'active'), where('isOnline', '==', true)), s => setStats(p => ({ ...p, activeDrivers: s.size })));
    const q2 = onSnapshot(query(collection(db, 'users'), where('role', 'in', ['client', 'family']), where('status', '==', 'active')), s => setStats(p => ({ ...p, clients: s.size })));
    const q3 = onSnapshot(query(collection(db, 'users'), where('role', '==', 'driver'), where('status', '==', 'pending')), s => setStats(p => ({ ...p, pendingDrivers: s.size })));
    const q4 = onSnapshot(query(collection(db, 'rides'), where('status', 'in', ['accepted', 'waiting', 'started'])), s => setStats(p => ({ ...p, liveRides: s.size })));
    return () => { q1(); q2(); q3(); q4(); };
  }, []);
  return stats;
}

// ===== Driver Settings =====
export async function updateDriverSettings(driverId: string, data: any) {
  await updateDoc(doc(db, 'users', driverId), { ...data, updatedAt: serverTimestamp() });
}
export async function approveDriver(driverId: string, approvedBy: string) {
  await updateDoc(doc(db, 'users', driverId), { status: 'active', approvedBy, approvedAt: serverTimestamp() });
}
export async function rejectDriver(driverId: string, reason: string) {
  await updateDoc(doc(db, 'users', driverId), { status: 'banned', rejectionReason: reason, rejectedAt: serverTimestamp() });
}

// ===== Request Ride (مع منطقة + تسعير ديناميكي) =====
export async function requestRide(
  clientId: string, clientName: string,
  pickupAddress: string, dropoffAddress: string,
  pickupLat: number, pickupLng: number,
  dropoffLat: number, dropoffLng: number,
  area?: Area | null,
  manualLandmarks?: string[]
): Promise<string> {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const qrCode = btoa(`${clientId}_${Date.now()}_${otp}`);
  const distanceKm = calcDistanceKm(pickupLat, pickupLng, dropoffLat, dropoffLng);
  const price = calcPriceByArea(distanceKm, area);

  let landmarks: string[] = [];
  if (manualLandmarks && manualLandmarks.length > 0) {
    landmarks = manualLandmarks;
  } else {
    landmarks = await getAutoLandmarks(pickupLat, pickupLng, dropoffLat, dropoffLng);
  }

  const rideRef = await addDoc(collection(db, 'rides'), {
    clientId, clientName,
    status: 'searching',
    pickupAddress, dropoffAddress,
    pickupLat, pickupLng, dropoffLat, dropoffLng,
    areaId: area?.id || null,
    areaName: area?.name || null,
    distanceKm: Math.round(distanceKm * 10) / 10,
    price,
    qrCode, otp,
    landmarks: landmarks.map(name => ({ name, done: false })),
    createdAt: serverTimestamp(),
  });
  return rideRef.id;
}

export async function acceptRide(rideId: string, driverId: string, driverName: string) {
  await updateDoc(doc(db, 'rides', rideId), { driverId, driverName, status: 'accepted', acceptedAt: serverTimestamp() });
}

// ===== Auto Landmark Check =====
export async function autoCheckLandmarks(
  rideId: string,
  landmarks: { name: string; done: boolean; lat?: number; lng?: number }[],
  driverLat: number, driverLng: number
): Promise<boolean> {
  let updated = false;
  const newLandmarks = landmarks.map(l => {
    if (l.done || !l.lat || !l.lng) return l;
    const dist = calcDistanceKm(driverLat, driverLng, l.lat, l.lng) * 1000;
    if (dist <= 100) { updated = true; return { ...l, done: true, doneAt: new Date() }; }
    return l;
  });
  if (updated) await updateDoc(doc(db, 'rides', rideId), { landmarks: newLandmarks });
  return updated;
}

// ===== SOS =====
export async function sendSOS(userId: string, userName: string, userPhone: string, rideId?: string, lat?: number, lng?: number) {
  await addDoc(collection(db, 'sos_alerts'), { userId, userName, userPhone, rideId: rideId || null, lat: lat || null, lng: lng || null, status: 'active', createdAt: serverTimestamp() });
}
export async function resolveSOSAlert(alertId: string, resolvedBy: string) {
  await updateDoc(doc(db, 'sos_alerts', alertId), { status: 'resolved', resolvedBy, resolvedAt: serverTimestamp() });
}

// ===== Notifications =====
export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'notifications'), where('targetId', '==', userId), where('read', '==', false), orderBy('createdAt', 'desc'), limit(20));
    const unsub = onSnapshot(q, snap => { setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    return unsub;
  }, [userId]);
  return notifications;
}

// ===== Partners =====
export function usePartners(statusFilter?: string) {
  const [partners, setPartners] = useState<any[]>([]);
  useEffect(() => {
    let q = query(collection(db, 'partners'), orderBy('createdAt', 'desc'));
    if (statusFilter) q = query(collection(db, 'partners'), where('status', '==', statusFilter), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => { setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    return unsub;
  }, [statusFilter]);
  return partners;
}

// ===== Settings =====
export async function getSetting(key: string): Promise<any> {
  const snap = await getDoc(doc(db, 'settings', key));
  return snap.exists() ? snap.data() : null;
}
export async function saveSetting(key: string, data: Record<string, any>) {
  await setDoc(doc(db, 'settings', key), { ...data, updatedAt: serverTimestamp() });
}
