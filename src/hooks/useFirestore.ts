// src/hooks/useFirestore.ts
import { useState, useEffect } from 'react';
import {
  collection, query, where, orderBy, onSnapshot,
  doc, updateDoc, addDoc, serverTimestamp,
  getDocs, getDoc, limit, Timestamp,
} from 'firebase/firestore';
import { ref, onValue, set } from 'firebase/database';
import { db, rtdb } from '../lib/firebase';
import type { AppUser } from '../contexts/AuthContext';

// ===== Online Drivers =====
export function useOnlineDrivers(areaId?: string) {
  const [drivers, setDrivers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = query(
      collection(db, 'users'),
      where('role', '==', 'driver'),
      where('status', '==', 'active'),
      where('isOnline', '==', true)
    );
    if (areaId) q = query(q, where('areaId', '==', areaId));

    const unsub = onSnapshot(q, (snap) => {
      setDrivers(snap.docs.map(d => ({ uid: d.id, ...d.data() }) as AppUser));
      setLoading(false);
    });
    return unsub;
  }, [areaId]);

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
    const q = query(
      collection(db, 'users'),
      where('role', 'in', ['client', 'family']),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setClients(snap.docs.map(d => ({ uid: d.id, ...d.data() }) as AppUser));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { clients, loading };
}

// ===== Rides =====
export interface Ride {
  id: string;
  clientId: string;
  clientName: string;
  driverId?: string;
  driverName?: string;
  status: 'searching' | 'accepted' | 'waiting' | 'started' | 'completed' | 'cancelled';
  pickupAddress: string;
  dropoffAddress: string;
  qrCode: string;
  otp: string;
  price?: number;
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
    const q = query(
      collection(db, 'rides'),
      where('driverId', '==', driverId),
      where('status', 'in', ['accepted', 'waiting', 'started']),
      limit(1)
    );
    const unsub = onSnapshot(q, snap => {
      if (!snap.empty) {
        const d = snap.docs[0];
        setRide({ id: d.id, ...d.data() } as Ride);
      } else setRide(null);
    });
    return unsub;
  }, [driverId]);

  return ride;
}

export function useClientRide(clientId: string) {
  const [ride, setRide] = useState<Ride | null>(null);

  useEffect(() => {
    if (!clientId) return;
    const q = query(
      collection(db, 'rides'),
      where('clientId', '==', clientId),
      where('status', 'in', ['searching', 'accepted', 'waiting', 'started']),
      limit(1)
    );
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
    const q = query(
      collection(db, 'rides'),
      where('status', 'in', ['accepted', 'waiting', 'started']),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setRides(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Ride));
    });
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
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  rideId?: string;
  lat?: number;
  lng?: number;
  status: 'active' | 'resolved';
  createdAt: Timestamp;
}

export function useSOSAlerts() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'sos_alerts'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() }) as SOSAlert));
    });
    return unsub;
  }, []);

  return alerts;
}

// ===== PTT Signals (Realtime DB) =====
export function usePTTSignal(driverId: string) {
  const [signal, setSignal] = useState<{ active: boolean; adminName?: string } | null>(null);

  useEffect(() => {
    if (!driverId) return;
    const pttRef = ref(rtdb, `ptt/${driverId}`);
    const unsub = onValue(pttRef, snap => {
      setSignal(snap.val());
    });
    return () => unsub();
  }, [driverId]);

  return signal;
}

export async function sendPTTSignal(driverId: string, active: boolean, adminName: string) {
  const pttRef = ref(rtdb, `ptt/${driverId}`);
  await set(pttRef, active ? { active: true, adminName, startedAt: Date.now() } : { active: false });
}

