import { useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

export default function ClientDashboard() {
  const [tripStatus, setTripStatus] = useState<'idle' | 'searching' | 'matched' | 'waiting' | 'started' | 'ended'>('idle');
  const [showSOS, setShowSOS] = useState(false);
  const [rating, setRating] = useState(0);

  const driverInfo = {
    name: 'أحمد محمود',
    rating: 4.8,
    vehicle: 'توك توك - أحمر',
    phone: '01012345678',
    photo: '🛺',
  };

  const qrData = JSON.stringify({
    rideId: 'R' + Date.now(),
    clientId: 'C001',
    driverId: 'D001',
    otp: Math.floor(1000 + Math.random() * 9000),
    timestamp: new Date().toISOString(),
  });

  const requestRide = () => {
    setTripStatus('searching');
    setTimeout(() => setTripStatus('matched'), 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/images/logo.png" alt="الغفير" className="w-10 h-10 rounded-full object-cover border-2 border-gold" />
          <div>
            <span className="font-bold text-gold">الغفير</span>
            <p className="text-xs text-gray-400">مرحباً يا عميل</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowSOS(true)} className="bg-red-500 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-red-500/30 hover:bg-red-600 transition-all">
            🚨 SOS
          </button>
          <Link to="/" className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Status */}
        {tripStatus === 'idle' && (
          <div className="fade-in space-y-4">
            <div className="glass-card-gold p-6 text-center">
              <div className="text-6xl mb-4">🛺</div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">محتاج توصيلة؟</h2>
              <p className="text-gray-500 mb-6">اطلب غفير وهيكون عندك في دقائق</p>
              <button onClick={requestRide} className="btn-gold w-full text-xl py-5">
                🚀 اطلب غفير
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-black text-gold">12</div>
                <div className="text-xs text-gray-500">رحلة</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-black text-teal">4.9</div>
                <div className="text-xs text-gray-500">تقييمك</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-black text-silver-dark">3</div>
                <div className="text-xs text-gray-500">أفراد العائلة</div>
              </div>
            </div>

            {/* Recent Trips */}
            <div className="glass-card p-4">
              <h3 className="font-bold text-gray-800 mb-3">📋 آخر الرحلات</h3>
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">🛺</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">رحلة #{100 + i}</p>
                      <p className="text-xs text-gray-400">منذ {i} ساعة</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-gold text-sm">
                    ⭐ 4.{9 - i}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tripStatus === 'searching' && (
          <div className="glass-card-gold p-8 text-center fade-in">
            <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4 walkie-pulse">
              <span className="text-4xl">🔍</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">جاري البحث عن سائق...</h2>
            <p className="text-gray-500 text-sm">بنجيب لك أقرب سائق متاح</p>
            <div className="mt-4 flex justify-center">
              <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}

        {(tripStatus === 'matched' || tripStatus === 'waiting') && (
          <div className="space-y-4 fade-in">
            {/* QR Code */}
            <div className="glass-card-gold p-6 text-center">
              <h3 className="font-bold text-gray-800 mb-2">🎫 كود الرحلة</h3>
              <p className="text-gray-500 text-sm mb-4">اعرض الكود للسائق عند الوصول</p>
              <div className="flex justify-center mb-4">
                <div className="bg-white p-4 rounded-2xl shadow-inner border border-gold/20">
                  <QRCodeSVG
                    value={qrData}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#1a1a1a"
                    level="H"
                    imageSettings={{
                      src: '/images/logo.png',
                      x: undefined,
                      y: undefined,
                      height: 40,
                      width: 40,
                      excavate: true,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Call Driver */}
            <button
              onClick={() => alert('جاري الاتصال بالسائق عبر الوكي توكي...')}
              className="btn-teal w-full text-lg py-4 flex items-center justify-center gap-3"
            >
              <span className="text-2xl">📡</span>
              اتصل بالسائق (وكي توكي)
            </button>

            {/* Driver Info */}
            <div className="glass-card p-5">
              <h3 className="font-bold text-gray-800 mb-3">🛺 بيانات السائق</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center text-3xl border-2 border-teal">
                  {driverInfo.photo}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{driverInfo.name}</p>
                  <p className="text-sm text-gray-500">{driverInfo.vehicle}</p>
                  <div className="flex items-center gap-1 text-gold text-sm mt-1">
                    ⭐ {driverInfo.rating}
                  </div>
                </div>
              </div>
              {tripStatus === 'matched' && (
                <div className="mt-4 bg-gold/10 rounded-xl p-3 text-center">
                  <p className="text-gold-dark font-semibold text-sm">🛺 السائق في الطريق إليك</p>
                  <p className="text-gray-500 text-xs mt-1">الوقت المتوقع: 5 دقائق</p>
                </div>
              )}
              {tripStatus === 'waiting' && (
                <div className="mt-4 bg-teal/10 rounded-xl p-3 text-center">
                  <p className="text-teal-dark font-semibold text-sm">✅ السائق وصل ومنتظرك</p>
                  <p className="text-gray-500 text-xs mt-1">اعرض كود QR للسائق لبدء الرحلة</p>
                </div>
              )}
            </div>

            {/* Simulate status changes */}
            {tripStatus === 'matched' && (
              <button onClick={() => setTripStatus('waiting')} className="btn-silver w-full py-3 text-sm">
                ⏭️ (محاكاة: السائق وصل)
              </button>
            )}
            {tripStatus === 'waiting' && (
              <button onClick={() => setTripStatus('started')} className="btn-silver w-full py-3 text-sm">
                ⏭️ (محاكاة: تم مسح QR - بدء الرحلة)
              </button>
            )}
          </div>
        )}

        {tripStatus === 'started' && (
          <div className="space-y-4 fade-in">
            <div className="glass-card-gold p-6 text-center">
              <div className="text-5xl mb-3">🛺</div>
              <h2 className="text-xl font-bold text-gray-800">الرحلة جارية...</h2>
              <p className="text-gray-500 text-sm mt-2">استمتع برحلة آمنة مع الغفير</p>
              <div className="mt-4 bg-teal/10 rounded-xl p-3">
                <p className="text-teal-dark font-semibold text-sm">⏱ مدة الرحلة: 0:00</p>
              </div>
            </div>

            {/* Trip landmarks */}
            <div className="glass-card p-5">
              <h3 className="font-bold text-gray-800 mb-3">🗺️ مسار الرحلة</h3>
              <div className="space-y-2">
                {['شارع رئيسي', 'التقاطع الأول', 'كوبري المنطقة', 'مدرسة الحي', 'الوجهة النهائية'].map((landmark, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${i < 2 ? 'landmark-done' : 'landmark-pending'}`}>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i < 2 ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {i < 2 ? '✓' : i + 1}
                    </span>
                    <span className={`font-semibold text-sm ${i < 2 ? 'text-white' : 'text-gray-700'}`}>{landmark}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => alert('جاري الاتصال بالسائق...')} className="btn-teal w-full py-3">
              📡 اتصل بالسائق
            </button>

            <button onClick={() => setTripStatus('ended')} className="btn-silver w-full py-3 text-sm">
              ⏭️ (محاكاة: انتهاء الرحلة)
            </button>
          </div>
        )}

        {tripStatus === 'ended' && (
          <div className="space-y-4 fade-in">
            <div className="glass-card-gold p-8 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">وصلت بالسلامة!</h2>
              <p className="text-gray-500 mb-6">قيّم رحلتك مع السائق</p>

              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setRating(star)} className="text-4xl transition-transform hover:scale-125">
                    {star <= rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>

              <textarea
                placeholder="اكتب تعليقك على الرحلة (اختياري)..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gold outline-none bg-white text-sm resize-none h-24"
              />

              <button onClick={() => { alert('شكراً لتقييمك!'); setTripStatus('idle'); setRating(0); }}
                className="btn-gold w-full text-lg py-4 mt-4">
                إرسال التقييم ⭐
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SOS Modal */}
      {showSOS && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="text-6xl mb-4">🚨</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">نداء طوارئ SOS</h2>
            <p className="text-gray-500 mb-6">هل أنت متأكد من إرسال نداء الطوارئ؟ سيتم إخطار المشرف والإدارة فوراً.</p>
            <div className="flex gap-3">
              <button onClick={() => { alert('تم إرسال SOS! المساعدة في الطريق'); setShowSOS(false); }}
                className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl">
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
