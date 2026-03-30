import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [driverStatus, setDriverStatus] = useState<'idle' | 'new_request' | 'going' | 'waiting' | 'scanning' | 'trip' | 'ended'>('idle');
  const [landmarks, setLandmarks] = useState([
    { name: 'الشارع الرئيسي', done: false },
    { name: 'التقاطع الأول', done: false },
    { name: 'كوبري المنطقة', done: false },
    { name: 'ميدان المدرسة', done: false },
    { name: 'الوجهة النهائية', done: false },
  ]);
  const [showWalkie, setShowWalkie] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);

  const toggleLandmark = (index: number) => {
    setLandmarks(prev => prev.map((l, i) => i === index ? { ...l, done: true } : l));
  };

  const allLandmarksDone = landmarks.every(l => l.done);

  // Simulate incoming walkie call
  const simulateIncomingCall = () => {
    setIncomingCall(true);
    setShowWalkie(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/images/logo.png" alt="الغفير" className="w-10 h-10 rounded-full object-cover border-2 border-teal" />
          <div>
            <span className="font-bold text-teal">لوحة السائق</span>
            <p className="text-xs text-gray-400">أحمد محمود</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Online Toggle */}
          <button onClick={() => { setIsOnline(!isOnline); if (!isOnline) setTimeout(() => setDriverStatus('new_request'), 3000); }}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${isOnline ? 'bg-teal text-white shadow-lg shadow-teal/30' : 'bg-gray-200 text-gray-500'}`}>
            {isOnline ? '🟢 متصل' : '⚫ غير متصل'}
          </button>
          <Link to="/" className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="glass-card-gold p-3 text-center">
            <div className="text-xl font-black text-gold">25</div>
            <div className="text-[10px] text-gray-500">رحلة اليوم</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-xl font-black text-teal">4.8</div>
            <div className="text-[10px] text-gray-500">التقييم</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-xl font-black text-gold">150</div>
            <div className="text-[10px] text-gray-500">جنيه</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-xl font-black text-teal">3h</div>
            <div className="text-[10px] text-gray-500">وقت العمل</div>
          </div>
        </div>

        {/* Idle */}
        {driverStatus === 'idle' && isOnline && (
          <div className="glass-card p-6 text-center fade-in">
            <div className="w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-4 walkie-pulse">
              <span className="text-3xl">📡</span>
            </div>
            <h3 className="font-bold text-gray-800">في انتظار طلبات...</h3>
            <p className="text-gray-500 text-sm mt-1">ابقَ متصل وسيأتيك الطلب</p>
          </div>
        )}

        {!isOnline && driverStatus === 'idle' && (
          <div className="glass-card-gold p-6 text-center fade-in">
            <div className="text-5xl mb-3">🛺</div>
            <h3 className="text-xl font-bold text-gray-800">مرحباً يا سائق!</h3>
            <p className="text-gray-500 text-sm mt-2">اضغط "متصل" لبدء استقبال الطلبات</p>
          </div>
        )}

        {/* New Request */}
        {driverStatus === 'new_request' && (
          <div className="glass-card-gold p-6 text-center fade-in border-2 border-gold">
            <div className="text-5xl mb-3 walkie-pulse">🔔</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">طلب جديد!</h3>
            <div className="bg-white/50 rounded-xl p-4 mb-4 text-right">
              <p className="text-sm text-gray-600"><span className="font-semibold">العميل:</span> محمد أحمد</p>
              <p className="text-sm text-gray-600"><span className="font-semibold">المكان:</span> شارع 15 - المنطقة الثالثة</p>
              <p className="text-sm text-gray-600"><span className="font-semibold">المسافة:</span> 800 متر</p>
              <p className="text-sm text-gray-600"><span className="font-semibold">الوقت المتوقع:</span> 3 دقائق</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDriverStatus('going')} className="flex-1 btn-teal py-4 text-lg">
                ✅ قبول
              </button>
              <button onClick={() => { setDriverStatus('idle'); setTimeout(() => setDriverStatus('new_request'), 2000); }}
                className="flex-1 bg-red-100 text-red-600 font-bold py-4 rounded-xl text-lg hover:bg-red-200 transition-all">
                ❌ رفض
              </button>
            </div>
          </div>
        )}

        {/* Going to client */}
        {driverStatus === 'going' && (
          <div className="space-y-4 fade-in">
            <div className="glass-card p-5">
              <h3 className="font-bold text-gray-800 mb-3">🧭 في الطريق للعميل</h3>
              <div className="bg-teal/10 rounded-xl p-4">
                <p className="text-teal-dark font-semibold text-sm">📍 شارع 15 - المنطقة الثالثة</p>
                <p className="text-gray-500 text-xs mt-1">المسافة: 800 متر | الوقت: 3 دقائق</p>
              </div>
            </div>
            <button onClick={() => setDriverStatus('waiting')} className="btn-gold w-full py-4 text-lg">
              📍 وصلت
            </button>
            <button onClick={simulateIncomingCall} className="btn-teal w-full py-3">
              📡 وكي توكي
            </button>
          </div>
        )}

        {/* Waiting for client */}
        {driverStatus === 'waiting' && (
          <div className="space-y-4 fade-in">
            <div className="glass-card-gold p-6 text-center">
              <div className="text-5xl mb-3">⏳</div>
              <h3 className="text-xl font-bold text-gray-800">في انتظار العميل</h3>
              <p className="text-gray-500 text-sm mt-2">العميل هيجي يوريك كود QR</p>
            </div>
            <button onClick={() => setDriverStatus('scanning')} className="btn-teal w-full py-4 text-lg">
              📷 مسح QR Code
            </button>
            <button onClick={simulateIncomingCall} className="btn-silver w-full py-3">
              📡 اتصل بالعميل
            </button>
          </div>
        )}

        {/* Scanning QR */}
        {driverStatus === 'scanning' && (
          <div className="space-y-4 fade-in">
            <div className="glass-card p-6 text-center">
              <div className="w-48 h-48 mx-auto bg-gray-100 rounded-2xl border-2 border-dashed border-teal flex items-center justify-center mb-4">
                <div className="text-center">
                  <div className="text-5xl mb-2">📷</div>
                  <p className="text-gray-500 text-sm">وجّه الكاميرا على كود QR</p>
                </div>
              </div>
              <button onClick={() => { setDriverStatus('trip'); setLandmarks(prev => prev.map(l => ({...l, done: false}))); }}
                className="btn-gold w-full py-4 text-lg">
                ✅ تم مسح الكود - بدء الرحلة
              </button>
            </div>
          </div>
        )}

        {/* Trip in progress */}
        {driverStatus === 'trip' && (
          <div className="space-y-4 fade-in">
            <div className="glass-card-gold p-4 text-center">
              <p className="text-gold-dark font-bold">🛺 الرحلة جارية</p>
              <p className="text-xs text-gray-500 mt-1">⏱ 0:00 | 📏 0 كم</p>
            </div>

            {/* Landmarks */}
            <div className="glass-card p-5">
              <h3 className="font-bold text-gray-800 mb-4">🗺️ مسار الرحلة</h3>
              <div className="space-y-2">
                {landmarks.map((landmark, i) => (
                  <button
                    key={i}
                    onClick={() => !landmark.done && toggleLandmark(i)}
                    disabled={landmark.done}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-right ${
                      landmark.done ? 'landmark-done' : 'landmark-pending hover:border-teal cursor-pointer'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      landmark.done ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {landmark.done ? '✓' : i + 1}
                    </span>
                    <span className={`font-semibold text-sm ${landmark.done ? 'text-white' : 'text-gray-700'}`}>
                      {landmark.name}
                    </span>
                    {!landmark.done && (
                      <span className="mr-auto text-xs text-gray-400">اضغط عند الوصول</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-3 bg-gray-50 rounded-xl p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">المعالم المكتملة:</span>
                  <span className="font-bold text-teal">{landmarks.filter(l => l.done).length} / {landmarks.length}</span>
                </div>
              </div>
            </div>

            {allLandmarksDone && (
              <button onClick={() => setDriverStatus('ended')} className="btn-gold w-full py-4 text-lg walkie-pulse">
                🏁 إنهاء الرحلة
              </button>
            )}

            <button onClick={simulateIncomingCall} className="btn-teal w-full py-3">
              📡 وكي توكي
            </button>
          </div>
        )}

        {/* Trip ended */}
        {driverStatus === 'ended' && (
          <div className="glass-card-gold p-8 text-center fade-in">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">الرحلة انتهت بنجاح!</h2>
            <p className="text-gray-500 mb-4">أحسنت! في انتظار تقييم العميل</p>
            <div className="bg-white/50 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500">المدة</p>
                  <p className="font-bold text-gray-800">12 دقيقة</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">المعالم</p>
                  <p className="font-bold text-teal">5/5 ✓</p>
                </div>
              </div>
            </div>
            <button onClick={() => { setDriverStatus('idle'); setLandmarks(prev => prev.map(l => ({...l, done: false}))); }}
              className="btn-teal w-full py-3">
              استعد لرحلة جديدة 🛺
            </button>
          </div>
        )}
      </div>

      {/* Walkie Talkie Modal */}
      {showWalkie && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center p-4">
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 slide-up">
            <div className="text-center mb-4">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              <div className={`w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center ${incomingCall ? 'bg-teal walkie-pulse' : 'bg-gold/10'}`}>
                <span className="text-4xl">📡</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                {incomingCall ? '📞 مكالمة واردة من الإدارة' : 'وكي توكي'}
              </h3>
              {incomingCall && <p className="text-gray-500 text-sm mt-1">نغمة الاستدعاء... 📡</p>}
            </div>

            {incomingCall ? (
              <div className="space-y-3">
                <button onClick={() => setIncomingCall(false)} className="btn-teal w-full py-4 text-lg">
                  📞 رد على المكالمة
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-500">
                  {isTalking ? '🎙️ جاري التحدث...' : '🔇 الميكروفون مغلق'}
                </div>
                <button
                  onMouseDown={() => setIsTalking(true)}
                  onMouseUp={() => setIsTalking(false)}
                  onTouchStart={() => setIsTalking(true)}
                  onTouchEnd={() => setIsTalking(false)}
                  className={`w-full py-5 rounded-xl font-bold text-lg transition-all ${
                    isTalking ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'btn-teal'
                  }`}
                >
                  {isTalking ? '🎙️ تحدث الآن...' : '🎙️ اضغط مع الاستمرار للتحدث'}
                </button>
              </div>
            )}

            <button onClick={() => { setShowWalkie(false); setIncomingCall(false); setIsTalking(false); }}
              className="w-full py-3 mt-3 bg-gray-100 text-gray-600 rounded-xl font-bold">
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