// ===== Dashboard Stats =====
export function useDashboardStats() {
  const [stats, setStats] = useState({
    activeDrivers: 0, clients: 0, ridesTotal: 0,
    ridesToday: 0, pendingDrivers: 0, liveRides: 0,
    earningsToday: 0,
  });

  useEffect(() => {
    // Active drivers
    const q1 = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'driver'), where('status', '==', 'active'), where('isOnline', '==', true)),
      s => setStats(p => ({ ...p, activeDrivers: s.size }))
    );
    // Clients
    const q2 = onSnapshot(
      query(collection(db, 'users'), where('role', 'in', ['client', 'family']), where('status', '==', 'active')),
      s => setStats(p => ({ ...p, clients: s.size }))
    );
    // Pending drivers
    const q3 = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'driver'), where('status', '==', 'pending')),
      s => setStats(p => ({ ...p, pendingDrivers: s.size }))
    );
    // Live rides
    const q4 = onSnapshot(
      query(collection(db, 'rides'), where('status', 'in', ['accepted', 'waiting', 'started'])),
      s => setStats(p => ({ ...p, liveRides: s.size }))
    );
    return () => { q1(); q2(); q3(); q4(); };
  }, []);

  return stats;
}

// ===== Update Driver Settings =====
export async function updateDriverSettings(
  driverId: string,
  data: {
    voipExtension?: string;
    voipPassword?: string;
    voipServer?: string;
    paymentType?: 'fixed' | 'percent';
    paymentValue?: number;
    status?: string;
    areaId?: string;
  }
) {
  await updateDoc(doc(db, 'users', driverId), { ...data, updatedAt: serverTimestamp() });
}

// ===== Approve / Reject Driver =====
export async function approveDriver(driverId: string, approvedBy: string) {
  await updateDoc(doc(db, 'users', driverId), {
    status: 'active',
    approvedBy,
    approvedAt: serverTimestamp(),
  });
}

export async function rejectDriver(driverId: string, reason: string) {
  await updateDoc(doc(db, 'users', driverId), {
    status: 'banned',
    rejectionReason: reason,
    rejectedAt: serverTimestamp(),
  });
}

// ===== Request Ride =====
export async function requestRide(
  clientId: string,
  clientName: string,
  pickupAddress: string,
  dropoffAddress: string,
  landmarks: string[]
): Promise<string> {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const qrCode = btoa(`${clientId}_${Date.now()}_${otp}`);

  const rideRef = await addDoc(collection(db, 'rides'), {
    clientId,
    clientName,
    status: 'searching',
    pickupAddress,
    dropoffAddress,
    qrCode,
    otp,
    price: 0,
    landmarks: landmarks.map(name => ({ name, done: false })),
    createdAt: serverTimestamp(),
  });

  return rideRef.id;
}

// ===== Accept Ride =====
export async function acceptRide(rideId: string, driverId: string, driverName: string) {
  await updateDoc(doc(db, 'rides', rideId), {
    driverId,
    driverName,
    status: 'accepted',
    acceptedAt: serverTimestamp(),
  });
}

// ===== SOS =====
export async function sendSOS(userId: string, userName: string, userPhone: string, rideId?: string) {
  await addDoc(collection(db, 'sos_alerts'), {
    userId, userName, userPhone,
    rideId: rideId || null,
    status: 'active',
    createdAt: serverTimestamp(),
  });
}

export async function resolveSOSAlert(alertId: string, resolvedBy: string) {
  await updateDoc(doc(db, 'sos_alerts', alertId), {
    status: 'resolved',
    resolvedBy,
    resolvedAt: serverTimestamp(),
  });
}

// ===== Notifications =====
export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'notifications'),
      where('targetId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(q, snap => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
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
    const unsub = onSnapshot(q, snap => {
      setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [statusFilter]);

  return partners;
}

// ===== Firestore Settings =====
export async function getSetting(key: string): Promise<any> {
  const snap = await getDoc(doc(db, 'settings', key));
  return snap.exists() ? snap.data() : null;
}

export async function saveSetting(key: string, data: Record<string, any>) {
  const { setDoc } = await import('firebase/firestore');
  await setDoc(doc(db, 'settings', key), { ...data, updatedAt: serverTimestamp() });
}
