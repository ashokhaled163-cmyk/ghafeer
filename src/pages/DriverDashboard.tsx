import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  useDriverRide, useActiveRides, usePTTSignal, sendPTTSignal,
  acceptRide,
} from '../hooks/useFirestore';
import {
  doc, updateDoc, serverTimestamp, onSnapshot, query,
  collection, where, orderBy, limit,
} from 'firebase/firestore';
import { ref, set } from 'firebase/database';
import { db, rtdb } from '../lib/firebase';

export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const ride = useDriverRide(user?.uid || '');
  const pttSignal = usePTTSignal(user?.uid || '');

  const [isOnline, setIsOnline] = useState(false);
  const [pendingRides, setPendingRides] = useState<any[]>([]);
  const [todayStats, setTodayStats] = useState({ rides: 0, earnings: 0 });
  const [showWalkie, setShowWalkie] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [toast, setToast] = useState('');
  const watchRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Listen for incoming PTT signal from admin
  useEffect(() => {
    if (pttSignal?.active) {
      setShowWalkie(true);
      showToast(`📡 مكالمة من الإدارة: ${pttSignal.adminName}`);
    }
  }, [pttSignal?.active]);

  // Listen for searching rides (only when online and no active ride)
  useEffect(() => {
    if (!isOnline || ride) {
      setPendingRides([]);
      return;
    }
    const q = query(
      collection(db, 'rides'),
      where('status', '==', 'searching'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    return onSnapshot(q, snap => {
      setPendingRides(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [isOnline, ride]);

  // Load today's stats
  useEffect(() => {
    if (!user?.uid) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const q = query(
      collection(db, 'rides'),
      where('driverId', '==', user.uid),
      where('status', '==', 'completed'),
      orderBy('completedAt', 'desc'),
      limit(50)
    );
    return onSnapshot(q, snap => {
      const rides = snap.docs.map(d => d.data());
      const todayRides = rides.filter(r => r.completedAt?.toDate() >= today);
      setTodayStats({
        rides: todayRides.length,
        earnings: todayRides.reduce((s, r) => s + (r.price || 0), 0),
      });
    });
  }, [user?.uid]);

  // Toggle online + GPS tracking
  const toggleOnline = async () => {
    if (!user?.uid) return;
    const newStatus = !isOnline;
    setIsOnline(newStatus);

    const presenceRef = ref(rtdb, `presence/${user.uid}`);

    if (newStatus) {
      // Start GPS watch
      if (navigator.geolocation) {
        watchRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            // Update location in Realtime DB (fast)
            set(ref(rtdb, `driverLocation/${user.uid}`), {
              lat: latitude,
              lng: longitude,
              accuracy,
              updatedAt: Date.now(),
            });
            // Update presence
            set(presenceRef, {
              online: true,
              lastSeen: Date.now(),
              role: 'driver',
              lat: latitude,
              lng: longitude,
            });
          },
          (err) => {
            if (err.code !== err.TIMEOUT) {
              showToast('⚠️ تعذّر تتبع الموقع — تحقق من إذن GPS');
            }
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );
      }
      // Mark online in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        isOnline: true,
        lastOnlineAt: serverTimestamp(),
      });
      showToast('🟢 أنت متصل الآن');
    } else {
      // Stop GPS watch
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
      await updateDoc(doc(db, 'users', user.uid), { isOnline: false });
      await set(presenceRef, { online: false, lastSeen: Date.now(), role: 'driver' });
      showToast('⚫ أنت غير متصل');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, []);

  const handleAcceptRide = async (rideId: string) => {
    if (!user) return;
    try {
      await acceptRide(rideId, user.uid, user.name);
      showToast('✅ تم قبول الرحلة');
    } catch (e: any) {
      showToast('❌ ' + (e.message || 'حدث خطأ'));
    }
  };

  const handleMarkLandmark = async (index: number) => {
    if (!ride) return;
    const updated = ride.landmarks.map((l: any, i: number) =>
      i === index ? { ...l, done: true, doneAt: new Date() } : l
    );
    await updateDoc(doc(db, 'rides', ride.id), { landmarks: updated });
  };

  const handleEndRide = async () => {
    if (!ride || !user) return;
    await updateDoc(doc(db, 'rides', ride.id), {
      status: 'completed',
      completedAt: serverTimestamp(),
    });
    // Update driver stats
    await updateDoc(doc(db, 'users', user.uid), {
      totalRides: (user.totalRides || 0) + 1,
    });
    showToast('🎉 انتهت الرحلة بنجاح!');
  };

  const handleLogout = async () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    if (user?.uid) {
      await updateDoc(doc(db, 'users', user.uid), { isOnline: false });
    }
    await logout();
    navigate('/login');
  };

  const allLandmarksDone = ride?.landmarks?.every((l: any) => l.done);

  return (
    <div className="min-h-screen bg-white">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white border border-teal/30 shadow-xl rounded-2xl px-5 py-3 font-bold text-gray-800 text-sm">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img src="/images/logo.png" className="w-10 h-10 rounded-full border-2 border-teal" />
          <div>
            <p className="font-bold text-teal text-sm">لوحة السائق</p>
            <p className="text-xs text-gray-400">{user?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleOnline}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${isOnline ? 'bg-teal text-white shadow-lg shadow-teal/30' : 'bg-gray-200 text-gray-500'}`}>
            {isOnline ? '🟢 متصل' : '⚫ غير متصل'}
          </button>
          <button onClick={handleLogout} className="text-gray-400 text-xs font-semibold">خروج</button>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">

        {/* Real Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="glass-card-gold p-3 text-center">
            <div className="text-xl font-black text-gold">{todayStats.rides}</div>
            <div className="text-[10px] text-gray-500">رحلة اليوم</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-xl font-black text-teal">{user?.rating?.toFixed(1) || '5.0'}</div>
            <div className="text-[10px] text-gray-500">التقييم</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-xl font-black text-gold">{todayStats.earnings}</div>
            <div className="text-[10px] text-gray-500">جنيه</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-xl font-black text-teal">{user?.totalRides || 0}</div>
            <div className="text-[10px] text-gray-500">إجمالي</div>
          </div>
        </div>

        {/* Offline */}
        {!isOnline && !ride && (
          <div className="glass-card-gold p-6 text-center">
            <div className="text-5xl mb-3">🛺</div>
            <h3 className="text-xl font-bold text-gray-800">مرحباً {user?.name}!</h3>
            <p className="text-gray-500 text-sm mt-2">اضغط "متصل" لبدء استقبال الطلبات</p>
          </div>
        )}

        {/* Online - waiting */}
        {isOnline && !ride && pendingRides.length === 0 && (
          <div className="glass-card p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-4 walkie-pulse">
              <span className="text-3xl">📡</span>
            </div>
            <h3 className="font-bold text-gray-800">في انتظار طلبات...</h3>
            <p className="text-gray-500 text-sm mt-1">موقعك يُحدَّث تلقائياً عبر GPS</p>
          </div>
        )}

        {/* New Ride Requests */}
        {isOnline && !ride && pendingRides.map(r => (
          <div key={r.id} className="glass-card-gold p-5 border-2 border-gold">
            <div className="text-4xl text-center mb-2 walkie-pulse">🔔</div>
            <h3 className="text-lg font-bold text-center text-gray-800 mb-3">طلب جديد!</h3>
            <div className="bg-white/60 rounded-xl p-3 mb-3 space-y-1 text-sm text-right">
              <p><span className="font-semibold">العميل:</span> {r.clientName}</p>
              <p><span className="font-semibold">الانطلاق:</span> {r.pickupAddress}</p>
              <p><span className="font-semibold">الوجهة:</span> {r.dropoffAddress}</p>
              {r.landmarks?.length > 0 && (
                <p><span className="font-semibold">معالم:</span> {r.landmarks.length}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleAcceptRide(r.id)} className="flex-1 btn-teal py-3 text-lg">✅ قبول</button>
              <button className="flex-1 bg-red-100 text-red-600 font-bold py-3 rounded-xl text-lg">❌ رفض</button>
            </div>
          </div>
        ))}

        {/* Active Ride */}
        {ride && (
          <div className="space-y-4">
            <div className={`p-4 rounded-2xl text-center font-bold ${
              ride.status === 'accepted' ? 'bg-gold/10 text-gold-dark' :
              ride.status === 'waiting' ? 'bg-teal/10 text-teal' :
              'bg-green-50 text-green-700'
            }`}>
              {ride.status === 'accepted' && '🧭 في الطريق للعميل'}
              {ride.status === 'waiting' && '⏳ انتظر العميل يريك QR'}
              {ride.status === 'started' && '🛺 الرحلة جارية'}
            </div>

            <div className="glass-card p-4 text-sm space-y-1">
              <p><span className="font-semibold">العميل:</span> {ride.clientName}</p>
              <p><span className="font-semibold">الانطلاق:</span> {ride.pickupAddress}</p>
              <p><span className="font-semibold">الوجهة:</span> {ride.dropoffAddress}</p>
              <p><span className="font-semibold">رمز التحقق:</span> <span className="font-black text-gold text-lg tracking-widest">{ride.otp}</span></p>
            </div>

            {/* Go to waiting */}
            {ride.status === 'accepted' && (
              <button onClick={() => updateDoc(doc(db, 'rides', ride.id), { status: 'waiting', arrivedAt: serverTimestamp() })}
                className="btn-gold w-full py-4 text-lg">
                📍 وصلت للعميل
              </button>
            )}

            {/* Scan QR → Start Trip */}
            {ride.status === 'waiting' && (
              <button onClick={() => updateDoc(doc(db, 'rides', ride.id), { status: 'started', startedAt: serverTimestamp() })}
                className="btn-teal w-full py-4 text-lg">
                ✅ تم التحقق من QR — ابدأ الرحلة
              </button>
            )}

            {/* Landmarks */}
            {ride.status === 'started' && ride.landmarks?.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="font-bold text-gray-800 mb-3">🗺️ مسار الرحلة</h3>
                <div className="space-y-2">
                  {ride.landmarks.map((l: any, i: number) => (
                    <button key={i} onClick={() => !l.done && handleMarkLandmark(i)}
                      disabled={l.done}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-right ${l.done ? 'landmark-done' : 'landmark-pending hover:border-teal'}`}>
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${l.done ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {l.done ? '✓' : i + 1}
                      </span>
                      <span className={`font-semibold text-sm ${l.done ? 'text-white' : 'text-gray-700'}`}>{l.name}</span>
                      {!l.done && <span className="mr-auto text-xs text-gray-400">اضغط عند الوصول</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* End Ride */}
            {ride.status === 'started' && (allLandmarksDone || !ride.landmarks?.length) && (
              <button onClick={handleEndRide} className="btn-gold w-full py-4 text-lg walkie-pulse">
                🏁 إنهاء الرحلة
              </button>
            )}

            {/* Walkie */}
            <button onClick={() => setShowWalkie(true)} className="btn-teal w-full py-3">
              📡 وكي توكي — الإدارة
            </button>
          </div>
        )}
      </div>

      {/* Walkie Talkie Modal */}
      {showWalkie && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center p-4">
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 slide-up">
            <div className="text-center mb-4">
              <div className={`w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center ${pttSignal?.active ? 'bg-teal walkie-pulse' : 'bg-gold/10'}`}>
                <span className="text-4xl">📡</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">وكي توكي</h3>
              {pttSignal?.active && (
                <p className="text-teal font-semibold text-sm mt-1">🎙️ الإدارة تتحدث: {pttSignal.adminName}</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-500 mb-3">
              {isTalking ? '🎙️ جاري التحدث...' : pttSignal?.active ? '🔊 استمع للإدارة' : '🔇 جاهز'}
            </div>

            <button
              onMouseDown={async () => { setIsTalking(true); await sendPTTSignal(user?.uid || '', true, user?.name || 'سائق'); }}
              onMouseUp={async () => { setIsTalking(false); await sendPTTSignal(user?.uid || '', false, ''); }}
              onTouchStart={async () => { setIsTalking(true); await sendPTTSignal(user?.uid || '', true, user?.name || 'سائق'); }}
              onTouchEnd={async () => { setIsTalking(false); await sendPTTSignal(user?.uid || '', false, ''); }}
              className={`w-full py-5 rounded-xl font-bold text-lg transition-all mb-3 ${isTalking ? 'bg-red-500 text-white shadow-lg' : 'btn-teal'}`}>
              {isTalking ? '🎙️ تحدث الآن...' : '🎙️ اضغط مع الاستمرار للتحدث'}
            </button>

            <button onClick={() => setShowWalkie(false)}
              className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-bold">
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
