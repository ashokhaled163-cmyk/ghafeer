import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  useClientRide, useOnlineDrivers,
  requestRide, sendSOS,
} from '../hooks/useFirestore';
import {
  doc, updateDoc, addDoc, collection, serverTimestamp, onSnapshot, query, where, orderBy, limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const ride = useClientRide(user?.uid || '');
  const { drivers } = useOnlineDrivers();

  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [landmarksInput, setLandmarksInput] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingDone, setRatingDone] = useState(false);
  const [recentRides, setRecentRides] = useState<any[]>([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [toast, setToast] = useState('');

  // Load recent rides
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'rides'),
      where('clientId', '==', user.uid),
      where('status', '==', 'completed'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    return onSnapshot(q, snap => {
      setRecentRides(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user?.uid]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Get GPS location
  const getMyLocation = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      showToast('⚠️ الجهاز لا يدعم GPS');
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Reverse geocode using free API
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ar`)
          .then(r => r.json())
          .then(data => {
            const addr = data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
            setPickupAddress(addr);
            showToast('📍 تم تحديد موقعك');
          })
          .catch(() => {
            setPickupAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          })
          .finally(() => setGpsLoading(false));
      },
      () => {
        showToast('⚠️ تعذّر تحديد الموقع — اكتبه يدوياً');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleRequestRide = async () => {
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      showToast('⚠️ اكتب موقع الانطلاق والوجهة');
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      const landmarks = landmarksInput
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);
      await requestRide(user.uid, user.name, pickupAddress, dropoffAddress, landmarks);
      setShowForm(false);
      setLandmarksInput('');
    } catch (e: any) {
      showToast('❌ ' + (e.message || 'حدث خطأ'));
    } finally {
      setLoading(false);
    }
  };

  const handleSOS = async () => {
    if (!user) return;
    try {
      await sendSOS(user.uid, user.name, user.phone, ride?.id);
      showToast('🚨 تم إرسال نداء الطوارئ!');
      setShowSOS(false);
    } catch {
      showToast('❌ فشل إرسال SOS');
    }
  };

  const handleCancelRide = async () => {
    if (!ride) return;
    await updateDoc(doc(db, 'rides', ride.id), {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
    });
  };

  const handleRating = async () => {
    if (!ride || rating === 0) return;
    await updateDoc(doc(db, 'rides', ride.id), {
      clientRating: rating,
      clientComment: ratingComment,
      ratedAt: serverTimestamp(),
    });
    // Update driver rating
    if (ride.driverId) {
      const rideHistory = recentRides.filter(r => r.driverId === ride.driverId && r.clientRating);
      const avgRating = rideHistory.length
        ? (rideHistory.reduce((s, r) => s + r.clientRating, 0) + rating) / (rideHistory.length + 1)
        : rating;
      await updateDoc(doc(db, 'users', ride.driverId), { rating: avgRating });
    }
    setRatingDone(true);
    showToast('⭐ شكراً لتقييمك!');
    setTimeout(() => setRatingDone(false), 2000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const statusLabel: Record<string, string> = {
    searching: '🔍 جاري البحث عن سائق...',
    accepted: '🛺 السائق في الطريق إليك',
    waiting: '⏳ السائق وصل — أرِه كود QR',
    started: '🛺 الرحلة جارية',
    completed: '✅ وصلت بالسلامة!',
  };

  return (
    <div className="min-h-screen bg-white">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white border border-gold/30 shadow-xl rounded-2xl px-5 py-3 font-bold text-gray-800 text-sm">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img src="/images/logo.png" className="w-10 h-10 rounded-full border-2 border-gold" />
          <div>
            <p className="font-bold text-gold text-sm">الغفير</p>
            <p className="text-xs text-gray-400">مرحباً {user?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSOS(true)}
            className="bg-red-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-lg shadow-red-500/30">
            🚨 SOS
          </button>
          <button onClick={handleLogout} className="text-gray-400 text-xs font-semibold">خروج</button>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">

        {/* Stats from real data */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card-gold p-4 text-center">
            <div className="text-2xl font-black text-gold">{user?.totalRides || 0}</div>
            <div className="text-xs text-gray-500">رحلة</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-black text-teal">{user?.rating?.toFixed(1) || '5.0'}</div>
            <div className="text-xs text-gray-500">تقييمك</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-black text-gold">{drivers.length}</div>
            <div className="text-xs text-gray-500">سائق متاح</div>
          </div>
        </div>

        {/* No active ride */}
        {!ride && (
          <div className="space-y-4">
            {!showForm ? (
              <div className="glass-card-gold p-6 text-center">
                <div className="text-6xl mb-4">🛺</div>
                <h2 className="text-2xl font-black text-gray-800 mb-2">محتاج توصيلة؟</h2>
                <p className="text-gray-500 mb-4">
                  {drivers.length > 0
                    ? `${drivers.length} سائق متاح الآن`
                    : 'لا يوجد سائقين متاحين الآن'}
                </p>
                <button onClick={() => setShowForm(true)} className="btn-gold w-full text-xl py-5">
                  🚀 اطلب غفير
                </button>
              </div>
            ) : (
              <div className="glass-card-gold p-5 space-y-3">
                <h3 className="font-black text-lg text-gray-800">📍 تفاصيل الرحلة</h3>

                <div>
                  <label className="text-sm font-semibold text-gray-600 block mb-1">موقع الانطلاق</label>
                  <div className="flex gap-2">
                    <input value={pickupAddress} onChange={e => setPickupAddress(e.target.value)}
                      placeholder="اكتب عنوانك أو اضغط GPS"
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-gold outline-none text-sm bg-white" />
                    <button onClick={getMyLocation} disabled={gpsLoading}
                      className="bg-teal/10 text-teal px-3 py-2 rounded-xl font-bold text-sm border border-teal/20">
                      {gpsLoading ? '...' : '📍'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600 block mb-1">الوجهة</label>
                  <input value={dropoffAddress} onChange={e => setDropoffAddress(e.target.value)}
                    placeholder="وين رايح؟"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-gold outline-none text-sm bg-white" />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600 block mb-1">
                    معالم الطريق <span className="text-gray-400 font-normal">(اختياري — سطر لكل معلم)</span>
                  </label>
                  <textarea value={landmarksInput} onChange={e => setLandmarksInput(e.target.value)}
                    placeholder={"مثلاً:\nكوبري الجسر\nميدان المدرسة\nالسوق"}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-gold outline-none text-sm bg-white resize-none" />
                </div>

                <div className="flex gap-2">
                  <button onClick={handleRequestRide} disabled={loading}
                    className="flex-1 btn-gold py-3 text-lg disabled:opacity-60">
                    {loading ? '⏳...' : '🚀 اطلب'}
                  </button>
                  <button onClick={() => setShowForm(false)}
                    className="bg-gray-100 text-gray-500 px-4 py-3 rounded-xl font-bold">
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {/* Recent Rides */}
            {recentRides.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="font-bold text-gray-800 mb-3">📋 آخر الرحلات</h3>
                {recentRides.map(r => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{r.dropoffAddress}</p>
                      <p className="text-xs text-gray-400">{r.driverName || '—'}</p>
                    </div>
                    <div className="text-gold text-sm">
                      {r.clientRating ? `⭐ ${r.clientRating}` : '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active Ride */}
        {ride && ride.status !== 'completed' && (
          <div className="space-y-4">
            <div className="glass-card-gold p-4 text-center">
              <p className="font-bold text-gray-800">{statusLabel[ride.status] || ride.status}</p>
            </div>

            {/* QR Code — shown when waiting */}
            {(ride.status === 'accepted' || ride.status === 'waiting') && (
              <div className="glass-card p-5 text-center">
                <h3 className="font-bold text-gray-800 mb-3">🎫 كود الرحلة</h3>
                <p className="text-gray-500 text-sm mb-4">اعرضه للسائق عند وصوله</p>
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-2xl shadow-inner border border-gold/20">
                    <QRCodeSVG
                      value={ride.qrCode}
                      size={180}
                      bgColor="#ffffff"
                      fgColor="#1a1a1a"
                      level="H"
                      imageSettings={{
                        src: '/images/logo.png',
                        x: undefined, y: undefined,
                        height: 35, width: 35,
                        excavate: true,
                      }}
                    />
                  </div>
                </div>
                <p className="text-2xl font-black text-gold mt-3 tracking-widest">{ride.otp}</p>
                <p className="text-xs text-gray-400 mt-1">رمز التحقق</p>
              </div>
            )}

            {/* Driver Info */}
            {ride.driverName && (
              <div className="glass-card p-4">
                <h3 className="font-bold text-gray-800 mb-2">🛺 السائق</h3>
                <p className="font-semibold">{ride.driverName}</p>
              </div>
            )}

            {/* Landmarks progress */}
            {ride.status === 'started' && ride.landmarks?.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="font-bold text-gray-800 mb-3">🗺️ مسار الرحلة</h3>
                <div className="space-y-2">
                  {ride.landmarks.map((l: any, i: number) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${l.done ? 'landmark-done' : 'landmark-pending'}`}>
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${l.done ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {l.done ? '✓' : i + 1}
                      </span>
                      <span className={`font-semibold text-sm ${l.done ? 'text-white' : 'text-gray-700'}`}>{l.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancel */}
            {(ride.status === 'searching') && (
              <button onClick={handleCancelRide}
                className="w-full bg-red-100 text-red-600 font-bold py-3 rounded-xl">
                ❌ إلغاء الطلب
              </button>
            )}
          </div>
        )}

        {/* Rating after trip */}
        {ride && ride.status === 'completed' && !ratingDone && !ride.clientRating && (
          <div className="glass-card-gold p-6 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">وصلت بالسلامة!</h2>
            <p className="text-gray-500 text-sm mb-4">قيّم رحلتك مع {ride.driverName}</p>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setRating(star)} className="text-3xl transition-transform hover:scale-125">
                  {star <= rating ? '⭐' : '☆'}
                </button>
              ))}
            </div>
            <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)}
              placeholder="تعليقك على الرحلة (اختياري)..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none text-sm resize-none h-20 mb-3" />
            <button onClick={handleRating} disabled={rating === 0}
              className="btn-gold w-full py-3 disabled:opacity-50">
              إرسال التقييم ⭐
            </button>
          </div>
        )}
      </div>

      {/* SOS Modal */}
      {showSOS && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="text-6xl mb-4">🚨</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">نداء طوارئ SOS</h2>
            <p className="text-gray-500 mb-6 text-sm">سيتم إخطار الإدارة فوراً بموقعك وبيانات رحلتك.</p>
            <div className="flex gap-3">
              <button onClick={handleSOS} className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl">
                🚨 أرسل SOS
              </button>
              <button onClick={() => setShowSOS(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
